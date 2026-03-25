import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { taskService, type Task } from '@/services/taskService';
import { projectService, type Project } from '@/services/projectService';
import TaskDetailDialog from '@/components/tasks/TaskDetailDialog';

const statusOrder: Task['status'][] = ['pendiente', 'en_progreso', 'completada', 'bloqueada'];

const statusLabel: Record<Task['status'], string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
  bloqueada: 'Bloqueada',
};

const statusIcon: Record<Task['status'], string> = {
  pendiente: '🟡',
  en_progreso: '🔵',
  completada: '✅',
  bloqueada: '⛔',
};

const TasksTab = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [openInEdit, setOpenInEdit] = useState(false);

  const projectNameById = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, projectsData] = await Promise.all([taskService.getAll(), projectService.getAll()]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (e: any) {
      const apiMessage = e?.response?.data?.message;
      setError(apiMessage || 'Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => {
      const title = (t.title || '').toLowerCase();
      const projectName = (projectNameById.get(t.project_id) || '').toLowerCase();
      return title.includes(q) || projectName.includes(q);
    });
  }, [tasks, search, projectNameById]);

  const tasksByStatus = useMemo(() => {
    const map = new Map<Task['status'], Task[]>();
    statusOrder.forEach((s) => map.set(s, []));
    filtered.forEach((t) => {
      const arr = map.get(t.status);
      if (arr) arr.push(t);
    });
    return map;
  }, [filtered]);

  return (
    <div className="container mx-auto px-6 pt-20 pb-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Tareas</h1>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar tareas..."
          className="max-w-sm"
        />
      </div>

      {error && (
        <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Cargando tareas...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay tareas para mostrar.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statusOrder.map((status) => {
            const list = tasksByStatus.get(status) || [];
            return (
              <Card key={status}>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    <span>
                      {statusIcon[status]} {statusLabel[status].toUpperCase()}
                    </span>
                    <span className="text-sm text-muted-foreground">({list.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="min-h-[400px]">
                  <div className="space-y-3">
                    {list.map((t) => (
                      <div key={t.id} className="rounded-md border border-border bg-surface hover:bg-surface-active transition-colors">
                        <div className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenInEdit(false);
                                setSelectedTaskId(t.id);
                              }}
                              className="min-w-0 flex-1 text-left"
                              aria-label={`Abrir tarea: ${t.title}`}
                            >
                              <div className="truncate text-sm font-medium text-foreground">{t.title}</div>
                              <div className="mt-1 text-xs text-muted-foreground truncate">
                                Proyecto: {projectNameById.get(t.project_id) || t.project_id}
                              </div>
                              {t.due_date && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Fecha límite: {new Date(t.due_date).toISOString().slice(0, 10)}
                                </div>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenInEdit(true);
                                setSelectedTaskId(t.id);
                              }}
                              className="shrink-0 px-3 py-1.5 text-xs font-medium text-muted-foreground cursor-pointer"
                              aria-label={`Editar tarea: ${t.title}`}
                            >
                              Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TaskDetailDialog
        open={Boolean(selectedTaskId)}
        onOpenChange={(next) => {
          if (!next) {
            setSelectedTaskId(null);
            setOpenInEdit(false);
          }
        }}
        taskId={selectedTaskId}
        startInEdit={openInEdit}
        onUpdated={(updated) => {
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        }}
        onDeleted={(deletedId) => {
          setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          setSelectedTaskId(null);
          setOpenInEdit(false);
        }}
      />
    </div>
  );
};

export default TasksTab;
