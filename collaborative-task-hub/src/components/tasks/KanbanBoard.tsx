import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { ArrowLeft } from 'lucide-react';
import { projectService, type Project } from '@/services/projectService';
import { taskService, type Task } from '@/services/taskService';
import TaskForm from './TaskForm';
import KanbanColumn from './KanbanColumn';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/context/AuthContext';

const normalizeStatusForBoard = (status: Task['status']): Exclude<Task['status'], 'bloqueada'> =>
  status === 'bloqueada' ? 'pendiente' : status;

const KanbanBoard = () => {
  const { user } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      const [projectData, tasksData] = await Promise.all([
        projectService.getById(projectId),
        taskService.getAll(projectId),
      ]);
      const safeProject = user?.id && projectData.owner_id && projectData.owner_id !== user.id ? null : projectData;
      const safeTasks = user?.id ? tasksData.filter((t) => !t.creator_id || t.creator_id === user.id) : tasksData;
      setProject(safeProject);
      setTasks(safeTasks);
      setError('');
    } catch {
      setError('Error al cargar el proyecto.');
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddTask = async ({
    title,
    description,
    priority,
    tagIds,
  }: {
    title: string;
    description?: string;
    priority?: Task['priority'];
    tagIds: string[];
  }) => {
    if (!projectId) return;
    try {
      const newTask = await taskService.create({
        title,
        description,
        ...(priority ? { priority } : {}),
        status: 'pendiente',
        project_id: projectId,
      });

      if (tagIds.length) {
        await Promise.all(tagIds.map((tagId) => taskService.addTag(newTask.id, tagId)));
      }

      setTasks((prev) => [newTask, ...prev]);
    } catch {
      setError('Error al crear la tarea.');
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const updated = updates.status ? await taskService.updateStatus(id, updates.status) : await taskService.update(id, updates);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      setError('Error al actualizar la tarea.');
    }
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id && typeof active.id === 'string' && typeof over.id === 'string') {
        handleUpdateTask(active.id, { status: over.id as Task['status'] });
      }
    },
    [handleUpdateTask]
  );

  const columns: { id: Task['status']; title: string }[] = [
    { id: 'pendiente', title: 'PENDIENTES' },
    { id: 'en_progreso', title: 'EN PROGRESO' },
    { id: 'completada', title: 'COMPLETADAS' },
  ];

  if (loading) {
    return <div className="px-6 pt-20 text-center py-12">Cargando proyecto...</div>;
  }

  if (!project) {
    return <div className="px-6 pt-20 text-center py-12">Proyecto no encontrado.</div>;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground px-6 pt-20 pb-6 targaryen-shell">
        <div className="max-w-7xl mx-auto">
        <img src="/houses/targaryen.png" alt="Casa Targaryen" className="house-logo" />
        <header className="mb-8">
          <div className="grid grid-cols-3 items-center gap-4">
            <div>
              <Link to="/dashboard" className="hover:no-underline">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
            </div>
            <h1 className="text-center text-xl font-semibold">Proyecto: {project.name}</h1>
            <div />
          </div>

          <div className="mt-4 grid grid-cols-3 items-center gap-4">
            <div>
              <TaskForm onAdd={handleAddTask} />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {(project.member_count || 1)} miembros
            </div>
            <div />
          </div>
        </header>

        {error && (
          <div className="rounded border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={tasks.filter((task) => normalizeStatusForBoard(task.status) === column.id)}
              />
            ))}
          </div>
        </DndContext>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default KanbanBoard;