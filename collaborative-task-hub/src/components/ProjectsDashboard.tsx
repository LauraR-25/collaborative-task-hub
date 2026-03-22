import { useState, useEffect, useCallback } from 'react';
import { projectService, type Project } from '@/services/projectService';
import ProjectList from './ProjectsList';
import { Input } from '@/components/ui/input';
import ProjectForm from './ProjectForm';


const ProjectsDashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch {
      setError('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleAddProject = async (name: string, description?: string) => {
    try {
      const newProject = await projectService.create({ name, description });
      setProjects(prev => [newProject, ...prev]);
    } catch {
      setError('Error al crear proyecto');
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-6 pt-20 pb-6">
      <h1 className="text-3xl font-bold mb-6">Mis Proyectos</h1>
      
      <div className="flex justify-between items-center mb-6">
        <Input
          type="text"
          placeholder="Buscar proyectos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <ProjectForm onAdd={handleAddProject} />
      </div>

      {error && (
        <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Cargando proyectos...</div>
      ) : (
        <ProjectList projects={filteredProjects} />
      )}
    </div>
  );
};

export default ProjectsDashboard;