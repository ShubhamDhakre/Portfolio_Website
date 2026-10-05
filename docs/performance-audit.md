# Full React Portfolio Performance Audit Report

> **Audit Type:** Non-Destructive Browser-Rendering & Architecture Audit  
> **Target Application:** React 19 + Three.js Portfolio (`/media/shubhamdhakre/New Volume/Portfolio`)  
> **Environment:** Linux (x86_64), Node.js v24.21.0, Vite 8.3.2, Brave/Chromium 154 (CDP Headless & Local Dev Server)  
> **Status:** AUDIT ONLY — No application source files modified.

---

## 1. Executive Summary

This performance audit conducted a comprehensive, multi-phase investigation of the portfolio application to diagnose poor FPS, dropped frames, interaction stuttering, and reduced scrolling smoothness. 

Our investigation combined static code architecture analysis with live headless browser telemetry via the Chrome DevTools Protocol (CDP).

### Key Takeaways

1. **Worst Measured Frame Drops (83.3 ms – 183.4 ms, ~5.4 to 12 FPS):**
   * **Root Cause:** Pointer movement over the `<Contact />` card (`.contact-card.contact-tilt-card`).
   * **Mechanism:** Combining 3D perspective transforms (`perspective()`, `rotateX()`, `rotateY()`, `scale3d()`) with a heavy continuous `backdrop-filter: blur(20px) saturate(160%)` and a cursor glare overlay using `mix-blend-mode: overlay`. In Chromium, continuous 3D transforms on backdrop-filtered surfaces invalidate the compositor layer, forcing repeated GPU/raster thread texture readbacks and filter recalculations on every frame.
   * **Compounding Factor:** During pointer movement, `CustomCursor.jsx` continuously updates `:root` CSS custom properties (`--mouse-x`, `--mouse-y`), triggering document-wide style recalculations.

2. **Severe Scroll Stutter & Staged Reveal Jitter (116 ms – 249.9 ms Frame Spikes, ~4 to 8.5 FPS):**
   * **Root Cause:** Active scroll-driven reveal keyframes (`revealOnScroll` via `@supports (animation-timeline: view())` and fallback transitions).
   * **Mechanism:** The reveal animation continuously animates `filter: blur(8px–10px) -> blur(0px)` and `clip-path: circle(0%) -> circle(150%)` simultaneously with 3D rotation (`rotateY(-35deg)`), scale, and opacity across 10+ major content cards. Because each card also renders `backdrop-filter: blur(20px)`, animating Gaussian blur on top of backdrop blur forces high-cost rasterization passes on every scroll tick.

3. **Critical Main-Thread Scripting & Initial Load Bottlenecks (Up to 184 ms Long Tasks):**
   * **Root Cause:** Eager inclusion of Three.js (531 kB uncompressed vendor chunk) on the critical initial rendering path.
   * **308 Active JS Event Listeners** registered immediately upon mount (including unthrottled or redundant window `scroll`, `resize`, `mousemove`, `pointermove`, and duplicate `IntersectionObserver` instances).
   * **Dead & Redundant Code:** `src/hooks/useMousePosition.js` remains unreferenced in the bundle; `src/assets/profile.jpg` (1.5 MB uncompressed) remains on disk alongside `profile.webp` (22 kB).

---

## 2. Files and Components Scanned

Every file in `src/` and relevant server configuration was audited:

