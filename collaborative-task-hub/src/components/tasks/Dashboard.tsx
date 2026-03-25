import { useState, useEffect, useCallback } from 'react';
import { taskService, type Task, type TaskPriority } from '@/services/taskService';
import TaskForm from './TaskForm';
import TaskList from './TaskList';

const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const data = await taskService.getAll(); // todas las tareas (sin filtrar por proyecto)
      setTasks(data);
      setError('');
    } catch {
      setError('Error al cargar las tareas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAdd = async ({
    title,
  }: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    tagIds: string[];
  }) => {
    // Esta pantalla no se usa en el flujo principal (router) y no tiene project_id válido.
    // Evitamos enviar un project_id inválido al backend.
    setError('Selecciona un proyecto para crear tareas.');
    void title;
  };

  const handleUpdate = async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const updated = await taskService.update(id, updates);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      setError('Error al actualizar la tarea.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await taskService.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Error al eliminar la tarea.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-20 pb-12">
      <h1 className="mb-8 font-heading text-3xl font-semibold text-foreground">Tareas</h1>

      <div className="bg-surface shadow-[var(--shadow-slab)]">
        <div className="border-b border-border p-4">
          <TaskForm onAdd={handleAdd} />
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded mb-6">{error}</div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <span className="inline-block h-3 w-3 rounded-full bg-primary animate-heartbeat" />
          </div>
        ) : (
          <TaskList tasks={tasks} onUpdate={handleUpdate} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;