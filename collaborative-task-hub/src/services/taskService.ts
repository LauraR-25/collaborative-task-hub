export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  project_id: string;
  assigned_to?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'taskflow_tasks';

const defaultTasks: Task[] = [
  {
    id: 'task1',
    title: 'Mock task 1 - Diseñar interfaz',
    status: 'todo',
    project_id: 'proj1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    priority: 'high',
  },
  {
    id: 'task2',
    title: 'Mock task 2 - Implementar login',
    status: 'in_progress',
    project_id: 'proj1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assigned_to: 'user2',
  },
  {
    id: 'task3',
    title: 'Mock task 3 - Configurar repositorio',
    status: 'done',
    project_id: 'proj1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task4',
    title: 'Mock task 4 - Escribir documentación',
    status: 'todo',
    project_id: 'proj2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const loadTasks = (): Task[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultTasks;
    }
  }
  return defaultTasks;
};

const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

let mockTasks: Task[] = loadTasks();

export const taskService = {
  getAll: async (projectId?: string): Promise<Task[]> => {
    console.log('[MOCK] taskService.getAll - usando localStorage');
    if (projectId) {
      return mockTasks.filter(t => t.project_id === projectId);
    }
    return mockTasks;
  },
  create: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockTasks.push(newTask);
    saveTasks(mockTasks);
    return newTask;
  },
  update: async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task> => {
    const index = mockTasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tarea no encontrada');
    mockTasks[index] = { ...mockTasks[index], ...updates, updated_at: new Date().toISOString() };
    saveTasks(mockTasks);
    return mockTasks[index];
  },
  delete: async (id: string): Promise<void> => {
    mockTasks = mockTasks.filter(t => t.id !== id);
    saveTasks(mockTasks);
  },
};