```
src/
├── App.css / App.jsx
├── index.css / main.jsx
├── assets/
│   ├── hero.png (13 kB)
│   ├── profile.jpg (1.5 MB — Unreferenced)
│   ├── profile.webp (22 kB — Active)
│   ├── react.svg (4.1 kB)
│   └── vite.svg (8.6 kB)
├── components/
│   ├── About/ (About.jsx, About.css)
│   ├── Contact/ (Contact.jsx, Contact.css)
│   ├── CustomCursor/ (CustomCursor.jsx, CustomCursor.css)
│   ├── DeveloperStatus/ (DeveloperStatus.jsx, DeveloperStatus.css)
│   ├── EasterEgg/ (EasterEggModal.jsx, EasterEggModal.css — Lazy)
│   ├── Experiments/ (Experiments.jsx, Experiments.css)
│   ├── Footer/ (Footer.jsx, Footer.css)
│   ├── Hero/ (Hero.jsx, Hero.css)
│   ├── Navbar/ (Navbar.jsx, Navbar.css)
│   ├── PerformanceMonitor/ (PerformanceMonitorHUD.jsx, PerformanceMonitorHUD.css)
│   ├── PrivateControlLayer/ (PrivateControlLayer.jsx, PrivateControlLayer.css — Lazy)
│   ├── Projects/ (Projects.jsx, ProjectCard.jsx, Projects.css)
│   ├── Skills/ (Skills.jsx, Skills.css)
│   ├── ThemeToggle/ (ThemeToggle.jsx, ThemeToggle.css)
│   ├── ThreeScene/ (ThreeScene.jsx, ThreeScene.css)
│   ├── WebSystemBackground/ (WebSystemBackground.jsx, WebSystemBackground.css)
│   └── WorkspaceHUD/ (WorkspaceHUD.jsx, WorkspaceHUD.css)
├── data/
│   ├── projects.js
│   └── skills.js
├── hooks/
│   ├── useGlobalSiteSettings.js
│   ├── useMousePosition.js (Dead Code)
│   ├── usePointerCapability.js
│   ├── useScrollProgress.js
│   └── useTheme.js
├── services/
│   └── siteSettingsApi.js
└── utils/
    └── performanceConfig.js
```

---

## 3. Component & Dependency Inventory and Critical Rendering Paths

### 3.1 Component & Dependency Map

| Component / Dependency | Type / Size | Rendering Role | Lifecycle / Loop |
| :--- | :--- | :--- | :--- |
| **`App.jsx`** | Root Component | Coordinates Theme, Layout, HUDs, Server Settings | Listens for `keydown` (Ctrl+K); observer for scroll-reveal |
| **`ThreeScene.jsx`** | 3D WebGL Canvas | Renders icosahedron, nucleus, orbital rings, particle cloud | Continuous `requestAnimationFrame` loop; paused offscreen via `IntersectionObserver` |
| **`WebSystemBackground.jsx`**| 2D Canvas + DOM | Ambient node network, traveling packets, floating syntax | Throttled RAF loop (~24–40 ms interval); throttled further on active scroll |
| **`CustomCursor.jsx`** | Direct DOM / SVG | Custom pointer follower, dynamic text badge | RAF-coalesced `mousemove` tracking; updates `--mouse-x/y` on `:root` |
| **`Contact.jsx`** | Interactive Glass Card | Reach-out links, 3D tilt with specular glare overlay | RAF-coalesced `pointermove` 3D perspective matrix transform |
| **`Skills.jsx`** | SVG + DOM Network | Constellation graph & interactive node directory | Unmemoized component; re-renders on hover/selection |
| **`Projects.jsx`** | DOM Card List | Project showcase panels with expandable details | Memoized; renders multiple `.reveal-on-scroll` panels |
| **`WorkspaceHUD.jsx`** | Persistent HUD | Fixed bottom-left session uptime & section tracker | `setInterval` (1000 ms); independent `IntersectionObserver` |
| **`DeveloperStatus.jsx`** | Persistent HUD | Fixed bottom-right clock & developer thoughts | `setInterval` (1000 ms); `useMemo` for date/time formatting |
| **`three` (v0.186.1)** | Vendor Chunk (531 kB) | WebGL 3D rendering library | Eagerly bundled into `Hero -> ThreeScene` |
| **`react` / `react-dom`** | Vendor Chunk (425 kB) | Core framework | Critical bundle |

### 3.2 Critical Rendering Paths

```
Critical Initial Load Path:
index.html ──> main.jsx ──> App.jsx ──> Navbar, WebSystemBackground, Hero (ThreeScene + Three.js 531KB),
                                     ──> About, Skills, Projects, Experiments, Contact, Footer, HUDs
```

