import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { Calendar, AlertCircle, TrendingUp, Clock, KeyRound, FileText } from 'lucide-react';
import { formatDate } from '../lib/utils';

interface Record {
  id: string;
  status: string;
  createdAt: string;
  lectureInstance: { scheduledDate: string; slot: { course: { name: string } } };
  justification?: { status: string } | null;
}

interface Summary { total: number; present: number; late: number; absent: number; }

export function StudentDashboard() {
  const [records, setRecords] = useState<Record[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, present: 0, late: 0, absent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/attendance/student/me');
        setRecords(res.data.data);
        setSummary(res.data.summary || { total: 0, present: 0, late: 0, absent: 0 });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const rate = summary.total > 0 ? Math.round(((summary.present + summary.late) / summary.total) * 100) : 100;

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
        title="My Attendance"
        description="Your live attendance record and absence status"
      />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-3 py-2">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Attendance Rate" value={`${rate}%`} icon={<TrendingUp className="w-5 h-5" />} gradient="bg-blue-500/15 text-blue-400" />
        <StatCard title="Present" value={summary.present} icon={<Calendar className="w-5 h-5" />} gradient="bg-green-500/15 text-green-400" />
        <StatCard title="Late" value={summary.late} icon={<Clock className="w-5 h-5" />} gradient="bg-orange-500/15 text-orange-400" />
        <StatCard title="Absences" value={summary.absent} icon={<AlertCircle className="w-5 h-5" />} gradient="bg-red-500/15 text-red-400" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link to="/attendance" className="flex items-center gap-3 rounded-xl border border-blue-500/25 bg-blue-500/5 hover:bg-blue-500/10 p-4 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Check in to a lecture</p>
            <p className="text-charcoal-400 text-xs">Enter the PIN shared by your lecturer</p>
          </div>
        </Link>
        <Link to="/justifications" className="flex items-center gap-3 rounded-xl border border-orange-500/25 bg-orange-500/5 hover:bg-orange-500/10 p-4 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Request a justification</p>
            <p className="text-charcoal-400 text-xs">Submit evidence for an absence</p>
          </div>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-charcoal-500">
              <Calendar className="w-8 h-8 mb-2" />
              <p className="text-sm">No attendance records yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Justification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.slice(0, 10).map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-white">{record.lectureInstance.slot.course.name}</TableCell>
                    <TableCell>{formatDate(record.lectureInstance.scheduledDate)}</TableCell>
                    <TableCell><StatusBadge status={record.status} /></TableCell>
                    <TableCell>
                      {record.justification ? <StatusBadge status={record.justification.status} /> : <span className="text-charcoal-600">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
