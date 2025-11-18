import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createEmployee, getEmployee, updateEmployee } from '../../../lib/services/employees';
import { useToast } from '../../../components/Toast';

/**
 * PUBLIC_INTERFACE
 * EmployeeFormPage - create or edit employee.
 */
export default function EmployeeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { notify } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    department: '',
    role: 'employee',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      const { data, error } = await getEmployee(id);
      if (error) {
        setLoadError('Unable to load employee. If the table is missing, create it in Supabase.');
      } else if (data) {
        setForm({
          name: data.name || '',
          email: data.email || '',
          department: data.department || '',
          role: data.role || 'employee',
          status: data.status || 'active'
        });
      }
      setLoading(false);
    };
    load();
  }, [id, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    if (!form.role) e.role = 'Role is required';
    if (!form.status) e.status = 'Status is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    if (isEdit) {
      const { error } = await updateEmployee(id, form);
      if (error) {
        notify('Update failed', 'error');
      } else {
        notify('Employee updated', 'success');
        navigate('/admin/employees');
      }
    } else {
      const { error } = await createEmployee(form);
      if (error) {
        notify('Create failed', 'error');
      } else {
        notify('Employee created', 'success');
        navigate('/admin/employees');
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
    <div className="card" style={{ padding: '1.25rem', maxWidth: 600 }}>
      <h2 style={{ marginTop: 0 }}>{isEdit ? 'Edit Employee' : 'New Employee'}</h2>
      <form onSubmit={onSubmit} noValidate>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label htmlFor="name" style={{ display: 'block', marginBottom: 6 }}>Name</label>
            <input
              id="name"
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              aria-invalid={!!errors.name}
            />
            {errors.name && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
          </div>

          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: 6 }}>Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              aria-invalid={!!errors.email}
            />
            {errors.email && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
          </div>

          <div>
            <label htmlFor="department" style={{ display: 'block', marginBottom: 6 }}>Department</label>
            <input
              id="department"
              className="input"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="role" style={{ display: 'block', marginBottom: 6 }}>Role</label>
            <select
              id="role"
              className="input"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              aria-invalid={!!errors.role}
            >
              <option value="employee">employee</option>
              <option value="hr">hr</option>
              <option value="admin">admin</option>
            </select>
            {errors.role && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.role}</div>}
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
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            {errors.status && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.status}</div>}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/employees')}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
