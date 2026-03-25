import api from './api';
import { loadJson, nowIso, saveJson } from '@/lib/mockStorage';
import {
  MOCK_KEYS,
  USE_MOCK,
  mockCreateId,
  mockRequireUserId,
  mockSeedIfNeeded,
  type MockProject,
  type MockTag,
  type MockTask,
  type MockTaskTag,
} from '@/lib/mockData';

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
export type TaskPriority = 'baja' | 'media' | 'alta' | 'critica';

const normalizeStatus = (value: unknown): TaskStatus | undefined => {
  if (!value) return undefined;
  const raw = String(value).trim();
  const key = raw.toLowerCase();

  if (key === 'pendiente' || key === 'todo' || key === 'to-do' || key === 'to do') return 'pendiente';
  if (
    key === 'en_progreso' ||
    key === 'en progreso' ||
    key === 'enprogreso' ||
    key === 'in_progress' ||
    key === 'in progress'
  )
    return 'en_progreso';
  if (key === 'completada' || key === 'completado' || key === 'done' || key === 'completed') return 'completada';
  if (key === 'bloqueada' || key === 'bloqueado' || key === 'blocked') return 'bloqueada';
  return undefined;
};

const normalizePriority = (value: unknown): TaskPriority | undefined => {
  if (!value) return undefined;
  const raw = String(value).trim();
  const key = raw.toLowerCase();

  if (key === 'baja' || key === 'low') return 'baja';
  if (key === 'media' || key === 'medium') return 'media';
  if (key === 'alta' || key === 'high') return 'alta';
  if (key === 'critica' || key === 'crítica' || key === 'critical') return 'critica';
  return undefined;
};

const normalizeTaskFromApi = (task: any): Task => {
  const status = normalizeStatus(task?.status) ?? 'pendiente';
  const priority = normalizePriority(task?.priority);
  return {
    ...task,
    status,
    ...(priority ? { priority } : {}),
  };
};

const normalizeTaskPayloadForApi = <T extends Record<string, any>>(payload: T): T => {
  const next: any = { ...payload };

  if ('status' in next) {
    const status = normalizeStatus(next.status);
    if (status) next.status = status;
    else delete next.status;
  }

  if ('priority' in next) {
    const priority = normalizePriority(next.priority);
    if (priority) next.priority = priority;
    else delete next.priority;
  }

  return next;
};

export interface Task {
  id: string;
  project_id: string;
  creator_id: string;
  assignee_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  due_date?: string;
}

