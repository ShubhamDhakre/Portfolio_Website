import React, { useState } from 'react';
import profilePhoto from '../../assets/profile.webp';
import './About.css';

/**
 * About
 * Introduces Shubham Dhakre from an honest, student-first perspective.
 * Features:
 * - Interactive Mindset tags (CURIOUS, LEARNING, BUILDING, EXPLORING, EXPERIMENTING)
 *   that dynamically update a live mindset terminal panel.
 * - Interactive Full-Stack Web + AI Architecture Pipeline visualization
 *   (CLIENT -> REACT -> API -> NODE/EXPRESS -> MONGODB -> AI ANALYSIS -> FEEDBACK).
 */
function About({ onStateChange }) {
  // Dynamic Mindset selection
  const [selectedTag, setSelectedTag] = useState('CURIOUS');

  // Interactive Architecture Node selection
  const [activeArchNode, setActiveArchNode] = useState('REACT');

  const mindsetData = {
    CURIOUS: {
      tagline: "Always interested in understanding how things work under the hood.",
      detail: "Instead of accepting frameworks as magic black boxes, I enjoy exploring the underlying mechanics — from browser rendering engines to JavaScript event loop queues and HTTP request lifecycles."
    },
    LEARNING: {
      tagline: "Actively studying computer science fundamentals and modern web standards.",
      detail: "Balancing university coursework in Data Structures, Algorithms, and Operating Systems with hands-on practice in modern React, server architecture, and applied machine learning tools."
    },
    BUILDING: {
      tagline: "Learning concepts by turning them into working, testable applications.",
      detail: "Theory sticks best when combined with real code. Building interactive projects like this workspace and the AI Interview Coach helps solidify architecture decisions."
    },
    EXPLORING: {
      tagline: "Experimenting with multimodal AI interfaces and Three.js WebGL.",
      detail: "Investigating how computer vision landmarks (MediaPipe) and audio feature extraction can bring intelligence and real-time interaction to web interfaces."
    },
    EXPERIMENTING: {
      tagline: "Testing ideas in isolation through mini sandbox prototypes.",
      detail: "Before committing to complex architectures, I build lightweight prototypes (like the sandboxes in the Lab section) to validate feasibility and performance."
    }
  };

  const architectureNodes = [
    {
      id: 'CLIENT',
      label: 'CLIENT',
      sub: 'Browser / DOM',
      role: 'Interface & Event Layer',
      desc: 'Clean semantic HTML5 structure, responsive vanilla CSS tokens, and raw browser event listeners handling user interactions.'
    },
    {
      id: 'REACT',
      label: 'REACT.JS',
      sub: 'UI Engine',
      role: 'Component State & Virtual DOM',
      desc: 'Declarative component architecture using hooks (useState, useEffect, useRef) to manage reactive UI states without bloated external libraries.'
    },
    {
      id: 'API',
      label: 'REST API',
      sub: 'HTTP Endpoints',
      role: 'Structured Contract',
      desc: 'Standardized JSON endpoints communicating asynchronously with client fetch requests, validating input headers and status codes.'
    },
    {
      id: 'NODE',
      label: 'NODE / EXPRESS',
      sub: 'Server Runtime',
      role: 'Backend Middleware',
      desc: 'Lightweight asynchronous server handling route controllers, authentication checks, and business logic execution.'
    },
    {
      id: 'MONGODB',
      label: 'MONGODB',
      sub: 'Data Persistence',
      role: 'Document Store',
      desc: 'Flexible NoSQL document schemas modeling application data, question banks, and session history records.'
    },
    {
      id: 'AI_VISION',
      label: 'AI ANALYSIS',
      sub: 'Speech & Vision Concept',
      role: 'Multimodal Processing',
      desc: 'Exploration using MediaPipe landmarks for facial cues, and audio processing for words-per-minute (WPM) and pause metrics.'
    },
    {
      id: 'FEEDBACK',
      label: 'FEEDBACK',
      sub: 'User Insights',
      role: 'Evaluation Dashboard',
      desc: 'Consolidating metric signals into constructive, actionable guidance without replacing human evaluation.'
    }
  ];

  const handleTagClick = (tagKey) => {
    setSelectedTag(tagKey);
    if (onStateChange) onStateChange(`MINDSET.${tagKey}`);
  };

  const handleArchClick = (nodeId) => {
    setActiveArchNode(nodeId);
    if (onStateChange) onStateChange(`ARCH.${nodeId}`);
  };

  const currentNode = architectureNodes.find((n) => n.id === activeArchNode) || architectureNodes[1];

  // Interactive 3D Perspective Tilt on Profile Photo (Bends & Reacts to cursor)
  const [photoTilt, setPhotoTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, active: false });

  const handlePhotoMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;
    const rotateY = (xRatio - 0.5) * 16; // -8 to +8 deg
    const rotateX = -(yRatio - 0.5) * 16; // -8 to +8 deg
    setPhotoTilt({
      x: rotateY,
      y: rotateX,
      glareX: Math.round(xRatio * 100),
      glareY: Math.round(yRatio * 100),
      active: true
    });
  };

  const handlePhotoMouseLeave = () => {
    setPhotoTilt({ x: 0, y: 0, glareX: 50, glareY: 50, active: false });
  };

  return (
    <section id="about" className="about-section">
      {/* Developer Section Header */}
      <div className="section-header">
        <span className="section-route-tag">/about</span>
        <span className="section-number">01</span>
        <h2 className="section-title">ABOUT ME</h2>
        <div className="section-divider" />
        <span className="section-component-pill">&lt;AboutWorkspace /&gt;</span>
      </div>

      <div className="about-grid">
        {/* Main Narrative Card */}
        <div className="about-card about-card-main">
          <div className="about-profile-layout">
            <div className="about-photo-wrapper">
              <div
                className="about-photo-frame"
                onMouseMove={handlePhotoMouseMove}
                onMouseLeave={handlePhotoMouseLeave}
                style={{
                  transform: photoTilt.active
                    ? `perspective(800px) rotateY(${photoTilt.x.toFixed(2)}deg) rotateX(${photoTilt.y.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`
                    : 'perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)',
                  transition: photoTilt.active ? 'transform 0.08s ease-out' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* Atmospheric Ambient Glow behind photo */}
                <div className="photo-ambient-glow" aria-hidden="true" />

                {/* Profile Photo with 0 radius & edge feather mask */}
                <img
                  src={profilePhoto}
                  alt="Shubham Dhakre"
                  className="about-profile-photo"
                  width="600"
                  height="600"
                  loading="lazy"
                  decoding="async"
                />

                {/* Edge Vignette & Blend Layer */}
                <div className="photo-edge-vignette" aria-hidden="true" />

                {/* Holographic Specular Glare (bends dynamically with tilt) */}
                <div
                  className="photo-specular-glare"
                  aria-hidden="true"
                  style={{
                    background: photoTilt.active
                      ? `radial-gradient(circle at ${photoTilt.glareX}% ${photoTilt.glareY}%, rgba(255, 255, 255, 0.16) 0%, rgba(139, 123, 184, 0.08) 40%, transparent 70%)`
                      : 'none',
                    opacity: photoTilt.active ? 1 : 0
                  }}
                />

                {/* 4 Precision HUD Corners around image corners only */}
                <div className="photo-corner photo-corner-tl" aria-hidden="true" />
                <div className="photo-corner photo-corner-tr" aria-hidden="true" />
                <div className="photo-corner photo-corner-bl" aria-hidden="true" />
                <div className="photo-corner photo-corner-br" aria-hidden="true" />
              </div>
            </div>

            <div className="about-profile-intro">
              <div className="about-badge">
                <span className="badge-dot" />
                STUDENT PERSPECTIVE // COMPUTER ENGINEERING
              </div>
              <h3 className="about-subtitle">
                Exploring the intersection of web interfaces, systems, and applied machine intelligence.
              </h3>
              <p className="about-paragraph">
                I am a Computer Science / Computer Engineering undergraduate student passionate about understanding how modern software operates from the ground up. Rather than treating frameworks as black boxes, I enjoy digging into the mechanics — from component lifecycles in React to server-side event loops and machine intelligence APIs.
              </p>
            </div>
          </div>

          <p className="about-paragraph">
            My primary focus is on building responsive, engaging digital workspaces and exploring how machine learning (such as computer vision landmarks and audio speech processing) can make everyday tools more interactive and constructive.
          </p>

          {/* Interactive Mindset Tags */}
          <div className="about-tags-container">
            <div className="tags-header">
              <span className="tags-label">INTERACTIVE MINDSET // CLICK TO INSPECT:</span>
            </div>
            <div className="about-tags-list">
              {Object.keys(mindsetData).map((tagKey) => {
                const isSelected = selectedTag === tagKey;
                return (
                  <button
                    key={tagKey}
                    type="button"
                    className={`floating-tag ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleTagClick(tagKey)}
                    aria-pressed={isSelected}
                  >
                    <span className="tag-prefix">#</span>
                    <span className="tag-text">{tagKey}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Mindset Console Display */}
            <div className="mindset-console-panel">
              <div className="console-panel-header">
                <span className="panel-tag">MINDSET.QUERY: {selectedTag}</span>
                <span className="panel-status">OK // 200</span>
              </div>
              <p className="mindset-tagline">
                "{mindsetData[selectedTag].tagline}"
              </p>
              <p className="mindset-detail">
                {mindsetData[selectedTag].detail}
              </p>
            </div>
          </div>
        </div>

        {/* Side Highlights Column */}
        <div className="about-sidebar">
          {/* Education Card */}
          <div className="about-card about-card-sub">
            <div className="card-header-icon">🎓</div>
            <div className="card-sub-meta">DEGREE // UNDERGRADUATE</div>
            <h4 className="card-sub-title">Computer Science &amp; Engineering</h4>
            <p className="card-sub-text">
              Focusing on Data Structures, Algorithms, Database Systems, Computer Networks, and Applied AI/ML fundamentals.
            </p>
          </div>

          {/* Practical Focus Card */}
          <div className="about-card about-card-sub">
            <div className="card-header-icon">⚡</div>
            <div className="card-sub-meta">PHILOSOPHY // ZERO BLOAT</div>
            <h4 className="card-sub-title">Hands-On Engineering</h4>
            <p className="card-sub-text">
              Striving for clean architecture, understandable code, and interfaces that feel fluid and alive without third-party framework overhead.
            </p>
          </div>

          {/* Active Exploration Card */}
          <div className="about-card about-card-sub highlight-card">
            <div className="card-header-icon">🔬</div>
            <div className="card-sub-meta">CURRENT EXPERIMENT</div>
            <h4 className="card-sub-title">Multimodal Speech &amp; Vision</h4>
            <p className="card-sub-text">
              Prototyping audio pacing indicators and facial landmark tracking with MediaPipe for the AI Interview Coach.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Web & AI Architecture Pipeline */}
      <div className="about-architecture-section">
        <div className="arch-header">
          <div className="arch-header-left">
            <span className="arch-pre-label">SYSTEM ARCHITECTURE VISUALIZATION</span>
            <h3 className="arch-title">How I Structure Web &amp; AI Applications</h3>
          </div>
          <span className="arch-hint">CLICK ANY NODE TO INSPECT ROLE IN PIPELINE</span>
        </div>

        {/* Node Pipeline Flow */}
        <div className="arch-pipeline-track">
          {architectureNodes.map((node, idx) => {
            const isSelected = activeArchNode === node.id;
            return (
              <React.Fragment key={node.id}>
                <button
                  type="button"
                  className={`arch-node-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => handleArchClick(node.id)}
                  aria-pressed={isSelected}
                >
                  <span className="node-step-num">0{idx + 1}</span>
                  <span className="node-chip-label">{node.label}</span>
                  <span className="node-chip-sub">{node.sub}</span>
                </button>
                {idx < architectureNodes.length - 1 && (
                  <span className="arch-pipeline-arrow" aria-hidden="true">
                    →
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Selected Node Details Box */}
        <div className="arch-detail-box">
          <div className="detail-box-top">
            <div className="detail-title-group">
              <span className="detail-node-name">{currentNode.label}</span>
              <span className="detail-node-role">{currentNode.role}</span>
            </div>
            <span className="detail-status-badge">PIPELINE STAGE ACTIVE</span>
          </div>
          <p className="detail-desc">{currentNode.desc}</p>
        </div>
      </div>
    </section>
  );
}

export default React.memo(About);

