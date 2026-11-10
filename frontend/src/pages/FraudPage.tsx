import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select, ErrorText } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '../lib/utils';

interface FraudLog {
  id: string;
  detectionType: string;
  severity: string;
  resolved: boolean;
  ipAddress: string | null;
  details: Record<string, unknown>;
  createdAt: string;
  user: { email: string; role: string };
}

const TYPES = [
  'DUPLICATE_ATTENDANCE', 'FOREIGN_STUDENT_ATTENDANCE', 'EXPIRED_PIN_USED', 'BRUTE_FORCE_PIN',
  'LATE_CHECKIN', 'CANCELLED_LECTURE_ATTENDANCE', 'SUSPICIOUS_IP', 'INVALID_CHECKIN',
];

export function FraudPage() {
  const [logs, setLogs] = useState<FraudLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severity, setSeverity] = useState('');
  const [type, setType] = useState('');
  const [resolved, setResolved] = useState('');
  const [resolvingId, setResolvingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/fraud', {
        params: {
          ...(severity ? { severity } : {}),
          ...(type ? { detectionType: type } : {}),
          ...(resolved ? { resolved } : {}),
        },
      });
      setLogs(res.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load fraud alerts');
    } finally {
      setLoading(false);
    }
  }, [severity, type, resolved]);

  useEffect(() => { load(); }, [load]);

  const resolve = async (log: FraudLog) => {
    if (!window.confirm('Mark this alert as resolved?')) return;
    setResolvingId(log.id);
    try {
      await api.put(`/fraud/${log.id}/resolve`);
      setLogs(prev => prev.map(l => l.id === log.id ? { ...l, resolved: true } : l));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resolve alert');
    } finally {
      setResolvingId('');
    }
  };

  return (
    <div>
      <PageHeader title="Fraud Alerts" description="Security events detected across attendance submissions" />

      <ErrorText>{error}</ErrorText>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <Select value={type} onChange={e => setType(e.target.value)}>
          <option value="">All detection types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </Select>
        <Select value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </Select>
        <Select value={resolved} onChange={e => setResolved(e.target.value)}>
          <option value="">All states</option>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-charcoal-500">
              <ShieldCheck className="w-10 h-10 mb-2" />
              <p className="text-sm">No fraud alerts match your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Detected</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-white">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                        {log.detectionType.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={log.severity} /></TableCell>
                    <TableCell>{log.user?.email || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{log.ipAddress || '—'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${log.resolved ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {log.resolved ? 'RESOLVED' : 'OPEN'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {!log.resolved && (
                        <Button size="sm" variant="secondary" onClick={() => resolve(log)} loading={resolvingId === log.id}>
                          Resolve
                        </Button>
                      )}
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
