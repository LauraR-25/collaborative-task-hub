import { useState } from "react";

interface TaskFormProps {
  onAdd: (title: string) => Promise<void>;
}

const TaskForm = ({ onAdd }: TaskFormProps) => {
  const [title, setTitle] = useState("");
  const [committing, setCommitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setCommitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await onAdd(trimmed);
    setTitle("");
    setCommitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nueva tarea..."
        className="flex-1 border border-input bg-surface px-3 py-2 font-body text-foreground outline-none transition-colors focus:border-primary"
      />
      <button
        type="submit"
        disabled={committing || !title.trim()}
        className="flex min-w-[90px] items-center justify-center bg-primary px-4 py-2 font-heading text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {committing ? (
          <span className="inline-block h-2 w-2 rounded-full bg-primary-foreground animate-heartbeat" />
        ) : (
          "Agregar"
        )}
      </button>
    </form>
  );
};

export default TaskForm;
