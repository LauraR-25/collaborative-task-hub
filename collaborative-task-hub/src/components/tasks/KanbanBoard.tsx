import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { ArrowLeft } from 'lucide-react';
import { projectService, type Project } from '@/services/projectService';
import { taskService, type Task } from '@/services/taskService';
import TaskForm from './TaskForm';
import KanbanColumn from './KanbanColumn';
import { Button } from '@/components/ui/button';

const KanbanBoard = () => {
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
      setProject(projectData);
      setTasks(tasksData);
      setError('');
    } catch {
      setError('Error al cargar el proyecto.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddTask = async (title: string) => {
    if (!projectId) return;
    try {
      const newTask = await taskService.create({
        title,
        status: 'todo',
        project_id: projectId,
      });
      setTasks((prev) => [newTask, ...prev]);
    } catch {
      setError('Error al crear la tarea.');
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      await taskService.update(id, updates);
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    } catch {
      setError('Error al actualizar la tarea.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await taskService.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Error al eliminar la tarea.');
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

  const columns: { id: Task['status']; title: string; color: string }[] = [
    { id: 'todo', title: 'Pendiente', color: 'bg-red-500' },
    { id: 'in_progress', title: 'En Progreso', color: 'bg-yellow-500' },
    { id: 'done', title: 'Completada', color: 'bg-green-500' },
  ];

  if (loading) {
    return <div className="text-center py-12">Cargando proyecto...</div>;
  }

  if (!project) {
    return <div className="text-center py-12">Proyecto no encontrado.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/" className="hover:no-underline">
              <Button variant="ghost" className="text-purple-400 hover:text-purple-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-purple-400">{project.name}</h1>
          </div>
          <p className="text-gray-300 mb-4">{project.description || 'Sin descripción'}</p>
          <TaskForm onAdd={handleAddTask} />
        </header>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded mb-6">{error}</div>
        )}

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                tasks={tasks.filter((task) => task.status === column.id)}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
};

export default KanbanBoard;