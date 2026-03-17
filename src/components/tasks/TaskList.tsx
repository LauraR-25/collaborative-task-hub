import TaskItem from './TaskItem';
import type { Task } from '@/services/taskService';

interface TaskListProps {
  tasks: Task[];
  onUpdate: (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TaskList = ({ tasks, onUpdate, onDelete }: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-body text-muted-foreground">No hay tareas. Crea una para comenzar.</p>
      </div>
    );
  }

  return (
    <div>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default TaskList;