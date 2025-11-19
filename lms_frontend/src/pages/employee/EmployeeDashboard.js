import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentUserAssignments } from '../../lib/services/employeeAssignments';
import { getProgressByAssignmentId, upsertProgress } from '../../lib/services/progress';
import Loading from '../../components/Loading';
import { useToast } from '../../components/Toast';

/**
 * PUBLIC_INTERFACE
 * EmployeeDashboard
 * This page displays the logged-in employee's assigned courses/lessons and their progress.
 * - Authenticated access required.
 * - Renders list grouped by course with lesson entries, progress percent, and actions to update progress.
 * - Uses RLS-friendly Supabase service calls which filter by current user.
 */
const EmployeeDashboard = () => {
  const { user, roles, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [error, setError] = useState('');
  const { notify } = useToast();
  const mountedRef = useRef(true);

  const isAdminOrHr = useMemo(() => {
    const set = new Set((roles || []).map(r => r?.role || r));
    return set.has('admin') || set.has('hr');
  }, [roles]);

  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line no-console
    console.debug?.('[EmployeeDashboard] effect:start', { hasUser: !!user, authLoading });

    const abortController = new AbortController();

    async function load() {
      if (!user) {
        // eslint-disable-next-line no-console
        console.debug?.('[EmployeeDashboard] no user, skipping fetch');
        if (mountedRef.current) {
          setAssignments([]);
          setProgressMap({});
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      setError('');

      try {
        // eslint-disable-next-line no-console
        console.debug?.('[EmployeeDashboard] fetch:start assignments');
        const { data: assignmentsData, error: aErr, hint: aHint } = await getCurrentUserAssignments();

        if (abortController.signal.aborted) return;

        if (aErr) {
          // eslint-disable-next-line no-console
          console.error('[EmployeeDashboard] assignments fetch error', aErr);
          throw new Error(`${aErr}${aHint ? ` | hint: ${aHint}` : ''}`);
        }

        const items = Array.isArray(assignmentsData) ? assignmentsData : [];

        // In parallel, fetch progress for each assignment with allSettled to allow partial results
        // eslint-disable-next-line no-console
        console.debug?.('[EmployeeDashboard] fetch:start progress for assignments', { count: items.length });
        const results = await Promise.allSettled(
          items.map((a) => getProgressByAssignmentId(a.id))
        );

        if (abortController.signal.aborted) return;

        const map = {};
        results.forEach((res, idx) => {
          const a = items[idx];
          if (res.status === 'fulfilled') {
            const { data: pr, error: pErr, hint: pHint } = res.value || {};
            if (pErr) {
              map[a.id] = { percent_complete: 0, status: 'not_started', _rowError: `${pErr}${pHint ? ` | ${pHint}` : ''}` };
            } else {
              map[a.id] = pr || { percent_complete: 0, status: 'not_started' };
            }
          } else {
            map[a.id] = { percent_complete: 0, status: 'not_started', _rowError: res.reason?.message || 'progress fetch failed' };
          }
        });

        if (mountedRef.current) {
          setAssignments(items);
          setProgressMap(map);
        }
      } catch (e) {
        if (mountedRef.current) {
          setError(e.message || 'Failed to load assignments.');
          setAssignments([]); // show empty state on error
          setProgressMap({});
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          // eslint-disable-next-line no-console
          console.debug?.('[EmployeeDashboard] fetch:done');
        }
      }
    }

    if (!authLoading) {
      load();
    }

    return () => {
      abortController.abort();
      mountedRef.current = false;
    };
  }, [user, authLoading]);

  const handleUpdateProgress = async (assignmentId, nextPercent) => {
    try {
      const percent = Math.max(0, Math.min(100, Number(nextPercent)));
      const status = percent >= 100 ? 'completed' : percent > 0 ? 'in_progress' : 'not_started';

      const { error: uErr, hint } = await upsertProgress({
        assignment_id: assignmentId,
        percent_complete: percent,
        status
      });

      if (uErr) throw new Error(`${uErr}${hint ? ` | hint: ${hint}` : ''}`);

      setProgressMap(prev => ({
        ...prev,
        [assignmentId]: {
          ...(prev[assignmentId] || {}),
          percent_complete: percent,
          status
        }
      }));
      notify('Progress updated.', 'success');
    } catch (e) {
      notify(e.message || 'Failed to update progress.', 'error');
    }
  };

  // Group by course to present a cleaner view
  const grouped = useMemo(() => {
    const byCourse = {};
    for (const a of assignments) {
      const key = a.course_id || a.course?.id || 'uncategorized';
      if (!byCourse[key]) {
        byCourse[key] = {
          courseTitle: a.course?.title || a.course_title || 'Course',
          items: []
        };
      }
      byCourse[key].items.push(a);
    }
    return byCourse;
  }, [assignments]);

  // Show delayed spinner while loading auth/session or dashboard data
  if (authLoading || loading) {
    return <Loading label="Loading your dashboard..." timeoutMs={12000} troubleshooting initialDelayMs={250} />;
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Welcome</h1>
          <p className="text-gray-600">Please sign in to view your assignments and progress.</p>
          <div className="mt-4">
            <Link to="/login" className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-blue-500/10 to-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome to DT3 LMS Console</h1>
          <div className="h-px bg-gradient-to-r from-blue-500/40 to-gray-200 my-2" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-gray-900">Welcome, Employee</div>
              <p className="text-gray-600 mt-1">Track your assignments and learning progress</p>
            </div>
            {isAdminOrHr && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded">
                You have admin/hr role. Use Admin/HR dashboards for management tasks.
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Assignments</h2>
            <p className="text-gray-600">You don’t have any assigned lessons yet. Check back later.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([courseId, group]) => (
              <div key={courseId} className="bg-white rounded-xl shadow border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{group.courseTitle}</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {group.items.map((a) => {
                    const pr = progressMap[a.id] || { percent_complete: 0, status: 'not_started' };
                    return (
                      <li key={a.id} className="px-6 py-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-medium text-gray-900">{a.lesson?.title || a.lesson_title || 'Lesson'}</span>
                              {pr.status === 'completed' && (
                                <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">Completed</span>
                              )}
                              {pr._rowError && (
                                <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded" title={pr._rowError}>progress load issue</span>
                              )}
                            </div>
                            {a.lesson?.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">{a.lesson.description}</p>
                            )}
                          </div>
                          <div className="flex-1 md:max-w-md">
                            <div className="w-full bg-gray-100 rounded-full h-3">
                              <div
                                className="h-3 rounded-full bg-blue-600 transition-all"
                                style={{ width: `${pr.percent_complete || 0}%` }}
                                aria-label={`Progress ${pr.percent_complete || 0}%`}
                              />
                            </div>
                            <div className="mt-1 text-sm text-gray-600">{pr.percent_complete || 0}% complete</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              inputMode="numeric"
                              defaultValue={pr.percent_complete || 0}
                              onBlur={(e) => handleUpdateProgress(a.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleUpdateProgress(a.id, e.currentTarget.value);
                                }
                              }}
                              className="w-24 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-label="Update progress percentage"
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={Number(pr.percent_complete || 0)}
                            />
                            <button
                              onClick={() => handleUpdateProgress(a.id, 100)}
                              className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                            >
                              Mark Complete
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
