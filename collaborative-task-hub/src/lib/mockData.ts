import { loadJson, nowIso, randomId, saveJson } from '@/lib/mockStorage';

export const USE_MOCK = import.meta.env.MODE === 'mock' || import.meta.env.VITE_MOCK_API === 'true';

export const MOCK_KEYS = {
  users: 'mock_users',
  currentUserId: 'mock_current_user_id',
  token: 'mock_access_token',
  projects: 'mock_projects',
  tasks: 'mock_tasks',
  tags: 'mock_tags',
  taskTags: 'mock_task_tags',
};

type MockUser = {
  id: string;
  user: string;
  email: string;
  password: string;
  created_at: string;
};

export type MockProject = {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type MockTask = {
  id: string;
  project_id: string;
  creator_id: string;
  assignee_id?: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
};

export type MockTag = {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type MockTaskTag = {
  task_id: string;
  tag_id: string;
  created_at: string;
};

const seedAuthIfNeeded = () => {
  const users = loadJson<MockUser[]>(MOCK_KEYS.users, []);
  if (users.length > 0) return;

  const demo: MockUser = {
    id: 'user_1',
    user: 'demo',
    email: 'demo@taskflow.local',
    password: '12345678',
    created_at: nowIso(),
  };
  saveJson(MOCK_KEYS.users, [demo]);
  saveJson(MOCK_KEYS.currentUserId, demo.id);
  saveJson(MOCK_KEYS.token, `mock_${demo.id}_${Date.now()}`);
};

export const mockGetCurrentUserId = (): string | null => {
  seedAuthIfNeeded();
  return loadJson<string | null>(MOCK_KEYS.currentUserId, null);
};

export const mockRequireUserId = (): string => {
  const id = mockGetCurrentUserId();
  if (!id) throw new Error('No hay sesión');
  return id;
};

const seedDomainIfNeeded = (userId: string) => {
  const tags = loadJson<MockTag[]>(MOCK_KEYS.tags, []);
  if (tags.length === 0) {
    const base: MockTag[] = [
      { id: 'tag_1', owner_id: userId, name: 'Bug', color: '#ef4444', created_at: nowIso() },
      { id: 'tag_2', owner_id: userId, name: 'Mejora', color: '#3b82f6', created_at: nowIso() },
      { id: 'tag_3', owner_id: userId, name: 'Urgente', color: '#f97316', created_at: nowIso() },
      { id: 'tag_4', owner_id: userId, name: 'UI', color: '#a855f7', created_at: nowIso() },
    ];
    saveJson(MOCK_KEYS.tags, base);
  }

  const projects = loadJson<MockProject[]>(MOCK_KEYS.projects, []);
  if (projects.length === 0) {
    const now = nowIso();
    const seededProjects: MockProject[] = [
      {
        id: 'proj_1',
        name: 'Proyecto Demo',
        description: 'Proyecto de ejemplo (modo mock).',
        owner_id: userId,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'proj_2',
        name: 'Proyecto Personal',
        description: 'Ideas y tareas personales.',
        owner_id: userId,
        created_at: now,
        updated_at: now,
      },
    ];
    saveJson(MOCK_KEYS.projects, seededProjects);
  }

  const tasks = loadJson<MockTask[]>(MOCK_KEYS.tasks, []);
  if (tasks.length === 0) {
    const now = nowIso();
    const seededTasks: MockTask[] = [
      {
        id: 'task_1',
        project_id: 'proj_1',
        creator_id: userId,
        title: 'Configurar entorno',
        description: 'Instalar dependencias y arrancar el proyecto.',
        status: 'pendiente',
        priority: 'media',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'task_2',
        project_id: 'proj_1',
        creator_id: userId,
        title: 'Revisar Kanban',
        description: 'Verificar arrastre entre columnas.',
        status: 'en_progreso',
        priority: 'alta',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'task_3',
        project_id: 'proj_1',
        creator_id: userId,
        title: 'Cerrar bug visual',
        description: 'Ajustar estilos en tarjetas.',
        status: 'bloqueada',
        priority: 'critica',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'task_4',
        project_id: 'proj_2',
        creator_id: userId,
        title: 'Hacer lista de pendientes',
        description: 'Definir tareas para la semana.',
        status: 'completada',
        priority: 'baja',
        created_at: now,
        updated_at: now,
      },
    ];
    saveJson(MOCK_KEYS.tasks, seededTasks);
  }

  const taskTags = loadJson<MockTaskTag[]>(MOCK_KEYS.taskTags, []);
  if (taskTags.length === 0) {
    const now = nowIso();
    const seeded: MockTaskTag[] = [
      { task_id: 'task_2', tag_id: 'tag_4', created_at: now },
      { task_id: 'task_3', tag_id: 'tag_1', created_at: now },
      { task_id: 'task_3', tag_id: 'tag_3', created_at: now },
    ];
    saveJson(MOCK_KEYS.taskTags, seeded);
  }
};

export const mockSeedIfNeeded = () => {
  seedAuthIfNeeded();
  const userId = mockGetCurrentUserId();
  if (!userId) return;
  seedDomainIfNeeded(userId);
};

export const mockPickColor = (seed: string) => {
  const palette = ['#64748b', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#f97316'];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
};

export const mockNowUpdate = <T extends { updated_at: string }>(value: T): T => ({
  ...value,
  updated_at: nowIso(),
});

export const mockCreateId = (prefix: string) => randomId(prefix);
