import React, { useEffect, useMemo, useState } from 'react';
import { listProgress } from '../../lib/services/progress';
import { listEmployees } from '../../lib/services/employees';
import { listLessons } from '../../lib/services/lessons';

/**
 * PUBLIC_INTERFACE
 * ProgressPage - HR can view per-employee per-lesson progress with filters and summary counters.
 */
export default function ProgressPage() {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState('all');
  const [employeeId, setEmployeeId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count]);

  const fetchFilters = async () => {
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

  const fetchRows = async () => {
    setLoading(true);
    setLoadError('');
    const { data, count: total, error } = await listProgress({ status, employeeId, lessonId, page, pageSize });
    if (error) {
      setLoadError('Unable to load progress. Ensure tables and RLS policies exist in Supabase.');
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
  }, [status, employeeId, lessonId, page]);

  const summary = useMemo(() => {
    const s = { pending: 0, in_progress: 0, completed: 0, overdue: 0, avg: 0 };
    if (!rows.length) return s;
    let totalPct = 0;
    for (const r of rows) {
      const st = r.status || 'pending';
      if (s[st] !== undefined) s[st] += 1;
      const pct = Number(r.percent_complete);
      if (Number.isFinite(pct)) totalPct += pct;
    }
    s.avg = Number.isFinite(totalPct / rows.length) ? Math.round((totalPct / rows.length) * 10) / 10 : 0;
    return s;
  }, [rows]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ padding: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Progress</h2>
          <div style={{ color: 'var(--oc-muted-text)' }}>
            Filter and review learners' lesson progress.
          </div>
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

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="badge" style={{ marginBottom: 8 }}>Summary</div>
          <div>Pending: <strong>{summary.pending}</strong></div>
          <div>In Progress: <strong>{summary.in_progress}</strong></div>
          <div>Completed: <strong>{summary.completed}</strong></div>
          <div>Overdue: <strong>{summary.overdue}</strong></div>
          <div style={{ marginTop: 8 }}>Avg % Complete</div>
          <div style={{ height: 12, background: '#eef2ff', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--oc-border)' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, summary.avg))}%`, height: '100%', background: 'var(--oc-primary)' }} />
          </div>
          <div style={{ marginTop: 8, color: 'var(--oc-muted-text)' }}>{summary.avg}%</div>
        </div>
      </div>

      <div className="card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <div style={{ padding: '1rem' }}>Loading...</div>
        ) : loadError ? (
          <div style={{ padding: '1rem', color: 'var(--oc-error)' }}>{loadError}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--oc-muted-text)' }}>
            No progress records found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Employee</th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Lesson</th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Status</th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Percent</th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.employee_id}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.lesson_id}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.status}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 120, height: 8, background: '#eef2ff', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--oc-border)' }}>
                          <div style={{ width: `${Math.min(100, Math.max(0, Number(r.percent_complete) || 0))}%`, height: '100%', background: 'var(--oc-primary)' }} />
                        </div>
                        <span>{Number(r.percent_complete) || 0}%</span>
                      </div>
                    </td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.last_activity_at ? new Date(r.last_activity_at).toLocaleString() : ''}</td>
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