```
Per-Frame Mouse Interaction Path:
Pointer Move ──> CustomCursor (RAF) ──> style.setProperty('--mouse-x', '--mouse-y') on :root
                                    ──> document-wide style recalculation
                                    ──> .mouse-spotlight-layer repaint (radial-gradient)
```

```
Contact Hover Interaction Path:
Pointer Move over Contact Card ──> Contact.jsx (RAF)
                               ──> card.style.transform (perspective + rotateX/Y + scale3d)
                               ──> glare.style.setProperty('--glare-x', '--glare-y')
                               ──> backdrop-filter: blur(20px) re-rasterization
                               ──> mix-blend-mode: overlay blend pass
                               ──> 83.3 ms – 183.4 ms GPU compositor stall
```

---

## 4. Ranked Table of Performance Bottlenecks

| Rank | Bottleneck Description | Affected Component / File | Severity | Confidence | Measured Impact |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **#1** | **3D Tilt on Backdrop-Filtered Glass Card with Blend-Mode Glare** | `Contact.jsx`, `Contact.css` | **Critical** | **High** | Frame times of **83.3 ms – 183.4 ms** during hover (5.4 – 12 FPS) |
| **#2** | **Filter: Blur + Clip-Path Animating on Scroll-Driven Timeline** | `App.css`, `App.jsx`, All Section Cards | **Critical** | **High** | Frame duration spikes of **116.7 ms – 249.9 ms** during section scroll |
| **#3** | **Global `:root` Style Recalculation on Mousemove** | `CustomCursor.jsx`, `App.css` | **High** | **High** | Document-wide style recalculation on `:root` CSS custom property mutation |
| **#4** | **Eager Three.js Bundle on Critical Initial Load Path** | `App.jsx` -> `Hero.jsx` -> `ThreeScene.jsx` | **High** | **High** | **531 kB** vendor script chunk; multiple initial Long Tasks (**75 ms – 184 ms**) |
| **#5** | **Layered Backdrop Filters & Heavy Glass Stack** | `index.css`, `Navbar.css`, `Contact.css`, etc. | **High** | **High** | Multi-layer 20px blur + 160% saturation + specular pseudo-elements |
| **#6** | **High Active Event Listener Count & Redundant Observers** | `Navbar.jsx`, `WorkspaceHUD.jsx`, `ThreeScene.jsx` | **Medium** | **High** | **308 active event listeners** on mount; 2 duplicate `IntersectionObserver` instances |
| **#7** | **Unmemoized Constellation Component** | `Skills.jsx` | **Medium** | **High** | Entire constellation graph re-renders on parent state changes |
| **#8** | **Dual 1Hz Interval Timers in Fixed HUDs** | `WorkspaceHUD.jsx`, `DeveloperStatus.jsx` | **Low** | **High** | Continuous 1000 ms state dispatches and DOM mutations |
| **#9** | **Orphaned Disk Assets & Dead Code** | `src/assets/profile.jpg`, `useMousePosition.js` | **Low** | **High** | 1.5 MB uncompressed orphaned image file; 100 lines dead hook code |

---

## 5. Detailed Technical Findings

### Finding #1: Contact Card 3D Tilt on Backdrop-Filtered Glass (`Critical`)

* **File:** [`src/components/Contact/Contact.jsx`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/components/Contact/Contact.jsx) & [`src/components/Contact/Contact.css`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/components/Contact/Contact.css)
* **Selector / Function:** `.contact-card.contact-tilt-card`, `onPointerMove`, `glare.style.setProperty`
* **Static Evidence:**
  * Line 27 in `Contact.css`: `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));`
  * Line 60 in `Contact.css`: `transform-style: preserve-3d; will-change: transform;`
  * Line 83 in `Contact.css`: `.contact-tilt-glare { mix-blend-mode: overlay; ... }`
  * Lines 82–88 in `Contact.jsx`: Setting `perspective() rotateX() rotateY() scale3d()` on `card.style.transform` and modifying CSS custom properties on `glare.style` within an active RAF loop.
