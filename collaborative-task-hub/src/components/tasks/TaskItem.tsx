import { useState } from 'react';
import type { Task } from '@/services/taskService';
import TaskDetailDialog from './TaskDetailDialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskItemProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TaskItem = ({ task, onUpdate, onDelete }: TaskItemProps) => {
  const [open, setOpen] = useState(false);
  const [openInEdit, setOpenInEdit] = useState(false);

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
      <div className="rounded-md border border-border px-4 py-3 transition-colors bg-surface hover:bg-surface-active">
        <div className="flex items-start gap-3">
          {/* Indicador de estado (no clickeable) */}
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
            <span className="text-sm">{statusIcon}</span>
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    setOpenInEdit(false);
                    setOpen(true);
                  }}
                  className="min-w-0 w-full text-left"
                  aria-label={`Abrir tarea: ${task.title}`}
                >
                  <div
                    className={`truncate font-heading text-sm font-medium ${
                      isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {task.title}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>{task.title}</TooltipContent>
            </Tooltip>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpenInEdit(true);
                  setOpen(true);
                }}
                className="px-3 py-1.5 font-heading text-xs font-medium text-muted-foreground cursor-pointer"
                aria-label={`Editar tarea: ${task.title}`}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="px-3 py-1.5 font-heading text-xs font-medium text-destructive cursor-pointer"
                aria-label={`Eliminar tarea: ${task.title}`}
              >
                Eliminar
              </button>
            </div>

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

      <TaskDetailDialog
        open={open}
        onOpenChange={setOpen}
        taskId={open ? task.id : null}
        startInEdit={openInEdit}
        onUpdated={(updated) => {
          const { id, created_at, updated_at, ...updates } = updated;
          return onUpdate(id, updates);
        }}
        onDeleted={(deletedId) => onDelete(deletedId)}
      />
    </>
  );
};

export default TaskItem;