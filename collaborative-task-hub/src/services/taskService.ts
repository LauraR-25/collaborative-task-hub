import api from './api';

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
    const params = projectId ? { project_id: projectId } : {};
    const { data } = await api.get('/tasks', { params });
    const tasks = data.tasks || [];
    return tasks.map(normalizeTaskFromApi);
  },

  getById: async (id: string): Promise<Task> => {
    const { data } = await api.get(`/tasks/${id}`);
    return normalizeTaskFromApi(data.task);
  },

  create: async (task: CreateTaskInput): Promise<Task> => {
    const payload = normalizeTaskPayloadForApi(task);
    const { data } = await api.post('/tasks', payload);
    return normalizeTaskFromApi(data.task);
  },

  update: async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task> => {
    const payload = normalizeTaskPayloadForApi(updates);
    const { data } = await api.put(`/tasks/${id}`, payload);
    return normalizeTaskFromApi(data.task);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  // Métodos específicos según el contrato
  updateStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    const payload = normalizeTaskPayloadForApi({ status });
    const { data } = await api.patch(`/tasks/${id}/status`, payload);
    return normalizeTaskFromApi(data.task);
  },

  updatePriority: async (id: string, priority: TaskPriority): Promise<Task> => {
    const payload = normalizeTaskPayloadForApi({ priority });
    const { data } = await api.patch(`/tasks/${id}/priority`, payload);
    return normalizeTaskFromApi(data.task);
  },

  assign: async (id: string, assignee_id?: string): Promise<Task> => {
    const { data } = await api.patch(`/tasks/${id}/assign`, { assignee_id });
    return normalizeTaskFromApi(data.task);
  },

  getTags: async (taskId: string): Promise<any[]> => {
    const { data } = await api.get(`/tasks/${taskId}/tags`);
    return data.tags || [];
  },

  addTag: async (taskId: string, tagId: string): Promise<boolean> => {
    const { data } = await api.post(`/tasks/${taskId}/tags`, { tag_id: tagId });
    return Boolean(data.added);
  },

  removeTag: async (taskId: string, tagId: string): Promise<boolean> => {
    const { data } = await api.delete(`/tasks/${taskId}/tags/${tagId}`);
    return Boolean(data.removed);
  },
};