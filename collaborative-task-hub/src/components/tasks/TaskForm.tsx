import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { tagService, type Tag } from '@/services/tagService';

interface TaskFormProps {
  onAdd: (input: { title: string; tagIds: string[] }) => Promise<void>;
}

const TaskForm = ({ onAdd }: TaskFormProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [committing, setCommitting] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');

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

    setCommitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await onAdd({ title: trimmed, tagIds: selectedTagIds });
    setTitle('');
    setSelectedTagIds([]);
    setCommitting(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">➕ Nueva Tarea</Button>
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
            className="flex w-full items-center justify-center bg-primary px-4 py-2 font-heading text-sm font-semibold text-primary-foreground disabled:opacity-50"
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