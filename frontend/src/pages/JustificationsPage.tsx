import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField, Select, Textarea, ErrorText } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { FileText, Check, X } from 'lucide-react';
import { formatDate } from '../lib/utils';

interface Justification {
  id: string;
  reason: string;
  justificationText: string;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  student: { studentNumber: string; user: { email: string }; department?: { name: string } };
  reviewer?: { email: string } | null;
  attendance?: { lectureInstance: { scheduledDate: string; slot: { course: { name: string } } } };
}

interface AttendanceRecord {
  id: string;
  status: string;
  justification: { id: string } | null;
  lectureInstance: { scheduledDate: string; slot: { course: { name: string } } };
}

const REASONS = [
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'FAMILY_EMERGENCY', label: 'Family emergency' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'OTHER', label: 'Other' },
];

export function JustificationsPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const [items, setItems] = useState<Justification[]>([]);
  const [absences, setAbsences] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [submitOpen, setSubmitOpen] = useState(false);
  const [form, setForm] = useState({ attendanceId: '', reason: 'MEDICAL', justificationText: '' });
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState<Justification | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const requests: Promise<any>[] = [api.get('/justifications')];
      if (isStudent) requests.push(api.get('/attendance/student/me'));
      const [justRes, attendanceRes] = await Promise.all(requests);
      setItems(justRes.data.data);
      if (attendanceRes) {
        const eligible = attendanceRes.data.data.filter(
          (r: AttendanceRecord) => r.status === 'ABSENT' && !r.justification
        );
        setAbsences(eligible);
      }
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load justifications');
    } finally {
      setLoading(false);
    }
  }, [isStudent]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(j => !statusFilter || j.status === statusFilter);

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/justifications', form);
      setSubmitOpen(false);
      setForm({ attendanceId: '', reason: 'MEDICAL', justificationText: '' });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit justification');
    } finally {
      setSaving(false);
    }
  };

  const review = async () => {
    if (!reviewing) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/justifications/${reviewing.id}/review`, { status: reviewStatus, reviewNotes });
      setReviewing(null);
      setReviewNotes('');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to review justification');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Justifications"
        description={isStudent ? 'Request review for an absence' : 'Review absence justifications'}
        actions={isStudent ? (
          <Button onClick={() => { setForm({ attendanceId: absences[0]?.id || '', reason: 'MEDICAL', justificationText: '' }); setSubmitOpen(true); }} disabled={absences.length === 0}>
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Request Justification</span>
          </Button>
        ) : undefined}
      />

      <ErrorText>{error}</ErrorText>

      {isStudent && absences.length === 0 && !loading && (
        <p className="text-sm text-charcoal-400 mb-4">You have no unjustified absences to request.</p>
      )}

      <div className="flex justify-end mb-4">
        <Select className="sm:w-56" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-charcoal-500">
              <FileText className="w-8 h-8 mb-2" />
              <p className="text-sm">No justifications found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {!isStudent && <TableHead>Student</TableHead>}
                  <TableHead>Course / Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => (
                  <TableRow key={item.id}>
                    {!isStudent && (
                      <TableCell className="font-medium text-white">
                        {item.student.studentNumber}
                        <span className="block text-xs text-charcoal-500">{item.student.user.email}</span>
                      </TableCell>
                    )}
                    <TableCell>
                      {item.attendance?.lectureInstance.slot.course.name || '—'}
                      <span className="block text-xs text-charcoal-500">
                        {item.attendance ? formatDate(item.attendance.lectureInstance.scheduledDate) : ''}
                      </span>
                    </TableCell>
                    <TableCell>{REASONS.find(r => r.value === item.reason)?.label || item.reason}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell>
                      {item.status === 'PENDING' && !isStudent ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setReviewing(item); setReviewStatus('APPROVED'); setReviewNotes(''); }}
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-green-400 hover:bg-charcoal-800"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setReviewing(item); setReviewStatus('REJECTED'); setReviewNotes(''); }}
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-charcoal-500">{item.reviewNotes || '—'}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={submitOpen}
        title="Request Justification"
        onClose={() => setSubmitOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSubmitOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={saving} disabled={!form.attendanceId || form.justificationText.length < 10}>Submit</Button>
          </>
        }
      >
        <FormField label="Absent Lecture">
          <Select value={form.attendanceId} onChange={e => setForm({ ...form, attendanceId: e.target.value })}>
            {absences.map(a => (
              <option key={a.id} value={a.id}>
                {a.lectureInstance.slot.course.name} — {formatDate(a.lectureInstance.scheduledDate)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Reason">
          <Select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}>
            {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </FormField>
        <FormField label="Explanation (min 10 characters)">
          <Textarea
            value={form.justificationText}
            onChange={e => setForm({ ...form, justificationText: e.target.value })}
            placeholder="Explain the reason for your absence..."
          />
        </FormField>
      </Modal>

      <Modal
        open={!!reviewing}
        title={reviewStatus === 'APPROVED' ? 'Approve Justification' : 'Reject Justification'}
        onClose={() => setReviewing(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReviewing(null)}>Cancel</Button>
            <Button onClick={review} loading={saving} variant={reviewStatus === 'APPROVED' ? 'primary' : 'danger'}>
              {reviewStatus === 'APPROVED' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        {reviewing && (
          <>
            <p className="text-sm text-charcoal-300 mb-2">
              <span className="text-white font-medium">{reviewing.student.studentNumber}</span> — {REASONS.find(r => r.value === reviewing.reason)?.label}
            </p>
            <p className="text-sm text-charcoal-400 mb-4 rounded-lg border border-charcoal-800 bg-charcoal-950 p-3">
              {reviewing.justificationText}
            </p>
          </>
        )}
        <FormField label="Review notes (optional)">
          <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Add context for the student..." />
        </FormField>
      </Modal>
    </div>
  );
}