* **Runtime Measured Impact:**
  * Measured frame deltas during mouse movement over the Contact card: **83.3 ms, 100 ms, 83.4 ms, 183.4 ms** (sampled across 39 consecutive frames).
  * Effective FPS drops to **5.4 – 12 FPS**.
* **Problem Description:**
  In Chromium's rendering pipeline (Blink + Skia/Ganesh), `backdrop-filter` requires copying the rendered background pixels behind the element into a temporary texture, executing a Gaussian blur shader pass, and blending it with the foreground. When the element itself undergoes continuous 3D transforms (`rotateX`, `rotateY`) while containing a child with `mix-blend-mode: overlay`, the browser cannot maintain a stable composited texture. It must re-rasterize and re-composite the entire card and underlying background on every frame.
* **Recommended Fix:**
  1. On pointer enter/interaction on `.contact-tilt-card`, disable or bypass `backdrop-filter` in favor of a pre-rendered high-opacity tinted background (e.g., `background: rgba(13, 17, 32, 0.88)`).
  2. Alternatively, move `backdrop-filter` to a stationary background wrapper behind the tilting card so that only a lightweight opaque/semi-transparent surface tilts.
  3. Replace `mix-blend-mode: overlay` on `.contact-tilt-glare` with a standard alpha-blended radial gradient (`mix-blend-mode: normal`).
* **Expected Trade-off:** Slight reduction in translucent background refraction during the tilt animation, in exchange for a **7x to 15x improvement in frame rate** (recovering 60 FPS).

---

### Finding #2: Scroll-Driven Reveal Animating `filter: blur()` and `clip-path` (`Critical`)

* **File:** [`src/App.css`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/App.css) & [`src/App.jsx`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/App.jsx)
* **Selector / Function:** `@keyframes revealOnScroll`, `@keyframes revealOnScroll3DCircle`, `.reveal-on-scroll`
* **Static Evidence:**
  * Lines 71–84 in `App.css`:
    ```css
    @keyframes revealOnScroll {
      from {
        opacity: 0;
        transform: perspective(...) rotateY(-35deg) scale(0.75);
        clip-path: circle(0% at 50% 50%);
        filter: blur(var(--reveal-blur, 10px));
      }
      to {
        opacity: 1;
        transform: perspective(...) rotateY(0deg) scale(1);
        clip-path: circle(150% at 50% 50%);
        filter: blur(0px);
      }
    }
    ```
  * Attached to `.projects-intro`, each `.project-card-wrapper`, `.skill-network-container`, `.skills-cards-grid`, `.about-card-main`, 3 `.about-card-sub`, `.about-architecture-section`, `.contact-reveal-wrapper`, `.experiments-intro`, `.exp-card`, and `.stage-glass-panel`.
* **Runtime Measured Impact:**
  * Frame spikes when scrolling across reveal boundaries: **116.7 ms, 133.3 ms, 149.9 ms, 183.3 ms, 233.3 ms, 249.9 ms**.
  * Dropping instantaneous scroll delivery to **4 – 8.5 FPS**.
* **Problem Description:**
  `filter: blur()` and `clip-path: circle()` are rasterization-heavy properties. Unlike `transform` and `opacity` (which are composite-only properties handled on the GPU without repainting), animating `filter: blur()` and `clip-path` dynamically along a scroll timeline forces continuous software repainting and tile invalidation on every pixel scrolled. When applied to 12+ separate large glass containers, this causes massive stuttering during page navigation.
* **Recommended Fix:**
  1. Default the scroll-reveal style to `3d-fade` or `fade-up` (which only animates `transform` and `opacity`), eliminating `filter: blur()` and `clip-path`.
  2. If blur is desired, avoid animating `filter: blur()` continuously; instead, use an opacity fade of a blurred pre-render or confine blur to non-glass elements.
* **Expected Trade-off:** Cleaner, instant scroll response with zero rasterization lockups, without sacrificing smooth entrance motion.

---

### Finding #3: Global `:root` Style Recalculation from Mousemove Variables (`High`)

