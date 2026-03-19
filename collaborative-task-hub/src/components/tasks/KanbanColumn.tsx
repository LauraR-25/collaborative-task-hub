import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { type Task } from '@/services/taskService';
import TaskItem from './TaskItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KanbanColumnProps {
  id: Task['status'];
  title: string;
  color: string;
  tasks: Task[];
  onUpdate: (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const KanbanColumn = ({ id, title, color, tasks, onUpdate, onDelete }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          {title}
          <span className="text-sm text-gray-400">({tasks.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent ref={setNodeRef} className="min-h-[400px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
};

export default KanbanColumn;