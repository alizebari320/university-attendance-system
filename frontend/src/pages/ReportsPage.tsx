import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ErrorText } from '../components/ui/Form';
import { StatCard } from '../components/StatCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Download, TrendingUp, Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatDate } from '../lib/utils';

type ReportTab = 'daily' | 'weekly' | 'monthly' | 'semester';

interface ReportPageProps {
  initialTab?: ReportTab;
}

interface StatusCount { status: string; _count: { status: number }; }
interface AttendanceRow {
  id: string;
  status: string;
  createdAt: string;
  student?: { studentNumber: string; user: { email: string }; department?: { name: string } };
  lectureInstance?: { scheduledDate: string; slot: { course: { name: string } } };
}

const TABS: { key: ReportTab; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'semester', label: 'Semester' },
];

const COLORS = ['#22c55e', '#f97316', '#ef4444'];

export function ReportsPage({ initialTab = 'daily' }: ReportPageProps) {
  const [tab, setTab] = useState<ReportTab>(initialTab);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/${tab}`);
      setData(res.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const download = async () => {
    setExporting(true);
    try {
      const res = await api.get('/reports/export', { params: { type: tab }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tab}-report-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const summary = useMemo(() => {
    const stats: StatusCount[] = data?.stats || [];
    const present = stats.find(s => s.status === 'PRESENT')?._count.status || 0;
    const late = stats.find(s => s.status === 'LATE')?._count.status || 0;
    const absent = stats.find(s => s.status === 'ABSENT')?._count.status || 0;
    return { present, late, absent, total: present + late + absent };
  }, [data]);

  const chartData = [
    { name: 'Present', value: summary.present },
    { name: 'Late', value: summary.late },
    { name: 'Absent', value: summary.absent },
  ];

  const timeline = useMemo(() => {
    const records: AttendanceRow[] = data?.records || data?.attendances || [];
    const buckets: Record<string, { date: string; present: number; late: number; absent: number }> = {};
    records.forEach(record => {
      const key = new Date(record.createdAt).toISOString().slice(0, 10);
      if (!buckets[key]) buckets[key] = { date: key, present: 0, late: 0, absent: 0 };
      if (record.status === 'PRESENT') buckets[key].present += 1;
      if (record.status === 'LATE') buckets[key].late += 1;
      if (record.status === 'ABSENT') buckets[key].absent += 1;
    });
    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const tableRecords: AttendanceRow[] = data?.records || data?.attendances || [];

  const rate = summary.total > 0 ? Math.round(((summary.present + summary.late) / summary.total) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Attendance analytics across daily, weekly, monthly and semester periods"
        actions={
          <Button variant="secondary" onClick={download} loading={exporting}>
            <span className="flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</span>
          </Button>
        }
      />

      <ErrorText>{error}</ErrorText>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-blue-500 text-white'
                : 'bg-charcoal-900 text-charcoal-300 hover:bg-charcoal-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Records" value={summary.total} icon={<Calendar className="w-5 h-5" />} gradient="bg-blue-500/15 text-blue-400" />
            <StatCard title="Present" value={summary.present} icon={<CheckCircle2 className="w-5 h-5" />} gradient="bg-green-500/15 text-green-400" />
            <StatCard title="Late" value={summary.late} icon={<Clock className="w-5 h-5" />} gradient="bg-orange-500/15 text-orange-400" />
            <StatCard title="Absent" value={summary.absent} icon={<AlertCircle className="w-5 h-5" />} gradient="bg-red-500/15 text-red-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Attendance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.total === 0 ? (
                  <p className="text-sm text-charcoal-400 text-center py-16">No attendance data for this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="name" stroke="#737373" fontSize={12} />
                      <YAxis stroke="#737373" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: 8, color: '#fff' }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                        {chartData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie isAnimationActive={false}
                      data={[{ name: 'Attended', value: summary.present + summary.late }, { name: 'Absent', value: summary.absent }]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: 8, color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-center text-2xl font-bold text-white -mt-6">{rate}%</p>
                <p className="text-center text-xs text-charcoal-500 mt-1">
                  {summary.present + summary.late} attended · {summary.absent} absent
                </p>
              </CardContent>
            </Card>
          </div>

          {timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="date" stroke="#737373" fontSize={12} />
                    <YAxis stroke="#737373" fontSize={12} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: 8, color: '#fff' }} />
                    <Legend />
                    <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="late" stroke="#f97316" strokeWidth={2} />
                    <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {tableRecords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Records</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRecords.slice(0, 50).map(record => (
                      <TableRow key={record.id}>
                        <TableCell className="text-white">{record.student?.studentNumber || '—'}</TableCell>
                        <TableCell>{record.lectureInstance?.slot.course.name || '—'}</TableCell>
                        <TableCell>{formatDate(record.createdAt)}</TableCell>
                        <TableCell><StatusBadge status={record.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {summary.total === 0 && (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-32 text-charcoal-500">
                  <TrendingUp className="w-8 h-8 mb-2" />
                  <p className="text-sm">No activity recorded for this period.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
