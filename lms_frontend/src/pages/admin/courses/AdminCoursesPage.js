import React, { useEffect, useMemo, useState } from 'react';
import { listCourses, createCourse, updateCourse, deleteCourse } from '../../../lib/services/adminCourses';
import { useToast } from '../../../components/Toast';
import Loading from '../../../components/Loading';
import { Link, useNavigate } from 'react-router-dom';
import '../../../styles/global.css';
import '../../../App.css';

/**
 * PUBLIC_INTERFACE
 * AdminCoursesPage - Manage courses (create, edit, delete) with clean UI and RLS-aware errors.
 */
export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();
  const [form, setForm] = useState({ id: null, name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const isEditing = useMemo(() => form.id !== null, [form]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await listCourses();
    if (error) {
      showToast(error, 'error');
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message, type = 'success') => notify(message, type);

  const resetForm = () => setForm({ id: null, name: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Course name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        const { error } = await updateCourse(form.id, { name: form.name, description: form.description });
        if (error) return showToast(error, 'error');
        showToast('Course updated');
      } else {
        const { error } = await createCourse({ name: form.name, description: form.description });
        if (error) return showToast(error, 'error');
        showToast('Course created');
      }
      resetForm();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (c) => setForm({ id: c.id, name: c.name || '', description: c.description || '' });

  const onDelete = async (c) => {
    if (!window.confirm(`Delete course "${c.name}"? This cannot be undone.`)) return;
    const { error } = await deleteCourse(c.id);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Course deleted');
      fetchData();
    }
  };

  const cardClass =
    'bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition p-4 flex flex-col gap-2';
  const btnPrimary =
    'inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50';
  const btnSecondary =
    'inline-flex items-center justify-center rounded-md bg-gray-100 text-gray-800 px-3 py-2 text-sm font-medium hover:bg-gray-200';
  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Courses</h1>
        <button
          className={btnSecondary}
          onClick={() => {
            resetForm();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          New course
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="md:col-span-1 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{isEditing ? 'Edit Course' : 'Create Course'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Onboarding 101"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Description</label>
              <textarea
                className={inputClass}
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description..."
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button className={btnPrimary} type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
            {isEditing && (
              <button type="button" className={btnSecondary} onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Note: In demo with relaxed RLS, writes should succeed. If blocked, see README_RLS_TROUBLESHOOTING.md.
          </div>
        </form>

        <div className="md:col-span-2">
          {loading ? (
            <Loading />
          ) : courses.length === 0 ? (
            <div className={cardClass}>
              <p className="text-gray-600">No courses yet. Create your first course using the form.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {courses.map((c) => (
                <div key={c.id} className={cardClass}>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                    {c.description && <p className="text-sm text-gray-600 mt-1">{c.description}</p>}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button className={btnSecondary} onClick={() => onEdit(c)}>
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-700 text-sm" onClick={() => onDelete(c)}>
                      Delete
                    </button>
                    <button
                      className="ml-auto inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                      onClick={() => navigate(`/admin/courses/${c.id}`)}
                    >
                      Manage lessons →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
