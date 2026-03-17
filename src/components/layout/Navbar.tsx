import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

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
        Forma Fluida
      </span>
      {user && (
        <div className="flex items-center gap-6">
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