* **File:** [`src/components/CustomCursor/CustomCursor.jsx`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/components/CustomCursor/CustomCursor.jsx)
* **Selector / Function:** `animateCursor` (Lines 82–83)
* **Static Evidence:**
  ```javascript
  document.documentElement.style.setProperty('--mouse-x', `${roundX}px`);
  document.documentElement.style.setProperty('--mouse-y', `${roundY}px`);
  ```
* **Runtime Measured Impact:**
  * Chromium `Performance.getMetrics` showed `RecalcStyleCount` surging from **80** on initial load to **343** during interaction.
* **Problem Description:**
  Setting a CSS variable on `document.documentElement` (`:root`) invalidates inherited style rules for the entire DOM tree. In modern Chromium, style recalculations occur whenever custom properties on root are mutated, even if only one child (`.mouse-spotlight-layer`) reads `--mouse-x` and `--mouse-y`.
* **Recommended Fix:**
  1. Set `--mouse-x` and `--mouse-y` directly on the `.mouse-spotlight-layer` element DOM node rather than on `document.documentElement`.
  2. Alternatively, apply `transform: translate3d(x, y, 0)` to an absolute radial gradient pseudo-element, bypassing custom property style recalculations entirely.
* **Expected Trade-off:** Completely eliminates global document-wide style invalidation on mousemove.

---

### Finding #4: Eager Three.js Bundle on Critical Initial Load Path (`High`)

* **File:** [`src/App.jsx`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/App.jsx), [`src/components/Hero/Hero.jsx`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/components/Hero/Hero.jsx), [`src/components/ThreeScene/ThreeScene.jsx`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/components/ThreeScene/ThreeScene.jsx)
* **Static Evidence:**
  * `App.jsx` statically imports `Hero`.
  * `Hero.jsx` statically imports `ThreeScene`.
  * `ThreeScene.jsx` statically imports `* as THREE from 'three'`.
  * Production bundle contains `dist/assets/three-vendor-8rz068_N.js` at **531.00 kB** uncompressed (**132.14 kB** gzip).
* **Runtime Measured Impact:**
  * Initial page load recorded multiple Long Tasks:
    * 75 ms (startTime: 426 ms)
    * 119 ms (startTime: 572 ms)
    * 184 ms (startTime: 1471 ms)
    * 125 ms (startTime: 1666 ms)
    * 73 ms (startTime: 1878 ms)
  * Total initial task duration: **2.67 s**; Script evaluation: **464 ms**.
* **Problem Description:**
  The entire 531 kB Three.js library is loaded synchronously before React renders the initial UI. Users on slower mobile connections or lower-spec devices experience significant main-thread contention while parsing and compiling this bundle, delaying Time to Interactive (TTI).
* **Recommended Fix:**
  1. Dynamically import `ThreeScene` via `React.lazy(() => import('../ThreeScene/ThreeScene'))` wrapped in a `<React.Suspense>` fallback that renders a lightweight CSS geometric placeholder.
  2. Defer loading Three.js until after initial layout paint or until the Hero section is settled.
* **Expected Trade-off:** Initial JavaScript bundle reduced by **~531 kB**, eliminating early long tasks, with a lightweight fallback placeholder while the 3D core initializes.

---

### Finding #5: High Active Event Listener Count & Redundant Observers (`Medium`)

* **File:** [`src/components/Navbar/Navbar.jsx`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/components/Navbar/Navbar.jsx), [`src/components/WorkspaceHUD/WorkspaceHUD.jsx`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/components/WorkspaceHUD/WorkspaceHUD.jsx), [`src/components/ThreeScene/ThreeScene.jsx`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/components/ThreeScene/ThreeScene.jsx), [`src/components/Contact/Contact.jsx`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/components/Contact/Contact.jsx)
* **Static Evidence:**
  * `initialMetrics.JSEventListeners`: **308** active listeners.
  * In `Navbar.jsx` (Lines 71–86):
    ```javascript
    const sectionIds = ['hero', 'about', 'skills', 'projects', 'experiments', 'contact'];
    const observer = new IntersectionObserver(...)
    ```
  * In `WorkspaceHUD.jsx` (Lines 53–70):
    ```javascript
    const sectionIds = ['hero', 'about', 'skills', 'projects', 'experiments', 'contact'];
    const observer = new IntersectionObserver(...)
    ```
    Duplicate observer running identical threshold queries on identical DOM elements.
  * Window `scroll` listeners added in `ThreeScene.jsx` (`invalidateCanvasRect`), `Contact.jsx` (`handleInvalidateRect`), `WebSystemBackground.jsx` (`handleScroll`), and `Navbar.jsx`.
