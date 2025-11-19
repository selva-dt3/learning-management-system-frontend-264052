 /**
  * PUBLIC_INTERFACE
  * normalizeSupabaseError
  * Converts Supabase/PostgREST error into UI-friendly string with RLS hinting.
  */
export function normalizeSupabaseError(err) {
  if (!err) return 'Unknown error';
  const msg = (err.message || String(err)).toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls') || msg.includes('not authorized')) {
    return 'Operation blocked by Row Level Security (RLS). In demo, ensure relaxed RLS or see README_RLS_TROUBLESHOOTING.md.';
  }
  if (msg.includes('duplicate key') || msg.includes('unique')) {
    return 'Duplicate detected. Please use a different value.';
  }
  if (msg.includes('foreign key')) {
    return 'Blocked by a related record constraint.';
  }
  return err.message || 'An unexpected error occurred';
}
