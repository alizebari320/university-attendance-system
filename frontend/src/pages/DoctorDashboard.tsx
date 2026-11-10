import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { Users, Building2, GraduationCap, BookOpen, AlertTriangle, TrendingUp, Layers, Percent, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

interface FraudLog {
  id: string;
  detectionType: string;
  severity: string;
  createdAt: string;
  user?: { email: string };
}

export function DoctorDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [fraudLogs, setFraudLogs] = useState<FraudLog[]>([]);
  const [weekly, setWeekly] = useState<{ date: string; present: number; late: number; absent: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [colleges, departments, students, lecturers, courses, lectures, fraud, daily, week] = await Promise.all([
          api.get('/colleges'),
          api.get('/departments'),
          api.get('/students'),
          api.get('/lecturers'),
          api.get('/courses'),
          api.get('/lectures'),
          api.get('/fraud'),
          api.get('/reports/daily'),
          api.get('/reports/weekly'),
        ]);

        const dayStats = daily.data.data.stats || [];
        const count = (status: string) =>
          dayStats.find((s: any) => s.status === status)?._count?.status || 0;

        const fraudData: FraudLog[] = fraud.data.data;
        setFraudLogs(fraudData.slice(0, 5));

        setStats({
          totalColleges: colleges.data.data.length,
          totalDepartments: departments.data.data.length,
          totalStudents: students.data.data.length,
          totalLecturers: lecturers.data.data.length,
          totalCourses: courses.data.data.length,
          totalLectures: lectures.data.data.length,
          presentToday: count('PRESENT'),
          lateToday: count('LATE'),
          absentToday: count('ABSENT'),
          fraudAlerts: fraudData.filter(f => !(f as any).resolved).length,
        });

        const records = week.data.data.records || [];
        const buckets: Record<string, { date: string; present: number; late: number; absent: number }> = {};
        records.forEach((r: any) => {
          const key = new Date(r.createdAt).toISOString().slice(0, 10);
          if (!buckets[key]) buckets[key] = { date: key.slice(5), present: 0, late: 0, absent: 0 };
          if (r.status === 'PRESENT') buckets[key].present += 1;
          if (r.status === 'LATE') buckets[key].late += 1;
          if (r.status === 'ABSENT') buckets[key].absent += 1;
        });
        setWeekly(Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date)));
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const rate = useMemo(() => {
    if (!stats) return 0;
    const total = stats.presentToday + stats.lateToday + stats.absentToday;
    return total > 0 ? Math.round(((stats.presentToday + stats.lateToday) / total) * 100) : 0;
  }, [stats]);

  const breakdown = stats ? [
    { name: 'Present', value: stats.presentToday },
    { name: 'Late', value: stats.lateToday },
    { name: 'Absent', value: stats.absentToday },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution Overview"
        description="Live attendance, staffing and integrity signals across every college"
      />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-3 py-2">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Colleges" value={stats?.totalColleges || 0} icon={<Building2 className="w-5 h-5" />} gradient="bg-blue-500/15 text-blue-400" />
        <StatCard title="Departments" value={stats?.totalDepartments || 0} icon={<Layers className="w-5 h-5" />} gradient="bg-cyan-500/15 text-cyan-400" />
        <StatCard title="Students" value={stats?.totalStudents || 0} icon={<Users className="w-5 h-5" />} gradient="bg-green-500/15 text-green-400" />
        <StatCard title="Lecturers" value={stats?.totalLecturers || 0} icon={<GraduationCap className="w-5 h-5" />} gradient="bg-purple-500/15 text-purple-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Courses" value={stats?.totalCourses || 0} icon={<BookOpen className="w-5 h-5" />} gradient="bg-orange-500/15 text-orange-400" />
        <StatCard title="Sessions" value={stats?.totalLectures || 0} icon={<TrendingUp className="w-5 h-5" />} gradient="bg-emerald-500/15 text-emerald-400" />
        <StatCard title="Attendance Rate" value={`${rate}%`} icon={<Percent className="w-5 h-5" />} gradient="bg-blue-500/15 text-blue-400" />
        <StatCard title="Open Fraud Alerts" value={stats?.fraudAlerts || 0} icon={<AlertTriangle className="w-5 h-5" />} gradient="bg-red-500/15 text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {weekly.length === 0 ? (
              <p className="text-sm text-charcoal-400 text-center py-16">No attendance recorded this week yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="date" stroke="#737373" fontSize={12} />
                  <YAxis stroke="#737373" fontSize={12} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: 8, color: '#fff' }} />
                  <Bar dataKey="present" stackId="a" fill="#22c55e" isAnimationActive={false} />
                  <Bar dataKey="late" stackId="a" fill="#f97316" isAnimationActive={false} />
                  <Bar dataKey="absent" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown.every(b => b.value === 0) ? (
              <p className="text-sm text-charcoal-400 text-center py-16">No check-ins today yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={breakdown} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                  <XAxis type="number" stroke="#737373" fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#737373" fontSize={12} width={64} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: 8, color: '#fff' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                    {breakdown.map((_, i) => <Cell key={i} fill={['#22c55e', '#f97316', '#ef4444'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Fraud Alerts</CardTitle>
              <Link to="/fraud" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fraudLogs.length === 0 ? (
              <p className="text-sm text-charcoal-400 text-center py-10">No fraud alerts. All clear.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fraudLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-white">{log.detectionType.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{log.user?.email || '—'}</TableCell>
                      <TableCell><StatusBadge status={log.severity} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/colleges" className="p-4 rounded-lg bg-charcoal-800/50 hover:bg-charcoal-800 transition-colors">
                <Building2 className="w-6 h-6 text-blue-400 mb-2" />
                <span className="text-sm text-charcoal-200 block">Manage Colleges</span>
              </Link>
              <Link to="/departments" className="p-4 rounded-lg bg-charcoal-800/50 hover:bg-charcoal-800 transition-colors">
                <Layers className="w-6 h-6 text-cyan-400 mb-2" />
                <span className="text-sm text-charcoal-200 block">Departments</span>
              </Link>
              <Link to="/students" className="p-4 rounded-lg bg-charcoal-800/50 hover:bg-charcoal-800 transition-colors">
                <Users className="w-6 h-6 text-green-400 mb-2" />
                <span className="text-sm text-charcoal-200 block">Students</span>
              </Link>
              <Link to="/reports/weekly" className="p-4 rounded-lg bg-charcoal-800/50 hover:bg-charcoal-800 transition-colors">
                <TrendingUp className="w-6 h-6 text-orange-400 mb-2" />
                <span className="text-sm text-charcoal-200 block">Reports</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
