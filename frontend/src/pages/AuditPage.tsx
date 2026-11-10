import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Input, Select, ErrorText } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Clock, Search } from 'lucide-react';
import { formatDateTime, roleLabels } from '../lib/utils';

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorRole: string | null;
  ipAddress: string | null;
  createdAt: string;
  actor?: { email: string } | null;
  reason?: string | null;
}

const ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ATTENDANCE_SUBMIT', 'ATTENDANCE_MODIFY',
  'PIN_GENERATE', 'PIN_VERIFY', 'PIN_EXPIRE', 'LECTURE_OPEN', 'LECTURE_CLOSE', 'LECTURE_CANCEL',
  'JUSTIFICATION_APPROVE', 'JUSTIFICATION_REJECT', 'USER_ROLE_CHANGE', 'USER_STATUS_CHANGE',
];

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-500/15 text-green-400',
  UPDATE: 'bg-blue-500/15 text-blue-400',
  DELETE: 'bg-red-500/15 text-red-400',
  LOGIN: 'bg-cyan-500/15 text-cyan-400',
  LOGOUT: 'bg-gray-500/15 text-gray-400',
  ATTENDANCE_SUBMIT: 'bg-emerald-500/15 text-emerald-400',
  ATTENDANCE_MODIFY: 'bg-orange-500/15 text-orange-400',
  LECTURE_OPEN: 'bg-blue-500/15 text-blue-400',
  LECTURE_CLOSE: 'bg-gray-500/15 text-gray-400',
  LECTURE_CANCEL: 'bg-red-500/15 text-red-400',
};

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit', {
        params: {
          ...(action ? { action } : {}),
          ...(entityType ? { entityType } : {}),
          limit: 200,
        },
      });
      setLogs(res.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [action, entityType]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader title="Audit Log" description="Immutable record of every sensitive action in the system" />

      <ErrorText>{error}</ErrorText>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
          <Input
            className="pl-9"
            placeholder="Filter by entity type (e.g. AttendanceRecord)"
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
          />
        </div>
        <Select className="sm:w-64" value={action} onChange={e => setAction(e.target.value)}>
          <option value="">All actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
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
              <Clock className="w-10 h-10 mb-2" />
              <p className="text-sm">No audit entries match your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${ACTION_COLORS[log.action] || 'bg-gray-500/15 text-gray-400'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-white">{log.entityType}</span>
                      <span className="block text-xs text-charcoal-500 font-mono">{log.entityId.slice(0, 12)}…</span>
                    </TableCell>
                    <TableCell>
                      {log.actor?.email || 'System'}
                      <span className="block text-xs text-charcoal-500">{log.actorRole ? roleLabels[log.actorRole] || log.actorRole : '—'}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.ipAddress || '—'}</TableCell>
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
