import api from "./api";

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

let mockProjects: Project[] = [
  {
    id: 'proj1',
    name: 'Proyecto de ejemplo 1',
    description: 'Este es un proyecto mock mientras se desarrolla el backend',
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
    last_activity: new Date(Date.now() - 86400000).toISOString(), // ayer
  },
];

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    console.warn('[MOCK] projectService.getAll - Backend /projects no implementado');
    return mockProjects;
  },
  getById: async (id: string): Promise<Project> => {
    console.warn('[MOCK] projectService.getById - Backend /projects no implementado');
    const project = mockProjects.find(p => p.id === id);
    if (!project) throw new Error('Proyecto no encontrado');
    return project;
  },
  create: async (project: Omit<Project, 'id' | 'owner_id' | 'created_at' | 'updated_at'>): Promise<Project> => {
    console.warn('[MOCK] projectService.create - Backend /projects no implementado');
    const newProject: Project = {
      ...project,
      id: Math.random().toString(36).substring(2, 9),
      owner_id: 'current-user-id', // se obtendría del token real
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member_count: 1,
      task_count: 0,
    };
    mockProjects.push(newProject);
    return newProject;
  },
  update: async (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>): Promise<Project> => {
    console.warn('[MOCK] projectService.update - Backend /projects no implementado');
    const index = mockProjects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Proyecto no encontrado');
    mockProjects[index] = { ...mockProjects[index], ...updates, updated_at: new Date().toISOString() };
    return mockProjects[index];
  },
  delete: async (id: string): Promise<void> => {
    console.warn('[MOCK] projectService.delete - Backend /projects no implementado');
    mockProjects = mockProjects.filter(p => p.id !== id);
  },
};