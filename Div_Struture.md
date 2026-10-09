# Digital Workspace & Portfolio — DOM / Div Structure & Technical Architecture

Comprehensive documentation of the DOM component hierarchy, div structure, CSS class conventions, dynamic states, and full technical architecture for **Shubham Dhakre's Portfolio & Digital Workspace**.

---

## 1. Executive Summary & Website Overview

- **Owner / Identity:** Shubham Dhakre — Computer Science & Engineering Undergraduate Student & Tech Enthusiast (India).
- **Core Concept:** An interactive, developer-first personal digital workspace combining modern web architecture, responsive client-server synchronization, a custom Three.js 3D WebGL centerpiece, and a hidden password-protected administrative control center.
- **Frontend Stack:** React 19.2.8, Vite 8.3.0, Three.js 0.186.1, Vanilla CSS (Design Tokens & 3-Tier Liquid Glass System).
- **Backend Stack:** Node.js, Express 5.2.1, Cookie-Parser, Bcrypt.js, Express-Rate-Limit, Vercel Serverless Function deployment (`api/index.js`).
- **Typography:**
  - Primary UI: `Nunito Sans` (Smooth Rounded Humanist Sans-Serif).
  - Technical / Code / HUD: `IBM Plex Mono` (Technical Monospace).

---

## 2. High-Level Application Tree (`App.jsx`)

```
<!doctype html> (index.html)
└── <html lang="en" data-theme="night|day|technical|nature|minimal|aurora|monochrome" data-reveal-style="..." data-reveal-replay="...">
    └── <body>
        └── <div id="root">
            └── <div class="app-layout">
                ├── <CustomCursor />                        [Fixed Desktop Hardware-Accelerated Cursor]
                ├── <div class="mouse-spotlight-layer" />   [Fixed Ambient Radial Spotlight Gradient]
                ├── <WebSystemBackground />                 [Fixed Multi-Mode 2D Canvas & Parallax Wallpaper]
                ├── <Navbar />                              [Sticky/Floating Dark Glass Navigation Header]
                ├── <WorkspaceHUD />                        [Fixed Bottom-Left Session Uptime & Focus HUD]
                ├── <DeveloperStatus />                     [Fixed Bottom-Right Live Clock & Developer Thoughts HUD]
                ├── <main id="main-content">
                │   ├── <Hero />                            [Entrance, Title, Actions & 3D ThreeScene Core]
                │   ├── <div class="section-container">
                │   │   └── <About />                       [Perspective, Interactive Mindset, Arch Pipeline]
                │   ├── <div class="section-container">
                │   │   └── <Skills />                      [Interactive Constellation Graph & Topic Cards]
                │   ├── <div class="section-container">
                │   │   └── <Projects />                    [Browser-Window Project Panels & Feature Matrices]
                │   ├── <div class="section-container">
                │   │   └── <Experiments />                 [Lab Sandboxes: 3D Tilt, Core Shaders, Themes]
                │   └── <div class="section-container">
                │       └── <Contact />                     [3D Tilting Glass Communication Hub & Direct Actions]
                ├── <Footer />                              [Technical Minimal Footer with Back-to-Top]
                ├── <EasterEggModal />                      [Lazy-Loaded Secret Developer Terminal (Ctrl+K / `)]
                ├── <PrivateControlLayer />                 [Lazy-Loaded Authenticated Global Control Center]
                └── <PerformanceMonitorHUD />               [Developer Live Telemetry & FPS Overlay HUD]
```

---

## 3. Detailed Component-by-Component DOM & Div Structure

---

### 3.1. Main Application Wrapper (`src/App.jsx` & `src/App.css`)

```html
<div class="app-layout">
  <!-- 1. Mouse Ambient Spotlight (Fine-pointer Desktop Only) -->
  <div class="mouse-spotlight-layer" aria-hidden="true"></div>

  <!-- 2. Main Content Container -->
  <main id="main-content">
    <!-- Section wrappers -->
    <div class="section-container">...</div>
  </main>
</div>
```

#### CSS Classes & Variables:
- `.app-layout`: Primary container, `position: relative`, `min-height: 100vh`, `min-height: 100dvh`, `overflow-x: clip`.
- `.mouse-spotlight-layer`: `position: fixed`, radial gradient spotlight reacting to `--mouse-x` and `--mouse-y` coordinates. Hidden on coarse touch devices (`pointer: coarse`).
- `#main-content`: Content host, `z-index: 1`, `position: relative`.
- `.section-container`: Container wrapper standardizing max-width and margins across sections.

---

### 3.2. Background System (`src/components/WebSystemBackground/`)

```html
<div class="web-system-bg-wrapper bg-mode-[digital-web|neural-flow|data-stream|organic-flow|starfield|digital-code-flow]" aria-hidden="true">
  <!-- Parallax Wallpaper Crossfade Surface -->
  <div class="web-system-wallpaper-container [is-day-theme | is-night-theme]" data-active-theme="night">
    <div class="web-system-wallpaper wallpaper-night"></div>
    <div class="web-system-wallpaper wallpaper-day"></div>
  </div>

  <!-- HTML5 Canvas Animated Network Surface -->
  <canvas class="web-system-canvas"></canvas>

  <!-- Environmental Developer Tokens & Fragments (digital-web / data-stream modes) -->
  <div class="bg-env-layer">
    <div class="env-fragment env-react">&lt;React /&gt;</div>
    <div class="env-fragment env-hook">useState()</div>
    <div class="env-fragment env-fetch">fetch(API)</div>
    <div class="env-fragment env-node">node.js // runtime</div>
    <div class="env-fragment env-status">HTTP 200 // OK</div>
    <div class="env-fragment env-route">/api/v1/stream</div>
    <div class="env-fragment env-json">{ status: "active" }</div>

    <!-- Minimalist Mock Browser Artifact -->
    <div class="env-browser-frame">
      <div class="frame-header">
        <span class="frame-dot"></span>
        <span class="frame-dot"></span>
        <span class="frame-dot"></span>
        <span class="frame-url">localhost:5173 / workspace</span>
      </div>
      <div class="frame-lines">
        <div class="frame-line short"></div>
        <div class="frame-line med"></div>
      </div>
    </div>

    <!-- Terminal Command Line Fragment -->
    <div class="env-terminal-fragment">
      <span class="term-prompt">$</span>
      <span class="term-cmd">npm run dev --host</span>
      <span class="term-pulse">_</span>
    </div>
  </div>
</div>
```

#### CSS Classes:
- `.web-system-bg-wrapper`: Fixed full-screen backdrop, `pointer-events: none`, `z-index: -2`.
- `.bg-mode-*`: Dynamic modes: `bg-mode-digital-web`, `bg-mode-neural-flow`, `bg-mode-data-stream`, `bg-mode-organic-flow`, `bg-mode-starfield`, `bg-mode-digital-code-flow`.
- `.web-system-wallpaper-container`: Dual-image container with smooth opacity crossfade on theme changes (`.is-day-theme`, `.is-night-theme`).
- `.wallpaper-night`, `.wallpaper-day`: Background image surfaces with hardware-accelerated parallax transform.
- `.web-system-canvas`: Fullscreen HTML5 2D canvas running throttled particle & network physics (30–60 FPS).
- `.bg-env-layer`, `.env-fragment`: Floating technical code tokens scattered across the ambient background.

