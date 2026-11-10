import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField, Input, Select, ErrorText } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { Calendar, Plus, Play, Square, XCircle, KeyRound, Copy } from 'lucide-react';
import { formatDateTime } from '../lib/utils';

interface Lecture {
  id: string;
  status: string;
  scheduledDate: string;
  pinExpiresAt: string | null;
  pinAttempts: number;
  slot: { id: string; name: string; startTime: string; endTime: string; room: string | null; course: { name: string; code: string } };
  _count?: { attendances: number };
}

interface Slot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  room: string | null;
  course: { name: string; code: string };
  lecturer: { id: string; user?: { email: string } };
}

interface Course { id: string; name: string; code: string; }
interface Lecturer { id: string; employeeId: string; user: { email: string }; }

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function LecturesPage() {
  const { user } = useAuth();
  const canManage = user?.role !== 'STUDENT';
  const isLecturer = user?.role === 'LECTURER';
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pinModal, setPinModal] = useState<{ open: boolean; pin: string; lecture: Lecture | null }>({ open: false, pin: '', lecture: null });
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [instanceModalOpen, setInstanceModalOpen] = useState(false);
  const [slotForm, setSlotForm] = useState({ name: '', courseId: '', lecturerId: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:30', room: '' });
  const [instanceForm, setInstanceForm] = useState({ slotId: '', scheduledDate: '' });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const requests: Promise<any>[] = [api.get('/lectures'), api.get('/lectures/slots'), api.get('/courses')];
      if (canManage && !isLecturer) requests.push(api.get('/lecturers'));
      const [lectureRes, slotRes, courseRes, lecturerRes] = await Promise.all(requests);
      setLectures(lectureRes.data.data);
      setSlots(slotRes.data.data);
      setCourses(courseRes.data.data);
      if (lecturerRes) setLecturers(lecturerRes.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load lectures');
    } finally {
      setLoading(false);
    }
  }, [canManage, isLecturer]);

  useEffect(() => { load(); }, [load]);

  const filtered = lectures.filter(l => !statusFilter || l.status === statusFilter);

  const openLecture = async (lecture: Lecture) => {
    try {
      const res = await api.post(`/lectures/${lecture.id}/open`);
      setPinModal({ open: true, pin: res.data.data.pin, lecture });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to open lecture');
    }
  };

  const closeLecture = async (lecture: Lecture) => {
    if (!window.confirm('Close this lecture? Students without check-in will be marked absent.')) return;
    try {
      await api.post(`/lectures/${lecture.id}/close`, { cancel: false });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to close lecture');
    }
  };

  const cancelLecture = async (lecture: Lecture) => {
    const reason = window.prompt('Reason for cancelling this lecture:');
    if (reason === null) return;
    try {
      await api.post(`/lectures/${lecture.id}/close`, { cancel: true, reason });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel lecture');
    }
  };

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(pinModal.pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const createSlot = async () => {
    setSaving(true);
    setError('');
    const lecturerId = isLecturer ? user?.profile?.id : slotForm.lecturerId;
    if (!lecturerId) {
      setError('Select a lecturer');
      setSaving(false);
      return;
    }
    try {
      await api.post('/lectures/slots', {
        name: slotForm.name,
        courseId: slotForm.courseId,
        lecturerId,
        dayOfWeek: Number(slotForm.dayOfWeek),
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        room: slotForm.room || undefined,
      });
      setSlotModalOpen(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create lecture slot');
    } finally {
      setSaving(false);
    }
  };

  const createInstance = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/lectures/instances', instanceForm);
      setInstanceModalOpen(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to schedule session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Lectures"
        description="Sessions, live check-in windows and schedules"
        actions={canManage ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setInstanceForm({ slotId: slots[0]?.id || '', scheduledDate: '' }); setInstanceModalOpen(true); }} disabled={slots.length === 0}>
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Schedule Session</span>
            </Button>
            <Button onClick={() => {
              setSlotForm({
                name: '', courseId: courses[0]?.id || '',
                lecturerId: isLecturer ? '' : (lecturers[0]?.id || ''),
                dayOfWeek: 1, startTime: '09:00', endTime: '10:30', room: '',
              });
              setSlotModalOpen(true);
            }} disabled={courses.length === 0}>
              <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Slot</span>
            </Button>
          </div>
        ) : undefined}
      />

      <ErrorText>{error}</ErrorText>

      <div className="flex justify-end mb-4">
        <Select className="sm:w-56" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="CLOSED">Closed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-charcoal-500">
              <Calendar className="w-10 h-10 mb-2" />
              <p className="text-sm">{lectures.length === 0 ? 'No lecture sessions yet' : 'No sessions match this filter'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Check-ins</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(lecture => (
                  <TableRow key={lecture.id}>
                    <TableCell className="font-medium text-white">
                      {lecture.slot.course.name}
                      <span className="block text-xs text-charcoal-500">{lecture.slot.course.code}</span>
                    </TableCell>
                    <TableCell>
                      {lecture.slot.name}
                      <span className="block text-xs text-charcoal-500">{lecture.slot.startTime}–{lecture.slot.endTime}{lecture.slot.room ? ` · ${lecture.slot.room}` : ''}</span>
                    </TableCell>
                    <TableCell>{formatDateTime(lecture.scheduledDate)}</TableCell>
                    <TableCell>{lecture._count?.attendances ?? 0}</TableCell>
                    <TableCell><StatusBadge status={lecture.status} /></TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {lecture.status === 'SCHEDULED' && (
                            <>
                              <button onClick={() => openLecture(lecture)} className="p-1.5 rounded-lg text-charcoal-400 hover:text-green-400 hover:bg-charcoal-800" title="Open check-in">
                                <Play className="w-4 h-4" />
                              </button>
                              <button onClick={() => cancelLecture(lecture)} className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800" title="Cancel lecture">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {lecture.status === 'IN_PROGRESS' && (
                            <>
                              <button onClick={() => openLecture(lecture)} className="p-1.5 rounded-lg text-charcoal-400 hover:text-blue-400 hover:bg-charcoal-800" title="Regenerate PIN">
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button onClick={() => closeLecture(lecture)} className="p-1.5 rounded-lg text-charcoal-400 hover:text-orange-400 hover:bg-charcoal-800" title="Close lecture">
                                <Square className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={pinModal.open}
        title="Check-in PIN"
        onClose={() => setPinModal({ open: false, pin: '', lecture: null })}
        footer={<Button onClick={() => setPinModal({ open: false, pin: '', lecture: null })}>Done</Button>}
      >
        <p className="text-sm text-charcoal-400 mb-3">
          Share this PIN with students. It expires in 30 minutes.
        </p>
        <div className="flex items-center justify-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 py-6">
          <span className="text-4xl font-mono font-bold tracking-[0.35em] text-white">{pinModal.pin}</span>
          <button onClick={copyPin} className="p-2 rounded-lg text-blue-300 hover:bg-blue-500/20" title="Copy PIN">
            <Copy className="w-5 h-5" />
          </button>
        </div>
        {copied && <p className="text-xs text-green-400 text-center mt-2">Copied!</p>}
      </Modal>

      <Modal
        open={slotModalOpen}
        title="Add Lecture Slot"
        onClose={() => setSlotModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSlotModalOpen(false)}>Cancel</Button>
            <Button onClick={createSlot} loading={saving}>Create Slot</Button>
          </>
        }
      >
        <FormField label="Slot Name">
          <Input value={slotForm.name} onChange={e => setSlotForm({ ...slotForm, name: e.target.value })} placeholder="CS101 - Monday Lecture" />
        </FormField>
        <FormField label="Course">
          <Select value={slotForm.courseId} onChange={e => setSlotForm({ ...slotForm, courseId: e.target.value })}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </Select>
        </FormField>
        {!isLecturer && (
          <FormField label="Lecturer">
            <Select value={slotForm.lecturerId} onChange={e => setSlotForm({ ...slotForm, lecturerId: e.target.value })}>
              {lecturers.map(l => <option key={l.id} value={l.id}>{l.employeeId} — {l.user.email}</option>)}
            </Select>
          </FormField>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Day">
            <Select value={slotForm.dayOfWeek} onChange={e => setSlotForm({ ...slotForm, dayOfWeek: Number(e.target.value) })}>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </Select>
          </FormField>
          <FormField label="Room">
            <Input value={slotForm.room} onChange={e => setSlotForm({ ...slotForm, room: e.target.value })} placeholder="Room 101" />
          </FormField>
          <FormField label="Start">
            <Input type="time" value={slotForm.startTime} onChange={e => setSlotForm({ ...slotForm, startTime: e.target.value })} />
          </FormField>
          <FormField label="End">
            <Input type="time" value={slotForm.endTime} onChange={e => setSlotForm({ ...slotForm, endTime: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={instanceModalOpen}
        title="Schedule Session"
        onClose={() => setInstanceModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setInstanceModalOpen(false)}>Cancel</Button>
            <Button onClick={createInstance} loading={saving} disabled={!instanceForm.slotId || !instanceForm.scheduledDate}>Schedule</Button>
          </>
        }
      >
        <FormField label="Lecture Slot">
          <Select value={instanceForm.slotId} onChange={e => setInstanceForm({ ...instanceForm, slotId: e.target.value })}>
            {slots.map(s => <option key={s.id} value={s.id}>{s.course.name} — {s.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Date & Time">
          <Input type="datetime-local" value={instanceForm.scheduledDate} onChange={e => setInstanceForm({ ...instanceForm, scheduledDate: e.target.value })} />
        </FormField>
      </Modal>
    </div>
  );
}
