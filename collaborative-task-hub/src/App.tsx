import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import PrivateRoute from '@/components/auth/PrivateRoute';
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';
import Navbar from '@/components/layout/Navbar';
import ProjectsDashboard from '@/components/ProjectsDashboard'; // nuevo componente
import TasksTab from '@/pages/TasksTab';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <ProjectsDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <TasksTab />
              </PrivateRoute>
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <PrivateRoute>
                <KanbanBoard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;