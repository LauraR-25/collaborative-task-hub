import api from "./api";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export const taskService = {
  getAll: async (): Promise<Task[]> => {
    const { data } = await api.get<Task[]>("/tasks");
    return data;
  },

  create: async (title: string): Promise<Task> => {
    const { data } = await api.post<Task>("/tasks", { title });
    return data;
  },

  update: async (id: string, updates: Partial<Pick<Task, "title" | "completed">>): Promise<Task> => {
    const { data } = await api.put<Task>(`/tasks/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};
