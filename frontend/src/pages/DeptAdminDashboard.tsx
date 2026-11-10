import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { Users, BookOpen, Calendar, AlertCircle, TrendingUp, Building2 } from 'lucide-react';

interface DeptAdminStats {
  totalStudents: number;
  totalCourses: number;
  totalLecturers: number;
  totalLectures: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  pendingJustifications: number;
  highRiskStudents: number;
}

export function DeptAdminDashboard() {
  const [stats, setStats] = useState<DeptAdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [students, courses, lecturers, lectures, justifications] = await Promise.all([
        api.get('/students'),
        api.get('/courses'),
        api.get('/lecturers'),
        api.get('/lectures'),
        api.get('/justifications'),
      ]);
      setStats({
        totalStudents: students.data.data.length,
        totalCourses: courses.data.data.length,
        totalLecturers: lecturers.data.data.length,
        totalLectures: lectures.data.data.length,
        presentToday: 0,
        lateToday: 0,
        absentToday: 0,
        pendingJustifications: justifications.data.data.filter((j: any) => j.status === 'PENDING').length,
        highRiskStudents: 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={<Users className="w-5 h-5" />}
          gradient="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          title="Total Courses"
          value={stats?.totalCourses || 0}
          icon={<BookOpen className="w-5 h-5" />}
          gradient="bg-green-500/15 text-green-400"
        />
        <StatCard
          title="Total Lecturers"
          value={stats?.totalLecturers || 0}
          icon={<Users className="w-5 h-5" />}
          gradient="bg-purple-500/15 text-purple-400"
        />
        <StatCard
          title="Pending Justifications"
          value={stats?.pendingJustifications || 0}
          icon={<AlertCircle className="w-5 h-5" />}
          gradient="bg-orange-500/15 text-orange-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-charcoal-400 text-sm">Total Lectures</span>
                <span className="text-white font-medium">{stats?.totalLectures || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-400 text-sm">High Risk Students</span>
                <span className="text-orange-400 font-medium">{stats?.highRiskStudents || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-charcoal-800/50 text-center">
                <Users className="w-6 h-6 mx-auto text-blue-400 mb-1" />
                <span className="text-sm text-charcoal-300">Students</span>
              </div>
              <div className="p-3 rounded-lg bg-charcoal-800/50 text-center">
                <BookOpen className="w-6 h-6 mx-auto text-green-400 mb-1" />
                <span className="text-sm text-charcoal-300">Courses</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}