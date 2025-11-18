import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createLesson, getLesson, updateLesson } from '../../../lib/services/lessons';
import { useToast } from '../../../components/Toast';

/**
 * PUBLIC_INTERFACE
 * LessonFormPage - create or edit lessons.
 */
export default function LessonFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { notify } = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    durationMinutes: '',
    isPublished: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      const { data, error } = await getLesson(id);
      if (error) {
        setLoadError('Unable to load lesson. If the table is missing, create it in Supabase.');
      } else if (data) {
        setForm({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          difficulty: data.difficulty || 'beginner',
          durationMinutes: data.duration_minutes ?? '',
          isPublished: Boolean(data.is_published)
        });
      }
      setLoading(false);
    };
    load();
  }, [id, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.difficulty) e.difficulty = 'Difficulty is required';
    if (form.durationMinutes !== '' && (!Number.isFinite(Number(form.durationMinutes)) || Number(form.durationMinutes) < 0)) {
      e.durationMinutes = 'Duration must be a non-negative number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      ...form,
      durationMinutes: form.durationMinutes === '' ? null : Number(form.durationMinutes)
    };
    if (isEdit) {
      const { error } = await updateLesson(id, payload);
      if (error) {
        notify('Update failed', 'error');
      } else {
        notify('Lesson updated', 'success');
        navigate('/admin/lessons');
      }
    } else {
      const { error } = await createLesson(payload);
      if (error) {
        notify('Create failed', 'error');
      } else {
        notify('Lesson created', 'success');
        navigate('/admin/lessons');
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="card" style={{ padding: '1rem' }}>Loading...</div>;
  if (loadError) {
    return (
      <div className="card" style={{ padding: '1rem', color: 'var(--oc-error)' }}>
        {loadError}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1.25rem', maxWidth: 720 }}>
      <h2 style={{ marginTop: 0 }}>{isEdit ? 'Edit Lesson' : 'New Lesson'}</h2>
      <form onSubmit={onSubmit} noValidate>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label htmlFor="title" style={{ display: 'block', marginBottom: 6 }}>Title</label>
            <input
              id="title"
              className="input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              aria-invalid={!!errors.title}
            />
            {errors.title && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.title}</div>}
          </div>

          <div>
            <label htmlFor="description" style={{ display: 'block', marginBottom: 6 }}>Description</label>
            <textarea
              id="description"
              className="input"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={5}
            />
          </div>

          <div>
            <label htmlFor="category" style={{ display: 'block', marginBottom: 6 }}>Category</label>
            <input
              id="category"
              className="input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="difficulty" style={{ display: 'block', marginBottom: 6 }}>Difficulty</label>
            <select
              id="difficulty"
              className="input"
              value={form.difficulty}
              onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
              aria-invalid={!!errors.difficulty}
            >
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
            {errors.difficulty && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.difficulty}</div>}
          </div>

          <div>
            <label htmlFor="durationMinutes" style={{ display: 'block', marginBottom: 6 }}>Duration (minutes)</label>
            <input
              id="durationMinutes"
              className="input"
              value={form.durationMinutes}
              onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
              aria-invalid={!!errors.durationMinutes}
              inputMode="numeric"
            />
            {errors.durationMinutes && <div style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.durationMinutes}</div>}
          </div>

          <div>
            <label htmlFor="isPublished" style={{ display: 'block', marginBottom: 6 }}>Published</label>
            <input
              id="isPublished"
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
            />{' '}
            <span className="badge">Toggle publish state</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/lessons')}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