---

### 3.3. Application Header & Navbar (`src/components/Navbar/`)

```html
<header class="navbar-header [is-scrolled]">
  <nav class="navbar-container" aria-label="Main Navigation">
    <!-- Brand / Workspace Identifier -->
    <div class="navbar-brand">
      <a href="/resume.pdf" download="Shubham_Dhakre_Resume.pdf" class="navbar-resume-btn" aria-label="Download resume">
        <svg class="navbar-resume-icon">...</svg>
      </a>
      <a href="#hero" class="navbar-brand-name">SHUBHAM</a>
      <span class="navbar-workspace-badge" aria-hidden="true">/workspace</span>
    </div>

    <!-- Desktop Navigation Links List -->
    <ul class="navbar-links" role="menubar">
      <li role="none">
        <a href="#about" role="menuitem" class="nav-link [active]">
          <span class="nav-route-prefix">/</span>about
        </a>
      </li>
      <li role="none">
        <a href="#skills" role="menuitem" class="nav-link [active]">
          <span class="nav-route-prefix">/</span>skills
        </a>
      </li>
      <li role="none">
        <a href="#projects" role="menuitem" class="nav-link [active]">
          <span class="nav-route-prefix">/</span>work
        </a>
      </li>
      <li role="none">
        <a href="#experiments" role="menuitem" class="nav-link [active]">
          <span class="nav-route-prefix">/</span>lab
        </a>
      </li>
      <li role="none">
        <a href="#contact" role="menuitem" class="nav-link [active]">
          <span class="nav-route-prefix">/</span>contact
        </a>
      </li>
    </ul>

    <!-- Action Group: Theme Toggle & Hamburger -->
    <div class="navbar-actions">
      <!-- ThemeToggle Component -->
      <button class="theme-toggle-btn" type="button" aria-label="Switch to Day/Night mode">
        <span class="theme-toggle-track">
          <span class="theme-toggle-thumb [night | day]">🌙</span>
        </span>
        <span class="theme-toggle-text">Night</span>
      </button>

      <!-- Mobile Hamburger Button -->
      <button class="mobile-menu-btn [open]" type="button" aria-expanded="false" aria-label="Open Navigation Menu">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
    </div>
  </nav>

  <!-- Mobile Dropdown Navigation Drawer -->
  <div class="mobile-drawer" role="menu">
    <a href="#about" role="menuitem" class="mobile-link">/about // Background & Mindset</a>
    <a href="#skills" role="menuitem" class="mobile-link">/skills // Tech Constellation</a>
    <a href="#projects" role="menuitem" class="mobile-link">/work // Selected Applications</a>
    <a href="#experiments" role="menuitem" class="mobile-link">/lab // Technical Sandboxes</a>
    <a href="#contact" role="menuitem" class="mobile-link">/contact // Reach Out</a>
  </div>
</header>
```

#### CSS Classes:
- `.navbar-header`: Fixed floating header; gains `.is-scrolled` on window scroll > 30px with condensed height, deeper glass blur, and border shadow.
- `.navbar-container`: Inner flex container centered with glassmorphic styling (`--glass-level-1-bg`).
- `.navbar-brand`, `.navbar-brand-name`, `.navbar-workspace-badge`: Brand typography styling.
- `.navbar-resume-btn`: Direct PDF download button with SVG icon.
- `.navbar-links`: Flex unordered list, handles horizontal alignment.
- `.nav-link`: Nav item link; receives `.active` dynamically via native `IntersectionObserver` section tracking.
- `.nav-route-prefix`: Accent colored `/` prefix.
- `.theme-toggle-btn`, `.theme-toggle-track`, `.theme-toggle-thumb`: Animated switch toggle.
- `.mobile-menu-btn`, `.hamburger-line`: Cross/hamburger animation lines when `.open`.
- `.mobile-drawer`, `.mobile-link`: Full-width mobile overlay drawer.

---

### 3.4. Hero Section (`src/components/Hero/`)

```html
<section id="hero" class="hero-section">
  <div class="hero-container">
    <!-- Left Column: Identity, Status & Actions -->
    <div class="hero-content">
      <!-- Diagnostic Status Pill -->
      <div class="hero-status-pill" title="System Diagnostics: Curious & Active">
        <span class="status-indicator-dot"></span>
        <span class="status-route-indicator">/home</span>
        <span class="status-indicator-divider">//</span>
        <span class="status-indicator-text">SYSTEM ONLINE • CURIOUS • BUILDING</span>
      </div>

      <!-- Main Headline Title -->
      <h1 class="hero-title">
        SHUBHAM <br />
        <span class="hero-title-gradient">DHAKRE</span>
      </h1>

      <!-- Student & Focus Badges -->
      <div class="hero-roles">
        <span class="hero-role-badge">CSE Student</span>
        <span class="hero-role-divider">//</span>
        <span class="hero-role-badge">Tech Enthusiast</span>
      </div>

      <!-- Narrative Mission Summary -->
      <p class="hero-description">
        Learning, building and experimenting with technology. Exploring modern web architecture, interactive interfaces, and applied AI/ML.
      </p>

      <!-- Primary Action Buttons & Social Links -->
      <div class="hero-actions">
        <button type="button" class="btn btn-primary" data-cursor="pointer">
          <span>Explore My Work</span>
          <span class="btn-arrow">→</span>
        </button>

        <button type="button" class="btn btn-glass" data-cursor="pointer">
          <span>Let's Connect</span>
        </button>

        <!-- Social Quick Chips -->
        <div class="hero-social-chips">
          <a href="https://github.com/shubhamdhakre" target="_blank" class="social-chip" title="GitHub Profile">
            <svg>...</svg>
            <span>GitHub</span>
          </a>
          <a href="https://linkedin.com/in/shubhamdhakre" target="_blank" class="social-chip" title="LinkedIn Profile">
            <svg>...</svg>
            <span>LinkedIn</span>
          </a>
        </div>
      </div>

      <!-- Quick Developer Telemetry Micro-Meta -->
      <div class="hero-quick-meta">
        <div class="meta-item">
          <span class="meta-label">LOCATION:</span>
          <span class="meta-value">INDIA</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">FOCUS:</span>
          <span class="meta-value">WEB + AI SYSTEMS</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">MINDSET:</span>
          <span class="meta-value">HANDS-ON LEARNER</span>
        </div>
      </div>
    </div>

    <!-- Right Column: Interactive 3D Three.js Digital Core -->
    <div class="hero-visual">
      <div class="visual-wrapper">
        <div class="three-scene-container core-state-[ready|active|processing|exploring|private]"
             role="button"
             tabindex="0"
             data-cursor="[interact|explore]">
          <canvas>...</canvas>
          <span class="sr-only">Click or press Enter to explore Digital Core system...</span>
          <span class="core-keyboard-hint">ENTER: EXPLORE · SHIFT+ENTER: WORKSPACE</span>
          <!-- Mobile Touch Feedback Progress (during long-press) -->
          <div class="core-touch-feedback" role="status">
            <span class="feedback-label">PRIVATE ACCESS [XX%]</span>
            <div class="feedback-progress-track">
              <div class="feedback-progress-bar" style="width: XX%"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Subtle Scroll Prompt -->
  <div class="scroll-hint">
    <span class="scroll-hint-text">SCROLL TO DISCOVER</span>
    <span class="scroll-hint-bar"></span>
  </div>
</section>
```

