import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { type Task } from '@/services/taskService';
import TaskItem from './TaskItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KanbanColumnProps {
  id: Task['status'];
  title: string;
  tasks: Task[];
}

const KanbanColumn = ({ id, title, tasks }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <Card className="targaryen-card kanban-column">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span className="text-primary column-title">{title}</span>
          <span className="text-sm text-muted-foreground">({tasks.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent ref={setNodeRef} className="min-h-[400px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
};

export default KanbanColumn;