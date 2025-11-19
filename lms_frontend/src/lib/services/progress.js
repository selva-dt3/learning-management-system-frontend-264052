import { supabase } from '../supabaseClient';

/**
 * Progress service using Supabase.
 * Table: progress
 * Fields: id, employee_id, lesson_id, status, percent_complete, last_activity_at, notes
 * Returns { data, error } for each call.
 */

// PUBLIC_INTERFACE
export async function listProgress({ employeeId = '', lessonId = '', status = 'all', page = 1, pageSize = 10 } = {}) {
  /**
   * List progress records with filters and pagination.
   */
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('progress')
      .select('*', { count: 'exact' })
      .order('last_activity_at', { ascending: false })
      .range(from, to);

    if (employeeId) query = query.eq('employee_id', employeeId);
    if (lessonId) query = query.eq('lesson_id', lessonId);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) return { data: null, count: 0, error };
    return { data: data || [], count: count || 0, error: null };
  } catch (_e) {
    return { data: null, count: 0, error: new Error('Unable to list progress') };
  }
}

/**
 * PUBLIC_INTERFACE
 * getProgressByAssignmentId
 * Fetch progress by assignment id if the schema links progress to assignment_id.
 * If your schema uses user_id + lesson_id, adapt EmployeeDashboard to call listProgress or another helper.
 */
export async function getProgressByAssignmentId(assignmentId) {
  try {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('assignment_id', assignmentId)
      .maybeSingle();
    if (error) return { data: null, error, hint: 'Ensure progress table has assignment_id and RLS allows SELECT.' };
    return { data, error: null, hint: null };
  } catch (_e) {
    return { data: null, error: new Error('Unable to fetch progress for assignment'), hint: null };
  }
}

// PUBLIC_INTERFACE
export async function upsertProgress(payload) {
  /**
   * Upsert progress row for employee_id + lesson_id.
   * Accepts: employee_id, lesson_id, status, percent_complete, last_activity_at, notes
   */
  try {
    const dataToUpsert = {
      employee_id: payload?.employee_id || payload?.employeeId || null,
      lesson_id: payload?.lesson_id || payload?.lessonId || null,
      status: payload?.status ? String(payload.status).trim() : null,
      percent_complete: Number.isFinite(Number(payload?.percent_complete ?? payload?.percentComplete))
        ? Number(payload?.percent_complete ?? payload?.percentComplete)
        : null,
      last_activity_at: payload?.last_activity_at || payload?.lastActivityAt || new Date().toISOString(),
      notes: payload?.notes ?? null
    };

    const { data, error } = await supabase
      .from('progress')
      .upsert(dataToUpsert, { onConflict: 'employee_id,lesson_id' })
      .select()
      .single();

    if (error) return { data: null, error };
    return { data, error: null };
  } catch (_e) {
    return { data: null, error: new Error('Unable to upsert progress') };
  }
}
