import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listLessons, deleteLesson, updateLesson } from '../../../lib/services/lessons';
import { useToast } from '../../../components/Toast';

/**
 * PUBLIC_INTERFACE
 * LessonsListPage lists lessons with search, client-side sort/filter, pagination, inline edits, and actions.
 */
export default function LessonsListPage() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [sortKey, setSortKey] = useState(searchParams.get('sort') || 'created_at');
  const [sortDir, setSortDir] = useState(searchParams.get('dir') || 'desc');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count]);

  useEffect(() => {
    setSearchParams((sp) => {
      const next = new URLSearchParams(sp);
      q ? next.set('q', q) : next.delete('q');
      typeFilter && typeFilter !== 'all' ? next.set('type', typeFilter) : next.delete('type');
      next.set('sort', sortKey);
      next.set('dir', sortDir);
      next.set('page', String(page));
      return next;
    });
  }, [q, page, sortKey, sortDir, typeFilter, setSearchParams]);

  const fetchRows = async () => {
    setLoading(true);
    setLoadError('');
    const { data, count: total, error } = await listLessons({ q, page, pageSize });
    if (error) {
      setLoadError('Unable to load lessons. If the table is missing, create it in Supabase.');
      setRows([]);
      setCount(0);
    } else {
      setRows(data || []);
      setCount(total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  const onDelete = async (id, assetUrl) => {
    const ok = window.confirm('Delete this lesson? This will also detach associated asset references.');
    if (!ok) return;
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== id)); // optimistic
    const { error } = await deleteLesson(id);
    if (error) {
      notify('Delete failed. Check RLS policies.', 'error');
      setRows(prev);
    } else {
      notify('Lesson deleted', 'success');
      // Note: Actual file removal from Storage must be handled server-side or via a privileged function.
      fetchRows();
    }
  };

  const onHeaderSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedFilteredRows = useMemo(() => {
    let data = [...rows];
    if (typeFilter !== 'all') {
      data = data.filter((r) => (r.type || r.content_type) === typeFilter);
    }
    const k = sortKey;
    const dir = sortDir === 'asc' ? 1 : -1;
    data.sort((a, b) => {
      const av = (a[k] ?? '').toString().toLowerCase();
      const bv = (b[k] ?? '').toString().toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return data;
  }, [rows, sortKey, sortDir, typeFilter]);

  const InlineEditable = ({ value, onSave, ariaLabel }) => {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value || '');
    const [busy, setBusy] = useState(false);

    const handleSave = async () => {
      setBusy(true);
      const ok = await onSave(val);
      setBusy(false);
      if (ok) setEditing(false);
    };

    return (
      <div>
        {editing ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="input"
              aria-label={ariaLabel}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
              autoFocus
            />
            <button className="btn btn-secondary" type="button" onClick={() => setEditing(false)} disabled={busy}>Cancel</button>
            <button className="btn" type="button" onClick={handleSave} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        ) : (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${ariaLabel}`}
          >
            {value || '—'}
          </button>
        )}
      </div>
    );
  };

  const InlineSelect = ({ value, onSave, ariaLabel, options }) => {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value || options[0]?.value);
    const [busy, setBusy] = useState(false);

    const handleSave = async () => {
      setBusy(true);
      const ok = await onSave(val);
      setBusy(false);
      if (ok) setEditing(false);
    };

    return (
      <div>
        {editing ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              className="input"
              aria-label={ariaLabel}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
              autoFocus
            >
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button className="btn btn-secondary" type="button" onClick={() => setEditing(false)} disabled={busy}>Cancel</button>
            <button className="btn" type="button" onClick={handleSave} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        ) : (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${ariaLabel}`}
          >
            {value || '—'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Lessons</h2>
            <div style={{ color: 'var(--oc-muted-text)' }}>
              Create and manage lessons. Use column headers to sort. Press Enter to save inline edits, Esc to cancel.
            </div>
          </div>
          <Link to="/admin/lessons/new" className="btn">Add New</Link>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Search lessons..."
            aria-label="Search lessons"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            style={{ flex: '2 1 260px' }}
          />
          <select
            className="input"
            aria-label="Filter by type"
            value={typeFilter}
            onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }}
            style={{ flex: '1 1 180px' }}
          >
            <option value="all">All types</option>
            <option value="pdf">pdf</option>
            <option value="video">video</option>
            <option value="link">link</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <div style={{ padding: '1rem' }}>Loading...</div>
        ) : loadError ? (
          <div style={{ padding: '1rem', color: 'var(--oc-error)' }}>{loadError}</div>
        ) : sortedFilteredRows.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--oc-muted-text)' }}>No lessons found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th tabIndex={0} onClick={() => onHeaderSort('title')} onKeyDown={(e) => e.key === 'Enter' && onHeaderSort('title')} style={{ padding: 10, borderBottom: '1px solid var(--oc-border)', cursor: 'pointer' }}>
                    Title {sortKey === 'title' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th tabIndex={0} onClick={() => onHeaderSort('type')} onKeyDown={(e) => e.key === 'Enter' && onHeaderSort('type')} style={{ padding: 10, borderBottom: '1px solid var(--oc-border)', cursor: 'pointer' }}>
                    Type {sortKey === 'type' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th tabIndex={0} onClick={() => onHeaderSort('created_at')} onKeyDown={(e) => e.key === 'Enter' && onHeaderSort('created_at')} style={{ padding: 10, borderBottom: '1px solid var(--oc-border)', cursor: 'pointer' }}>
                    Created {sortKey === 'created_at' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }} />
                </tr>
              </thead>
              <tbody>
                {sortedFilteredRows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>
                      <InlineEditable
                        value={r.title}
                        ariaLabel="lesson title"
                        onSave={async (val) => {
                          const prev = rows;
                          setRows((rs) => rs.map(x => x.id === r.id ? { ...x, title: val } : x));
                          const { error } = await updateLesson(r.id, { title: val });
                          if (error) {
                            notify('Failed to update title', 'error');
                            setRows(prev);
                            return false;
                          }
                          notify('Title updated', 'success');
                          return true;
                        }}
                      />
                      <div style={{ color: 'var(--oc-muted-text)', marginTop: 4 }}>
                        <InlineEditable
                          value={r.description}
                          ariaLabel="lesson description"
                          onSave={async (val) => {
                            const prev = rows;
                            setRows((rs) => rs.map(x => x.id === r.id ? { ...x, description: val } : x));
                            const { error } = await updateLesson(r.id, { description: val });
                            if (error) {
                              notify('Failed to update description', 'error');
                              setRows(prev);
                              return false;
                            }
                            notify('Description updated', 'success');
                            return true;
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>
                      <InlineSelect
                        value={r.type}
                        ariaLabel="lesson type"
                        options={[{ value: 'pdf', label: 'pdf' }, { value: 'video', label: 'video' }, { value: 'link', label: 'link' }]}
                        onSave={async (val) => {
                          const prev = rows;
                          setRows((rs) => rs.map(x => x.id === r.id ? { ...x, type: val } : x));
                          const { error } = await updateLesson(r.id, { type: val });
                          if (error) {
                            notify('Failed to update type', 'error');
                            setRows(prev);
                            return false;
                          }
                          notify('Type updated', 'success');
                          return true;
                        }}
                      />
                    </td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: 10, borderBottom: '1px solid var(--oc-border)', textAlign: 'right' }}>
                      <button className="btn btn-secondary" onClick={() => navigate(`/admin/lessons/${r.id}`)}>View/Edit</button>{' '}
                      <button className="btn" style={{ background: 'var(--oc-error)' }} onClick={() => onDelete(r.id, r.asset_url)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem' }}>
              <div className="badge">Total: {count}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <div className="badge">Page {page} / {totalPages}</div>
                <button
                  className="btn btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
