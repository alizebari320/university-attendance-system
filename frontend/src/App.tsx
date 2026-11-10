import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { LecturerDashboard } from './pages/LecturerDashboard';
import { DeptAdminDashboard } from './pages/DeptAdminDashboard';
import { CollegesPage } from './pages/CollegesPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { StudentsPage } from './pages/StudentsPage';
import { LecturersPage } from './pages/LecturersPage';
import { CoursesPage } from './pages/CoursesPage';
import { LecturesPage } from './pages/LecturesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { JustificationsPage } from './pages/JustificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditPage } from './pages/AuditPage';
import { FraudPage } from './pages/FraudPage';
import { AttendancePage } from './pages/AttendancePage';
import { SettingsPage } from './pages/SettingsPage';
import { AppLayout } from './components/AppLayout';
import { doctorNav, lecturerNav, deptAdminNav, studentNav } from './data/navItems';
import './index.css';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal-950">
      <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function RoleDashboard() {
  const { user } = useAuth();
  switch (user?.role) {
    case 'DOCTOR':
    case 'SUPER_ADMIN':
      return <DoctorDashboard />;
    case 'LECTURER':
      return <LecturerDashboard />;
    case 'DEPARTMENT_ADMIN':
      return <DeptAdminDashboard />;
    default:
      return <StudentDashboard />;
  }
}

function navForRole(role?: string) {
  switch (role) {
    case 'DOCTOR':
    case 'SUPER_ADMIN':
      return doctorNav;
    case 'LECTURER':
      return lecturerNav;
    case 'DEPARTMENT_ADMIN':
      return deptAdminNav;
    default:
      return studentNav;
  }
}

function LayoutWrapper() {
  const { user } = useAuth();
  return <AppLayout navItems={navForRole(user?.role)} />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><LayoutWrapper /></ProtectedRoute>}>
            <Route path="/dashboard" element={<RoleDashboard />} />
            <Route path="/colleges" element={<CollegesPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/lecturers" element={<LecturersPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/lectures" element={<LecturesPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/justifications" element={<JustificationsPage />} />
            <Route path="/reports/weekly" element={<ReportsPage initialTab="weekly" />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/absences" element={<AttendancePage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/fraud" element={<FraudPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
