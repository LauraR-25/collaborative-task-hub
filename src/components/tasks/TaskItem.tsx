import { useState } from 'react';
import type { Task } from '@/services/taskService';

interface TaskItemProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TaskItem = ({ task, onUpdate, onDelete }: TaskItemProps) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [committing, setCommitting] = useState(false);

  const handleSave = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === task.title) {
      setEditing(false);
      setEditTitle(task.title);
      return;
    }
    setCommitting(true);
    await onUpdate(task.id, { title: trimmed });
    setEditing(false);
    setCommitting(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditing(false);
  };

  const handleToggle = async () => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await onUpdate(task.id, { status: newStatus });
  };

  const isDone = task.status === 'done';

  return (
    <div
      className={`flex items-center gap-3 border-b border-border px-4 py-3 transition-colors ${
        editing ? 'bg-surface-active' : 'bg-surface'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className="flex h-5 w-5 shrink-0 items-center justify-center border border-border cursor-pointer"
        aria-label={isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
      >
        {isDone && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-primary">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
            className="w-full border border-input bg-surface px-2 py-1 font-body text-foreground outline-none focus:border-primary"
          />
        ) : (
          <span
            className={`block truncate font-body text-foreground ${
              isDone ? 'line-through text-muted-foreground' : ''
            }`}
          >
            {task.title}
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex shrink-0 items-center gap-2">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={committing}
              className="flex min-w-[64px] items-center justify-center bg-primary px-3 py-1 font-heading text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {committing ? (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-foreground animate-heartbeat" />
              ) : (
                'Guardar'
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={committing}
              className="px-3 py-1 font-heading text-xs font-medium text-muted-foreground disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1 font-heading text-xs font-medium text-muted-foreground cursor-pointer"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="px-3 py-1 font-heading text-xs font-medium text-destructive cursor-pointer"
            >
              Eliminar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskItem;