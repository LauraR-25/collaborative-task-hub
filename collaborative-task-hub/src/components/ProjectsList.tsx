import { type Project } from '@/services/projectService';
import ProjectItem from './ProjectsItem';

interface ProjectListProps {
  projects: Project[];
}


const ProjectList = ({ projects }: ProjectListProps) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No tienes proyectos aún.</p>
        <p className="text-muted-foreground">Crea tu primer proyecto para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {projects.map((project) => (
        <ProjectItem key={project.id} project={project} />
      ))}
    </div>
  );
};

export default ProjectList;