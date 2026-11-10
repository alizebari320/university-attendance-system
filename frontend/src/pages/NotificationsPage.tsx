import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField, Input, Select, Textarea, ErrorText } from '../components/ui/Form';
import { Bell, CheckCheck, Megaphone, MailOpen } from 'lucide-react';
import { formatDateTime } from '../lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

interface Recipient {
  userId: string;
  email: string;
  studentNumber: string;
  department: string;
}

const TYPES = [
  'ATTENDANCE_CONFIRMATION',
  'ABSENCE_REGISTRATION',
  'LATE_ARRIVAL',
  'ABSENCE_THRESHOLD_WARNING',
  'APPROVED_JUSTIFICATION',
  'REJECTED_JUSTIFICATION',
  'LECTURER_ANNOUNCEMENT',
];

const TYPE_COLORS: Record<string, string> = {
  ATTENDANCE_CONFIRMATION: 'bg-green-500/15 text-green-400',
  ABSENCE_REGISTRATION: 'bg-red-500/15 text-red-400',
  LATE_ARRIVAL: 'bg-orange-500/15 text-orange-400',
  ABSENCE_THRESHOLD_WARNING: 'bg-red-500/15 text-red-400',
  APPROVED_JUSTIFICATION: 'bg-green-500/15 text-green-400',
  REJECTED_JUSTIFICATION: 'bg-red-500/15 text-red-400',
  LECTURER_ANNOUNCEMENT: 'bg-blue-500/15 text-blue-400',
};

export function NotificationsPage() {
  const { user } = useAuth();
  const canAnnounce = user?.role === 'SUPER_ADMIN' || user?.role === 'DOCTOR' || user?.role === 'LECTURER';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openComposer = async () => {
    setModalOpen(true);
    setRecipientCount(null);
    try {
      const res = await api.get('/notifications/recipients');
      setRecipientCount(res.data.data.length);
    } catch {
      setRecipientCount(null);
    }
  };

  const markRead = async (notification: Notification) => {
    if (notification.readAt) return;
    try {
      await api.put(`/notifications/${notification.id}/read`);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to mark as read');
    }
  };

  const markAll = async () => {
    try {
      await api.put('/notifications/read-all');
      const now = new Date().toISOString();
      setNotifications(prev => prev.map(n => n.readAt ? n : { ...n, readAt: now }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to mark all as read');
    }
  };

  const sendAnnouncement = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/notifications/announcement', form);
      setModalOpen(false);
      setForm({ title: '', message: '' });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send announcement');
    } finally {
      setSaving(false);
    }
  };

  const filtered = notifications.filter(n => !typeFilter || n.type === typeFilter);
  const unread = notifications.filter(n => !n.readAt).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={`${unread} unread of ${notifications.length}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={markAll} disabled={unread === 0}>
              <span className="flex items-center gap-2"><CheckCheck className="w-4 h-4" /> Mark all read</span>
            </Button>
            {canAnnounce && (
              <Button onClick={openComposer}>
                <span className="flex items-center gap-2"><Megaphone className="w-4 h-4" /> Announcement</span>
              </Button>
            )}
          </div>
        }
      />

      <ErrorText>{error}</ErrorText>

      <div className="flex justify-end mb-4">
        <Select className="sm:w-72" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-40 text-charcoal-500">
              <Bell className="w-10 h-10 mb-2" />
              <p className="text-sm">No notifications</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(notification => (
            <button
              key={notification.id}
              onClick={() => markRead(notification)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                notification.readAt
                  ? 'border-charcoal-800 bg-charcoal-900/40 hover:bg-charcoal-900/70'
                  : 'border-blue-500/25 bg-blue-500/5 hover:bg-blue-500/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_COLORS[notification.type] || 'bg-gray-500/15 text-gray-400'}`}>
                      {notification.type.replace(/_/g, ' ')}
                    </span>
                    {!notification.readAt && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  </div>
                  <p className="text-white text-sm font-medium mt-1.5">{notification.title}</p>
                  <p className="text-charcoal-400 text-sm mt-0.5">{notification.message}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-charcoal-500 whitespace-nowrap">{formatDateTime(notification.createdAt)}</span>
                  {notification.readAt ? <MailOpen className="w-4 h-4 text-charcoal-600" /> : <Bell className="w-4 h-4 text-blue-400" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title="Send Announcement"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={sendAnnouncement} loading={saving} disabled={!form.title || !form.message}>Send</Button>
          </>
        }
      >
        <p className="text-xs text-charcoal-400 mb-3">
          {recipientCount === null
            ? 'Recipients are resolved automatically.'
            : `This will be sent to ${recipientCount} student${recipientCount === 1 ? '' : 's'}.`}
        </p>
        <FormField label="Title">
          <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Midterm schedule update" />
        </FormField>
        <FormField label="Message">
          <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Write your announcement..." />
        </FormField>
      </Modal>
    </div>
  );
}
