import { useSortable } from '@dnd-kit/sortable';
import type { Task } from '@/services/taskService';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskItemProps {
  task: Task;
}

const TaskItem = ({ task }: TaskItemProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: task.id });

  const effectiveStatus: Task['status'] = task.status === 'bloqueada' ? 'pendiente' : task.status;
  const isDone = effectiveStatus === 'completada';

  const statusIcon = (() => {
    switch (effectiveStatus) {
      case 'pendiente':
        return '🟡';
      case 'en_progreso':
        return '🔵';
      case 'completada':
        return '✅';
      default:
        return '•';
    }
  })();

  const priorityMeta = (() => {
    switch (task.priority) {
      case 'baja':
        return { label: 'Baja', className: 'border-green-200 bg-green-100 text-green-800' };
      case 'media':
        return { label: 'Media', className: 'border-blue-200 bg-blue-100 text-blue-800' };
      case 'alta':
        return { label: 'Alta', className: 'border-purple-200 bg-purple-100 text-purple-800' };
      case 'critica':
        return { label: 'Crítica', className: 'border-red-200 bg-red-100 text-red-800' };
      default:
        return { label: 'Sin prioridad', className: 'border-gray-200 bg-gray-100 text-gray-700' };
    }
  })();

  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`kanban-task-card rounded-md border border-border px-4 py-3 transition-colors bg-surface hover:bg-surface-active ${
          isDragging ? 'is-dragging' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Indicador de estado (no clickeable) */}
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
            <span className="text-sm">{statusIcon}</span>
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="min-w-0 w-full text-left" aria-label={`Tarea: ${task.title}`}>
                  <div
                    className={`truncate font-heading text-sm font-medium ${
                      isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {task.title}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>{task.title}</TooltipContent>
            </Tooltip>

            <div className="mt-2 text-[11px] text-muted-foreground/80">Gestiona edicion y eliminacion desde la vista Tareas.</div>

            {task.description && (
              <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{task.description}</div>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Prioridad:</span>
              <Badge variant="outline" className={priorityMeta.className}>
                {priorityMeta.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskItem;