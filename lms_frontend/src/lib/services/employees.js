import { supabase } from '../supabaseClient';

/**
 * Employees service using Supabase.
 * All functions return { data, error } and never throw to keep UI simple.
 */

// PUBLIC_INTERFACE
export async function listEmployees({ q = '', page = 1, pageSize = 10 } = {}) {
  /** List employees with simple search and pagination */
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    const search = q.trim();
    if (search) {
      // Basic ilike search across common fields
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,department.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) return { data: null, count: 0, error };
    return { data: data || [], count: count || 0, error: null };
  } catch (e) {
    return { data: null, count: 0, error: new Error('Unable to list employees') };
  }
}

// PUBLIC_INTERFACE
export async function getEmployee(id) {
  /** Fetch single employee by id */
  try {
    const { data, error } = await supabase.from('employees').select('*').eq('id', id).single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (_e) {
    return { data: null, error: new Error('Unable to fetch employee') };
  }
}

// PUBLIC_INTERFACE
export async function createEmployee(payload) {
  /** Create employee. Performs basic client-side sanitation. */
  try {
    const dataToInsert = {
      name: String(payload?.name || '').trim(),
      email: String(payload?.email || '').trim(),
      department: String(payload?.department || '').trim(),
      role: String(payload?.role || 'employee').trim(),
      status: String(payload?.status || 'active').trim()
    };
    const { data, error } = await supabase.from('employees').insert(dataToInsert).select().single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (_e) {
    return { data: null, error: new Error('Unable to create employee') };
  }
}

// PUBLIC_INTERFACE
export async function updateEmployee(id, payload) {
  /** Update employee by id */
  try {
    const dataToUpdate = {
      name: payload?.name !== undefined ? String(payload.name).trim() : undefined,
      email: payload?.email !== undefined ? String(payload.email).trim() : undefined,
      department: payload?.department !== undefined ? String(payload.department).trim() : undefined,
      role: payload?.role !== undefined ? String(payload.role).trim() : undefined,
      status: payload?.status !== undefined ? String(payload.status).trim() : undefined
    };
    Object.keys(dataToUpdate).forEach((k) => dataToUpdate[k] === undefined && delete dataToUpdate[k]);

    const { data, error } = await supabase
      .from('employees')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (_e) {
    return { data: null, error: new Error('Unable to update employee') };
  }
}

// PUBLIC_INTERFACE
export async function deleteEmployee(id) {
  /** Delete employee by id */
  try {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) return { data: null, error };
    return { data: true, error: null };
  } catch (_e) {
    return { data: null, error: new Error('Unable to delete employee') };
  }
}
