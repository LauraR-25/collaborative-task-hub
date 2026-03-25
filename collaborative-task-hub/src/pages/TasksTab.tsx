import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { taskService, type Task } from '@/services/taskService';
import { projectService, type Project } from '@/services/projectService';
import TaskDetailDialog from '@/components/tasks/TaskDetailDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const statusOrder: Array<Exclude<Task['status'], 'bloqueada'>> = ['pendiente', 'en_progreso', 'completada'];

const statusLabel: Record<Exclude<Task['status'], 'bloqueada'>, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
};

const statusIcon: Record<Exclude<Task['status'], 'bloqueada'>, string> = {
  pendiente: '🟡',
  en_progreso: '🔵',
  completada: '✅',
};

const normalizeStatusForBoard = (status: Task['status']): Exclude<Task['status'], 'bloqueada'> =>
  status === 'bloqueada' ? 'pendiente' : status;

const TasksTab = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'alta' | 'media' | 'baja' | 'critica' | 'none'>(
    'all'
  );

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

  const handleDeleteTask = useCallback(async (id: string) => {
    setError(null);
    try {
      await taskService.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (selectedTaskId === id) {
        setSelectedTaskId(null);
        setOpenInEdit(false);
      }
    } catch (e: any) {
      const apiMessage = e?.response?.data?.message;
      setError(apiMessage || 'No se pudo eliminar la tarea');
    }
  }, [selectedTaskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (priorityFilter !== 'all') {
        if (priorityFilter === 'none') {
          if (t.priority) return false;
        } else {
          if (t.priority !== priorityFilter) return false;
        }
      }
      if (!q) return true;
      const title = (t.title || '').toLowerCase();
      const projectName = (projectNameById.get(t.project_id) || '').toLowerCase();
      return title.includes(q) || projectName.includes(q);
    });
  }, [tasks, search, projectNameById, priorityFilter]);

  const tasksByStatus = useMemo(() => {
    const map = new Map<Exclude<Task['status'], 'bloqueada'>, Task[]>();
    statusOrder.forEach((s) => map.set(s, []));
    filtered.forEach((t) => {
      const arr = map.get(normalizeStatusForBoard(t.status));
      if (arr) arr.push(t);
    });
    return map;
  }, [filtered]);

  return (
    <TooltipProvider>
      <div className="container mx-auto px-6 pt-20 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">Tareas</h1>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Buscar tareas..."
              className="w-full sm:w-72"
            />
            <Select
              value={priorityFilter}
              onValueChange={(v) =>
                setPriorityFilter(v as 'all' | 'alta' | 'media' | 'baja' | 'critica' | 'none')
              }
            >
              <SelectTrigger aria-label="Filtrar por prioridad" className="w-full sm:w-56">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="none">Sin prioridad</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <div
                          key={t.id}
                          className="rounded-md border border-border bg-surface hover:bg-surface-active transition-colors"
                        >
                          <div className="px-4 py-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenInEdit(false);
                                    setSelectedTaskId(t.id);
                                  }}
                                  className="min-w-0 w-full text-left"
                                  aria-label={`Abrir tarea: ${t.title}`}
                                >
                                  <div className="truncate text-sm font-medium text-foreground">{t.title}</div>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{t.title}</TooltipContent>
                            </Tooltip>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenInEdit(true);
                                  setSelectedTaskId(t.id);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-muted-foreground cursor-pointer"
                                aria-label={`Editar tarea: ${t.title}`}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(t.id)}
                                className="px-3 py-1.5 text-xs font-medium text-destructive cursor-pointer"
                                aria-label={`Eliminar tarea: ${t.title}`}
                              >
                                Eliminar
                              </button>
                            </div>

                            <div className="mt-2 text-xs text-muted-foreground truncate">
                              Proyecto: {projectNameById.get(t.project_id) || t.project_id}
                            </div>
                            {t.due_date && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                Fecha límite: {new Date(t.due_date).toISOString().slice(0, 10)}
                              </div>
                            )}
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
    </TooltipProvider>
  );
};

export default TasksTab;
