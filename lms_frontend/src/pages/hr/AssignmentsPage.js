import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listAssignments, deleteAssignment, updateAssignment } from '../../lib/services/assignments';
import { listEmployees } from '../../lib/services/employees';
import { listLessons } from '../../lib/services/lessons';
import { useToast } from '../../components/Toast';

/**
 * PUBLIC_INTERFACE
 * AssignmentsPage - HR can view/filter assignments, update status, and delete.
 * Provides links to create new and edit specific assignment.
 */
export default function AssignmentsPage() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const pageSize = 10;

  const [q] = useState(searchParams.get('q') || ''); // no-op currently
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [employeeId, setEmployeeId] = useState(searchParams.get('employeeId') || '');
  const [lessonId, setLessonId] = useState(searchParams.get('lessonId') || '');
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [employees, setEmployees] = useState([]);
  const [lessons, setLessons] = useState([]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count]);

  useEffect(() => {
    setSearchParams((sp) => {
      const next = new URLSearchParams(sp);
      status ? next.set('status', status) : next.delete('status');
      employeeId ? next.set('employeeId', employeeId) : next.delete('employeeId');
      lessonId ? next.set('lessonId', lessonId) : next.delete('lessonId');
      next.set('page', String(page));
      return next;
    });
  }, [status, employeeId, lessonId, page, setSearchParams]);

  const fetchFilters = async () => {
    // Fetch a small list of employees and lessons for dropdowns
    const [empRes, lesRes] = await Promise.allSettled([
      listEmployees({ q: '', page: 1, pageSize: 100 }),
      listLessons({ q: '', page: 1, pageSize: 100 })
    ]);
    if (empRes.status === 'fulfilled' && !empRes.value.error) {
      setEmployees(empRes.value.data || []);
    }
    if (lesRes.status === 'fulfilled' && !lesRes.value.error) {
      setLessons(lesRes.value.data || []);
    }
  };

  const fetchRows = async () => {
    setLoading(true);
    setLoadError('');
    const { data, count: total, error } = await listAssignments({ q, status, employeeId, lessonId, page, pageSize });
    if (error) {
      setLoadError('Unable to load assignments. Ensure tables and RLS policies exist in Supabase.');
      setRows([]);
      setCount(0);
    } else {
      setRows(data || []);
      setCount(total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, employeeId, lessonId, page]);

  const onDelete = async (id) => {
    const ok = window.confirm('Delete this assignment?');
    if (!ok) return;
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== id));
    const { error } = await deleteAssignment(id);
    if (error) {
      notify('Delete failed', 'error');
      setRows(prev);
    } else {
      notify('Assignment deleted', 'success');
      fetchRows();
    }
  };

  const onInlineStatusChange = async (id, value) => {
    const prev = rows;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status: value } : x)));
    const { error } = await updateAssignment(id, { status: value });
    if (error) {
      notify('Update status failed', 'error');
      setRows(prev);
    } else {
      notify('Status updated', 'success');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Assignments</h2>
            <div style={{ color: 'var(--oc-muted-text)' }}>
              Assign lessons to employees and manage due dates and status.
            </div>
          </div>
          <Link to="/hr/assignments/new" className="btn">New Assignment</Link>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select
            className="input"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.target.value); }}
            style={{ flex: '1 1 160px' }}
          >
            <option value="all">All Status</option>
            <option value="pending">pending</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
            <option value="overdue">overdue</option>
          </select>

          <select
            className="input"
            aria-label="Filter by employee"
            value={employeeId}
            onChange={(e) => { setPage(1); setEmployeeId(e.target.value); }}
            style={{ flex: '1 1 220px' }}
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name || emp.email}</option>
            ))}
          </select>

          <select
            className="input"
            aria-label="Filter by lesson"
            value={lessonId}
            onChange={(e) => { setPage(1); setLessonId(e.target.value); }}
            style={{ flex: '1 1 220px' }}
          >
            <option value="">All Lessons</option>
            {lessons.map((les) => (
              <option key={les.id} value={les.id}>{les.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <div style={{ padding: '1rem' }}>Loading...</div>
        ) : loadError ? (
          <div style={{ padding: '1rem', color: 'var(--oc-error)' }}>{loadError}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--oc-muted-text)' }}>
            No assignments found. Use "New Assignment" to create one.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Employee</th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Lesson</th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Assigned At</th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Due Date</th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Status</th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.employee_id}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.lesson_id}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.assigned_at ? new Date(r.assigned_at).toLocaleString() : ''}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.due_date ? new Date(r.due_date).toLocaleDateString() : ''}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>
                      <select
                        className="input"
                        value={r.status || 'pending'}
                        onChange={(e) => onInlineStatusChange(r.id, e.target.value)}
                        style={{ maxWidth: 180 }}
                      >
                        <option value="pending">pending</option>
                        <option value="in_progress">in_progress</option>
                        <option value="completed">completed</option>
                        <option value="overdue">overdue</option>
                      </select>
                    </td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)', textAlign: 'right' }}>
                      <button className="btn btn-secondary" onClick={() => navigate(`/hr/assignments/${r.id}`)}>View/Edit</button>{' '}
                      <button className="btn" style={{ background: 'var(--oc-error)' }} onClick={() => onDelete(r.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem' }}>
              <div className="badge">Total: {count}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <div className="badge">Page {page} / {totalPages}</div>
                <button
                  className="btn btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