#### CSS Classes:
- `.hero-section`: Primary viewport landing container with subtle gradient backing.
- `.hero-container`: 2-column grid (`1.15fr 0.85fr`) collapsing into a single column on smaller viewports (< 960px).
- `.hero-content`: Left typographic stack.
- `.hero-status-pill`: Glass badge with pulsing green/violet status dot. Changes text on mouse hover to `SYSTEM CURIOUS // ENGAGED`.
- `.hero-title`, `.hero-title-gradient`: Large bold hero text with smooth radial-gradient color fill.
- `.hero-roles`, `.hero-role-badge`: Monospace identity badges.
- `.hero-actions`, `.btn-primary`, `.btn-glass`: Glassmorphic and solid gradient call-to-action buttons.
- `.hero-social-chips`, `.social-chip`: Glass anchor tags linking to GitHub and LinkedIn.
- `.hero-quick-meta`, `.meta-item`, `.meta-label`, `.meta-value`: Grid of system telemetry metrics (Location, Focus, Mindset).
- `.hero-visual`, `.visual-wrapper`: Fixed aspect ratio host for the WebGL scene.
- `.three-scene-container`: Canvas container with keyboard focus ring, supporting `.core-state-ready`, `.core-state-active`, etc.
- `.scroll-hint`, `.scroll-hint-bar`: Animated vertical bounce indicator prompting the user to scroll.

---

### 3.5. About Section (`src/components/About/`)

```html
<section id="about" class="about-section">
  <!-- Developer Standard Section Header -->
  <div class="section-header">
    <span class="section-route-tag">/about</span>
    <span class="section-number">01</span>
    <h2 class="section-title">ABOUT ME</h2>
    <div class="section-divider"></div>
    <span class="section-component-pill">&lt;AboutWorkspace /&gt;</span>
  </div>

  <!-- Primary Narrative & Sidebar Grid -->
  <div class="about-grid">
    <!-- Main Narrative Glass Card (reveal-on-scroll) -->
    <div class="about-card about-card-main reveal-on-scroll">
      <div class="about-profile-layout">
        <!-- 3D Tilting Holographic Photo Frame -->
        <div class="about-photo-wrapper">
          <div class="about-photo-frame">
            <div class="photo-ambient-glow" aria-hidden="true"></div>
            <img src="/src/assets/profile.webp" alt="Shubham Dhakre" class="about-profile-photo" />
            <div class="photo-edge-vignette" aria-hidden="true"></div>
            <div class="photo-specular-glare" aria-hidden="true"></div>
            <!-- Precision HUD Corners -->
            <div class="photo-corner photo-corner-tl" aria-hidden="true"></div>
            <div class="photo-corner photo-corner-tr" aria-hidden="true"></div>
            <div class="photo-corner photo-corner-bl" aria-hidden="true"></div>
            <div class="photo-corner photo-corner-br" aria-hidden="true"></div>
          </div>
        </div>

        <!-- Student Perspective Introduction -->
        <div class="about-profile-intro">
          <div class="about-badge">
            <span class="badge-dot"></span>
            STUDENT PERSPECTIVE // COMPUTER ENGINEERING
          </div>
          <h3 class="about-subtitle">Exploring the intersection of web interfaces, systems, and applied machine intelligence.</h3>
          <p class="about-paragraph">...</p>
        </div>
      </div>

      <p class="about-paragraph">...</p>

      <!-- Interactive Mindset Tag Inspection Console -->
      <div class="about-tags-container">
        <div class="tags-header">
          <span class="tags-label">INTERACTIVE MINDSET // CLICK TO INSPECT:</span>
        </div>
        <div class="about-tags-list">
          <button type="button" class="floating-tag [is-selected]">
            <span class="tag-prefix">#</span>
            <span class="tag-text">CURIOUS</span>
          </button>
          <!-- Additional tags: LEARNING, BUILDING, EXPLORING, EXPERIMENTING -->
        </div>

        <!-- Dynamic Mindset Terminal Display Box -->
        <div class="mindset-console-panel">
          <div className="console-panel-header">
            <span class="panel-tag">MINDSET.QUERY: CURIOUS</span>
            <span class="panel-status">OK // 200</span>
          </div>
          <p class="mindset-tagline">"Always interested in understanding how things work under the hood."</p>
          <p class="mindset-detail">...</p>
        </div>
      </div>
    </div>

    <!-- Side Highlights Column -->
    <div class="about-sidebar">
      <!-- 1. Education Sub-Card -->
      <div class="about-card about-card-sub reveal-on-scroll">
        <div class="card-header-icon">🎓</div>
        <div class="card-sub-meta">DEGREE // UNDERGRADUATE</div>
        <h4 class="card-sub-title">Computer Science & Engineering</h4>
        <p class="card-sub-text">Focusing on Data Structures, Algorithms, Database Systems...</p>
      </div>

      <!-- 2. Zero-Bloat Philosophy Sub-Card -->
      <div class="about-card about-card-sub reveal-on-scroll">
        <div class="card-header-icon">⚡</div>
        <div class="card-sub-meta">PHILOSOPHY // ZERO BLOAT</div>
        <h4 class="card-sub-title">Purposeful Tools. Lean Architecture.</h4>
        <p class="card-sub-text">Choosing the right frameworks and libraries...</p>
      </div>

      <!-- 3. Current Experiment Highlight Sub-Card -->
      <div class="about-card about-card-sub highlight-card reveal-on-scroll">
        <div class="card-header-icon">🔬</div>
        <div class="card-sub-meta">CURRENT EXPERIMENT</div>
        <h4 class="card-sub-title">Multimodal Speech & Vision</h4>
        <p class="card-sub-text">Prototyping audio pacing indicators and facial landmarks...</p>
      </div>
    </div>
  </div>

  <!-- Interactive Web & AI Architecture Pipeline -->
  <div class="about-architecture-section reveal-on-scroll">
    <div class="arch-header">
      <div class="arch-header-left">
        <span class="arch-pre-label">SYSTEM ARCHITECTURE VISUALIZATION</span>
        <h3 class="arch-title">How I Structure Web & AI Applications</h3>
      </div>
      <span class="arch-hint">CLICK ANY NODE TO INSPECT ROLE IN PIPELINE</span>
    </div>

    <!-- Horizontal Flow Track of Pipeline Nodes -->
    <div class="arch-pipeline-track">
      <button type="button" class="arch-node-chip [active]">
        <span class="node-step-num">01</span>
        <span class="node-chip-label">CLIENT</span>
        <span class="node-chip-sub">Browser / DOM</span>
      </button>
      <span class="arch-pipeline-arrow" aria-hidden="true">→</span>
      <!-- Nodes: CLIENT → REACT.JS → REST API → NODE / EXPRESS → MONGODB → AI ANALYSIS → FEEDBACK -->
    </div>

    <!-- Active Node Inspection Panel -->
    <div class="arch-detail-box">
      <div class="detail-box-top">
        <div class="detail-title-group">
          <span class="detail-node-name">REACT.JS</span>
          <span class="detail-node-role">Component State & Virtual DOM</span>
        </div>
        <span class="detail-status-badge">PIPELINE STAGE ACTIVE</span>
      </div>
      <p class="detail-desc">Declarative component architecture using hooks...</p>
    </div>
  </div>
</section>
```

