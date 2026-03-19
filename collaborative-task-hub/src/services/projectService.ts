import api from './api';

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

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    // El backend responde con { projects: [...] }
    const { data } = await api.get('/projects');
    return data.projects || [];
  },

  getById: async (id: string): Promise<Project> => {
    const { data } = await api.get(`/projects/${id}`);
    return data.project;
  },

  create: async (project: { name: string; description?: string }): Promise<Project> => {
    const { data } = await api.post('/projects', project);
    return data.project;
  },

  update: async (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>): Promise<Project> => {
    const { data } = await api.put(`/projects/${id}`, updates);
    return data.project;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};