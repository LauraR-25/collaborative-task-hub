import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type Project } from '@/services/projectService';

interface ProjectItemProps {
  project: Project;
}

const ProjectItem = ({ project }: ProjectItemProps) => {
  const formatLastActivity = (date?: string) => {
    if (!date) return 'nunca';
    const now = new Date();
    const activityDate = new Date(date);
    const diffDays = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `${diffDays} días`;
    return activityDate.toLocaleDateString();
  };

  return (
    <Link to={`/project/${project.id}`}>
      <Card className="transition-colors cursor-pointer hover:bg-muted">
        <CardHeader>
          <CardTitle className="text-lg">{project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{project.description || 'Sin descripción'}</p>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex gap-3">
              <Badge variant="secondary">{project.task_count || 0} tareas</Badge>
              <Badge variant="outline">{project.member_count || 1} miembros</Badge>
            </div>
            <span className="text-muted-foreground">Última: {formatLastActivity(project.last_activity)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProjectItem;