import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listEmployees, deleteEmployee } from '../../../lib/services/employees';
import { useToast } from '../../../components/Toast';

/**
 * PUBLIC_INTERFACE
 * EmployeesListPage lists employees with search and pagination.
 * Actions: add new, view/edit (navigates to form), delete (with confirm).
 */
export default function EmployeesListPage() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count]);

  useEffect(() => {
    setSearchParams((sp) => {
      const next = new URLSearchParams(sp);
      q ? next.set('q', q) : next.delete('q');
      next.set('page', String(page));
      return next;
    });
  }, [q, page, setSearchParams]);

  const fetchRows = async () => {
    setLoading(true);
    setLoadError('');
    const { data, count: total, error } = await listEmployees({ q, page, pageSize });
    if (error) {
      setLoadError('Unable to load employees. If the table is missing, create it in Supabase.');
      setRows([]);
      setCount(0);
    } else {
      setRows(data || []);
      setCount(total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  const onDelete = async (id) => {
    const ok = window.confirm('Are you sure you want to delete this employee? This cannot be undone.');
    if (!ok) return;
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== id)); // optimistic
    const { error } = await deleteEmployee(id);
    if (error) {
      notify('Delete failed', 'error');
      setRows(prev);
    } else {
      notify('Employee deleted', 'success');
      fetchRows();
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Employees</h2>
            <div style={{ color: 'var(--oc-muted-text)' }}>
              Manage employees. Use search to filter by name, email, or department.
            </div>
          </div>
          <Link to="/admin/employees/new" className="btn">Add New</Link>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Search employees..."
            aria-label="Search employees"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            style={{ flex: '2 1 260px' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <div style={{ padding: '1rem' }} role="status" aria-live="polite">Loading...</div>
        ) : loadError ? (
          <div style={{ padding: '1rem', color: 'var(--oc-error)' }} role="alert" aria-live="assertive">{loadError}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--oc-muted-text)' }} aria-live="polite">No employees found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th tabIndex={0} style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Name</th>
                  <th tabIndex={0} style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Email</th>
                  <th tabIndex={0} style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Department</th>
                  <th tabIndex={0} style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Role</th>
                  <th tabIndex={0} style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Status</th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.name}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.email}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.department}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.role}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.status}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)', textAlign: 'right' }}>
                      <button className="btn btn-secondary" onClick={() => navigate(`/admin/employees/${r.id}`)}>View/Edit</button>{' '}
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