#### CSS Classes:
- `.about-section`: Section wrapper with standard vertical padding.
- `.about-grid`: 2-column layout (`1.25fr 0.75fr`).
- `.about-card`, `.about-card-main`, `.about-card-sub`: Glassmorphism Level 1 & Level 2 cards.
- `.about-photo-wrapper`, `.about-photo-frame`: Hardware-accelerated 3D mouse-tracking perspective tilt (`perspective(800px)`).
- `.photo-specular-glare`: Dynamic holographic specular radial gradient overlay moving with cursor.
- `.photo-corner`, `.photo-corner-tl/tr/bl/br`: High-precision technical HUD brackets framing the profile image.
- `.floating-tag`, `.is-selected`: Clickable interactive mindset pill filters.
- `.mindset-console-panel`: Translucent violet glass terminal inspection panel.
- `.about-architecture-section`, `.arch-pipeline-track`, `.arch-node-chip`: Interactive pipeline stages.
- `.arch-detail-box`: Liquid violet glass container displaying currently selected architectural role.

---

### 3.6. Skills Section (`src/components/Skills/`)

```html
<section id="skills" class="skills-section">
  <!-- Section Header -->
  <div class="section-header">
    <span class="section-route-tag">/skills</span>
    <span class="section-number">02</span>
    <h2 class="section-title">TECH STACK CONSTELLATION</h2>
    <div class="section-divider"></div>
    <span class="section-component-pill">&lt;ConstellationGraph /&gt;</span>
  </div>

  <div class="skills-intro">
    <p class="skills-intro-text">...</p>
  </div>

  <!-- 1. Interactive Constellation Network Viewport -->
  <div class="skill-network-container reveal-on-scroll">
    <div class="network-viewport">
      <!-- SVG Connecting Lines Layer -->
      <svg class="constellation-svg" aria-hidden="true">
        <line class="constellation-line [line-active]" x1=".." y1=".." x2=".." y2=".."></line>
      </svg>

      <!-- Absolute Positioned Skill Nodes -->
      <button class="skill-node [node-selected | node-connected | node-dimmed]"
              style="left: XX%; top: YY%;"
              type="button"
              data-cursor="select">
        <span class="node-dot"></span>
        <span class="node-label">React.js</span>
      </button>
    </div>

    <!-- 2. Active Node Liquid Violet Glass Inspection Panel -->
    <div class="skill-inspection-layer" role="region">
      <div class="skill-inspection-panel">
        <div class="inspection-header">
          <div class="inspection-title-group">
            <span class="inspection-node-dot"></span>
            <span class="inspection-title">React.js</span>
            <span class="inspection-badge category-frontend">FRONTEND</span>
          </div>
          <span class="inspection-route-tag">NODE.STATUS // ACTIVE</span>
        </div>

        <div class="inspection-tagline">Component UI Engine</div>
        <p class="inspection-summary">...</p>

        <!-- Topic Badges -->
        <div class="inspection-topics-group">
          <span class="topics-label">CORE CONCEPTS:</span>
          <div class="inspection-topics-list">
            <span class="inspection-topic-chip">Functional Components</span>
            <span class="inspection-topic-chip">Hooks</span>
          </div>
        </div>

        <!-- Architectural Dependencies / Connected Technologies -->
        <div class="inspection-connections-group">
          <span class="connections-label">ARCHITECTURAL CONNECTIONS:</span>
          <div class="inspection-connections-list">
            <button type="button" class="connection-link-chip">
              <span class="conn-arrow">➔</span>
              <span class="conn-name">JavaScript</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 3. Skill Cards Grid Directory -->
  <div class="skills-overview-heading">
    <span class="overview-label">ALL STACK TOPICS // QUICK DIRECTORY</span>
    <div class="overview-divider"></div>
  </div>

  <div class="skills-cards-grid reveal-on-scroll">
    <div class="skill-card [is-active-card]" role="button" tabindex="0">
      <div class="card-top">
        <div class="card-title-row">
          <span class="card-active-status-dot"></span>
          <span class="skill-card-name">React.js</span>
        </div>
        <span class="skill-card-badge category-frontend">FRONTEND</span>
      </div>

      <div class="skill-card-tagline">Component UI Engine</div>
      <p class="skill-card-summary">...</p>

      <div class="skill-card-tags">
        <span class="card-topic-pill">Functional Components</span>
      </div>

      <div class="card-active-relations-bar">
        <span class="relations-hint-label">CONNECTED:</span>
        <span class="relations-hint-names">JavaScript • HTML5 • CSS3</span>
      </div>
    </div>
  </div>
</section>
```

#### CSS Classes:
- `.skill-network-container`: Container wrapping the 2D constellation canvas.
- `.network-viewport`: Host container for SVG lines and absolute `%` coordinate nodes.
- `.constellation-svg`, `.constellation-line`: SVG lines linking skills. Becomes `.line-active` with bright accent glow when either connected node is active.
- `.skill-node`: Interactive button placed by coordinate; states: `.node-selected`, `.node-connected`, `.node-dimmed`.
- `.skill-inspection-layer`, `.skill-inspection-panel`: Level 2 violet-tinted glass surface overlay showing deep metadata.
- `.category-frontend`, `.category-backend`, `.category-database`, `.category-tools`, `.category-exploring`: Category chip colors.
- `.skills-cards-grid`, `.skill-card`: Responsive directory grid with `.is-active-card` synchronization.

---

### 3.7. Projects Section (`src/components/Projects/`)

