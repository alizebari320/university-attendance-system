import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField, Input, Select, ErrorText } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
  status: string;
  collegeId: string;
  college: { name: string };
  courses: unknown[];
}

interface College { id: string; name: string; }

export function DepartmentsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'DOCTOR';
  const [departments, setDepartments] = useState<Department[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', code: '', collegeId: '', status: 'ACTIVE' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const requests: Promise<any>[] = [api.get('/departments')];
      if (canEdit) requests.push(api.get('/colleges'));
      const [deptRes, collegeRes] = await Promise.all(requests);
      setDepartments(deptRes.data.data);
      if (collegeRes) setColleges(collegeRes.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, [canEdit]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', collegeId: colleges[0]?.id || '', status: 'ACTIVE' });
    setModalOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({ name: dept.name, code: dept.code, collegeId: dept.collegeId, status: dept.status });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/departments/${editing.id}`, form);
      } else {
        await api.post('/departments', form);
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (dept: Department) => {
    if (!window.confirm(`Delete department "${dept.name}"?`)) return;
    try {
      await api.delete(`/departments/${dept.id}`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete department');
    }
  };

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Academic departments and their course offerings"
        actions={canEdit ? (
          <Button onClick={openCreate} disabled={colleges.length === 0}>
            <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Department</span>
          </Button>
        ) : undefined}
      />

      <ErrorText>{error}</ErrorText>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : departments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-charcoal-500">
              <Layers className="w-10 h-10 mb-2" />
              <p className="text-sm">No departments yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map(dept => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium text-white">{dept.name}</TableCell>
                    <TableCell>{dept.code}</TableCell>
                    <TableCell>{dept.college?.name || '—'}</TableCell>
                    <TableCell>{dept.courses.length}</TableCell>
                    <TableCell><StatusBadge status={dept.status} /></TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(dept)} className="p-1.5 rounded-lg text-charcoal-400 hover:text-blue-400 hover:bg-charcoal-800" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => remove(dept)} className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
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
        open={modalOpen}
        title={editing ? 'Edit Department' : 'Add Department'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Create Department'}</Button>
          </>
        }
      >
        <FormField label="Department Name">
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Computer Science" />
        </FormField>
        <FormField label="Code">
          <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CS" />
        </FormField>
        <FormField label="College">
          <Select value={form.collegeId} onChange={e => setForm({ ...form, collegeId: e.target.value })}>
            {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </FormField>
      </Modal>
    </div>
  );
}
