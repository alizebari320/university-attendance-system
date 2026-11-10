import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { Users, Building2, GraduationCap, BookOpen, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalColleges: number;
  totalDepartments: number;
  totalStudents: number;
  totalLecturers: number;
  totalCourses: number;
  totalLectures: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  fraudAlerts: number;
}

export function DoctorDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [colleges, students, lecturers, courses, lectures, fraud] = await Promise.all([
        api.get('/colleges'),
        api.get('/students'),
        api.get('/lecturers'),
        api.get('/courses'),
        api.get('/lectures'),
        api.get('/fraud'),
      ]);
      setStats({
        totalColleges: colleges.data.data.length,
        totalDepartments: 0,
        totalStudents: students.data.data.length,
        totalLecturers: lecturers.data.data.length,
        totalCourses: courses.data.data.length,
        totalLectures: lectures.data.data.length,
        presentToday: 0,
        lateToday: 0,
        absentToday: 0,
        fraudAlerts: fraud.data.data.filter((f: any) => !f.resolved).length,
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
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Colleges"
          value={stats?.totalColleges || 0}
          icon={<Building2 className="w-5 h-5" />}
          gradient="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={<Users className="w-5 h-5" />}
          gradient="bg-green-500/15 text-green-400"
        />
        <StatCard
          title="Total Lecturers"
          value={stats?.totalLecturers || 0}
          icon={<GraduationCap className="w-5 h-5" />}
          gradient="bg-purple-500/15 text-purple-400"
        />
        <StatCard
          title="Active Courses"
          value={stats?.totalCourses || 0}
          icon={<BookOpen className="w-5 h-5" />}
          gradient="bg-orange-500/15 text-orange-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Lectures"
          value={stats?.totalLectures || 0}
          icon={<TrendingUp className="w-5 h-5" />}
          gradient="bg-cyan-500/15 text-cyan-400"
        />
        <StatCard
          title="Fraud Alerts"
          value={stats?.fraudAlerts || 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          gradient="bg-red-500/15 text-red-400"
        />
        <StatCard
          title="Attendance Rate"
          value="0%"
          icon={<TrendingUp className="w-5 h-5" />}
          gradient="bg-emerald-500/15 text-emerald-400"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to="/colleges" className="p-3 rounded-lg bg-charcoal-800/50 hover:bg-charcoal-800 transition-colors text-center">
              <Building2 className="w-6 h-6 mx-auto text-blue-400 mb-1" />
              <span className="text-sm text-charcoal-300">Manage Colleges</span>
            </Link>
            <Link to="/students" className="p-3 rounded-lg bg-charcoal-800/50 hover:bg-charcoal-800 transition-colors text-center">
              <Users className="w-6 h-6 mx-auto text-green-400 mb-1" />
              <span className="text-sm text-charcoal-300">Manage Students</span>
            </Link>
            <Link to="/reports/weekly" className="p-3 rounded-lg bg-charcoal-800/50 hover:bg-charcoal-800 transition-colors text-center">
              <TrendingUp className="w-6 h-6 mx-auto text-orange-400 mb-1" />
              <span className="text-sm text-charcoal-300">View Reports</span>
            </Link>
            <Link to="/fraud" className="p-3 rounded-lg bg-charcoal-800/50 hover:bg-charcoal-800 transition-colors text-center">
              <AlertTriangle className="w-6 h-6 mx-auto text-red-400 mb-1" />
              <span className="text-sm text-charcoal-300">Fraud Alerts</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}