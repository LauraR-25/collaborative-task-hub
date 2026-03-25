import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { tagService, type Tag } from '@/services/tagService';
import { type TaskPriority } from '@/services/taskService';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TaskFormProps {
  onAdd: (input: { title: string; description?: string; priority?: TaskPriority; tagIds: string[] }) => Promise<void>;
}

const priorityMeta: {
  value: 'none' | TaskPriority;
  label: string;
  dotClass: string;
  badgeClass: string;
}[] = [
  {
    value: 'none',
    label: 'Sin prioridad',
    dotClass: 'bg-gray-400',
    badgeClass: 'border-gray-200 bg-gray-100 text-gray-700',
  },
  {
    value: 'baja',
    label: 'Baja',
    dotClass: 'bg-green-500',
    badgeClass: 'border-green-200 bg-green-100 text-green-800',
  },
  {
    value: 'media',
    label: 'Media',
    dotClass: 'bg-blue-500',
    badgeClass: 'border-blue-200 bg-blue-100 text-blue-800',
  },
  {
    value: 'alta',
    label: 'Alta',
    dotClass: 'bg-purple-500',
    badgeClass: 'border-purple-200 bg-purple-100 text-purple-800',
  },
  {
    value: 'critica',
    label: 'Crítica',
    dotClass: 'bg-red-500',
    badgeClass: 'border-red-200 bg-red-100 text-red-800',
  },
];

const TaskForm = ({ onAdd }: TaskFormProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'none' | TaskPriority>('none');
  const [committing, setCommitting] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [igniteOpen, setIgniteOpen] = useState(false);
  const [igniteCreate, setIgniteCreate] = useState(false);

  const triggerIgnite = (setter: (value: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 640);
  };

  const selectedTags = useMemo(
    () => tags.filter((t) => selectedTagIds.includes(t.id)),
    [tags, selectedTagIds]
  );

  useEffect(() => {
    const load = async () => {
      if (!open) return;
      if (tagsLoading) return;
      if (tags.length > 0) return;

      setTagsLoading(true);
      setTagsError(null);
      try {
        const data = await tagService.getAll();
        setTags(data);
      } catch (e: any) {
        const apiMessage = e?.response?.data?.message;
        setTagsError(apiMessage || 'No se pudieron cargar las etiquetas');
      } finally {
        setTagsLoading(false);
      }
    };

    load();
  }, [open, tags.length, tagsLoading]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;

    try {
      const created = await tagService.create({ name });
      setTags((prev) => [created, ...prev]);
      setSelectedTagIds((prev) => (prev.includes(created.id) ? prev : [created.id, ...prev]));
      setNewTagName('');
      setTagsError(null);
    } catch (e: any) {
      const apiMessage = e?.response?.data?.message;
      setTagsError(apiMessage || 'No se pudo crear la etiqueta');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const trimmedDescription = description.trim();
    const pickedPriority = priority === 'none' ? undefined : priority;

    setCommitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await onAdd({
      title: trimmed,
      description: trimmedDescription || undefined,
      priority: pickedPriority,
      tagIds: selectedTagIds,
    });
    setTitle('');
    setDescription('');
    setPriority('none');
    setSelectedTagIds([]);
    setCommitting(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className={`fire-button ${igniteOpen ? 'fire-button--ignite' : ''}`}
          onClick={() => triggerIgnite(setIgniteOpen)}
        >
          ➕ Nueva Tarea
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Tarea</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nueva tarea..."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Descripción (opcional)"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prioridad</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as 'none' | TaskPriority)}>
              <SelectTrigger aria-label="Prioridad">
                <SelectValue placeholder="Selecciona prioridad…" />
              </SelectTrigger>
              <SelectContent>
                {priorityMeta.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${p.dotClass}`} aria-hidden="true" />
                      <span>{p.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Seleccionada:{' '}
              <Badge variant="outline" className={priorityMeta.find((p) => p.value === priority)?.badgeClass}>
                {priorityMeta.find((p) => p.value === priority)?.label}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Etiquetas</label>

            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Nueva etiqueta..."
              />
              <Button type="button" onClick={handleCreateTag} disabled={!newTagName.trim()}>
                Crear
              </Button>
            </div>

            {tagsError && <div className="text-sm text-destructive">{tagsError}</div>}

            {tagsLoading ? (
              <div className="text-sm text-muted-foreground">Cargando etiquetas...</div>
            ) : tags.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay etiquetas aún.</div>
            ) : (
              <div className="max-h-60 overflow-auto rounded border border-border">
                {tags.map((tag) => {
                  const checked = selectedTagIds.includes(tag.id);
                  return (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 px-3 py-2 border-b border-border last:border-b-0 cursor-pointer"
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggleTag(tag.id)} />
                      <span className="text-sm">{tag.name}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {selectedTags.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Seleccionadas: {selectedTags.map((t) => t.name).join(', ')}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={committing || !title.trim()}
            onClick={() => triggerIgnite(setIgniteCreate)}
            className={`flex w-full items-center justify-center bg-primary px-4 py-2 font-heading text-sm font-semibold text-primary-foreground disabled:opacity-50 fire-button ${
              igniteCreate ? 'fire-button--ignite' : ''
            }`}
          >
            {committing ? (
              <span className="inline-block h-2 w-2 rounded-full bg-primary-foreground animate-heartbeat" />
            ) : (
              'Crear tarea'
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;