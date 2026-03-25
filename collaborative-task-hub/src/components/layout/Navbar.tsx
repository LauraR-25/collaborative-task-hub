import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <span className="font-heading text-base font-semibold text-foreground tracking-tight">
        TaskFlow
      </span>
      {user && (
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <NavLink
              to="/dashboard"
              className="font-heading text-sm font-medium text-muted-foreground"
              activeClassName="text-foreground"
            >
              Proyectos
            </NavLink>
            <NavLink
              to="/tasks"
              className="font-heading text-sm font-medium text-muted-foreground"
              activeClassName="text-foreground"
            >
              Tareas
            </NavLink>
          </div>
          <span className="font-body text-sm text-muted-foreground">
            {user.name}
          </span>
          <button
            onClick={handleLogout}
            className="font-heading text-sm font-medium text-muted-foreground cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
