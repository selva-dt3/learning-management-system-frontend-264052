import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/Toast';
import { uploadLessonAsset, ensureTablesHint } from '../../lib/services/supabaseHelpers';
import { seedDemoData } from '../../lib/services/seeding';

/**
 * PUBLIC_INTERFACE
 * AdminDashboard
 * - Quick-create Lesson form aligned with requested schema:
 *   courseId, title, description, contentType [pdf|video|link], file/link_url, optional resources
 *   File uploads to Supabase Storage for asset_url
 *   Persists metadata to lessons table
 * - Admin-only "Seed Demo Data" utility to populate courses, lessons, assignments, and optional progress.
 *   Uses idempotent UPSERTs. Shows actionable errors if schema missing or RLS blocks.
 * - Quick links to Admin sections including new Courses section.
 */
export default function AdminDashboard() {
  // eslint-disable-next-line no-console
  console.debug?.('[AdminDashboard] render');
  const { user, role } = useAuth();
  const { notify } = useToast();
  const isAdmin = role === 'admin' || role === 'superadmin';

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    courseId: '',
    title: '',
    description: '',
    contentType: 'pdf', // pdf | video | link
    linkUrl: '',
    file: null,
    resources: ''
  });
  const [validation, setValidation] = useState({});
  const [hints, setHints] = useState([]);

  // Seed panel state
  const [seedEmails, setSeedEmails] = useState('');
  const [seedIncludeProgress, setSeedIncludeProgress] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line no-console
        console.debug?.('[AdminDashboard] ensureTablesHint:start');
        const w = await ensureTablesHint();
        if (!cancelled) setHints(w);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[AdminDashboard] ensureTablesHint:error', e?.message);
        if (!cancelled) setHints([]);
      } finally {
        // eslint-disable-next-line no-console
        console.debug?.('[AdminDashboard] ensureTablesHint:done');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, file: f }));
    if (f) {
      // immediate lightweight validation feedback
      const name = f.name.toLowerCase();
      const sizeMB = f.size / (1024 * 1024);
      const v = {};
      if (form.contentType === 'pdf' && !name.endsWith('.pdf')) v.file = 'Upload a .pdf file';
      if (form.contentType === 'video' && !(/\.(mp4|webm|mov|m4v)$/i.test(name))) v.file = 'Upload a video file (mp4, webm, mov, m4v)';
      if (sizeMB > 50) v.file = 'File too large (max 50MB)';
      setValidation((prev) => ({ ...prev, ...v }));
    }
  };

  const validate = () => {
    const v = {};
    if (!String(form.courseId).trim()) v.courseId = 'Course ID is required';
    if (!String(form.title).trim()) v.title = 'Title is required';
    if (!String(form.contentType).trim()) v.contentType = 'Content type is required';
    if (form.contentType === 'link') {
      const url = String(form.linkUrl || '').trim();
      if (!url) v.linkUrl = 'Link URL is required for link content type';
      else if (!/^https?:\/\/\S+$/i.test(url)) v.linkUrl = 'Provide a valid http(s) URL';
    } else {
      if (!(form.file instanceof File)) v.file = 'Please select a file to upload';
      else {
        const name = form.file.name.toLowerCase();
        const sizeMB = form.file.size / (1024 * 1024);
        if (form.contentType === 'pdf' && !name.endsWith('.pdf')) v.file = 'Upload a .pdf file';
        if (form.contentType === 'video' && !(/\.(mp4|webm|mov|m4v)$/i.test(name))) v.file = 'Upload a video file (mp4, webm, mov, m4v)';
        if (sizeMB > 50) v.file = 'File too large (max 50MB)';
      }
    }
    setValidation(v);
    return Object.keys(v).length === 0;
  };

  const onCreateLesson = async (e) => {
    e.preventDefault();

    // Temporary console diagnostics
    // eslint-disable-next-line no-console
    console.debug?.('[AdminDashboard] onCreateLesson:submit', {
      courseId: form.courseId,
      title: form.title,
      contentType: form.contentType,
      hasFile: !!form.file,
      linkUrl: form.linkUrl,
      user: user?.id ? 'authenticated' : 'anonymous',
    });

    if (!validate()) {
      // eslint-disable-next-line no-console
      console.debug?.('[AdminDashboard] onCreateLesson:validate failed', { validation });
      return;
    }

    try {
      setCreating(true);

      // Guard unauthenticated writes if RLS most likely requires auth
      if (!user) {
        notify('Authentication required to create lessons. Please sign in.', 'error');
        // eslint-disable-next-line no-console
        console.warn('[AdminDashboard] blocked write: unauthenticated user');
        return;
      }

      let assetUrl = null;
      let linkUrl = null;

      if (form.contentType === 'link') {
        linkUrl = String(form.linkUrl || '').trim();
      } else if (form.file instanceof File) {
        const { publicUrl, error: upErr } = await uploadLessonAsset(form.file, `lessons/${form.courseId}`);
        // eslint-disable-next-line no-console
        console.debug?.('[AdminDashboard] storage.upload result', { publicUrl, upErr: upErr?.message });
        if (upErr) {
          notify(upErr.message || 'Upload failed', 'error');
          return;
        }
        assetUrl = publicUrl;
      }

      const resourcesArray = String(form.resources || '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);

      const payload = {
        course_id: String(form.courseId).trim(),
        title: String(form.title).trim(),
        description: String(form.description || '').trim(),
        type: form.contentType,
        asset_url: assetUrl,
        link_url: linkUrl,
        resources: resourcesArray.length ? resourcesArray : null,
        created_by: user?.id || null,
        // created_at will be set by DB default if present; send only if needed
      };

      // Log payload (non-sensitive only)
      // eslint-disable-next-line no-console
      console.debug?.('[AdminDashboard] inserting lesson payload', {
        ...payload,
        resources: Array.isArray(payload.resources) ? `[${payload.resources.length}]` : null,
      });

      const { data: inserted, error } = await supabase.from('lessons').insert(payload).select().maybeSingle();

      if (error) {
        // eslint-disable-next-line no-console
        console.error('[AdminDashboard] Supabase insert error', error);
        const msg = error?.message || 'Insert failed';
        // Surface RLS guidance without weakening policies
        notify(
          `Create failed: ${msg}. If this is an RLS issue, ensure policies allow authenticated inserts for your role.`,
          'error'
        );
        return;
      }

      // eslint-disable-next-line no-console
      console.debug?.('[AdminDashboard] insert success', { id: inserted?.id });

      // Reset form on success, give feedback, and optionally trigger refresh by navigating or emitting event.
      setForm({
        courseId: '',
        title: '',
        description: '',
        contentType: 'pdf',
        linkUrl: '',
        file: null,
        resources: ''
      });
      setValidation({});
      notify('Lesson created', 'success');

      // If a lessons list is mounted elsewhere, you may navigate or trigger a signal.
      // For now, provide a friendly nudge via toast.
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[AdminDashboard] onCreateLesson unexpected error', err);
      notify('Unable to create lesson. Verify Supabase tables, RLS, and storage configuration.', 'error');
    } finally {
      setCreating(false);
      // eslint-disable-next-line no-console
      console.debug?.('[AdminDashboard] onCreateLesson:done');
    }
  };

  const onSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const emails = seedEmails
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const res = await seedDemoData({ userEmails: emails, includeProgress: seedIncludeProgress });
      setSeedResult(res);
      if (res.errors?.length) {
        notify(`Seed failed: ${res.errors[0]}`, 'error');
      } else {
        notify(
          `Seeded: courses ${res.coursesInserted}, lessons ${res.lessonsInserted}, assignments ${res.assignmentsInserted}${
            seedIncludeProgress ? `, progress ${res.progressInserted}` : ''
          }`,
          'success'
        );
      }
      if (res.warnings?.length) {
        // eslint-disable-next-line no-console
        console.warn('[Seed warnings]', res.warnings);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Seed error]', e);
      notify('Unexpected error during seeding. See console.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        className="card"
        style={{
          padding: '1.25rem',
          background: 'var(--oc-gradient)',
          borderColor: 'var(--oc-primary)',
        }}
      >
        {/* Global console heading */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 800, color: 'var(--oc-text)' }}>
              Welcome to DT3 LMS Console
            </h1>
            <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(37,99,235,0.35), rgba(229,231,235,0.5))', marginTop: 8, marginBottom: 8 }} />
            <div className="badge" style={{ borderColor: 'var(--oc-primary)' }}>
              Welcome Admin
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>Admin Dashboard</div>
            <div style={{ color: 'var(--oc-muted-text)' }}>
              {user?.email ? `Signed in as ${user.email}. ` : ''}Manage platform settings and content.
            </div>
          </div>
          <div className="badge" title="Your role" style={{ borderColor: 'var(--oc-primary)', color: '#0f172a' }}>
            Role: {role}
          </div>
        </div>

        {!user && (
          <div style={{ marginTop: 4, color: '#7c2d12', background: '#fffbeb', border: '1px solid #fde68a', padding: '8px 12px', borderRadius: 8 }}>
            Admin page is public. For actions that write to Supabase (e.g., create lessons, seed data), authentication and proper RLS policies are still required. Consider adjusting RLS or moving writes to a backend with a service role.
          </div>
        )}
      </div>

      {hints.length > 0 && (
        <div className="card" style={{ padding: '0.75rem', borderColor: 'var(--oc-secondary)' }}>
          <div className="badge" style={{ marginBottom: 6 }}>Supabase Setup</div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--oc-muted-text)' }}>
            {hints.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}

      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/admin/employees" className="btn">Manage Employees</Link>
          <Link to="/admin/lessons" className="btn btn-secondary">Manage Lessons</Link>
          <Link to="/admin/courses" className="btn btn-secondary">Manage Courses</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="badge" style={{ marginBottom: 8 }}>Users</div>
          <h3 style={{ marginTop: 0 }}>Total Employees</h3>
          <div style={{ fontSize: 28, fontWeight: 800 }}>—</div>
          <div style={{ color: 'var(--oc-muted-text)' }}>RLS-friendly metric (placeholder)</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="badge" style={{ marginBottom: 8 }}>Courses</div>
          <h3 style={{ marginTop: 0 }}>Published Lessons</h3>
          <div style={{ fontSize: 28, fontWeight: 800 }}>—</div>
          <div style={{ color: 'var(--oc-muted-text)' }}>RLS-friendly metric (placeholder)</div>
        </div>
      </div>

      {isAdmin && (
        <div
          className="card"
          style={{
            padding: '1.25rem',
            borderColor: 'rgba(37,99,235,0.35)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
            <div>
              <div className="badge" style={{ marginBottom: 8, borderColor: 'var(--oc-primary)' }}>Developer</div>
              <h3 style={{ margin: 0 }}>Seed Demo Data</h3>
              <p style={{ color: 'var(--oc-muted-text)', marginTop: 6 }}>
                Inserts sample courses, lessons, and assignments. Safe to run multiple times (idempotent).
              </p>
            </div>
            <a
              href="README_RLS_TROUBLESHOOTING.md"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              title="Row Level Security help"
            >
              RLS Help
            </a>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#111827' }}>
              Target user emails (comma-separated, optional)
            </label>
            <input
              type="text"
              className="input"
              placeholder="admin@demo.com, hr@demo.com, employee@demo.com"
              value={seedEmails}
              onChange={(e) => setSeedEmails(e.target.value)}
            />
            <small style={{ color: 'var(--oc-muted-text)' }}>
              If omitted, the tool attempts to find users in a demo domain (%.demo.com) from a profiles/users table.
            </small>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#111827' }}>
              <input
                type="checkbox"
                checked={seedIncludeProgress}
                onChange={(e) => setSeedIncludeProgress(e.target.checked)}
              />
              Seed example progress
            </label>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onSeed}
              disabled={seeding}
              className="btn"
              title="Insert demo courses, lessons, assignments"
            >
              {seeding ? 'Seeding…' : 'Seed Demo Data'}
            </button>
          </div>

          {seedResult && (
            <div
              style={{
                marginTop: '1rem',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '0.75rem',
                color: '#111827',
              }}
            >
              <div><strong>Results</strong></div>
              <div>Courses: {seedResult.coursesInserted}</div>
              <div>Lessons: {seedResult.lessonsInserted}</div>
              <div>Assignments: {seedResult.assignmentsInserted}</div>
              {seedIncludeProgress && <div>Progress: {seedResult.progressInserted}</div>}
              {seedResult.warnings?.length > 0 && (
                <div style={{ marginTop: '0.5rem', color: 'var(--oc-muted-text)' }}>
                  Warnings:
                  <ul>
                    {seedResult.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
              {seedResult.errors?.length > 0 && (
                <div style={{ marginTop: '0.5rem', color: '#EF4444' }}>
                  Errors:
                  <ul>
                    {seedResult.errors.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '0.75rem', color: 'var(--oc-muted-text)' }}>
            Note: If tables are missing or RLS prevents inserts, see the README and README_RLS_TROUBLESHOOTING.md.
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '1.25rem', maxWidth: 900 }}>
        <div style={{ marginBottom: 8 }}>
          <div className="badge" style={{ marginBottom: 8 }}>Create Lesson</div>
          <h3 style={{ margin: 0 }}>New Lesson</h3>
          <p style={{ color: 'var(--oc-muted-text)', marginTop: 6 }}>
            Upload PDFs or Videos to Supabase Storage or provide a Link. Metadata is saved to the lessons table.
          </p>
        </div>

        <form onSubmit={onCreateLesson} noValidate>
          {!user && (
            <div style={{ marginBottom: 8, color: '#7c2d12', background: '#fffbeb', border: '1px solid #fde68a', padding: '8px 12px', borderRadius: 8 }}>
              You are not signed in. Creating a lesson requires authentication and appropriate Supabase RLS policies.
            </div>
          )}
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr' }}>
            <div>
              <label htmlFor="courseId" style={{ display: 'block', marginBottom: 6 }}>Course ID</label>
              <input
                id="courseId"
                className="input"
                placeholder="course uuid or code"
                value={form.courseId}
                onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                aria-invalid={!!validation.courseId}
              />
              {validation.courseId && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{validation.courseId}</div>}
            </div>

            <div>
              <label htmlFor="title" style={{ display: 'block', marginBottom: 6 }}>Title</label>
              <input
                id="title"
                className="input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                aria-invalid={!!validation.title}
              />
              {validation.title && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{validation.title}</div>}
            </div>

            <div>
              <label htmlFor="description" style={{ display: 'block', marginBottom: 6 }}>Description</label>
              <textarea
                id="description"
                className="input"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="contentType" style={{ display: 'block', marginBottom: 6 }}>Content Type</label>
              <select
                id="contentType"
                className="input"
                value={form.contentType}
                onChange={(e) => setForm((f) => ({ ...f, contentType: e.target.value }))}
                aria-invalid={!!validation.contentType}
              >
                <option value="pdf">pdf</option>
                <option value="video">video</option>
                <option value="link">link</option>
              </select>
              {validation.contentType && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{validation.contentType}</div>}
            </div>

            {form.contentType === 'link' ? (
              <div>
                <label htmlFor="linkUrl" style={{ display: 'block', marginBottom: 6 }}>Link URL</label>
                <input
                  id="linkUrl"
                  className="input"
                  placeholder="https://..."
                  value={form.linkUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                  aria-invalid={!!validation.linkUrl}
                />
                {validation.linkUrl && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{validation.linkUrl}</div>}
              </div>
            ) : (
              <div>
                <label htmlFor="file" style={{ display: 'block', marginBottom: 6 }}>
                  {form.contentType === 'pdf' ? 'PDF file' : 'Video file'}
                </label>
                <input
                  id="file"
                  type="file"
                  className="input"
                  accept={form.contentType === 'pdf' ? '.pdf' : 'video/*,.mp4,.mov,.webm,.m4v'}
                  onChange={onFileChange}
                  aria-invalid={!!validation.file}
                />
                {validation.file && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{validation.file}</div>}
              </div>
            )}

            <div>
              <label htmlFor="resources" style={{ display: 'block', marginBottom: 6 }}>Resources (optional)</label>
              <input
                id="resources"
                className="input"
                placeholder="Comma-separated URLs (https://link1, https://link2)"
                value={form.resources}
                onChange={(e) => setForm((f) => ({ ...f, resources: e.target.value }))}
              />
              <div style={{ color: 'var(--oc-muted-text)', fontSize: 12, marginTop: 4 }}>
                Provide any number of additional URLs separated by commas.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="submit" className="btn" disabled={creating}>
                {creating ? 'Creating…' : 'Create Lesson'}
              </button>
              <Link to="/admin/lessons" className="btn btn-secondary">Go to Lessons</Link>
              <Link to="/admin/courses" className="btn btn-secondary">Go to Courses</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
