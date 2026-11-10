import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FormField, Input, Select, ErrorText } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { StatCard } from '../components/StatCard';
import { Calendar, CheckCircle2, Clock, AlertCircle, ClipboardList, KeyRound } from 'lucide-react';
import { formatDate, formatDateTime } from '../lib/utils';

interface AttendanceRecord {
  id: string;
  status: string;
  checkInTime: string | null;
  createdAt: string;
  pinUsed: string | null;
  lectureInstance: { id: string; scheduledDate: string; slot: { course: { name: string; code: string } } };
  student?: { studentNumber: string; user: { email: string }; department?: { name: string } };
  justification?: { id: string; status: string } | null;
}

interface Lecture {
  id: string;
  status: string;
  scheduledDate: string;
  slot: { name: string; course: { name: string; code: string } };
}

export function AttendancePage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  if (isStudent) return <StudentAttendance />;
  return <StaffAttendance />;
}

function StudentAttendance() {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, late: 0, absent: 0 });
  const [openLectures, setOpenLectures] = useState<Lecture[]>([]);
  const [selectedLecture, setSelectedLecture] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [historyRes, lecturesRes] = await Promise.all([
        api.get('/attendance/student/me'),
        api.get('/lectures', { params: { status: 'IN_PROGRESS' } }),
      ]);
      setHistory(historyRes.data.data);
      setSummary(historyRes.data.summary || { total: 0, present: 0, late: 0, absent: 0 });
      setOpenLectures(lecturesRes.data.data);
      if (!selectedLecture && lecturesRes.data.data[0]) {
        setSelectedLecture(lecturesRes.data.data[0].id);
      }
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedLecture]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!selectedLecture) {
      setError('Select an open lecture first');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post(`/attendance/${selectedLecture}/submit`, { pin });
      setSuccess(`Attendance recorded as ${res.data.data.status}.`);
      setPin('');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const rate = summary.total > 0 ? Math.round(((summary.present + summary.late) / summary.total) * 100) : 100;

  return (
    <div>
      <PageHeader title="My Attendance" description="Check in to an open lecture and review your record" />

      <ErrorText>{error}</ErrorText>
      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 text-green-300 text-sm px-3 py-2 mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Attendance Rate" value={`${rate}%`} icon={<CheckCircle2 className="w-5 h-5" />} gradient="bg-blue-500/15 text-blue-400" />
        <StatCard title="Present" value={summary.present} icon={<Calendar className="w-5 h-5" />} gradient="bg-green-500/15 text-green-400" />
        <StatCard title="Late" value={summary.late} icon={<Clock className="w-5 h-5" />} gradient="bg-orange-500/15 text-orange-400" />
        <StatCard title="Absent" value={summary.absent} icon={<AlertCircle className="w-5 h-5" />} gradient="bg-red-500/15 text-red-400" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Check In</CardTitle>
        </CardHeader>
        <CardContent>
          {openLectures.length === 0 ? (
            <p className="text-sm text-charcoal-400">No lectures are open for check-in right now.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <FormField label="Open Lecture">
                <Select value={selectedLecture} onChange={e => setSelectedLecture(e.target.value)}>
                  {openLectures.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.slot.course.name} — {formatDate(l.scheduledDate)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="6-digit PIN">
                <Input
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                />
              </FormField>
              <Button onClick={submit} loading={submitting} disabled={pin.length !== 6}>
                <span className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> Submit Attendance</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-charcoal-500">
              <Calendar className="w-8 h-8 mb-2" />
              <p className="text-sm">No attendance records yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Lecture Date</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Justification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-white">{record.lectureInstance.slot.course.name}</TableCell>
                    <TableCell>{formatDate(record.lectureInstance.scheduledDate)}</TableCell>
                    <TableCell>{record.checkInTime ? formatDateTime(record.checkInTime) : '—'}</TableCell>
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

function StaffAttendance() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selected, setSelected] = useState('');
  const [sheet, setSheet] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/lectures');
      setLectures(res.data.data);
      if (!selected && res.data.data[0]) setSelected(res.data.data[0].id);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load lectures');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { load(); }, [load]);

  const loadSheet = useCallback(async (lectureId: string) => {
    if (!lectureId) { setSheet([]); return; }
    setSheetLoading(true);
    try {
      const res = await api.get(`/attendance/sheet/${lectureId}`);
      setSheet(res.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load attendance sheet');
    } finally {
      setSheetLoading(false);
    }
  }, []);

  useEffect(() => { loadSheet(selected); }, [selected, loadSheet]);

  const modify = async (record: AttendanceRecord, status: string) => {
    setSavingId(record.id);
    try {
      await api.put(`/attendance/${record.id}`, { status, reason: 'Manual update via attendance sheet' });
      setSheet(prev => prev.map(r => r.id === record.id ? { ...r, status } : r));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update attendance');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div>
      <PageHeader title="Attendance Sheets" description="Review and correct attendance for your lectures" />

      <ErrorText>{error}</ErrorText>

      <Card className="mb-6">
        <CardContent>
          <FormField label="Lecture">
            <Select value={selected} onChange={e => setSelected(e.target.value)} disabled={loading}>
              {lectures.map(l => (
                <option key={l.id} value={l.id}>
                  {l.slot.course.name} — {formatDate(l.scheduledDate)} ({l.status})
                </option>
              ))}
            </Select>
          </FormField>
          {lectures.length === 0 && !loading && (
            <p className="text-sm text-charcoal-400">No lectures available.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Sheet</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sheetLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : sheet.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-charcoal-500">
              <ClipboardList className="w-8 h-8 mb-2" />
              <p className="text-sm">No attendance records for this lecture</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Set Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheet.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-white">
                      {record.student?.studentNumber}
                      <span className="block text-xs text-charcoal-500">{record.student?.user.email}</span>
                    </TableCell>
                    <TableCell>{record.student?.department?.name || '—'}</TableCell>
                    <TableCell>{record.checkInTime ? formatDateTime(record.checkInTime) : '—'}</TableCell>
                    <TableCell><StatusBadge status={record.status} /></TableCell>
                    <TableCell>
                      <div className="w-32">
                        <Select
                          value={record.status}
                          disabled={savingId === record.id}
                          onChange={e => modify(record, e.target.value)}
                        >
                          <option value="PRESENT">Present</option>
                          <option value="LATE">Late</option>
                          <option value="ABSENT">Absent</option>
                        </Select>
                      </div>
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
