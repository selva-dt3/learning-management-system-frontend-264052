import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/supabaseClient';
import { listLessons } from '../../lib/services/lessons';
import { listProgress } from '../../lib/services/progress';
import { ensureTablesHint, findUserIdByEmail } from '../../lib/services/supabaseHelpers';

/**
 * PUBLIC_INTERFACE
 * HRDashboard
 * Adds inline forms:
 * - Assign by Email: HR enters employee email and selects course/lesson to assign
 * - Performance snapshot: shows progress rows with simple filters
 * All operations are client-only via Supabase; shows clear policy/table errors.
 */
export default function HRDashboard() {
  const { user, role } = useAuth();
  const { notify } = useToast();

  // Assignment by email
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [courseId, setCourseId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [assignErrors, setAssignErrors] = useState({});
  const [setupHints, setSetupHints] = useState([]);

  // Mini performance
  const [perfStatus, setPerfStatus] = useState('all');
  const [perfRows, setPerfRows] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setSetupHints(await ensureTablesHint());
      const { data, error } = await listLessons({ q: '', page: 1, pageSize: 200 });
      if (!error) setLessons(data || []);
    })();
  }, []);

  const validateAssign = () => {
    const v = {};
    const email = String(assigneeEmail || '').trim();
    if (!email) v.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) v.email = 'Enter a valid email';
    if (!String(courseId).trim()) v.courseId = 'Course ID is required';
    if (!String(lessonId).trim()) v.lessonId = 'Lesson is required';
    setAssignErrors(v);
    return Object.keys(v).length === 0;
  };

  const onAssign = async (e) => {
    e.preventDefault();
    if (!validateAssign()) return;
    setAssigning(true);
    try {
      // Resolve user_id by email
      const { userId, error: mapErr } = await findUserIdByEmail(assigneeEmail);
      if (mapErr || !userId) {
        notify(mapErr?.message || 'Unable to resolve user by email', 'error');
        setAssigning(false);
        return;
      }
      const payload = {
        assignee_user_id: userId,
        course_id: String(courseId).trim(),
        lesson_id: String(lessonId).trim(),
        assigned_by: user?.id || null,
        assigned_at: new Date().toISOString(),
        status: 'pending'
      };
      const { error } = await supabase.from('assignments').insert(payload);
      if (error) {
        notify('Assignment insert blocked. Ensure RLS insert policy and schema exist (see README).', 'error');
        setAssigning(false);
        return;
      }
      setAssigneeEmail('');
      setCourseId('');
      setLessonId('');
      setAssignErrors({});
      notify('Assignment created', 'success');
    } catch (_e) {
      notify('Unable to create assignment. Verify Supabase tables and policies.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const fetchPerf = async () => {
    setPerfLoading(true);
    // eslint-disable-next-line no-console
    console.debug?.('[HRDashboard] listProgress call', { status: perfStatus });
    const { data, error } = await listProgress({ status: perfStatus, page: 1, pageSize: 10 });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[HRDashboard] listProgress error (RLS?) returning []');
      setPerfRows([]);
    } else {
      setPerfRows(data || []);
    }
    setPerfLoading(false);
  };

  useEffect(() => {
    fetchPerf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfStatus]);

  const avgPct = useMemo(() => {
    if (!perfRows.length) return 0;
    const total = perfRows.reduce((acc, r) => acc + (Number(r.percent_complete) || 0), 0);
    return Math.round((total / perfRows.length) * 10) / 10;
  }, [perfRows]);

  return (
    // Page is guarded by RoleProtectedRoute in AppRouter (hr or admin).
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        className="card"
        style={{
          padding: '1.25rem',
          background: 'var(--oc-gradient)',
          borderColor: 'var(--oc-secondary)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <div className="badge" style={{ marginBottom: 6, borderColor: 'var(--oc-secondary)' }}>
              Welcome HR
            </div>
            <h2 style={{ margin: 0 }}>HR Dashboard</h2>
            <div style={{ color: 'var(--oc-muted-text)' }}>
              {user?.email ? `Signed in as ${user.email}. ` : ''}Assign lessons and track team progress.
            </div>
          </div>
          <div className="badge" title="Your role" style={{ borderColor: 'var(--oc-secondary)', color: '#7c2d12' }}>
            Role: {role}
          </div>
        </div>
      </div>

      {setupHints.length > 0 && (
        <div className="card" style={{ padding: '0.75rem', borderColor: 'var(--oc-secondary)' }}>
          <div className="badge" style={{ marginBottom: 6 }}>Supabase Setup</div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--oc-muted-text)' }}>
            {setupHints.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="badge" style={{ marginBottom: 8 }}>Assignments</div>
          <h3 style={{ marginTop: 0 }}>Pending Assignments</h3>
          <div style={{ fontSize: 28, fontWeight: 800 }}>—</div>
          <div style={{ color: 'var(--oc-muted-text)' }}>RLS-friendly metric (placeholder)</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="badge" style={{ marginBottom: 8 }}>Progress</div>
          <h3 style={{ marginTop: 0 }}>Avg Completion</h3>
          <div style={{ height: 12, background: '#eef2ff', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--oc-border)' }}>
            <div style={{ width: `${avgPct}%`, height: '100%', background: 'var(--oc-primary)' }} />
          </div>
          <div style={{ marginTop: 8, color: 'var(--oc-muted-text)' }}>{avgPct}% across latest records</div>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/hr/assignments" className="btn">Assign Lessons</Link>
          <Link to="/hr/progress" className="btn btn-secondary">Track Progress</Link>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="badge" style={{ marginBottom: 8 }}>Assign by Email</div>
        <form onSubmit={onAssign} noValidate>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr' }}>
            <div>
              <label htmlFor="assigneeEmail" style={{ display: 'block', marginBottom: 6 }}>Employee Email</label>
              <input
                id="assigneeEmail"
                className="input"
                placeholder="employee@example.com"
                value={assigneeEmail}
                onChange={(e) => setAssigneeEmail(e.target.value)}
                aria-invalid={!!assignErrors.email}
              />
              {assignErrors.email && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{assignErrors.email}</div>}
            </div>

            <div>
              <label htmlFor="courseId" style={{ display: 'block', marginBottom: 6 }}>Course ID</label>
              <input
                id="courseId"
                className="input"
                placeholder="course uuid or code"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                aria-invalid={!!assignErrors.courseId}
              />
              {assignErrors.courseId && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{assignErrors.courseId}</div>}
            </div>

            <div>
              <label htmlFor="lessonId" style={{ display: 'block', marginBottom: 6 }}>Lesson</label>
              <select
                id="lessonId"
                className="input"
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                aria-invalid={!!assignErrors.lessonId}
              >
                <option value="">Select lesson</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
              {assignErrors.lessonId && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{assignErrors.lessonId}</div>}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn" disabled={assigning}>
                {assigning ? 'Assigning…' : 'Assign Lesson'}
              </button>
              <Link to="/hr/assignments" className="btn btn-secondary">Manage All</Link>
            </div>
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="badge" style={{ marginBottom: 8 }}>Performance Snapshot</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <select className="input" value={perfStatus} onChange={(e) => setPerfStatus(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="all">All Status</option>
            <option value="pending">pending</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
            <option value="overdue">overdue</option>
          </select>
        </div>
        {perfLoading ? (
          <div>Loading...</div>
        ) : perfRows.length === 0 ? (
          <div style={{ color: 'var(--oc-muted-text)' }}>No progress records</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>User</th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Lesson</th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Status</th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>Percent</th>
                </tr>
              </thead>
              <tbody>
                {perfRows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.user_id || r.employee_id}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.lesson_id}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{r.status}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>{Number(r.percent_complete) || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
