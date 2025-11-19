import { supabase } from '../supabaseClient';
import { handlePostgrestError } from './supabaseHelpers';
import { normalizeSupabaseError } from './errorUtils';

/**
 * PUBLIC_INTERFACE
 * List all courses for admin view.
 * @returns {Promise<{data: any[]|null, error: string|null}>}
 */
export async function listCourses() {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, name, description, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handlePostgrestError(err) };
  }
}

/**
 * PUBLIC_INTERFACE
 * Create a course.
 * @param {{name: string, description?: string}} payload
 */
export async function createCourse(payload) {
  try {
    const insertObj = {
      name: (payload.name || '').trim(),
      description: (payload.description || '').trim(),
    };
    const { data, error } = await supabase
      .from('courses')
      .insert(insertObj)
      .select('id, name, description, created_at')
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handlePostgrestError(err) };
  }
}

/**
 * PUBLIC_INTERFACE
 * Update a course by id.
 * @param {number|string} id
 * @param {{name?: string, description?: string}} payload
 */
export async function updateCourse(id, payload) {
  try {
    const updateObj = {};
    if (typeof payload.name === 'string') updateObj.name = payload.name.trim();
    if (typeof payload.description === 'string') updateObj.description = payload.description.trim();

    const { data, error } = await supabase
      .from('courses')
      .update(updateObj)
      .eq('id', id)
      .select('id, name, description, created_at')
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handlePostgrestError(err) };
  }
}

/**
 * PUBLIC_INTERFACE
 * Delete a course by id.
 * @param {number|string} id
 */
export async function deleteCourse(id) {
  try {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (err) {
    return { data: null, error: handlePostgrestError(err) };
  }
}

/**
 * PUBLIC_INTERFACE
 * Get one course with lessons for admin view. Gracefully handle missing order_index.
 * @param {number|string} id
 */
export async function getCourseWithLessons(id) {
  try {
    // First try with order_index select
    let { data, error } = await supabase
      .from('courses')
      .select(`
        id, name, description, created_at,
        lessons:lessons(
          id, title, summary, created_at, order_index
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    const lessons = Array.isArray(data?.lessons) ? data.lessons : [];

    // Sort by order_index if exists else fallback to created_at
    const haveOrderIndex = lessons.some((l) => typeof l?.order_index === 'number');
    const sorted = [...lessons].sort((a, b) => {
      if (haveOrderIndex) {
        const ai = typeof a.order_index === 'number' ? a.order_index : Number.MAX_SAFE_INTEGER;
        const bi = typeof b.order_index === 'number' ? b.order_index : Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return { data: { ...data, lessons: sorted, haveOrderIndex }, error: null };
  } catch (err) {
    // In case selecting order_index causes problem, retry without it
    try {
      let { data } = await supabase
        .from('courses')
        .select(`
          id, name, description, created_at,
          lessons:lessons(
            id, title, summary, created_at
          )
        `)
        .eq('id', id)
        .single();

      const lessons = Array.isArray(data?.lessons) ? data.lessons : [];
      const sorted = [...lessons].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      return {
        data: { ...data, lessons: sorted, haveOrderIndex: false },
        error: null,
      };
    } catch (fallbackErr) {
      return { data: null, error: handlePostgrestError(fallbackErr || err) };
    }
  }
}

/**
 * PUBLIC_INTERFACE
 * Batch update lesson order using order_index.
 * If RLS prevents writes, returns an RLS message.
 * @param {Array<{id: number|string, order_index: number}>} updates
 */
export async function updateLessonsOrder(updates) {
  if (!Array.isArray(updates) || updates.length === 0) {
    return { data: true, error: null };
  }

  try {
    // Supabase upsert for each record (requires pk or unique)
    // We'll do multiple updates in a single rpc where possible; otherwise loop client-side.
    const payloads = updates.map((u) => ({ id: u.id, order_index: u.order_index }));
    // Try batch update using PostgREST prefer: resolution=merge-duplicates emulation with upsert
    // Not all schemas allow upsert; fallback to per-item update
    const { error } = await supabase.from('lessons').upsert(payloads, { onConflict: 'id' });
    if (error) throw error;

    return { data: true, error: null };
  } catch (err) {
    // If upsert blocked, fallback to per-item updates to isolate error
    try {
      for (const u of updates) {
        const { error } = await supabase.from('lessons').update({ order_index: u.order_index }).eq('id', u.id);
        if (error) throw error;
      }
      return { data: true, error: null };
    } catch (err2) {
      const msg = handlePostgrestError(err2 || err);
      return { data: null, error: msg };
    }
  }
}
