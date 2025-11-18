import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createAssignment, getAssignment, updateAssignment } from '../../lib/services/assignments';
import { listEmployees } from '../../lib/services/employees';
import { listLessons } from '../../lib/services/lessons';
import { useToast } from '../../components/Toast';

/**
 * PUBLIC_INTERFACE
 * AssignmentFormPage - create or edit an assignment.
 */
export default function AssignmentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { notify } = useToast();

  const [form, setForm] = useState({
    employee_id: '',
    lesson_id: '',
    due_date: '',
    status: 'pending'
  });
  const [employees, setEmployees] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadOptions = async () => {
    const [empRes, lesRes] = await Promise.allSettled([
      listEmployees({ q: '', page: 1, pageSize: 200 }),
      listLessons({ q: '', page: 1, pageSize: 200 })
    ]);
    if (empRes.status === 'fulfilled' && !empRes.value.error) {
      setEmployees(empRes.value.data || []);
    }
    if (lesRes.status === 'fulfilled' && !lesRes.value.error) {
      setLessons(lesRes.value.data || []);
    }
  };

  useEffect(() => {
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      const { data, error } = await getAssignment(id);
      if (error) {
        setLoadError('Unable to load assignment. If the table is missing, create it in Supabase.');
      } else if (data) {
        setForm({
          employee_id: data.employee_id || '',
          lesson_id: data.lesson_id || '',
          due_date: data.due_date ? data.due_date.substring(0, 10) : '',
          status: data.status || 'pending'
        });
      }
      setLoading(false);
    };
    load();
  }, [id, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.employee_id) e.employee_id = 'Employee is required';
    if (!form.lesson_id) e.lesson_id = 'Lesson is required';
    if (form.due_date && isNaN(Date.parse(form.due_date))) e.due_date = 'Invalid date';
    if (!form.status) e.status = 'Status is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const payload = {
      employee_id: form.employee_id,
      lesson_id: form.lesson_id,
      due_date: form.due_date || null,
      status: form.status
    };

    if (isEdit) {
      const { error } = await updateAssignment(id, payload);
      if (error) {
        notify('Update failed', 'error');
      } else {
        notify('Assignment updated', 'success');
        navigate('/hr/assignments');
      }
    } else {
      const { error } = await createAssignment(payload);
      if (error) {
        notify('Create failed', 'error');
      } else {
        notify('Assignment created', 'success');
        navigate('/hr/assignments');
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="card" style={{ padding: '1rem' }}>Loading...</div>;
  if (loadError) {
    return (
      <div className="card" style={{ padding: '1rem', color: 'var(--oc-error)' }}>
        {loadError}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1.25rem', maxWidth: 720 }}>
      <h2 style={{ marginTop: 0 }}>{isEdit ? 'Edit Assignment' : 'New Assignment'}</h2>
      <form onSubmit={onSubmit} noValidate>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label htmlFor="employee_id" style={{ display: 'block', marginBottom: 6 }}>Employee</label>
            <select
              id="employee_id"
              className="input"
              value={form.employee_id}
              onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
              aria-invalid={!!errors.employee_id}
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name || emp.email}</option>
              ))}
            </select>
            {errors.employee_id && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.employee_id}</div>}
          </div>

          <div>
            <label htmlFor="lesson_id" style={{ display: 'block', marginBottom: 6 }}>Lesson</label>
            <select
              id="lesson_id"
              className="input"
              value={form.lesson_id}
              onChange={(e) => setForm((f) => ({ ...f, lesson_id: e.target.value }))}
              aria-invalid={!!errors.lesson_id}
            >
              <option value="">Select lesson</option>
              {lessons.map((les) => (
                <option key={les.id} value={les.id}>{les.title}</option>
              ))}
            </select>
            {errors.lesson_id && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.lesson_id}</div>}
          </div>

          <div>
            <label htmlFor="due_date" style={{ display: 'block', marginBottom: 6 }}>Due Date</label>
            <input
              id="due_date"
              type="date"
              className="input"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              aria-invalid={!!errors.due_date}
            />
            {errors.due_date && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.due_date}</div>}
          </div>

          <div>
            <label htmlFor="status" style={{ display: 'block', marginBottom: 6 }}>Status</label>
            <select
              id="status"
              className="input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              aria-invalid={!!errors.status}
            >
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
              <option value="overdue">overdue</option>
            </select>
            {errors.status && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.status}</div>}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/hr/assignments')}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