export const taskService = {
  getAll: async (projectId?: string): Promise<Task[]> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();
      const tasks = loadJson<MockTask[]>(MOCK_KEYS.tasks, []).filter((t) => t.creator_id === userId);
      const filtered = projectId ? tasks.filter((t) => t.project_id === projectId) : tasks;
      return filtered
        .map(normalizeTaskFromApi)
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    }
    const params = projectId ? { project_id: projectId } : {};
    const { data } = await api.get('/tasks', { params });
    const tasks = data.tasks || [];
    return tasks.map(normalizeTaskFromApi);
  },

  getById: async (id: string): Promise<Task> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();
      const tasks = loadJson<MockTask[]>(MOCK_KEYS.tasks, []);
      const found = tasks.find((t) => t.id === id && t.creator_id === userId);
      if (!found) throw new Error('Tarea no encontrada');
      return normalizeTaskFromApi(found);
    }
    const { data } = await api.get(`/tasks/${id}`);
    return normalizeTaskFromApi(data.task);
  },

  create: async (task: CreateTaskInput): Promise<Task> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();
      const projects = loadJson<MockProject[]>(MOCK_KEYS.projects, []);
      const okProject = projects.some((p) => p.id === task.project_id && p.owner_id === userId);
      if (!okProject) throw new Error('Proyecto no encontrado');

      const now = nowIso();
      const created: MockTask = {
        id: mockCreateId('task'),
        project_id: task.project_id,
        creator_id: userId,
        ...(task.assignee_id ? { assignee_id: task.assignee_id } : {}),
        title: task.title,
        ...(task.description ? { description: task.description } : {}),
        status: task.status || 'pendiente',
        ...(task.priority ? { priority: task.priority } : {}),
        ...(task.due_date ? { due_date: task.due_date } : {}),
        created_at: now,
        updated_at: now,
      };
      const tasks = loadJson<MockTask[]>(MOCK_KEYS.tasks, []);
      saveJson(MOCK_KEYS.tasks, [created, ...tasks]);

      // Touch project updated_at for "Última actividad"
      const projIdx = projects.findIndex((p) => p.id === task.project_id && p.owner_id === userId);
      if (projIdx >= 0) {
        const copy = projects.slice();
        copy[projIdx] = { ...copy[projIdx], updated_at: nowIso() };
        saveJson(MOCK_KEYS.projects, copy);
      }

      return normalizeTaskFromApi(created);
    }
    const payload = normalizeTaskPayloadForApi(task);
    const { data } = await api.post('/tasks', payload);
    return normalizeTaskFromApi(data.task);
  },

  update: async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();
      const tasks = loadJson<MockTask[]>(MOCK_KEYS.tasks, []);
      const idx = tasks.findIndex((t) => t.id === id && t.creator_id === userId);
      if (idx === -1) throw new Error('Tarea no encontrada');

      // IMPORTANTE: el endpoint general (PUT /tasks/:id) NO debe cambiar status.
      // Lo dejamos solo para title, description y due_date.
      const safeUpdates = {
        ...(typeof updates.title === 'string' ? { title: updates.title } : {}),
        ...(typeof updates.description === 'string' || updates.description === undefined
          ? { description: updates.description }
          : {}),
        ...(typeof updates.due_date === 'string' || updates.due_date === undefined
          ? { due_date: updates.due_date }
          : {}),
      };

      const payload = normalizeTaskPayloadForApi(safeUpdates);
      const prev = tasks[idx];
      const next: MockTask = {
        ...prev,
        ...payload,
        updated_at: nowIso(),
      };
      const copy = tasks.slice();
      copy[idx] = next;
      saveJson(MOCK_KEYS.tasks, copy);

      // Touch project updated_at
      const projects = loadJson<MockProject[]>(MOCK_KEYS.projects, []);
      const projIdx = projects.findIndex((p) => p.id === next.project_id && p.owner_id === userId);
      if (projIdx >= 0) {
        const projCopy = projects.slice();
        projCopy[projIdx] = { ...projCopy[projIdx], updated_at: nowIso() };
        saveJson(MOCK_KEYS.projects, projCopy);
      }

      return normalizeTaskFromApi(next);
    }

    // IMPORTANTE: el endpoint general (PUT /tasks/:id) NO debe cambiar status.
    // Lo dejamos solo para title, description y due_date.
    const safeUpdates = {
      ...(typeof updates.title === 'string' ? { title: updates.title } : {}),
      ...(typeof updates.description === 'string' || updates.description === undefined
        ? { description: updates.description }
        : {}),
      ...(typeof updates.due_date === 'string' || updates.due_date === undefined
        ? { due_date: updates.due_date }
        : {}),
    };
    const payload = normalizeTaskPayloadForApi(safeUpdates);
    const { data } = await api.put(`/tasks/${id}`, payload);
    return normalizeTaskFromApi(data.task);
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();
      const tasks = loadJson<MockTask[]>(MOCK_KEYS.tasks, []);
      const toDelete = tasks.find((t) => t.id === id && t.creator_id === userId);
      if (!toDelete) throw new Error('Tarea no encontrada');
      saveJson(
        MOCK_KEYS.tasks,
        tasks.filter((t) => !(t.id === id && t.creator_id === userId))
      );

      const taskTags = loadJson<MockTaskTag[]>(MOCK_KEYS.taskTags, []);
      saveJson(
        MOCK_KEYS.taskTags,
        taskTags.filter((tt) => tt.task_id !== id)
      );

      // Touch project updated_at
      const projects = loadJson<MockProject[]>(MOCK_KEYS.projects, []);
      const projIdx = projects.findIndex((p) => p.id === toDelete.project_id && p.owner_id === userId);
      if (projIdx >= 0) {
        const projCopy = projects.slice();
        projCopy[projIdx] = { ...projCopy[projIdx], updated_at: nowIso() };
        saveJson(MOCK_KEYS.projects, projCopy);
      }
      return;
    }
    await api.delete(`/tasks/${id}`);
  },

  // Métodos específicos según el contrato
  updateStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    if (USE_MOCK) {
      return taskService.update(id, { status });
    }
    const payload = normalizeTaskPayloadForApi({ status });
    const { data } = await api.patch(`/tasks/${id}/status`, payload);
    return normalizeTaskFromApi(data.task);
  },

  updatePriority: async (id: string, priority: TaskPriority): Promise<Task> => {
    if (USE_MOCK) {
      return taskService.update(id, { priority });
    }
    const payload = normalizeTaskPayloadForApi({ priority });
    const { data } = await api.patch(`/tasks/${id}/priority`, payload);
    return normalizeTaskFromApi(data.task);
  },

  assign: async (id: string, assignee_id?: string): Promise<Task> => {
    if (USE_MOCK) {
      return taskService.update(id, { assignee_id });
    }
    const { data } = await api.patch(`/tasks/${id}/assign`, { assignee_id });
    return normalizeTaskFromApi(data.task);
  },

  getTags: async (taskId: string): Promise<any[]> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();

      const tasks = loadJson<MockTask[]>(MOCK_KEYS.tasks, []);
      const task = tasks.find((t) => t.id === taskId && t.creator_id === userId);
      if (!task) throw new Error('Tarea no encontrada');

      const links = loadJson<MockTaskTag[]>(MOCK_KEYS.taskTags, []).filter((tt) => tt.task_id === taskId);
      const tagIds = new Set(links.map((l) => l.tag_id));
      const tags = loadJson<MockTag[]>(MOCK_KEYS.tags, []).filter((t) => t.owner_id === userId && tagIds.has(t.id));
      return tags;
    }
    const { data } = await api.get(`/tasks/${taskId}/tags`);
    return data.tags || [];
  },

  addTag: async (taskId: string, tagId: string): Promise<boolean> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();

      const tasks = loadJson<MockTask[]>(MOCK_KEYS.tasks, []);
      const task = tasks.find((t) => t.id === taskId && t.creator_id === userId);
      if (!task) throw new Error('Tarea no encontrada');

      const tags = loadJson<MockTag[]>(MOCK_KEYS.tags, []);
      const tag = tags.find((t) => t.id === tagId && t.owner_id === userId);
      if (!tag) throw new Error('Etiqueta no encontrada');

      const links = loadJson<MockTaskTag[]>(MOCK_KEYS.taskTags, []);
      const exists = links.some((l) => l.task_id === taskId && l.tag_id === tagId);
      if (exists) return false;
      const next: MockTaskTag = { task_id: taskId, tag_id: tagId, created_at: nowIso() };
      saveJson(MOCK_KEYS.taskTags, [next, ...links]);
      return true;
    }
    const { data } = await api.post(`/tasks/${taskId}/tags`, { tag_id: tagId });
    return Boolean(data.added);
  },

  removeTag: async (taskId: string, tagId: string): Promise<boolean> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();

      const tasks = loadJson<MockTask[]>(MOCK_KEYS.tasks, []);
      const task = tasks.find((t) => t.id === taskId && t.creator_id === userId);
      if (!task) throw new Error('Tarea no encontrada');

      const links = loadJson<MockTaskTag[]>(MOCK_KEYS.taskTags, []);
      const before = links.length;
      const filtered = links.filter((l) => !(l.task_id === taskId && l.tag_id === tagId));
      saveJson(MOCK_KEYS.taskTags, filtered);
      return filtered.length !== before;
    }
    const { data } = await api.delete(`/tasks/${taskId}/tags/${tagId}`);
    return Boolean(data.removed);
  },
};