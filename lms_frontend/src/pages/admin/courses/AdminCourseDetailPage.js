import React, { useEffect, useMemo, useState } from 'react';
import { getCourseWithLessons, updateLessonsOrder } from '../../../lib/services/adminCourses';
import { useToast } from '../../../components/Toast';
import Loading from '../../../components/Loading';
import { Link, useParams } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * AdminCourseDetailPage - Shows lessons for a course with drag-and-drop ordering and batch update.
 */
export default function AdminCourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();
  const [haveOrderIndex, setHaveOrderIndex] = useState(true);

  const showToast = (message, type = 'success') => notify(message, type);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await getCourseWithLessons(id);
    if (error) {
      showToast(error, 'error');
    } else if (data) {
      setCourse({ id: data.id, name: data.name, description: data.description });
      setLessons(data.lessons || []);
      setHaveOrderIndex(Boolean(data.haveOrderIndex));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Simple drag & drop without extra dependency
  const onDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.currentTarget.classList.add('opacity-70');
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-70');
  };

  const onDrop = (e, index) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (Number.isNaN(fromIndex)) return;

    const updated = [...lessons];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(index, 0, moved);
    setLessons(updated);
  };

  const persistOrder = async () => {
    if (!haveOrderIndex) {
      showToast(
        'Ordering cannot be saved: lessons.order_index column not found. See guidance below.',
        'error'
      );
      return;
    }
    setSaving(true);
    const updates = lessons.map((l, i) => ({ id: l.id, order_index: i }));
    const { error } = await updateLessonsOrder(updates);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Lesson order saved');
    }
    setSaving(false);
  };

  const card =
    'bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition p-4 flex flex-col gap-2';
  const btnPrimary =
    'inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50';
  const btnSecondary =
    'inline-flex items-center justify-center rounded-md bg-gray-100 text-gray-800 px-3 py-2 text-sm font-medium hover:bg-gray-200';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Manage Lessons</h1>
            {course && <p className="text-gray-600 mt-1">{course.name}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Link className={btnSecondary} to="/admin/courses">← Back to courses</Link>
            <button className={btnPrimary} onClick={persistOrder} disabled={saving || !haveOrderIndex}>
              {saving ? 'Saving...' : 'Save order'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          {!haveOrderIndex && (
            <div className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-md text-amber-800 text-sm">
              Ordering is available, but saving requires a lessons.order_index integer column. To enable saving, run:
              <pre className="mt-2 p-2 bg-white rounded border border-amber-200 overflow-auto text-xs">
{`-- In Supabase SQL editor
alter table public.lessons
  add column if not exists order_index integer;

-- Optional: default existing rows with ascending order
create or replace function public.resequence_lessons()
returns void language plpgsql as $$
declare
  r record;
  i integer := 0;
begin
  for r in select id from public.lessons order by created_at loop
    update public.lessons set order_index = i where id = r.id;
    i := i + 1;
  end loop;
end; $$;

select public.resequence_lessons();`}
              </pre>
              After the column is added, refresh this page to save ordering.
            </div>
          )}

          {lessons.length === 0 ? (
            <div className={card}>
              <p className="text-gray-600">No lessons for this course yet.</p>
              <p className="text-gray-500 text-sm">Create lessons from the Admin Lessons section and link them to this course.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((l, index) => (
                <div
                  key={l.id}
                  className={`${card} cursor-move`}
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={onDragOver}
                  onDragEnd={onDragEnd}
                  onDrop={(e) => onDrop(e, index)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-gray-400 select-none">≡</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{l.title || 'Untitled lesson'}</h3>
                        {haveOrderIndex && (
                          <span className="text-xs text-gray-500">order: {index}</span>
                        )}
                      </div>
                      {l.summary && <p className="text-sm text-gray-600 mt-1">{l.summary}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}


    </div>
  );
}
