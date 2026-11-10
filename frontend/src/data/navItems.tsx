import { LayoutDashboard, Users, Building2, BookOpen, Calendar, FileText, AlertTriangle, Settings, Bell, TrendingUp, GraduationCap, Clock } from 'lucide-react';

export const doctorNav = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Colleges', href: '/colleges', icon: <Building2 className="w-5 h-5" /> },
  { label: 'Departments', href: '/departments', icon: <Users className="w-5 h-5" /> },
  { label: 'Students', href: '/students', icon: <GraduationCap className="w-5 h-5" /> },
  { label: 'Lecturers', href: '/lecturers', icon: <Users className="w-5 h-5" /> },
  { label: 'Courses', href: '/courses', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Reports', href: '/reports/weekly', icon: <FileText className="w-5 h-5" /> },
  { label: 'Audit Log', href: '/audit', icon: <Clock className="w-5 h-5" /> },
  { label: 'Fraud Alerts', href: '/fraud', icon: <AlertTriangle className="w-5 h-5" /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell className="w-5 h-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
];

export const lecturerNav = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'My Courses', href: '/courses', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Lectures', href: '/lectures', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Attendance', href: '/attendance', icon: <Clock className="w-5 h-5" /> },
  { label: 'Justifications', href: '/justifications', icon: <FileText className="w-5 h-5" /> },
  { label: 'Reports', href: '/reports/weekly', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell className="w-5 h-5" /> },
];

export const deptAdminNav = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Students', href: '/students', icon: <GraduationCap className="w-5 h-5" /> },
  { label: 'Courses', href: '/courses', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Lecturers', href: '/lecturers', icon: <Users className="w-5 h-5" /> },
  { label: 'Reports', href: '/reports/weekly', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Justifications', href: '/justifications', icon: <FileText className="w-5 h-5" /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell className="w-5 h-5" /> },
];

export const studentNav = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'My Courses', href: '/courses', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Attendance', href: '/attendance', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Absences', href: '/absences', icon: <AlertTriangle className="w-5 h-5" /> },
  { label: 'Justifications', href: '/justifications', icon: <FileText className="w-5 h-5" /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell className="w-5 h-5" /> },
];