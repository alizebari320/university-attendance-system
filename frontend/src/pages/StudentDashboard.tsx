import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { Users, BookOpen, Calendar, AlertCircle, TrendingUp, Clock } from 'lucide-react';

interface StudentStats {
  totalCourses: number;
  totalLectures: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  absenceThreshold: number;
  absenceCount: number;
}

export function StudentDashboard() {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/attendance/student/me');
      const records = res.data.data;
      setStats({
        totalCourses: 0,
        totalLectures: records.length,
        presentCount: records.filter((r: any) => r.status === 'PRESENT').length,
        lateCount: records.filter((r: any) => r.status === 'LATE').length,
        absentCount: records.filter((r: any) => r.status === 'ABSENT').length,
        absenceThreshold: 5,
        absenceCount: records.filter((r: any) => r.status === 'ABSENT').length,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const attendanceRate = stats && stats.totalLectures > 0
    ? Math.round(((stats.presentCount + stats.lateCount) / stats.totalLectures) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attendance Rate"
          value={`${attendanceRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          gradient="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          title="Present"
          value={stats?.presentCount || 0}
          icon={<Calendar className="w-5 h-5" />}
          gradient="bg-green-500/15 text-green-400"
        />
        <StatCard
          title="Late"
          value={stats?.lateCount || 0}
          icon={<Clock className="w-5 h-5" />}
          gradient="bg-orange-500/15 text-orange-400"
        />
        <StatCard
          title="Absences"
          value={stats?.absentCount || 0}
          icon={<AlertCircle className="w-5 h-5" />}
          gradient="bg-red-500/15 text-red-400"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Absence Warning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-charcoal-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                style={{ width: `${Math.min(100, ((stats?.absenceCount || 0) / (stats?.absenceThreshold || 5)) * 100)}%` }}
              />
            </div>
            <span className="text-sm text-charcoal-400">
              {stats?.absenceCount || 0}/{stats?.absenceThreshold || 5}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.totalLectures === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-charcoal-500">
                    No attendance records yet
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}