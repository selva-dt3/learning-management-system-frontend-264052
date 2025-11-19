import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/Toast';
import { uploadLessonAsset, ensureTablesHint } from '../../lib/services/supabaseHelpers';

/**
 * PUBLIC_INTERFACE
 * AdminDashboard
 * Adds quick-create Lesson form aligned with requested schema:
 * - courseId, title, description, contentType [pdf|video|link]
 * - file upload to Supabase Storage (pdf/video) for asset_url
 * - link_url for 'link' type
 * - optional resources array (comma-separated URLs)
 * - Persists metadata to lessons table
 * Provides actionable error messages if tables/bucket missing or RLS blocks inserts.
 */
export default function AdminDashboard() {
  const { user, role } = useAuth();
  const { notify } = useToast();

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

  useMemo(async () => {
    const w = await ensureTablesHint();
    setHints(w);
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, file: f }));
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
        if (form.contentType === 'pdf' && !name.endsWith('.pdf')) v.file = 'Upload a .pdf file';
        if (form.contentType === 'video' && !(/\.(mp4|webm|mov|m4v)$/i.test(name))) v.file = 'Upload a video file (mp4, webm, mov, m4v)';
      }
    }
    setValidation(v);
    return Object.keys(v).length === 0;
  };

  const onCreateLesson = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setCreating(true);
      let assetUrl = null;
      let linkUrl = null;

      if (form.contentType === 'link') {
        linkUrl = String(form.linkUrl || '').trim();
      } else if (form.file instanceof File) {
        const { publicUrl, error: upErr } = await uploadLessonAsset(form.file, `lessons/${form.courseId}`);
        if (upErr) {
          notify(upErr.message || 'Upload failed', 'error');
          setCreating(false);
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
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('lessons').insert(payload).select().single();
      if (error) {
        notify('Insert blocked. Ensure RLS policies permit insert and run provided SQL in README.', 'error');
        return;
      }

      // Reset form on success
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
    } catch (_e) {
      notify('Unable to create lesson. Verify Supabase tables and storage.', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    // Page is guarded by RoleProtectedRoute in AppRouter (admin only).
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
            <div style={{ color: 'var(--oc-muted-text)' }}>
              Welcome {user?.email || ''}. Manage platform settings and content.
            </div>
          </div>
          <div className="badge" title="Your role" style={{ borderColor: 'var(--oc-primary)', color: '#0f172a' }}>
            Role: {role}
          </div>
        </div>
      </div>

      {hints.length > 0 && (
        <div className="card" style={{ padding: '0.75rem', borderColor: 'var(--oc-secondary)' }}>
          <div className="badge" style={{ marginBottom: 6 }}>Supabase Setup</div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--oc-muted-text)' }}>
            {hints.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}

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

      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/admin/employees" className="btn">Manage Employees</Link>
          <Link to="/admin/lessons" className="btn btn-secondary">Manage Lessons</Link>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem', maxWidth: 900 }}>
        <div style={{ marginBottom: 8 }}>
          <div className="badge" style={{ marginBottom: 8 }}>Create Lesson</div>
          <h3 style={{ margin: 0 }}>New Lesson</h3>
          <p style={{ color: 'var(--oc-muted-text)', marginTop: 6 }}>
            Upload PDFs or Videos to Supabase Storage or provide a Link. Metadata is saved to the lessons table.
          </p>
        </div>

        <form onSubmit={onCreateLesson} noValidate>
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
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
