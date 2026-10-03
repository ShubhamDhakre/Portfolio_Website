import React from 'react';

/**
 * ProjectCard
 * Browser-window application interface with refined Liquid Violet Glass material hierarchy.
 * Editorial layout replacing repetitive grey cards with varied translucent layers,
 * thin architectural dividers, and semantic status chips.
 */
function ProjectCard({ project, isExpanded, onToggleExpand }) {
  const {
    number,
    title,
    tagline,
    shortDescription,
    technologies,
    status,
    statusType,
    github,
    demo,
    details,
  } = project;

  return (
    <article
      className={`project-window-panel ${isExpanded ? 'is-expanded' : ''} ${project.featured ? 'is-featured' : ''}`}
      data-cursor="inspect"
    >
      {/* Browser Window Titlebar Chrome */}
      <div
        className="window-chrome-bar"
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${title} window controls. Click to ${isExpanded ? 'collapse' : 'expand'} project workspace`}
      >
        <div className="window-controls">
          <span className="window-dot dot-red" />
          <span className="window-dot dot-yellow" />
          <span className="window-dot dot-green" />
        </div>

        <div className="window-address-tab">
          <span className="window-file-icon">⚡</span>
          <span className="window-file-path">src/projects/{project.id}.jsx</span>
        </div>

        <div className="window-right-meta">
          <span className={`window-status-pill status-${statusType}`}>
            <span className="status-dot" />
            {status}
          </span>
          <div className="window-expand-toggle" aria-hidden="true">
            {isExpanded ? '−' : '+'}
          </div>
        </div>
      </div>

      {/* Main Preview Body */}
      <div className="project-panel-body" onClick={onToggleExpand}>
        <div className="project-body-top">
          <div className="project-number-badge">PROJECT // {number}</div>
          <span className="project-route-badge">GET /api/{project.id}</span>
        </div>

        <h3 className="project-title">{title}</h3>
        <p className="project-tagline">{tagline}</p>
        <p className="project-description">{shortDescription}</p>

        {/* Tech Badges */}
        <div className="project-tech-list">
          {technologies.map((tech) => (
            <span key={tech} className="tech-badge">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="project-actions">
        <button
          type="button"
          className="project-btn project-btn-expand"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Hide Architecture Breakdown' : 'Inspect Architecture & Features'}
        </button>

        {github && (
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="project-btn project-btn-link"
            title="Inspect Source Code on GitHub"
          >
            <span>GitHub</span>
            <span className="ext-arrow">↗</span>
          </a>
        )}

        {demo && (
          <a
            href={demo}
            target="_blank"
            rel="noopener noreferrer"
            className="project-btn project-btn-link demo"
            title="Live Workspace"
          >
            <span>Live Workspace</span>
            <span className="ext-arrow">↗</span>
          </a>
        )}
      </div>

      {/* Expanded Development Workspace View with Distinct Material Hierarchy */}
      {isExpanded && details && (
        <div className="project-expanded-content">
          <div className="expanded-divider" />

          {/* Section 01: Problem Statement (Editorial direct layout with accent border) */}
          <div className="expanded-problem-block">
            <div className="block-header">
              <span className="block-num">01 //</span>
              <span className="block-label">THE PROBLEM &amp; CHALLENGE</span>
            </div>
            <p className="block-body-text">{details.problem}</p>
          </div>

          {/* Section 02: Approach & Solution (Level 2 Violet-Tinted Glass) */}
          <div className="expanded-approach-panel">
            <div className="block-header">
              <span className="block-num">02 //</span>
              <span className="block-label">WHAT I BUILT &amp; ARCHITECTURAL APPROACH</span>
            </div>
            <p className="block-body-text">{details.idea}</p>
          </div>

          {/* Section 03: Architecture & Technology Breakdown */}
          <div className="expanded-stack-panel">
            <div className="block-header">
              <span className="block-num">03 //</span>
              <span className="block-label">ARCHITECTURE &amp; STACK INTERACTION</span>
            </div>
            <p className="block-body-text">{details.technologiesBreakdown}</p>
          </div>

          {/* Section 04: Feature Matrix & Scope (Structured Glass Matrix with Semantic Badges) */}
          <div className="expanded-features-panel">
            <div className="block-header">
              <span className="block-num">04 //</span>
              <span className="block-label">FEATURE MATRIX &amp; IMPLEMENTATION SCOPE</span>
            </div>
            <div className="features-list">
              {details.features.map((feat) => (
                <div key={feat.name} className="feature-item">
                  <div className="feature-header">
                    <span className="feature-name">{feat.name}</span>
                    <span className={`feature-badge state-${feat.state.toLowerCase().replace(/\s+/g, '-')}`}>
                      {feat.state}
                    </span>
                  </div>
                  <p className="feature-note">{feat.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 05: Current Status & Roadmap (Level 3 Active Status Glass) */}
          <div className="expanded-roadmap-panel">
            <div className="roadmap-header">
              <span className="roadmap-dot" />
              <span className="roadmap-label">05 // CURRENT STATUS &amp; EXPERIMENTAL ROADMAP</span>
            </div>
            <p className="roadmap-text">{details.currentStatus}</p>
          </div>
        </div>
      )}
    </article>
  );
}

export default React.memo(ProjectCard);
