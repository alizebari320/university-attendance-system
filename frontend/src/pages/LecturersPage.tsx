import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select, ErrorText } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { Users, Search, Filter, Calendar } from 'lucide-react';

interface Lecturer {
  id: string;
  employeeId: string;
  status: string;
  user: { email: string };
  college: { name: string };
  department: { id: string; name: string };
  lectures: unknown[];
}

interface Department { id: string; name: string; }

interface Slot {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  course: { name: string; code: string };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function LecturersPage() {
  const { user } = useAuth();
  const canFilterDept = user?.role === 'SUPER_ADMIN' || user?.role === 'DOCTOR' || user?.role === 'DEPARTMENT_ADMIN';
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [selected, setSelected] = useState<Lecturer | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const requests: Promise<any>[] = [api.get('/lecturers')];
      if (canFilterDept) requests.push(api.get('/departments'));
      const [lecturerRes, deptRes] = await Promise.all(requests);
      setLecturers(lecturerRes.data.data);
      if (deptRes) setDepartments(deptRes.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load lecturers');
    } finally {
      setLoading(false);
    }
  }, [canFilterDept]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => lecturers.filter(l => {
    const haystack = `${l.employeeId} ${l.user.email} ${l.department?.name || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) && (!deptFilter || l.department?.id === deptFilter);
  }), [lecturers, search, deptFilter]);

  const openSchedule = async (lecturer: Lecturer) => {
    setSelected(lecturer);
    setSlots([]);
    setSlotsLoading(true);
    try {
      const res = await api.get('/lectures/slots', { params: { lecturerId: lecturer.id } });
      setSlots(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load schedule');
    } finally {
      setSlotsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Lecturers" description="Teaching staff and their assigned schedules" />

      <ErrorText>{error}</ErrorText>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
          <Input
            className="pl-9"
            placeholder="Search by employee ID, email or department"
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
              <Users className="w-10 h-10 mb-2" />
              <p className="text-sm">{lecturers.length === 0 ? 'No lecturers yet' : 'No lecturers match your filters'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schedule</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(lecturer => (
                  <TableRow key={lecturer.id}>
                    <TableCell className="font-medium text-white">{lecturer.employeeId}</TableCell>
                    <TableCell>{lecturer.user.email}</TableCell>
                    <TableCell>{lecturer.college?.name || '—'}</TableCell>
                    <TableCell>{lecturer.department?.name || '—'}</TableCell>
                    <TableCell>{lecturer.lectures.length}</TableCell>
                    <TableCell><StatusBadge status={lecturer.status} /></TableCell>
                    <TableCell>
                      <Button size="sm" variant="secondary" onClick={() => openSchedule(lecturer)}>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={!!selected}
        title={selected ? `Schedule — ${selected.employeeId}` : 'Schedule'}
        onClose={() => setSelected(null)}
      >
        {slotsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : slots.length === 0 ? (
          <p className="text-sm text-charcoal-400 text-center py-6">No lecture slots assigned.</p>
        ) : (
          <div className="space-y-2">
            {slots.map(slot => (
              <div key={slot.id} className="rounded-lg border border-charcoal-800 bg-charcoal-950 p-3">
                <p className="text-white text-sm font-medium">{slot.course.name} ({slot.course.code})</p>
                <p className="text-charcoal-400 text-xs mt-1">
                  {DAYS[slot.dayOfWeek]} · {slot.startTime}–{slot.endTime}{slot.room ? ` · ${slot.room}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
