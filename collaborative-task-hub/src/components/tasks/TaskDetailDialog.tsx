import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { taskService, type Task, type TaskPriority, type TaskStatus } from '@/services/taskService';
import { tagService, type Tag } from '@/services/tagService';

type TagLite = Pick<Tag, 'id' | 'name'>;

type TaskUpdates = Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>;

const toDateInputValue = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const fromDateInputValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // backend suele aceptar YYYY-MM-DD o ISO; mandamos YYYY-MM-DD
  return trimmed;
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completada', label: 'Completada' },
  { value: 'bloqueada', label: 'Bloqueada' },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  // Para mantener sincronizada la lista/kanban sin re-fetch global
  onUpdated?: (task: Task) => void;
  onDeleted?: (taskId: string) => void;
  // Si se abre desde el botón Editar, arranca en modo edición
  startInEdit?: boolean;
}

const TaskDetailDialog = ({
  open,
  onOpenChange,
  taskId,
  onUpdated,
  onDeleted,
  startInEdit = false,
}: TaskDetailDialogProps) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftStatus, setDraftStatus] = useState<TaskStatus>('pendiente');
  const [draftPriority, setDraftPriority] = useState<TaskPriority | ''>('');
  const [draftDueDate, setDraftDueDate] = useState('');

  const [taskTags, setTaskTags] = useState<TagLite[]>([]);
  const [allTags, setAllTags] = useState<TagLite[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [selectedAddTagId, setSelectedAddTagId] = useState<string>('');

  const tagIdSet = useMemo(() => new Set(taskTags.map((t) => t.id)), [taskTags]);
  const availableToAdd = useMemo(() => allTags.filter((t) => !tagIdSet.has(t.id)), [allTags, tagIdSet]);

  useEffect(() => {
    if (!open) return;
    if (!taskId) return;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await taskService.getById(taskId);
        setTask(data);

        setDraftTitle(data.title ?? '');
        setDraftDescription(data.description ?? '');
        setDraftStatus(data.status ?? 'pendiente');
        setDraftPriority(data.priority ?? '');
        setDraftDueDate(toDateInputValue(data.due_date));

        setEditing(startInEdit);

        const rawTags = await taskService.getTags(taskId);
        // backend devuelve {id,name,...}. Normalizamos a Tag mínimo.
        const normalizedTags: TagLite[] = (rawTags || []).map((t: any) => ({ id: String(t.id), name: String(t.name) }));
        setTaskTags(normalizedTags);
      } catch (e: any) {
        const apiMessage = e?.response?.data?.message;
        setError(apiMessage || 'No se pudo cargar la tarea');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, taskId, startInEdit]);

  useEffect(() => {
    if (!open) return;
    if (!editing) return;
    if (tagsLoading) return;
    if (allTags.length > 0) return;

    setTagsLoading(true);
    (async () => {
      try {
        const tags = await tagService.getAll();
        setAllTags(tags);
      } catch {
        // silencioso: el modal sigue siendo usable sin catálogo
      } finally {
        setTagsLoading(false);
      }
    })();
  }, [open, editing, tagsLoading, allTags.length]);

  const close = () => {
    onOpenChange(false);
    setError(null);
    setSelectedAddTagId('');
  };

  const resetDraftFromTask = (source: Task) => {
    setDraftTitle(source.title ?? '');
    setDraftDescription(source.description ?? '');
    setDraftStatus(source.status ?? 'pendiente');
    setDraftPriority(source.priority ?? '');
    setDraftDueDate(toDateInputValue(source.due_date));
  };

  const handleSave = async () => {
    if (!task) return;

    const updates: TaskUpdates = {
      title: draftTitle.trim(),
      description: draftDescription.trim() || undefined,
      status: draftStatus,
      priority: draftPriority || undefined,
      due_date: fromDateInputValue(draftDueDate),
    };

    setSaving(true);
    setError(null);
    try {
      const updated = await taskService.update(task.id, updates);
      setTask(updated);
      resetDraftFromTask(updated);
      setEditing(false);
      onUpdated?.(updated);
    } catch (e: any) {
      const apiMessage = e?.response?.data?.message;
      setError(apiMessage || 'No se pudo guardar la tarea');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    setSaving(true);
    setError(null);
    try {
      await taskService.delete(task.id);
      onDeleted?.(task.id);
      close();
    } catch (e: any) {
      const apiMessage = e?.response?.data?.message;
      setError(apiMessage || 'No se pudo eliminar la tarea');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async () => {
    if (!task) return;
    const tagId = selectedAddTagId;
    if (!tagId) return;

    setSaving(true);
    setError(null);
    try {
      const ok = await taskService.addTag(task.id, tagId);
      if (ok) {
        const tag = allTags.find((t) => t.id === tagId);
        if (tag) setTaskTags((prev) => [...prev, tag]);
        setSelectedAddTagId('');
      }
    } catch (e: any) {
      const apiMessage = e?.response?.data?.message;
      setError(apiMessage || 'No se pudo agregar la etiqueta');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!task) return;

    setSaving(true);
    setError(null);
    try {
      const ok = await taskService.removeTag(task.id, tagId);
      if (ok) setTaskTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch (e: any) {
      const apiMessage = e?.response?.data?.message;
      setError(apiMessage || 'No se pudo quitar la etiqueta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalle de tarea</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setEditing((v) => !v)} disabled={loading || !task}>
            ✏ {editing ? 'Ver' : 'Editar'}
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading || saving || !task}>
            🗑 Eliminar
          </Button>
          <Button type="button" variant="ghost" onClick={close}>
            ❌ Cerrar
          </Button>
        </div>

        {error && (
          <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading || !task ? (
          <div className="text-sm text-muted-foreground">Cargando...</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Título</div>
              {editing ? (
                <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Título" />
              ) : (
                <div className="text-sm">{task.title}</div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Descripción</div>
              {editing ? (
                <textarea
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Descripción (opcional)"
                />
              ) : (
                <div className="text-sm text-muted-foreground">{task.description || '—'}</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Estado</div>
                {editing ? (
                  <select
                    value={draftStatus}
                    onChange={(e) => setDraftStatus(e.target.value as TaskStatus)}
                    aria-label="Estado"
                    className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                  >
                    {statusOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm">{statusOptions.find((o) => o.value === task.status)?.label ?? task.status}</div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Prioridad</div>
                {editing ? (
                  <select
                    value={draftPriority}
                    onChange={(e) => setDraftPriority(e.target.value as TaskPriority | '')}
                    aria-label="Prioridad"
                    className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Sin prioridad</option>
                    {priorityOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {task.priority
                      ? priorityOptions.find((o) => o.value === task.priority)?.label ?? task.priority
                      : 'Sin prioridad'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Fecha límite</div>
                {editing ? (
                  <Input type="date" value={draftDueDate} onChange={(e) => setDraftDueDate(e.target.value)} />
                ) : (
                  <div className="text-sm text-muted-foreground">{task.due_date ? toDateInputValue(task.due_date) : '—'}</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Etiquetas</div>

              <div className="flex flex-wrap gap-2">
                {taskTags.length === 0 ? (
                  <div className="text-sm text-muted-foreground">—</div>
                ) : (
                  taskTags.map((t) => (
                    <Badge key={t.id} variant="secondary" className="gap-2">
                      {t.name}
                      {editing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t.id)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Quitar ${t.name}`}
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))
                )}
              </div>

              {editing && (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedAddTagId}
                    onChange={(e) => setSelectedAddTagId(e.target.value)}
                    aria-label="Agregar etiqueta"
                    className="min-w-[220px] rounded border border-input bg-background px-3 py-2 text-sm"
                    disabled={tagsLoading}
                  >
                    <option value="">Selecciona una etiqueta…</option>
                    {availableToAdd.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" onClick={handleAddTag} disabled={!selectedAddTagId || saving}>
                    Agregar etiqueta +
                  </Button>
                </div>
              )}
            </div>

            {editing && (
              <div className="flex items-center gap-2">
                <Button type="button" onClick={handleSave} disabled={saving || !draftTitle.trim()}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (task) resetDraftFromTask(task);
                    setEditing(false);
                  }}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;
