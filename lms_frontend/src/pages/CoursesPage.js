import React, { useMemo, useState } from 'react';

// PUBLIC_INTERFACE
export default function CoursesPage() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');

  const placeholderCourses = useMemo(() => ([
    { id: '101', title: 'React Fundamentals', level: 'beginner', category: 'Development' },
    { id: '102', title: 'Advanced CSS Techniques', level: 'intermediate', category: 'Design' },
    { id: '103', title: 'Data Analysis with Python', level: 'advanced', category: 'Data' }
  ]), []);

  const filtered = placeholderCourses.filter(c => {
    const q = query.trim().toLowerCase();
    const matchesText = !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
    const matchesLevel = level === 'all' || c.level === level;
    return matchesText && matchesLevel;
  });

  return (
    <div>
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <input
            className="input"
            placeholder="Search courses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search courses"
            style={{ flex: '2 1 240px' }}
          />
          <select
            className="input"
            aria-label="Filter by level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            style={{ flex: '1 1 160px' }}
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {filtered.map(c => (
          <a key={c.id} href={`/courses/${c.id}`} className="card" style={{ padding: '1rem' }}>
            <div className="badge" style={{ marginBottom: 8 }}>{c.category}</div>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>{c.title}</h3>
            <div style={{ color: 'var(--oc-muted-text)' }}>Level: {c.level}</div>
          </a>
        ))}
        {filtered.length === 0 && (
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ color: 'var(--oc-muted-text)' }}>No courses found.</div>
          </div>
        )}
      </div>
    </div>
  );
}
