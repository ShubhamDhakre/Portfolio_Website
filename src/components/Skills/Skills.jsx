import React, { useState, useMemo } from 'react';
import skillsData from '../../data/skills';
import './Skills.css';

/**
 * Skills - Tech Stack Constellation
 * Unified Technology Network & Detailed Card Directory.
 * Features:
 * - Full bidirectional interactivity: selecting a node or hovering a card activates the whole graph
 * - Visual connection paths highlighting dependencies
 * - Dedicated liquid violet glass inspection surface
 * - Seamless material hierarchy with refined translucent glass cards
 */
function Skills({ onStateChange }) {
  // Pinned selected skill + transient hovered skill for smooth inspection
  const [selectedSkill, setSelectedSkill] = useState(skillsData[0]);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const activeSkill = hoveredSkill || selectedSkill;

  const categories = ['ALL', 'FRONTEND', 'BACKEND', 'DATABASE', 'TOOLS', 'EXPLORING'];
  const filteredSkills = useMemo(() => {
    return selectedCategory === 'ALL'
      ? skillsData
      : skillsData.filter((s) => s.category.toUpperCase() === selectedCategory.toUpperCase());
  }, [selectedCategory]);

  // Connection line active check
  const isLineActive = (skillA, skillB) => {
    if (!activeSkill) return false;
    return (
      (activeSkill.id === skillA.id && skillA.connections?.includes(skillB.id)) ||
      (activeSkill.id === skillB.id && skillB.connections?.includes(skillA.id))
    );
  };

  // Generate unique connection pairs for SVG lines
  const connectionPairs = useMemo(() => {
    const pairs = [];
    const visited = new Set();

    skillsData.forEach((s) => {
      s.connections?.forEach((targetId) => {
        const target = skillsData.find((item) => item.id === targetId);
        if (target) {
          const pairKey = [s.id, target.id].sort().join('--');
          if (!visited.has(pairKey)) {
            visited.add(pairKey);
            pairs.push({ source: s, target });
          }
        }
      });
    });

    return pairs;
  }, []);

  const handleNodeClick = (skill) => {
    setSelectedSkill(skill);
    setHoveredSkill(null);
    if (onStateChange) onStateChange(`NODE.${skill.id.toUpperCase()}`);
  };

  const handleNodeHover = (skill) => {
    setHoveredSkill(skill);
  };

  const handleMouseLeave = () => {
    setHoveredSkill(null);
  };

  // Get connected skill objects for active skill
  const connectedSkills = useMemo(() => {
    if (!activeSkill || !activeSkill.connections) return [];
    return activeSkill.connections
      .map((id) => skillsData.find((s) => s.id === id))
      .filter(Boolean);
  }, [activeSkill]);

  return (
    <section id="skills" className="skills-section">
      {/* Developer Section Header */}
      <div className="section-header">
        <span className="section-route-tag">/skills</span>
        <span className="section-number">02</span>
        <h2 className="section-title">TECH STACK CONSTELLATION</h2>
        <div className="section-divider" />
        <span className="section-component-pill">&lt;ConstellationGraph /&gt;</span>
      </div>

      <div className="skills-intro">
        <p className="skills-intro-text">
          An interconnected map of technologies I actively build and experiment with. Hover or click any node or card below to inspect topics and observe live architectural dependencies.
        </p>

        {/* Category Filters */}
        <div className="skills-filter-bar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Skill Network Container: Dedicated Independent Stacking Context */}
      <div className="skill-network-container">
        <div 
          className="network-viewport"
          onMouseLeave={handleMouseLeave}
        >
          {/* SVG Connecting Lines */}
          <svg className="constellation-svg" aria-hidden="true">
            {connectionPairs.map(({ source, target }) => {
              const active = isLineActive(source, target);
              return (
                <line
                  key={`${source.id}-${target.id}`}
                  x1={`${source.x}%`}
                  y1={`${source.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  className={`constellation-line ${active ? 'line-active' : ''}`}
                />
              );
            })}
          </svg>

          {/* Interactive Skill Nodes */}
          {skillsData.map((skill) => {
            const isSelected = activeSkill?.id === skill.id;
            const isConnected = activeSkill?.connections?.includes(skill.id);
            const isDimmed = activeSkill && !isSelected && !isConnected;
            const isCategoryFiltered =
              selectedCategory !== 'ALL' &&
              skill.category.toUpperCase() !== selectedCategory.toUpperCase();

            return (
              <button
                key={skill.id}
                type="button"
                className={`skill-node ${isSelected ? 'node-selected' : ''} ${isConnected ? 'node-connected' : ''} ${isDimmed || isCategoryFiltered ? 'node-dimmed' : ''}`}
                style={{
                  left: `${skill.x}%`,
                  top: `${skill.y}%`,
                }}
                onClick={() => handleNodeClick(skill)}
                onMouseEnter={() => handleNodeHover(skill)}
                aria-pressed={isSelected}
                aria-label={`${skill.name} - ${skill.tagline}`}
                data-cursor="select"
              >
                <span className="node-dot" />
                <span className="node-label">{skill.name}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Interaction Layer: Dedicated Liquid Violet Glass Inspection Panel */}
        {activeSkill && (
          <div className="skill-inspection-layer" role="region" aria-label="Selected Skill Inspection">
            <div className="skill-inspection-panel">
              <div className="inspection-header">
                <div className="inspection-title-group">
                  <span className="inspection-node-dot" />
                  <span className="inspection-title">{activeSkill.name}</span>
                  <span className={`inspection-badge category-${activeSkill.category.toLowerCase()}`}>
                    {activeSkill.category}
                  </span>
                </div>
                <span className="inspection-route-tag">NODE.STATUS // ACTIVE</span>
              </div>

              <div className="inspection-tagline">{activeSkill.tagline}</div>
              <p className="inspection-summary">{activeSkill.summary}</p>

              {/* Core Topics Chips */}
              <div className="inspection-topics-group">
                <span className="topics-label">CORE CONCEPTS:</span>
                <div className="inspection-topics-list">
                  {activeSkill.topics?.map((topic) => (
                    <span key={topic} className="inspection-topic-chip">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Connected Architectural Dependencies */}
              {connectedSkills.length > 0 && (
                <div className="inspection-connections-group">
                  <span className="connections-label">ARCHITECTURAL CONNECTIONS:</span>
                  <div className="inspection-connections-list">
                    {connectedSkills.map((conn) => (
                      <button
                        key={conn.id}
                        type="button"
                        className="connection-link-chip"
                        onClick={() => handleNodeClick(conn)}
                        onMouseEnter={() => handleNodeHover(conn)}
                        title={`Inspect related technology: ${conn.name}`}
                      >
                        <span className="conn-arrow">➔</span>
                        <span className="conn-name">{conn.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Skill Cards Grid: Visually & Interactively connected with the Network */}
      <div className="skills-overview-heading">
        <span className="overview-label">ALL STACK TOPICS // QUICK DIRECTORY</span>
        <div className="overview-divider" />
      </div>

      <div className="skills-cards-grid">
        {filteredSkills.map((skill) => {
          const isSelected = selectedSkill?.id === skill.id;

          return (
            <div
              key={`card-${skill.id}`}
              className={`skill-card ${isSelected ? 'is-active-card' : ''}`}
              onClick={() => handleNodeClick(skill)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNodeClick(skill);
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
            >
              <div className="card-top">
                <div className="card-title-row">
                  {isSelected && <span className="card-active-status-dot" />}
                  <span className="skill-card-name">{skill.name}</span>
                </div>
                <span className={`skill-card-badge category-${skill.category.toLowerCase()}`}>
                  {skill.category}
                </span>
              </div>

              <div className="skill-card-tagline">{skill.tagline}</div>
              <p className="skill-card-summary">{skill.summary}</p>

              <div className="skill-card-tags">
                {skill.topics?.map((topic) => (
                  <span key={topic} className="card-topic-pill">
                    {topic}
                  </span>
                ))}
              </div>

              {/* Connected relations hint inside card */}
              {isSelected && connectedSkills.length > 0 && (
                <div className="card-active-relations-bar">
                  <span className="relations-hint-label">CONNECTED:</span>
                  <span className="relations-hint-names">
                    {connectedSkills.map((c) => c.name).join(' • ')}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default React.memo(Skills);

