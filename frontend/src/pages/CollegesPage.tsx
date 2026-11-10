import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField, Input, Select, ErrorText } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';

interface College {
  id: string;
  name: string;
  code: string;
  status: string;
  departments: unknown[];
  students: unknown[];
  lecturers: unknown[];
}

const emptyForm = { name: '', code: '', status: 'ACTIVE' };

export function CollegesPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'DOCTOR';
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<College | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/colleges');
      setColleges(res.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load colleges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (college: College) => {
    setEditing(college);
    setForm({ name: college.name, code: college.code, status: college.status });
    setError('');
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/colleges/${editing.id}`, form);
      } else {
        await api.post('/colleges', form);
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save college');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (college: College) => {
    if (!window.confirm(`Delete college "${college.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/colleges/${college.id}`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete college');
    }
  };

  return (
    <div>
      <PageHeader
        title="Colleges"
        description="Manage the university's colleges and their departments"
        actions={canEdit ? (
          <Button onClick={openCreate}>
            <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add College</span>
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
          ) : colleges.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-charcoal-500">
              <Building2 className="w-10 h-10 mb-2" />
              <p className="text-sm">No colleges yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Departments</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Lecturers</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {colleges.map(college => (
                  <TableRow key={college.id}>
                    <TableCell className="font-medium text-white">{college.name}</TableCell>
                    <TableCell>{college.code}</TableCell>
                    <TableCell>{college.departments.length}</TableCell>
                    <TableCell>{college.students.length}</TableCell>
                    <TableCell>{college.lecturers.length}</TableCell>
                    <TableCell><StatusBadge status={college.status} /></TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(college)}
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-blue-400 hover:bg-charcoal-800"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => remove(college)}
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800"
                            title="Delete"
                          >
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
        title={editing ? 'Edit College' : 'Add College'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Create College'}</Button>
          </>
        }
      >
        <FormField label="College Name">
          <Input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="College of Engineering"
          />
        </FormField>
        <FormField label="Code">
          <Input
            value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="ENG"
          />
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