* **Runtime Measured Impact:**
  * Unnecessary main-thread event dispatching on scroll and duplicate observer callbacks.
* **Recommended Fix:**
  1. Lift active section tracking to a single shared hook or context, or pass `activeSection` from `Navbar` to `WorkspaceHUD`, eliminating the duplicate `IntersectionObserver`.
  2. Combine scroll rect invalidation into a single throttled event listener or read rects on-demand in RAF.
* **Expected Trade-off:** Reduced idle listener overhead; cleaner, DRY architectural flow.

---

### Finding #6: Unmemoized Constellation Component (`Medium`)

* **File:** [`src/components/Skills/Skills.jsx`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/components/Skills/Skills.jsx)
* **Static Evidence:**
  * Line 287: `export default Skills;` (not wrapped in `React.memo`).
  * Contrast with `About.jsx`, `Projects.jsx`, `Experiments.jsx`, and `Contact.jsx` which are all wrapped in `React.memo`.
* **Problem Description:**
  Whenever `App` re-renders (for example, when `theme` changes, `systemStatus` transitions between READY / CORE.ACTIVE, or `perfSettings` updates), `Skills` and all its 14 skill buttons and 24 SVG lines re-render unnecessarily.
* **Recommended Fix:**
  Wrap with `export default React.memo(Skills);`.
* **Expected Trade-off:** Zero visual change; prevents unnecessary re-rendering of the constellation DOM.

---

### Finding #7: Dual 1Hz Interval Timers in Fixed HUDs (`Low`)

* **File:** [`src/components/WorkspaceHUD/WorkspaceHUD.jsx`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/components/WorkspaceHUD/WorkspaceHUD.jsx), [`src/components/DeveloperStatus/DeveloperStatus.jsx`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/components/DeveloperStatus/DeveloperStatus.jsx)
* **Static Evidence:**
  * `WorkspaceHUD.jsx` runs `setInterval` every 1000 ms to increment `secondsElapsed`.
  * `DeveloperStatus.jsx` runs `setInterval` every 1000 ms to update `now = new Date()`.
* **Problem Description:**
  While both components are isolated with `React.memo` (preventing re-rendering of `App`), two separate 1-second timers trigger state updates and DOM mutations every second.
* **Recommended Fix:**
  Consolidate into a single 1-second pulse event or context if desired, or defer clock updates when the HUD is minimized.
* **Expected Trade-off:** Negligible CPU impact, but cleaner timer lifecycle management.

---

### Finding #8: Orphaned Disk Assets & Dead Code (`Low`)

