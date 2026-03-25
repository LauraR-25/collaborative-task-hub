import api from './api';
import { loadJson, nowIso, saveJson } from '@/lib/mockStorage';
import {
  MOCK_KEYS,
  USE_MOCK,
  mockCreateId,
  mockRequireUserId,
  mockSeedIfNeeded,
  type MockProject,
  type MockTask,
} from '@/lib/mockData';

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  member_count?: number;  // Estos campos pueden venir del backend o calcularse
  task_count?: number;
  last_activity?: string;
}

const enrichProjects = (projects: MockProject[], tasks: MockTask[]) => {
  const byProject = new Map<string, MockTask[]>();
  for (const task of tasks) {
    const list = byProject.get(task.project_id) || [];
    list.push(task);
    byProject.set(task.project_id, list);
  }

  return projects.map((p) => {
    const projectTasks = byProject.get(p.id) || [];
    const last = projectTasks
      .map((t) => t.updated_at || t.created_at)
      .sort()
      .at(-1);
    return {
      ...p,
      member_count: 1,
      task_count: projectTasks.length,
      last_activity: last,
    } satisfies Project;
  });
};

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();
      const projects = loadJson<MockProject[]>(MOCK_KEYS.projects, []).filter((p) => p.owner_id === userId);
      const tasks = loadJson<MockTask[]>(MOCK_KEYS.tasks, []).filter((t) => t.creator_id === userId);
      return enrichProjects(projects, tasks).sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
    }
    // El backend responde con { projects: [...] }
    const { data } = await api.get('/projects');
    if (Array.isArray(data?.projects)) return data.projects;
    if (Array.isArray(data)) return data;
    return [];
  },

  getById: async (id: string): Promise<Project> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();
      const projects = loadJson<MockProject[]>(MOCK_KEYS.projects, []);
      const project = projects.find((p) => p.id === id && p.owner_id === userId);
      if (!project) throw new Error('Proyecto no encontrado');
      const tasks = loadJson<MockTask[]>(MOCK_KEYS.tasks, []).filter((t) => t.creator_id === userId);
      return enrichProjects([project], tasks)[0];
    }
    const { data } = await api.get(`/projects/${id}`);
    return data.project;
  },

  create: async (project: { name: string; description?: string }): Promise<Project> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();
      const now = nowIso();
      const created: MockProject = {
        id: mockCreateId('proj'),
        name: project.name,
        description: project.description,
        owner_id: userId,
        created_at: now,
        updated_at: now,
      };
      const projects = loadJson<MockProject[]>(MOCK_KEYS.projects, []);
      saveJson(MOCK_KEYS.projects, [created, ...projects]);
      return { ...created, member_count: 1, task_count: 0, last_activity: undefined };
    }
    const { data } = await api.post('/projects', project);
    return data.project;
  },

  update: async (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>): Promise<Project> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();
      const projects = loadJson<MockProject[]>(MOCK_KEYS.projects, []);
      const idx = projects.findIndex((p) => p.id === id && p.owner_id === userId);
      if (idx === -1) throw new Error('Proyecto no encontrado');

      const next: MockProject = {
        ...projects[idx],
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        updated_at: nowIso(),
      };
      const copy = projects.slice();
      copy[idx] = next;
      saveJson(MOCK_KEYS.projects, copy);

      const tasks = loadJson<MockTask[]>(MOCK_KEYS.tasks, []).filter((t) => t.creator_id === userId);
      return enrichProjects([next], tasks)[0];
    }
    const { data } = await api.put(`/projects/${id}`, updates);
    return data.project;
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();
      const projects = loadJson<MockProject[]>(MOCK_KEYS.projects, []);
      saveJson(
        MOCK_KEYS.projects,
        projects.filter((p) => !(p.id === id && p.owner_id === userId))
      );

      const tasks = loadJson<MockTask[]>(MOCK_KEYS.tasks, []);
      const removedTaskIds = new Set(tasks.filter((t) => t.project_id === id && t.creator_id === userId).map((t) => t.id));
      saveJson(
        MOCK_KEYS.tasks,
        tasks.filter((t) => !(t.project_id === id && t.creator_id === userId))
      );

      const taskTags = loadJson<any[]>(MOCK_KEYS.taskTags, []);
      saveJson(
        MOCK_KEYS.taskTags,
        taskTags.filter((tt) => !removedTaskIds.has(String(tt.task_id)))
      );
      return;
    }
    await api.delete(`/projects/${id}`);
  },
};