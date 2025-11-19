import { supabase } from '../supabaseClient';

/**
 * Lessons service using Supabase.
 * Returns { data, error } for each call.
 */

// PUBLIC_INTERFACE
export async function listLessons({ q = '', page = 1, pageSize = 10 } = {}) {
  /** List lessons with search/pagination */
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('lessons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    const search = q.trim();
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) return { data: null, count: 0, error };
    return { data: data || [], count: count || 0, error: null };
  } catch (_e) {
    return { data: null, count: 0, error: new Error('Unable to list lessons') };
  }
}

// PUBLIC_INTERFACE
export async function getLesson(id) {
  /** Fetch single lesson */
  try {
    const { data, error } = await supabase.from('lessons').select('*').eq('id', id).single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (_e) {
    return { data: null, error: new Error('Unable to fetch lesson') };
  }
}

// PUBLIC_INTERFACE
export async function createLesson(payload) {
  /** Create a lesson */
  try {
    const dataToInsert = {
      title: String(payload?.title || '').trim(),
      description: String(payload?.description || '').trim(),
      category: String(payload?.category || '').trim(),
      difficulty: String(payload?.difficulty || 'beginner').trim(),
      duration_minutes: Number.isFinite(Number(payload?.durationMinutes)) ? Number(payload.durationMinutes) : null,
      is_published: Boolean(payload?.isPublished)
    };
    // eslint-disable-next-line no-console
    console.debug?.('[lessons.createLesson] inserting', dataToInsert);

    const { data, error } = await supabase.from('lessons').insert(dataToInsert).select().single();
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[lessons.createLesson] insert error', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (_e) {
    // eslint-disable-next-line no-console
    console.error('[lessons.createLesson] unexpected error', _e);
    return { data: null, error: new Error('Unable to create lesson') };
  }
}

// PUBLIC_INTERFACE
export async function updateLesson(id, payload) {
  /** Update lesson by id */
  try {
    const dataToUpdate = {
      title: payload?.title !== undefined ? String(payload.title).trim() : undefined,
      description: payload?.description !== undefined ? String(payload.description).trim() : undefined,
      category: payload?.category !== undefined ? String(payload.category).trim() : undefined,
      difficulty: payload?.difficulty !== undefined ? String(payload.difficulty).trim() : undefined,
      duration_minutes:
        payload?.durationMinutes !== undefined
          ? Number.isFinite(Number(payload.durationMinutes)) ? Number(payload.durationMinutes) : null
          : undefined,
      is_published: payload?.isPublished !== undefined ? Boolean(payload.isPublished) : undefined
    };
    Object.keys(dataToUpdate).forEach((k) => dataToUpdate[k] === undefined && delete dataToUpdate[k]);

    const { data, error } = await supabase
      .from('lessons')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (_e) {
    return { data: null, error: new Error('Unable to update lesson') };
  }
}

// PUBLIC_INTERFACE
export async function deleteLesson(id) {
  /** Delete a lesson */
  try {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) return { data: null, error };
    return { data: true, error: null };
  } catch (_e) {
    return { data: null, error: new Error('Unable to delete lesson') };
  }
}
