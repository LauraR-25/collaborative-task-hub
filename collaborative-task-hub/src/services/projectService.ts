export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  task_count?: number;
  last_activity?: string;
}

const STORAGE_KEY = 'taskflow_projects';

// Datos iniciales si no hay nada en localStorage
const defaultProjects: Project[] = [
  {
    id: 'proj1',
    name: 'Proyecto de ejemplo 1',
    description: 'Este es un proyecto mock',
    owner_id: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    member_count: 3,
    task_count: 5,
    last_activity: new Date().toISOString(),
  },
  {
    id: 'proj2',
    name: 'Proyecto de ejemplo 2',
    description: 'Otro proyecto mock',
    owner_id: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    member_count: 2,
    task_count: 2,
    last_activity: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Función para cargar proyectos desde localStorage
const loadProjects = (): Project[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultProjects;
    }
  }
  return defaultProjects;
};

// Función para guardar proyectos en localStorage
const saveProjects = (projects: Project[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

// Inicializar
let mockProjects: Project[] = loadProjects();

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    console.log('[MOCK] projectService.getAll - usando localStorage');
    return mockProjects;
  },
  getById: async (id: string): Promise<Project> => {
    const project = mockProjects.find(p => p.id === id);
    if (!project) throw new Error('Proyecto no encontrado');
    return project;
  },
  create: async (project: Omit<Project, 'id' | 'owner_id' | 'created_at' | 'updated_at'>): Promise<Project> => {
    const newProject: Project = {
      ...project,
      id: Math.random().toString(36).substring(2, 9),
      owner_id: 'current-user-id', // se puede reemplazar con el ID real del usuario logueado
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member_count: 1,
      task_count: 0,
    };
    mockProjects.push(newProject);
    saveProjects(mockProjects);
    return newProject;
  },
  update: async (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>): Promise<Project> => {
    const index = mockProjects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Proyecto no encontrado');
    mockProjects[index] = { ...mockProjects[index], ...updates, updated_at: new Date().toISOString() };
    saveProjects(mockProjects);
    return mockProjects[index];
  },
  delete: async (id: string): Promise<void> => {
    mockProjects = mockProjects.filter(p => p.id !== id);
    saveProjects(mockProjects);
  },
};