```html
<section id="projects" class="projects-section">
  <!-- Section Header -->
  <div class="section-header">
    <span class="section-route-tag">/work</span>
    <span class="section-number">03</span>
    <h2 class="section-title">SELECTED PROJECTS</h2>
    <div class="section-divider"></div>
    <span class="section-component-pill">&lt;ProjectsWorkspace /&gt;</span>
  </div>

  <div class="projects-intro reveal-on-scroll">
    <p class="projects-intro-text">...</p>
  </div>

  <div class="projects-list">
    <!-- Project Card Wrapper -->
    <div class="project-card-wrapper reveal-on-scroll">
      <article class="project-window-panel [is-expanded] [is-featured]" data-cursor="inspect">
        <!-- 1. Window Chrome Header Bar -->
        <div class="window-chrome-bar" role="button" tabindex="0" aria-expanded="true">
          <div class="window-controls">
            <span class="window-dot dot-red"></span>
            <span class="window-dot dot-yellow"></span>
            <span class="window-dot dot-green"></span>
          </div>

          <div class="window-address-tab">
            <span class="window-file-icon">⚡</span>
            <span class="window-file-path">src/projects/ai-interview-coach.jsx</span>
          </div>

          <div class="window-right-meta">
            <span class="window-status-pill status-active">
              <span class="status-dot"></span>
              In Development
            </span>
            <div class="window-expand-toggle">−</div>
          </div>
        </div>

        <!-- 2. Main Preview Body -->
        <div class="project-panel-body">
          <div class="project-body-top">
            <div class="project-number-badge">PROJECT // 01</div>
            <span class="project-route-badge">GET /api/ai-interview-coach</span>
          </div>

          <h3 class="project-title">AI Interview Coach</h3>
          <p class="project-tagline">Multimodal Interview Simulation & Feedback Assistant</p>
          <p class="project-description">...</p>

          <div class="project-tech-list">
            <span class="tech-badge">React.js</span>
            <span class="tech-badge">Node.js</span>
            <span class="tech-badge">MediaPipe</span>
          </div>
        </div>

        <!-- 3. Action Toolbar -->
        <div class="project-actions">
          <button type="button" class="project-btn project-btn-expand">
            Hide Architecture Breakdown
          </button>
          <a href="..." target="_blank" class="project-btn project-btn-link">
            <span>GitHub</span>
            <span class="ext-arrow">↗</span>
          </a>
          <a href="..." target="_blank" class="project-btn project-btn-link demo">
            <span>Live Workspace</span>
            <span class="ext-arrow">↗</span>
          </a>
        </div>

        <!-- 4. Deep-Dive Architecture Breakdown (When Expanded) -->
        <div class="project-expanded-content">
          <div class="expanded-divider"></div>

          <!-- Section 01: Problem Statement -->
          <div class="expanded-problem-block">
            <div class="block-header">
              <span class="block-num">01 //</span>
              <span class="block-label">THE PROBLEM & CHALLENGE</span>
            </div>
            <p class="block-body-text">...</p>
          </div>

          <!-- Section 02: Approach & Solution -->
          <div class="expanded-approach-panel">
            <div class="block-header">
              <span class="block-num">02 //</span>
              <span class="block-label">WHAT I BUILT & ARCHITECTURAL APPROACH</span>
            </div>
            <p class="block-body-text">...</p>
          </div>

          <!-- Section 03: Tech Breakdown -->
          <div class="expanded-stack-panel">
            <div class="block-header">
              <span class="block-num">03 //</span>
              <span class="block-label">ARCHITECTURE & STACK INTERACTION</span>
            </div>
            <p class="block-body-text">...</p>
          </div>

          <!-- Section 04: Feature Matrix & Scope -->
          <div class="expanded-features-panel">
            <div class="block-header">
              <span class="block-num">04 //</span>
              <span class="block-label">FEATURE MATRIX & IMPLEMENTATION SCOPE</span>
            </div>
            <div class="features-list">
              <div class="feature-item">
                <div class="feature-header">
                  <span class="feature-name">Voice & Speech Analysis</span>
                  <span class="feature-badge state-in-development">In Development</span>
                </div>
                <p class="feature-note">Exploring pitch, volume consistency...</p>
              </div>
            </div>
          </div>

          <!-- Section 05: Current Roadmap & Status -->
          <div class="expanded-roadmap-panel">
            <div class="roadmap-header">
              <span class="roadmap-dot"></span>
              <span class="roadmap-label">05 // CURRENT STATUS & EXPERIMENTAL ROADMAP</span>
            </div>
            <p class="roadmap-text">...</p>
          </div>
        </div>
      </article>
    </div>
  </div>
</section>
```

#### CSS Classes:
- `.project-window-panel`: MacOS/IDE window emulation with rounded glass frame, border glow, and transition handling.
- `.is-expanded`: Expands accordion containing the 5-point technical analysis.
- `.is-featured`: Flagship border highlight styling.
- `.window-chrome-bar`, `.window-controls`, `.dot-red/yellow/green`: Top titlebar.
- `.window-address-tab`, `.window-file-path`: Code file path aesthetic.
- `.window-status-pill`: Status indicator (`.status-active`, `.status-completed`, `.status-concept`).
- `.project-expanded-content`: Level 2 & Level 3 glass sub-panels (`.expanded-problem-block`, `.expanded-approach-panel`, `.expanded-stack-panel`, `.expanded-features-panel`, `.expanded-roadmap-panel`).
- `.feature-badge`: Feature readiness badges (`state-in-development`, `state-implemented`, `state-exploring`, `state-planned`).

---

### 3.8. Experiments Section (`src/components/Experiments/`)

