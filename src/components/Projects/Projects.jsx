import React, { useState } from 'react';
import projectsData from '../../data/projects';
import ProjectCard from './ProjectCard';
import './Projects.css';

/**
 * Projects
 * Selected projects section displaying browser-window-framed application previews.
 * Features honest student development statuses (IN DEVELOPMENT, EXPERIMENTAL, CONCEPT),
 * deep-dive architecture breakdowns, and interactive workspace expansion.
 */
function Projects({ onStateChange }) {
  const [expandedId, setExpandedId] = useState('ai-interview-coach'); // Expand flagship project initially

  const handleToggleExpand = (id) => {
    setExpandedId((prev) => {
      const next = prev === id ? null : id;
      if (onStateChange && next) {
        onStateChange(`INSPECT.${next.toUpperCase()}`);
      }
      return next;
    });
  };

  return (
    <section id="projects" className="projects-section">
      <div className="section-header">
        <span className="section-route-tag">/work</span>
        <span className="section-number">03</span>
        <h2 className="section-title">SELECTED PROJECTS</h2>
        <div className="section-divider" />
        <span className="section-component-pill">&lt;ProjectsWorkspace /&gt;</span>
      </div>

      <div className="projects-intro">
        <p className="projects-intro-text">
          Application builds exploring multimodal AI analysis, responsive client-server architectures, and custom WebGL digital workspaces. Click any window to expand the full architecture breakdown, problem statements, and implementation status.
        </p>
      </div>

      <div className="projects-list">
        {projectsData.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            isExpanded={expandedId === project.id}
            onToggleExpand={() => handleToggleExpand(project.id)}
          />
        ))}
      </div>
    </section>
  );
}

export default React.memo(Projects);

