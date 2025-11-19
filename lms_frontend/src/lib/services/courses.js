import { supabase } from '../supabaseClient';

/**
 * Courses service
 * Lightweight helpers to list and update courses with actionable error messages.
 */

function actionableError(prefix, error) {
  const msg = error?.message || String(error);
  const hints = [];
  if (/permission|policy|rls/i.test(msg)) {
    hints.push('Check RLS policies on "courses" table.');
  }
  if (/relation .* does not exist|table .* not found/i.test(msg)) {
    hints.push('Ensure the "courses" table exists in Supabase.');
  }
  return new Error(`${prefix}: ${msg}${hints.length ? ' • ' + hints.join(' ') : ''}`);
}

// PUBLIC_INTERFACE
export async function getCourses({ limit = 50, offset = 0, search = '' } = {}) {
  /** List courses with pagination and search. */
  try {
    let query = supabase
      .from('courses')
      .select('id,name,description,created_at,updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (search) {
      // try both title and name depending on schema
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    const { data, count, error } = await query;
    if (error) throw actionableError('Failed to fetch courses', error);
    return { data: data || [], count: count || 0 };
  } catch (err) {
    return { data: null, count: 0, error: err };
  }
}

// PUBLIC_INTERFACE
export async function updateCourse(id, updates) {
  /** Update a course by id and return the updated row. */
  try {
    const { data, error } = await supabase.from('courses').update(updates).eq('id', id).select().single();
    if (error) throw actionableError('Failed to update course', error);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}