```html
<section id="experiments" class="experiments-section">
  <!-- Section Header -->
  <div class="section-header">
    <span class="section-route-tag">/lab</span>
    <span class="section-number">04</span>
    <h2 class="section-title">LAB / EXPERIMENTS</h2>
    <div class="section-divider"></div>
    <span class="section-component-pill">&lt;LabSandbox /&gt;</span>
  </div>

  <div class="experiments-intro reveal-on-scroll">
    <p class="experiments-intro-text">...</p>
  </div>

  <div class="experiments-layout">
    <!-- Left Column: Experiment Selector Cards -->
    <div class="experiments-selector">
      <div class="exp-card reveal-on-scroll [is-selected]" role="button" tabindex="0">
        <div class="exp-card-top">
          <span class="exp-number">EXPERIMENT_01</span>
          <span class="exp-status-indicator">STATUS: ACTIVE</span>
        </div>
        <h3 class="exp-title">Interactive Glass UI</h3>
        <p class="exp-concept-snippet">...</p>
        <div class="exp-tags">
          <span class="exp-tag">CSS 3D</span>
          <span class="exp-tag">Glassmorphism</span>
        </div>
      </div>
      <!-- Additional Cards: 02 Three.js Digital Core, 03 Mouse Reactive Background, 04 Theme System -->
    </div>

    <!-- Right Column: Interactive Live Sandbox Stage -->
    <div class="experiments-stage">
      <div class="stage-glass-panel reveal-on-scroll">
        <div class="stage-header">
          <span class="stage-terminal-tag">LIVE SANDBOX // EXPERIMENT_01 // STATUS: ACTIVE</span>
          <span class="stage-title">Interactive Glass UI</span>
        </div>

        <div class="stage-viewport">
          <!-- Sandbox 01: 3D Tilt Viewport -->
          <div class="sandbox-tilt-container">
            <div class="tilt-glass-card" style="transform: perspective(800px) rotateX(...) rotateY(...)">
              <div class="tilt-glare"></div>
              <span class="tilt-icon">✨</span>
              <h4>Move Your Cursor Over This Panel</h4>
              <p>Real-time CSS 3D tilt calculation...</p>
              <div class="tilt-data">
                <span>rotX: 4.2°</span>
                <span>rotY: -3.8°</span>
              </div>
            </div>
          </div>

          <!-- Sandbox 02: Three.js Mockup Controls -->
          <div class="sandbox-core-container">
            <div class="core-visualizer">
              <div class="core-mockup [mode-wireframe | mode-pulsing | mode-hyper]">
                <div class="core-ring r1"></div>
                <div class="core-ring r2"></div>
                <div class="core-center"></div>
              </div>
            </div>
            <div class="sandbox-controls">...</div>
          </div>

          <!-- Sandbox 03: Mouse Reactive Background Tracker -->
          <div class="sandbox-spotlight-container">
            <div class="spotlight-demo-area">
              <div class="spotlight-reticle">...</div>
            </div>
            <input type="range" class="sandbox-slider" min="350" max="900" />
          </div>

          <!-- Sandbox 04: Theme Token Matrix -->
          <div class="sandbox-theme-container">
            <div class="theme-matrix">
              <div class="matrix-row">
                <span class="matrix-key">--accent-primary</span>
                <span class="matrix-swatch primary"></span>
                <span class="matrix-val">#6D5BA6</span>
              </div>
            </div>
          </div>
        </div>

        <div class="stage-footer">
          <span class="stage-footer-text">...</span>
        </div>
      </div>
    </div>
  </div>
</section>
```

#### CSS Classes:
- `.experiments-layout`: 2-column sandbox playground layout (`0.9fr 1.1fr`).
- `.exp-card`, `.is-selected`: Selectable cards switching active playground tab.
- `.stage-glass-panel`, `.stage-header`, `.stage-viewport`: Live interactive testbed with dynamic rendering.
- `.tilt-glass-card`, `.tilt-glare`, `.tilt-data`: Real-time coordinate feedback demonstration.
- `.core-visualizer`, `.core-mockup`, `.sandbox-btn`: Procedural core control toggles.
- `.sandbox-slider`: Range input slider bound directly to `--spotlight-size`.
- `.theme-matrix`, `.matrix-swatch`: CSS variable swatch token inspector.

---

### 3.9. Contact Section (`src/components/Contact/`)

```html
<section id="contact" class="contact-section">
  <!-- Section Header -->
  <div class="section-header">
    <span class="section-route-tag">/contact</span>
    <span class="section-number">05</span>
    <h2 class="section-title">CONNECT</h2>
    <div class="section-divider"></div>
    <span class="section-component-pill">&lt;ContactInterface /&gt;</span>
  </div>

  <div class="contact-reveal-wrapper reveal-on-scroll">
    <!-- 3D Tilting Glass Card with Holographic Specular Glare -->
    <div class="contact-card contact-tilt-card [is-tilting]" style="transform: perspective(...) rotateX(...) rotateY(...)">
      <div class="contact-tilt-glare" style="opacity: 0.35; --glare-x: 52%; --glare-y: 48%;"></div>

      <div class="contact-badge">
        <span class="badge-dot"></span>
        COMMUNICATION // OPEN TO CONNECT
      </div>

      <h3 class="contact-heading">LET'S BUILD SOMETHING INTERESTING.</h3>
      <p class="contact-subtext">If you want to discuss a project, collaboration, internship opportunity...</p>

      <!-- Action Buttons Grid -->
      <div class="contact-buttons-group">
        <!-- Direct Email Mailto -->
        <a href="mailto:ssdhakre93@gmail.com" class="contact-btn contact-btn-primary" title="Send an email">
          <span class="contact-btn-icon">✉</span>
          <span>Send Email</span>
        </a>

        <!-- Interactive Copy Email Clipboard Button -->
        <button type="button" class="contact-btn contact-btn-glass" title="Copy email address to clipboard">
          <span class="contact-btn-icon">⧉</span>
          <span>Copy Email</span>
        </button>

        <!-- GitHub External Profile -->
        <a href="https://github.com/shubhamdhakre" target="_blank" class="contact-btn contact-btn-glass">
          <span class="contact-btn-icon">⚡</span>
          <span>GitHub</span>
          <span class="contact-btn-arrow">↗</span>
        </a>

        <!-- LinkedIn External Profile -->
        <a href="https://linkedin.com/in/shubhamdhakre" target="_blank" class="contact-btn contact-btn-glass">
          <span class="contact-btn-icon">💼</span>
          <span>LinkedIn</span>
          <span class="contact-btn-arrow">↗</span>
        </a>
      </div>

      <!-- Quick Communication Tags -->
      <div class="contact-meta-footer">
        <span class="meta-pill">Open for Discussions</span>
        <span class="meta-pill">Student Collaboration</span>
        <span class="meta-pill">Tech Exploration</span>
      </div>
    </div>
  </div>
</section>
```

#### CSS Classes:
- `.contact-card`, `.contact-tilt-card`: Central contact card running hardware-accelerated 3D mouse tilt.
- `.is-tilting`: Active mouse engagement state with smooth spring-physics return on pointer leave.
- `.contact-tilt-glare`: Specular glare gradient dynamically placed via `--glare-x` and `--glare-y`.
- `.contact-buttons-group`: 4-button responsive interactive action grid.
- `.contact-btn-primary`, `.contact-btn-glass`: Primary gradient & glassmorphic buttons with clipboard fallback handler.
- `.contact-meta-footer`, `.meta-pill`: Bottom status labels.

---

### 3.10. Footer (`src/components/Footer/`)

```html
<footer class="footer-container">
  <div class="footer-content">
    <div class="footer-left">
      <p class="footer-copyright">© 2026 Shubham Dhakre</p>
      <span class="footer-branch-pill">
        <span class="branch-dot"></span>
        branch: main
      </span>
    </div>

    <p class="footer-tech">Built with React, JavaScript, CSS & Three.js.</p>

    <!-- Scroll Back To Top Button -->
    <button type="button" class="footer-top-btn" title="Scroll back to top" aria-label="Back to top">
      <span>Top</span>
      <span class="top-arrow">↑</span>
    </button>
  </div>
</footer>
```

#### CSS Classes:
- `.footer-container`: Full-width technical footer with glass border.
- `.footer-content`: Flexbox layout separating copyright, stack description, and back-to-top trigger.
- `.footer-branch-pill`: Git branch status badge (`branch: main`).
- `.footer-top-btn`: Smooth-scrolling top anchor button.

