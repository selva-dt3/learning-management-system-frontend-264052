import React from 'react';
import { useParams } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function CourseDetailsPage() {
  const { id } = useParams();

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="badge">Course ID: {id}</div>
        <h2 style={{ margin: '0.25rem 0 0.5rem' }}>Course Title Placeholder</h2>
        <p style={{ color: 'var(--oc-muted-text)' }}>
          Short overview of the course. This is placeholder content for description, objectives, and outcomes.
        </p>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Modules</h3>
            <ul>
              <li>Introduction</li>
              <li>Core Concepts</li>
              <li>Hands-on Project</li>
              <li>Final Assessment</li>
            </ul>
          </div>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Progress</h3>
            <div style={{ height: 12, background: '#eef2ff', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--oc-border)' }}>
              <div style={{ width: '30%', height: '100%', background: 'var(--oc-primary)' }} />
            </div>
            <div style={{ marginTop: 8, color: 'var(--oc-muted-text)' }}>30% complete</div>
          </div>
        </div>
      </div>
    </div>
  );
}
