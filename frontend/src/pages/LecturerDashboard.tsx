import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { Users, Calendar, BookOpen, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface LecturerStats {
  totalCourses: number;
  totalLectures: number;
  openLectures: number;
  closedLectures: number;
  cancelledLectures: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  pendingJustifications: number;
}

export function LecturerDashboard() {
  const [stats, setStats] = useState<LecturerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [lectures, justifications] = await Promise.all([
        api.get('/lectures'),
        api.get('/justifications'),
      ]);
      const allLectures = lectures.data.data;
      setStats({
        totalCourses: 0,
        totalLectures: allLectures.length,
        openLectures: allLectures.filter((l: any) => l.status === 'IN_PROGRESS').length,
        closedLectures: allLectures.filter((l: any) => l.status === 'CLOSED').length,
        cancelledLectures: allLectures.filter((l: any) => l.status === 'CANCELLED').length,
        presentToday: 0,
        lateToday: 0,
        absentToday: 0,
        pendingJustifications: justifications.data.data.filter((j: any) => j.status === 'PENDING').length,
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
          title="Total Lectures"
          value={stats?.totalLectures || 0}
          icon={<Calendar className="w-5 h-5" />}
          gradient="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          title="Open Lectures"
          value={stats?.openLectures || 0}
          icon={<Clock className="w-5 h-5" />}
          gradient="bg-green-500/15 text-green-400"
        />
        <StatCard
          title="Closed Lectures"
          value={stats?.closedLectures || 0}
          icon={<Calendar className="w-5 h-5" />}
          gradient="bg-gray-500/15 text-gray-400"
        />
        <StatCard
          title="Pending Justifications"
          value={stats?.pendingJustifications || 0}
          icon={<AlertCircle className="w-5 h-5" />}
          gradient="bg-orange-500/15 text-orange-400"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Lectures</CardTitle>
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
                    No lectures scheduled yet
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