---

### 3.11. Persistent Heads-Up Displays (HUDs)

#### A. WorkspaceHUD (`src/components/WorkspaceHUD/`)
*Persistent fixed bottom-left HUD tracking session uptime and current section focus.*

```html
<aside class="workspace-hud" aria-label="Session and Context Status">
  <div class="hud-pill">
    <!-- Heartbeat Status & Live Uptime Counter -->
    <div class="hud-heartbeat-group">
      <span class="hud-heartbeat-dot"></span>
      <span class="hud-uptime-label">SESSION</span>
      <span class="hud-uptime-value">00:04:12</span>
    </div>

    <div class="hud-divider" aria-hidden="true"></div>

    <!-- Active Route & Dynamic Focus Tag -->
    <div class="hud-context-group">
      <span class="hud-exploring-tag">/workspace</span>
      <span class="hud-focus-label">CSE STUDENT // TECH ENTHUSIAST</span>
    </div>
  </div>
</aside>
```

#### B. DeveloperStatus (`src/components/DeveloperStatus/`)
*Persistent fixed bottom-right HUD displaying live local time, date, and randomized engineering thoughts.*

```html
<!-- Expanded View -->
<aside class="developer-status-fixed" role="region" aria-label="Persistent Developer Status">
  <!-- Top Bar & Minimize Control -->
  <div class="status-top-bar">
    <div class="status-meta-badge">
      <span class="status-live-dot"></span>
      <span class="status-system-label">SYSTEM // LOCAL TIME</span>
    </div>
    <button type="button" class="status-toggle-btn" title="Minimize to status pill" aria-label="Minimize">−</button>
  </div>

  <!-- Clock & Date Display -->
  <div class="status-clock-block">
    <div class="status-time-row">
      <span class="status-time-digits">01:20:45</span>
      <span class="status-tz-pill">IST</span>
    </div>
    <div class="status-date-label">THURSDAY, 09 OCTOBER 2026</div>
  </div>

  <div class="status-card-divider" aria-hidden="true"></div>

  <!-- Developer Thought Reflection Block -->
  <div class="status-thought-block">
    <div class="thought-meta-row">
      <span class="thought-section-label">DEVELOPER THOUGHT #04</span>
      <button type="button" class="thought-refresh-btn" aria-label="New Thought">
        <span class="refresh-label">NEW THOUGHT</span>
        <span class="refresh-symbol">↻</span>
      </button>
    </div>
    <div class="thought-quote-area [thought-fade-out]">
      <p class="thought-quote-text">“Build something you understand, not just something that works.”</p>
    </div>
  </div>
</aside>

<!-- Minimized View (Collapses automatically on tablets & laptops < 1280px) -->
<aside class="developer-status-fixed is-mini" role="region">
  <span class="status-live-dot"></span>
  <span class="mini-time">01:20:45</span>
  <span class="mini-thought-tag">THOUGHT #04</span>
  <button type="button" class="mini-expand-btn">↗</button>
</aside>
```

#### C. CustomCursor (`src/components/CustomCursor/`)
*Hardware-accelerated desktop pointer replacing default OS cursor on fine hover devices.*

```html
<div class="custom-cursor [is-hovering] [is-badge]" style="opacity: 1; transform: translate3d(XXpx, YYpx, 0);" aria-hidden="true">
  <div class="cursor-dot"></div>
  <!-- Dynamic context badge: INSPECT | OPEN | INTERACT | SELECT | EXPLORE | VIEW | PRIVATE -->
  <span class="cursor-label">INSPECT</span>
</div>
```

#### D. PerformanceMonitorHUD (`src/components/PerformanceMonitor/`)
*Floating developer telemetry overlay.*

```html
<aside class="perf-monitor-overlay" aria-label="Developer Performance Monitor">
  <div class="perf-hud-header">
    <span class="perf-hud-title">DEV // PERFORMANCE</span>
    <button type="button" class="perf-hud-close" aria-label="Close">✕</button>
  </div>
  <div class="perf-hud-row">
    <span class="perf-hud-key">FPS</span>
    <span class="perf-hud-val perf-fps-badge perf-fps-good">60 FPS</span>
  </div>
  <div class="perf-hud-row">
    <span class="perf-hud-key">FRAME TIME</span>
    <span class="perf-hud-val">16.6 ms</span>
  </div>
  <div class="perf-hud-row">
    <span class="perf-hud-key">DEVICE DPR</span>
    <span class="perf-hud-val">1.5x</span>
  </div>
  <div class="perf-hud-row">
    <span class="perf-hud-key">MODE</span>
    <span class="perf-hud-val">BALANCED</span>
  </div>
  <div class="perf-hud-row">
    <span class="perf-hud-key">3D DIGITAL CORE</span>
    <span class="perf-hud-val">ONLINE</span>
  </div>
</aside>
```

---

### 3.12. Secret & Developer Modals

