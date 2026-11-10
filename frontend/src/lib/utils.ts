import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const statusColors: Record<string, string> = {
  PRESENT: 'bg-green-500/15 text-green-400 border-green-500/30',
  LATE: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  ABSENT: 'bg-red-500/15 text-red-400 border-red-500/30',
  ACTIVE: 'bg-green-500/15 text-green-400',
  INACTIVE: 'bg-gray-500/15 text-gray-400',
  SUSPENDED: 'bg-red-500/15 text-red-400',
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  APPROVED: 'bg-green-500/15 text-green-400',
  REJECTED: 'bg-red-500/15 text-red-400',
  SCHEDULED: 'bg-blue-500/15 text-blue-400',
  IN_PROGRESS: 'bg-green-500/15 text-green-400',
  CLOSED: 'bg-gray-500/15 text-gray-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
  LOW: 'bg-green-500/15 text-green-400',
  MEDIUM: 'bg-yellow-500/15 text-yellow-400',
  HIGH: 'bg-orange-500/15 text-orange-400',
  CRITICAL: 'bg-red-500/15 text-red-400',
};

export const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  DOCTOR: 'Doctor',
  DEPARTMENT_ADMIN: 'Department Admin',
  LECTURER: 'Lecturer',
  STUDENT: 'Student',
};

export const roleShort: Record<string, string> = {
  SUPER_ADMIN: 'SA',
  DOCTOR: 'DR',
  DEPARTMENT_ADMIN: 'DA',
  LECTURER: 'LEC',
  STUDENT: 'STU',
};

export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return `${formatDate(d)} ${formatTime(d)}`;
};

export const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const formatNumber = (n: number): string => {
  return n.toLocaleString('en-US');
};

export const formatPercent = (n: number, total: number): string => {
  if (total === 0) return '0%';
  return ((n / total) * 100).toFixed(1) + '%';
};