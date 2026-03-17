import api from "./api";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  project_id: string;
  assigned_to?: string;
  priority?: "low" | "medium" | "high";
  due_date?: string;
  created_at: string;
  updated_at: string;
  // completed removed - use status instead
}

let mockTasks: Task[] = [
  {
    id: "1",
    title: "Mock task 1 - Backend not implemented yet",
    status: "todo" as const,
    project_id: "default",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Mock task 2",
    status: "in_progress" as const,
    project_id: "default",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Mock task 3",
    status: "done" as const,
    project_id: "default",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const taskService = {
  getAll: async (projectId?: string): Promise<Task[]> => {
    console.warn("[MOCK] taskService.getAll - Backend /tasks endpoint not implemented");
    return mockTasks.filter(t => !projectId || t.project_id === projectId);
  },

  create: async (task: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task> => {
    console.warn("[MOCK] taskService.create - Backend /tasks not implemented");
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).slice(2),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockTasks.unshift(newTask);
    return newTask;
  },

  update: async (id: string, updates: Partial<Omit<Task, "id" | "created_at" | "updated_at">>): Promise<Task> => {
    console.warn("[MOCK] taskService.update - Backend /tasks not implemented");
    const index = mockTasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Task not found");
    mockTasks[index] = { ...mockTasks[index], ...updates, updated_at: new Date().toISOString() } as Task;
    return mockTasks[index];
  },

  delete: async (id: string): Promise<void> => {
    console.warn("[MOCK] taskService.delete - Backend /tasks not implemented");
    mockTasks = mockTasks.filter(t => t.id !== id);
  },
};

