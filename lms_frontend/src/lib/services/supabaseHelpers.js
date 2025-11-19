import { supabase } from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * uploadLessonAsset
 * Uploads a File to Supabase Storage bucket 'lesson-assets' under a namespaced path.
 * Returns { publicUrl, error }.
 */
export async function uploadLessonAsset(file, pathPrefix = 'lessons') {
  if (!(file instanceof File)) {
    return { publicUrl: null, error: new Error('Invalid file selected') };
  }
  try {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${pathPrefix}/${fileName}`;

    // Ensure bucket exists (will fail with 404 if not). We cannot create bucket from anon key; guide user via error.
    const { data: listTest, error: listErr } = await supabase.storage.from('lesson-assets').list('', { limit: 1 });
    if (listErr) {
      // eslint-disable-next-line no-console
      console.warn('[uploadLessonAsset] bucket list failed', listErr?.message);
      return {
        publicUrl: null,
        error: new Error("Storage bucket 'lesson-assets' not found or inaccessible. Create it and ensure read access."),
      };
    }

    const { data, error } = await supabase.storage
      .from('lesson-assets')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    // eslint-disable-next-line no-console
    console.debug?.('[uploadLessonAsset] upload result', { path, error: error?.message, dataPath: data?.path });

    if (error) {
      return { publicUrl: null, error };
    }
    const { data: pub } = supabase.storage.from('lesson-assets').getPublicUrl(data.path);

    // eslint-disable-next-line no-console
    console.debug?.('[uploadLessonAsset] public URL', { publicUrl: pub?.publicUrl });

    if (!pub?.publicUrl) {
      return {
        publicUrl: null,
        error: new Error("Public URL not available. Make bucket public or use signed URL approach."),
      };
    }
    return { publicUrl: pub.publicUrl, error: null };
  } catch (_e) {
    // eslint-disable-next-line no-console
    console.error('[uploadLessonAsset] unexpected error', _e);
    return { publicUrl: null, error: new Error('Upload failed. Verify Storage configuration and policies.') };
  }
}

/**
 * PUBLIC_INTERFACE
 * ensureTablesHint
 * Performs a very lightweight select to detect if core tables exist and return human-friendly hints.
 * Returns an array of warning strings (empty when all basic checks pass).
 */
export async function ensureTablesHint() {
  const warnings = [];
  // Try reading basic metadata from tables; do not throw
  const checks = [
    { table: 'courses', columns: 'id' },
    { table: 'lessons', columns: 'id,title,type' },
    { table: 'assignments', columns: 'id,assignee_user_id' },
    { table: 'progress', columns: 'id,user_id' },
  ];

  for (const c of checks) {
    // eslint-disable-next-line no-await-in-loop
    const { error } = await supabase.from(c.table).select(c.columns).limit(1);
    if (error) {
      warnings.push(`Supabase table missing or RLS blocked: ${c.table}. See README → Supabase SQL section.`);
    }
  }

  // Storage bucket check happens on upload; still add general hint
  try {
    const { error: listErr } = await supabase.storage.from('lesson-assets').list('', { limit: 1 });
    if (listErr) {
      warnings.push("Supabase Storage bucket missing: 'lesson-assets'. Create it and make it public or add a read policy.");
    }
  } catch {
    warnings.push("Supabase Storage bucket check failed for 'lesson-assets'.");
  }

  return warnings;
}

/**
 * PUBLIC_INTERFACE
 * findUserIdByEmail
 * Attempts to find auth.users id by email using PostgREST RPC or public table mirror if available.
 * - By default, selects from a likely 'employees' table to map email to an internal user id column if present.
 * Returns { userId, error }.
 */
export async function findUserIdByEmail(email) {
  const trimmed = String(email || '').trim().toLowerCase();
  if (!trimmed) return { userId: null, error: new Error('Email is required') };

  // Preferred: employees table that stores mapping to user_id (uuid) and email
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id, user_id, email')
      .ilike('email', trimmed)
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      return { userId: (data.user_id || data.id) ?? null, error: null };
    }
  } catch (_e) {
    // ignore
  }

  // Last resort: assume assignments can store assignee by email in a dedicated column if schema allows (not in provided schema)
  return { userId: null, error: new Error('Unable to resolve user by email. Ensure employees table has user_id mapping or adjust policies.') };
}
