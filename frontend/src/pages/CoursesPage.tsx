import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField, Input, Select, ErrorText } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from '../components/ui/Table';
import { Plus, Pencil, Trash2, BookOpen, Search, Filter } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  status: string;
  departmentId: string;
  department?: { name: string; college?: { name: string } };
}

interface Department { id: string; name: string; }

const emptyForm = { name: '', code: '', credits: 3, departmentId: '', status: 'ACTIVE' };

export function CoursesPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'DOCTOR' || user?.role === 'DEPARTMENT_ADMIN';
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const requests: Promise<any>[] = [api.get('/courses')];
      if (canEdit) requests.push(api.get('/departments'));
      const [courseRes, deptRes] = await Promise.all(requests);
      setCourses(courseRes.data.data);
      if (deptRes) setDepartments(deptRes.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [canEdit]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => courses.filter(c => {
    const matchesSearch = `${c.name} ${c.code}`.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || c.departmentId === deptFilter;
    return matchesSearch && matchesDept;
  }), [courses, search, deptFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, departmentId: departments[0]?.id || '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setForm({
      name: course.name,
      code: course.code,
      credits: course.credits,
      departmentId: course.departmentId,
      status: course.status,
    });
    setError('');
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    const payload = { ...form, credits: Number(form.credits) };
    try {
      if (editing) await api.put(`/courses/${editing.id}`, payload);
      else await api.post('/courses', payload);
      setModalOpen(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (course: Course) => {
    if (!window.confirm(`Delete course "${course.name}"?`)) return;
    try {
      await api.delete(`/courses/${course.id}`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete course');
    }
  };

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Course catalogue across departments"
        actions={canEdit ? (
          <Button onClick={openCreate} disabled={departments.length === 0}>
            <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Course</span>
          </Button>
        ) : undefined}
      />

      <ErrorText>{error}</ErrorText>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
          <Input
            className="pl-9"
            placeholder="Search by name or code"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {canEdit && (
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
              <BookOpen className="w-10 h-10 mb-2" />
              <p className="text-sm">{courses.length === 0 ? 'No courses yet' : 'No courses match your filters'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(course => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium text-white">{course.name}</TableCell>
                    <TableCell>{course.code}</TableCell>
                    <TableCell>{course.department?.name || '—'}</TableCell>
                    <TableCell>{course.credits}</TableCell>
                    <TableCell><StatusBadge status={course.status} /></TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(course)} className="p-1.5 rounded-lg text-charcoal-400 hover:text-blue-400 hover:bg-charcoal-800" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => remove(course)} className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800" title="Delete">
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
        title={editing ? 'Edit Course' : 'Add Course'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Create Course'}</Button>
          </>
        }
      >
        <FormField label="Course Name">
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Introduction to Programming" />
        </FormField>
        <FormField label="Code">
          <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CS101" />
        </FormField>
        <FormField label="Department">
          <Select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Credits">
          <Input type="number" min={1} max={12} value={form.credits} onChange={e => setForm({ ...form, credits: Number(e.target.value) })} />
        </FormField>
        <FormField label="Status">
          <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </FormField>
      </Modal>
    </div>
  );
}
