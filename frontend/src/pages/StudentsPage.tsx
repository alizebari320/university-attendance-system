import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select, ErrorText } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { GraduationCap, Search, Filter, Eye, AlertTriangle } from 'lucide-react';
import { formatDate } from '../lib/utils';

interface Student {
  id: string;
  userId: string;
  studentNumber: string;
  status: string;
  enrollmentYear: number;
  enrollmentSemester: string;
  absenceCountPerSemester: number;
  absenceThreshold: number;
  user: { email: string };
  college: { name: string };
  department: { id: string; name: string };
}

interface Department { id: string; name: string; }

interface AttendanceRecord {
  id: string;
  status: string;
  checkInTime: string | null;
  createdAt: string;
  lectureInstance: { scheduledDate: string; slot: { course: { name: string; code: string } } };
}

export function StudentsPage() {
  const { user } = useAuth();
  const canFilterDept = user?.role === 'SUPER_ADMIN' || user?.role === 'DOCTOR' || user?.role === 'DEPARTMENT_ADMIN';
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const requests: Promise<any>[] = [api.get('/students')];
      if (canFilterDept) requests.push(api.get('/departments'));
      const [studentRes, deptRes] = await Promise.all(requests);
      setStudents(studentRes.data.data);
      if (deptRes) setDepartments(deptRes.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [canFilterDept]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => students.filter(s => {
    const haystack = `${s.studentNumber} ${s.user.email} ${s.department?.name || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) && (!deptFilter || s.department?.id === deptFilter);
  }), [students, search, deptFilter]);

  const openHistory = async (student: Student) => {
    setSelected(student);
    setRecords([]);
    setRecordsLoading(true);
    try {
      const res = await api.get(`/attendance/student/${student.userId}`);
      setRecords(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load attendance history');
    } finally {
      setRecordsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Students" description="Student records, enrolment and absence status" />

      <ErrorText>{error}</ErrorText>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
          <Input
            className="pl-9"
            placeholder="Search by student number, email or department"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {canFilterDept && (
          <div className="relative sm:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500 pointer-events-none" />
            <Select className="pl-9" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-charcoal-500">
              <GraduationCap className="w-10 h-10 mb-2" />
              <p className="text-sm">{students.length === 0 ? 'No students yet' : 'No students match your filters'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student No.</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Absences</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(student => {
                  const atRisk = student.absenceCountPerSemester >= student.absenceThreshold;
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium text-white">{student.studentNumber}</TableCell>
                      <TableCell>{student.user.email}</TableCell>
                      <TableCell>{student.department?.name || '—'}</TableCell>
                      <TableCell>{student.enrollmentYear} · {student.enrollmentSemester}</TableCell>
                      <TableCell>
                        <span className={atRisk ? 'text-red-400 font-medium' : ''}>
                          {student.absenceCountPerSemester}/{student.absenceThreshold}
                        </span>
                        {atRisk && <AlertTriangle className="inline w-3.5 h-3.5 ml-1 text-red-400" />}
                      </TableCell>
                      <TableCell><StatusBadge status={student.status} /></TableCell>
                      <TableCell>
                        <Button size="sm" variant="secondary" onClick={() => openHistory(student)}>
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={!!selected}
        title={selected ? `Attendance — ${selected.studentNumber}` : 'Attendance'}
        onClose={() => setSelected(null)}
      >
        {recordsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : records.length === 0 ? (
          <p className="text-sm text-charcoal-400 text-center py-6">No attendance records yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(record => (
                <TableRow key={record.id}>
                  <TableCell>{record.lectureInstance.slot.course.name}</TableCell>
                  <TableCell>{formatDate(record.lectureInstance.scheduledDate)}</TableCell>
                  <TableCell><StatusBadge status={record.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Modal>
    </div>
  );
}
