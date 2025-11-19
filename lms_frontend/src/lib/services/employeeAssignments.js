import { supabase } from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * getCurrentUserAssignments
 * Fetch assignments for the currently authenticated user. Relies on RLS to scope results.
 * Returns { data, error, hint }
 */
export async function getCurrentUserAssignments() {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        id, employee_id, course_id, lesson_id,
        course:courses(id, title),
        lesson:lessons(id, title, description)
      `)
      .order('id', { ascending: false });

    let hint = null;
    if (error) {
      hint = 'Ensure assignments table exists and RLS allows SELECT for the current user (employee_id = auth.uid()).';
    }
    return { data: data || [], error, hint };
  } catch (e) {
    return { data: null, error: e, hint: 'Check Supabase client configuration and network connectivity.' };
  }
}
