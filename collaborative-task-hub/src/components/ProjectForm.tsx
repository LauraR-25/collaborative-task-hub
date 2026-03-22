import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ProjectFormProps {
  onAdd: (name: string, description?: string) => Promise<void>;
}

const ProjectForm = ({ onAdd }: ProjectFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onAdd(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          ➕ Nuevo Proyecto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Nombre del proyecto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creando...' : 'Crear Proyecto'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;