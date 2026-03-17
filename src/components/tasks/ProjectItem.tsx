import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Project } from "@/services/projectService";

interface ProjectItemProps {
  project: Project;
}

const ProjectItem = ({ project }: ProjectItemProps) => {
  const formatLastActivity = (date?: string) => {
    if (!date) return "Nunca";
    const now = new Date();
    const activityDate = new Date(date);
    const diffDays = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `${diffDays} días`;
    return activityDate.toLocaleDateString();
  };

  return (
    <Link to={`/project/${project.id}`}>
      <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer">
        <CardHeader>
          <CardTitle className="text-white text-lg">{project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 text-sm mb-4">
            {project.description || "Sin descripción"}
          </p>
          <div className="flex justify-between items-center text-sm">
            <div className="flex gap-4">
              <Badge variant="secondary" className="bg-purple-600 text-white">
                {project.task_count || 0} tareas
              </Badge>
              <Badge variant="outline" className="border-pink-500 text-pink-400">
                {project.member_count || 1} miembros
              </Badge>
            </div>
            <span className="text-gray-400">
              Última: {formatLastActivity(project.last_activity)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProjectItem;