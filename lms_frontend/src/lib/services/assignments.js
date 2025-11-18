import { supabase } from '../supabaseClient';

/**
 * Assignments service using Supabase.
 * Table: assignments
 * Fields: id, employee_id, lesson_id, assigned_by, assigned_at, due_date, status
 * Returns { data, error } for each call. No secrets are hardcoded.
 */

// PUBLIC_INTERFACE
export async function listAssignments({ q = '', status = 'all', employeeId = '', lessonId = '', page = 1, pageSize = 10 } = {}) {
  /**
   * List assignments with basic filters and pagination.
   * Filters:
   * - q: searches employee name/email and lesson title if views/joins are available; as fallback, only filters by status
   * - status: pending|in_progress|completed|overdue|all
   * - employeeId: uuid to filter
   * - lessonId: uuid to filter
   */
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Base select: keep simple select from assignments
    let query = supabase
      .from('assignments')
      .select('*', { count: 'exact' })
      .order('assigned_at', { ascending: false })
      .range(from, to);

    if (employeeId) query = query.eq('employee_id', employeeId);
    if (lessonId) query = query.eq('lesson_id', lessonId);
    if (status && status !== 'all') query = query.eq('status', status);

    // Note: Without a view joining employees/lessons, we cannot ilike on related fields here.
    // We keep 'q' as a no-op on the base table to avoid errors (documented).
    // If a composite view is created, replace below with .or on desired fields.

    const { data, error, count } = await query;
    if (error) return { data: null, count: 0, error };
    return { data: data || [], count: count || 0, error: null };
  } catch (_e) {
    return { data: null, count: 0, error: new Error('Unable to list assignments') };
  }
}

// PUBLIC_INTERFACE
export async function getAssignment(id) {
  /** Fetch single assignment by id */
  try {
    const { data, error } = await supabase.from('assignments').select('*').eq('id', id).single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (_e) {
    return { data: null, error: new Error('Unable to fetch assignment') };
  }
}

// PUBLIC_INTERFACE
export async function createAssignment(payload) {
  /**
   * Create an assignment.
   * Required: employee_id, lesson_id, due_date (optional), status (default 'pending')
   * assigned_by is set to auth.uid() via policy or passed in payload if needed.
   */
  try {
    const dataToInsert = {
      employee_id: payload?.employee_id || payload?.employeeId || null,
      lesson_id: payload?.lesson_id || payload?.lessonId || null,
      due_date: payload?.due_date || payload?.dueDate || null,
      status: String(payload?.status || 'pending').trim()
    };
    const { data, error } = await supabase.from('assignments').insert(dataToInsert).select().single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (_e) {
    return { data: null, error: new Error('Unable to create assignment') };
  }
}

// PUBLIC_INTERFACE
export async function updateAssignment(id, payload) {
  /** Update an assignment by id */
  try {
    const dataToUpdate = {
      employee_id: payload?.employee_id !== undefined ? payload.employee_id : payload?.employeeId !== undefined ? payload.employeeId : undefined,
      lesson_id: payload?.lesson_id !== undefined ? payload.lesson_id : payload?.lessonId !== undefined ? payload.lessonId : undefined,
      due_date: payload?.due_date !== undefined ? payload.due_date : payload?.dueDate !== undefined ? payload.dueDate : undefined,
      status: payload?.status !== undefined ? String(payload.status).trim() : undefined
    };
    Object.keys(dataToUpdate).forEach((k) => dataToUpdate[k] === undefined && delete dataToUpdate[k]);

    const { data, error } = await supabase.from('assignments').update(dataToUpdate).eq('id', id).select().single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (_e) {
    return { data: null, error: new Error('Unable to update assignment') };
  }
}

// PUBLIC_INTERFACE
export async function deleteAssignment(id) {
  /** Delete an assignment by id */
  try {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) return { data: null, error };
    return { data: true, error: null };
  } catch (_e) {
    return { data: null, error: new Error('Unable to delete assignment') };
  }
}