#### A. EasterEggModal (`src/components/EasterEgg/`)
*Hidden dark glass interactive terminal opened via `Ctrl+K`, `Cmd+K`, or backtick (`).*

```html
<div class="easter-modal-overlay" role="dialog" aria-modal="true">
  <div class="easter-modal-console">
    <!-- Window Titlebar -->
    <div class="console-titlebar">
      <div class="console-traffic-lights">
        <button type="button" class="dot red" aria-label="Close terminal"></button>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <span class="console-title">shubham-terminal // zsh</span>
      <button type="button" class="console-close-btn" aria-label="Close terminal">✕</button>
    </div>

    <!-- Console Output & Interactive Input -->
    <div class="console-body">
      <div class="console-preset-block">
        <p class="console-line sys">SYSTEM OVERRIDE</p>
        <p class="console-line cmd">&gt; whoami</p>
        <p class="console-line out">Shubham Dhakre</p>
      </div>

      <div class="console-dynamic-history">
        <p class="console-line user">&gt; help</p>
        <p class="console-line output">Commands: whoami, status, curiosity, current_focus, build, admin, clear, exit</p>
      </div>

      <form class="console-input-row">
        <span class="prompt-symbol">&gt;</span>
        <input id="developer-terminal-input" type="text" class="console-input" placeholder="type a command..." />
      </form>
    </div>
  </div>
</div>
```

#### B. PrivateControlLayer (`src/components/PrivateControlLayer/`)
*Password-protected Global Control Center modal for live site configuration.*

```html
<div class="private-workspace-overlay" role="dialog" aria-modal="true" aria-label="Global Control Center">
  <div class="private-workspace-panel" data-cursor="private">
    <!-- Header -->
    <div class="private-panel-header">
      <div class="header-identity">
        <span class="header-badge">PRIVATE / GLOBAL SYSTEM CONTROL</span>
        <h2>GLOBAL CONTROL CENTER</h2>
      </div>
      <div class="header-meta">
        <div class="system-status-indicator">
          <span class="system-dot [live | locked]"></span>
          <span>ADMIN LIVE // v1</span>
        </div>
        <button type="button" class="header-close-btn">ESC // CLOSE</button>
      </div>
    </div>

    <!-- Unauthenticated Login Screen -->
    <div class="auth-prompt-container">
      <div class="auth-card">
        <div class="auth-header">
          <span class="auth-lock-icon">🔒</span>
          <h3>SHUBHAM-CORE AUTHENTICATION</h3>
          <p class="auth-desc">Enter developer password to access global performance controls...</p>
        </div>
        <form class="auth-form">
          <div class="field-group">
            <label class="field-label" for="admin-pass-input">DEVELOPER PASSWORD</label>
            <div class="password-input-wrap">
              <input id="admin-pass-input" type="password" class="field-input password-field" />
              <button type="button" class="toggle-pass-visibility-btn">SHOW</button>
            </div>
          </div>
          <button type="submit" class="btn-auth-submit">AUTHENTICATE & UNLOCK</button>
        </form>
      </div>
    </div>

    <!-- Authenticated Dashboard View (10 Tabs) -->
    <!-- Tabs: Global Control | Performance | Themes | Backgrounds | Notes | Console | Metrics | Log | Scroll Reveal | Contact Tilt -->
    <div class="private-panel-tabs" role="tablist">
      <button class="tab-btn active" role="tab">🌐 Global Website Control</button>
      <button class="tab-btn" role="tab">⚡ Global Performance</button>
      <button class="tab-btn" role="tab">🎨 Global Themes</button>
      <button class="tab-btn" role="tab">🌌 Global Backgrounds</button>
      <button class="tab-btn" role="tab">📝 Content & Notes</button>
      <button class="tab-btn" role="tab">💻 Developer Console</button>
      <button class="tab-btn" role="tab">📊 Diagnostics & Metrics</button>
      <button class="tab-btn" role="tab">📜 Interaction Log</button>
      <button class="tab-btn" role="tab">✨ Scroll Reveal</button>
      <button class="tab-btn" role="tab">🧊 Contact 3D Tilt</button>
    </div>

    <div class="private-panel-content">
      <!-- Active Tab Pane -->
    </div>
  </div>
</div>
```

---

## 4. Design System & CSS Token Architecture

The design language uses a **3-Tier Liquid Violet Glass Material System** built on native CSS variables, with complete support for multiple color themes, backdrop filters, and hardware acceleration.

### 4.1. The 3-Tier Liquid Glass Material Hierarchy

| Level | Purpose | Background | Border | Shadow / Glow |
|---|---|---|---|---|
| **Level 1** | Transparent base (Navbar, Main Cards, HUD pills) | `rgba(255, 255, 255, 0.035)` | `rgba(255, 255, 255, 0.08)` | `0 18px 45px -10px rgba(0,0,0,0.65)` |
| **Level 2** | Violet-tinted surface (Inspection panels, sub-cards) | `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(109,91,166,0.08) 100%)` | `rgba(109, 91, 166, 0.22)` | `0 16px 40px -10px rgba(0,0,0,0.70)` |
| **Level 3** | Active / highlighted elements (Selected nodes, active cards) | `rgba(109, 91, 166, 0.16)` | `rgba(139, 123, 184, 0.42)` | `0 20px 50px -10px rgba(109,91,166,0.35)` |

### 4.2. Supported Themes (`[data-theme]`)

1. **`night` (Default):** Deep midnight navy (`#080B16`) with muted liquid violet accents (`#806EC0`).
2. **`day`:** Refined daylight lavender & crisp violet glass (`#F3F2F7`).
3. **`technical`:** Deep cyan-slate developer station (`#070B12`, accent `#0284C7`).
4. **`nature`:** Muted organic forest sage & moss tones (`#070F0D`, accent `#2D6A4F`).
5. **`minimal`:** Pure slate & platinum restraint (`#0A0C10`, accent `#64748B`).
6. **`aurora`:** Cosmic teal-magenta atmosphere (`#060914`, accent `#0D9488`).
7. **`monochrome`:** High-contrast charcoal, pure silver & white (`#070707`, accent `#525252`).

### 4.3. Dynamic 3D Scroll Reveal Animation System

- **Native CSS Scroll-Driven Timelines:** Uses `@supports (animation-timeline: view())` for zero-overhead GPU compositor animations without main-thread scroll listeners.
- **IntersectionObserver Fallback:** Automatically switches to an observer-driven class toggle (`.is-revealed`) on browsers lacking scroll-timeline support.
- **Configurable Styles:**
  - `3d-circle` (Default): Perspective 3D rotation with depth scaling (`perspective(1400px) rotateY(-30deg) scale(0.8)`).
  - `3d-fade`: Subtle perspective rotation with opacity ramp.
  - `fade-up`: Vertical displacement transform (`translateY(24px)`).
  - `subtle-scale`: Subtle element scaling (`scale(0.94)`).

---

## 5. Backend & Serverless API Architecture

The application runs a lightweight Express 5 server deployed both locally via Node.js (`server/index.js`) and on Vercel as serverless functions (`api/index.js` via `vercel.json`).

### 5.1. Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/site-settings` | Fetches active global site configuration, theme, and telemetry preferences | No (Public) |
| `POST` | `/api/admin/auth/login` | Validates developer password using bcrypt; issues secure HTTP-only cookie | No (Rate Limited) |
| `GET` | `/api/admin/auth/session` | Validates session token and active authentication state | Yes (Cookie / Bearer) |
| `POST` | `/api/admin/auth/logout` | Revokes admin token and clears cookies | Yes |
| `GET` | `/api/admin/site-settings` | Fetches full server settings for administrative dashboard | Yes |
| `POST` | `/api/admin/site-settings` | Persists new global configuration to server JSON / Vercel KV store | Yes |

### 5.2. Dual-Storage Precedence Architecture

The frontend respects a strict 3-tier precedence model for settings & themes:
1. **Local Preview Mode Active:** Isolated strictly to current browser via `localStorage.portfolio_private_workspace`.
2. **Explicit Visitor Toggle:** Preserved for the current browser session.
3. **Authoritative Server Configuration:** Synchronized globally to all visitors via `/api/site-settings`.

---

## 6. Developer Shortcuts & Easter Eggs

- **Easter Egg Terminal:**
  - Keyboard: `Ctrl + K`, `Cmd + K`, or the backtick key (`` ` ``).
  - Click Trigger: Click the `</>` developer badge in the navbar 5 times in rapid succession.
- **Global Administrative Control Center:**
  - Keyboard: `Shift + Enter` while focused on the 3D Digital Core.
  - Mouse: `Shift + Click` or `Shift + Double-Click` on the Three.js canvas in the Hero section.
  - Mobile / Tablet: Long-press (1.5 seconds) on the 3D Digital Core in the Hero section with live progress bar feedback.
  - Terminal Command: Type `admin`, `control`, or `private` inside the Easter Egg modal.

---

*Generated for Shubham Dhakre's Portfolio & Workspace repository.*
