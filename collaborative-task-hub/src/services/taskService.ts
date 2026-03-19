import api from './api';

export interface Task {
  id: string;
  project_id: string;
  creator_id: string;
  assignee_id?: string;
  title: string;
  description?: string;
  status: string;        // 'todo' | 'in_progress' | 'done' (según backend)
  priority?: string;     // 'low' | 'medium' | 'high'
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export const taskService = {
  getAll: async (projectId?: string): Promise<Task[]> => {
    const params = projectId ? { project_id: projectId } : {};
    const { data } = await api.get('/tasks', { params });
    return data.tasks || [];
  },

  getById: async (id: string): Promise<Task> => {
    const { data } = await api.get(`/tasks/${id}`);
    return data.task;
  },

  create: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'creator_id'>): Promise<Task> => {
    const { data } = await api.post('/tasks', task);
    return data.task;
  },

  update: async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task> => {
    const { data } = await api.put(`/tasks/${id}`, updates);
    return data.task;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  // Métodos específicos según el contrato
  updateStatus: async (id: string, status: string): Promise<Task> => {
    const { data } = await api.patch(`/tasks/${id}/status`, { status });
    return data.task;
  },

  updatePriority: async (id: string, priority: string): Promise<Task> => {
    const { data } = await api.patch(`/tasks/${id}/priority`, { priority });
    return data.task;
  },

  assign: async (id: string, assignee_id?: string): Promise<Task> => {
    const { data } = await api.patch(`/tasks/${id}/assign`, { assignee_id });
    return data.task;
  },
};