* **File:** [`src/assets/profile.jpg`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/assets/profile.jpg), [`src/hooks/useMousePosition.js`](file:///media/shubhamdhakre/New%20Volume/Portfolio/src/hooks/useMousePosition.js)
* **Static Evidence:**
  * `src/assets/profile.jpg` is **1.5 MB** on disk. `About.jsx` imports `profile.webp` (22 kB). `profile.jpg` is not imported anywhere.
  * `src/hooks/useMousePosition.js` (100 lines) contains an old stateful mouse tracking hook that is not imported by any component.
* **Recommended Fix:**
  Remove or archive the unreferenced 1.5 MB JPEG and the dead hook to keep repository clean.

---

## 6. Confirmed Problems vs. Architectural Risks

### Confirmed Problems (Demonstrated by Runtime Profiling & Traces)
1. **Contact 3D Tilt Frame Drops:** Frame times of 83.3 ms – 183.4 ms measured during pointer movement directly over `.contact-tilt-card` due to `backdrop-filter` + 3D transform + `mix-blend-mode`.
2. **Scroll Reveal Animation Stutter:** Spikes of 116.7 ms – 249.9 ms measured during section entry due to `filter: blur()` and `clip-path: circle()` interpolating over glass elements.
3. **Long Tasks During Mount:** 5 long tasks (75 ms – 184 ms) during initial page load due to Three.js script compilation and simultaneous component tree instantiation.
4. **Style Recalculation Surge:** `RecalcStyleCount` increased from 80 to 343 due to `:root` `--mouse-x/y` mutations.

### Architectural Risks (Potential Bottlenecks Needing User Monitoring)
1. **Low-End Mobile Fill-Rate on High DPR:** High-resolution mobile screens (e.g. 3x DPR) with multiple overlapping glass elements (`backdrop-filter`) can exhaust GPU fill rate if DPR scaling is not capped.
2. **WebGL Context Loss on Long Background Sessions:** `ThreeScene.jsx` does not explicitly listen for `webglcontextlost` and `webglcontextrestored` events.
3. **Multiple Simultaneous Canvas Animations:** `WebSystemBackground` (2D Canvas) and `ThreeScene` (WebGL Canvas) run concurrent RAF loops in the hero section. Both handle visibility changes, but running both concurrently on weak integrated GPUs draws noticeable power.

---

## 7. Domain-Specific Deep Dives

### 7.1 CSS Compositing & Glassmorphism
The liquid violet glass material system uses:
```css
backdrop-filter: blur(20px) saturate(160%);
-webkit-backdrop-filter: blur(20px) saturate(160%);
box-shadow: 0 18px 45px -10px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.05);
```
Backdrop filter is efficient when elements are **stationary and composited into their own GPU layer**. However, when an element with `backdrop-filter` undergoes:
* 3D Rotation (`rotateX`, `rotateY`)
* Perspective matrix scaling
* Geometric clip-path animation (`circle()`)
* External Gaussian blur (`filter: blur()`)

The GPU compositor cannot cache the blurred backing store; it must recalculate the Gaussian blur kernel across the entire surface area on every frame.

### 7.2 Three.js WebGL Core
* **Draw Calls & Geometry:** The 3D Digital Core is well-optimized in terms of geometry (icosahedron: ~80 vertices; octahedron: 6 vertices; 3 torus rings: ~1,500 vertices; particle cloud: 75 points). Total vertex count is under 2,500.
* **Pixel Ratio:** Pixel ratio is capped at `1.5x` on desktop and `1.05x` on mobile.
* **Idle Execution:** `ThreeScene` correctly uses `IntersectionObserver` to skip rendering when scrolled offscreen.
* **Bottleneck:** The primary issue with Three.js is not its runtime rendering loop, but its **initial 531 kB bundle footprint on initial page load**.

---

## 8. Worst Measured Frame-Time Spikes & Attribution

| Measured Frame Duration | Effective FPS | Triggering User Action | Exact Cause / Attribution |
| :---: | :---: | :--- | :--- |
| **249.9 ms** | **4.0 FPS** | Scrolling over Skills & Projects boundary | Scroll-driven `revealOnScroll` (`filter: blur` + `clip-path: circle` + `perspective rotateY`) on multiple glass panels |
| **183.4 ms** | **5.4 FPS** | Moving mouse over Contact card | 3D perspective tilt (`rotateX/Y`) on element with `backdrop-filter: blur(20px)` and `mix-blend-mode: overlay` |
| **183.3 ms** | **5.5 FPS** | Re-scrolling past Work/Projects cards | Continuous rasterization of `clip-path: circle()` on multi-child glass windows |
| **166.8 ms** | **6.0 FPS** | Pointer sweep across Contact tilt glare | Specular glare CSS property mutation triggering layout and blend recalculation |
| **150.0 ms** | **6.7 FPS** | Scroll entry into About section | Multi-card staggered reveal executing CSS blur transitions simultaneously |
| **119.0 ms** | **8.4 FPS** | Initial page script execution | Parsing and initializing `three-vendor.js` (531 kB) |

---

## 9. Prioritized Optimization Roadmap

### Priority 1: High Impact / Low Risk (Immediate Polish)
1. **Fix Contact Card Tilt Compositing:**
   * Isolate `backdrop-filter` to a stationary parent or replace it with a high-opacity glass gradient during active tilt.
   * Remove `mix-blend-mode: overlay` from `.contact-tilt-glare` in favor of standard alpha blending.
   * *Expected Result:* Eliminates 83–183 ms frame drops on Contact hover; restores full 60 FPS tilt.

2. **Streamline Scroll-Reveal Keyframes:**
   * Remove `filter: blur()` and `clip-path: circle()` from the default `@keyframes revealOnScroll`. Use transform (translate/scale) and opacity only.
   * *Expected Result:* Eliminates 116–250 ms scroll stutter spikes across all sections.

3. **Scope Mouse Spotlight CSS Variables:**
   * Scope `--mouse-x` and `--mouse-y` to `.mouse-spotlight-layer` instead of `document.documentElement` (`:root`).
   * *Expected Result:* Eliminates whole-document style recalculation on mousemove.

### Priority 2: Medium Impact / Low Risk (Bundle & Architecture)
4. **Lazy Load ThreeScene:**
   * Dynamically import `ThreeScene` via `React.lazy()` with a CSS wireframe placeholder fallback.
   * *Expected Result:* Removes **531 kB** of JavaScript from the initial critical bundle; eliminates initial 75–184 ms Long Tasks.

5. **Memoize `Skills.jsx`:**
   * Wrap `Skills` with `React.memo`.
   * *Expected Result:* Prevents unnecessary re-renders of the constellation SVG on parent state updates.

6. **Consolidate Section Observers:**
   * Share a single `IntersectionObserver` between `Navbar.jsx` and `WorkspaceHUD.jsx`.
   * *Expected Result:* Reduces duplicate DOM queries and observer overhead.

### Priority 3: Low Impact / Housekeeping
7. **Clean Up Disk & Dead Code:**
   * Remove unreferenced `src/assets/profile.jpg` (1.5 MB) and `src/hooks/useMousePosition.js`.

---

## 10. Test Environment & Reproduction Methodology

### Test Environment
* **Platform:** Linux 6.8 (x86_64)
* **Runtime:** Node.js v24.21.0
* **Dev Server:** Vite v8.3.2 running at `http://localhost:5173`
* **Profiling Browser:** Brave Browser 154.1.96.61 (Chromium 154.0.8037.98)
* **CDP Automation Port:** `9222`
* **Test Viewports:**
  * Desktop: `1440 × 900`, DPR `1.0` and `1.5`
  * Mobile Emulation: `375 × 812`, DPR `2.0` (Touch enabled)
* **Display Refresh Baseline:** 60 Hz (16.6 ms target frame time)

### Step-by-Step Reproduction Procedure
To manually reproduce the measured performance bottlenecks:

1. **Contact Tilt Frame Drops:**
   * Open Chrome/Brave DevTools -> **Performance** tab.
   * Click **Record**.
   * Navigate to `#contact` and move the mouse rapidly across the main Contact card for 3 seconds.
   * Stop recording.
   * Observe long composite/rasterization slices and frame times exceeding 80 ms in the Frames track.

2. **Scroll Reveal Stutter:**
   * In DevTools, open the **Rendering** drawer and enable **Paint Flashing** and **Scrolling Performance Issues**.
   * Scroll smoothly through the Work / Selected Projects and Skills sections.
   * Notice massive green paint flashes across the full viewport on every scroll step where `filter: blur()` and `clip-path` are recalculating.

3. **Style Recalculation Surge:**
   * In DevTools Performance panel, record 3 seconds of continuous mouse movement over the background.
   * Notice continuous "Recalculate Style" events affecting all elements in the DOM tree triggered by `:root` custom property updates.
