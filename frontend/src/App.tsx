import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { LecturerDashboard } from './pages/LecturerDashboard';
import { DeptAdminDashboard } from './pages/DeptAdminDashboard';
import { AppLayout } from './components/AppLayout';
import { doctorNav, lecturerNav, deptAdminNav, studentNav } from './data/navItems';
import './index.css';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-charcoal-950">
    <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
  </div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function RoleLayout() {
  const { user } = useAuth();
  let navItems;
  switch (user?.role) {
    case 'DOCTOR': navItems = doctorNav; break;
    case 'LECTURER': navItems = lecturerNav; break;
    case 'DEPARTMENT_ADMIN': navItems = deptAdminNav; break;
    case 'STUDENT': navItems = studentNav; break;
    default: navItems = studentNav;
  }
  return <AppLayout navItems={navItems} />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><RoleLayout /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;