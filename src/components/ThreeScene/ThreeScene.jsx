import React, { useEffect, useRef, useState, memo } from 'react';
import * as THREE from 'three';
import './ThreeScene.css';

/**
 * ThreeScene - Digital Glass Core
 * Signature interactive 3D WebGL centerpiece.
 * Architecture & Performance Optimization:
 * - Autonomous continuous animation loop (never pauses on hover)
 * - Viewport-aware rendering using IntersectionObserver to pause rendering when scrolled offscreen
 * - Frame-throttled raycasting (processed in RAF instead of on pointermove event)
 * - Calibrated pixel ratio cap (1.5x) to eliminate GPU fillrate lag on high-DPI retina screens
 * - Single continuous animation loop, cleaned up on unmount
 */
function ThreeScene({
  theme,
  scrollProgress,
  onStateChange,
  onUnlockPrivateLayer,
  isPrivateModeActive = false,
  perfSettings = {}
}) {
  const mountRef = useRef(null);
  const coreGroupRef = useRef(null);
  const onStateChangeRef = useRef(onStateChange);
  const onUnlockRef = useRef(onUnlockPrivateLayer);
  const [coreState, setCoreState] = useState('READY'); // 'READY' | 'ACTIVE' | 'PROCESSING' | 'EXPLORING' | 'PRIVATE'
  const stateTimerRef = useRef(null);
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  // Performance settings extraction
  const threeEnabled = perfSettings.threeEnabled !== false;
  const interactionEnabled = perfSettings.threeInteraction !== false;
  const particlesEnabled = perfSettings.particlesEnabled !== false;
  const particleQuality = perfSettings.particleQuality || 'AUTO';
  const renderScale = perfSettings.renderScale || 'AUTO';
  const scrollEffectsEnabled = perfSettings.scrollEffectsEnabled !== false;

  // Mobile long-press state
  const [touchHolding, setTouchHolding] = useState(false);
  const [touchProgress, setTouchProgress] = useState(0);
  const touchTimerRef = useRef(null);
  const touchProgressIntervalRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    onUnlockRef.current = onUnlockPrivateLayer;
  }, [onUnlockPrivateLayer]);

  useEffect(() => {
    if (isPrivateModeActive) {
      setCoreState('PRIVATE');
    } else if (coreState === 'PRIVATE') {
      setCoreState('READY');
    }
  }, [isPrivateModeActive]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !threeEnabled) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 480;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 960;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();

    // Calibrated FOV & Camera Z to guarantee 0% clipping on orbital rings
    const cameraZ = isMobile ? 6.8 : isTablet ? 6.6 : 6.4;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = cameraZ;

    // Calculate effective pixel ratio based on renderScale setting
    let maxDpr = isMobile ? 1.05 : (isTablet ? 1.25 : 1.5);
    if (renderScale === 'HIGH') maxDpr = 1.75;
    else if (renderScale === 'MEDIUM') maxDpr = 1.25;
    else if (renderScale === 'LOW') maxDpr = 0.95;

    // 2. WebGL Renderer with Alpha & Antialiasing
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile && renderScale !== 'LOW',
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    container.appendChild(renderer.domElement);

    // 3. Digital Core Group
    const coreGroup = new THREE.Group();
    if (isMobile) {
      coreGroup.scale.set(0.85, 0.85, 0.85);
    }
    scene.add(coreGroup);
    coreGroupRef.current = coreGroup;

    // Theme-based colors
    const isNight = theme === 'night';
    const primaryColor = isNight ? 0x6D5BA6 : 0x5C4A94;
    const secondaryColor = isNight ? 0x4A416B : 0x4A416B;
    const highlightColor = isNight ? 0x8B7BB8 : 0x7A68AD;

    const materials = [];

    // Inner Core Wireframe: Icosahedron
    const innerGeo = new THREE.IcosahedronGeometry(0.95, isMobile ? 1 : 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: highlightColor,
      wireframe: true,
      transparent: true,
      opacity: isNight ? 0.32 : 0.24,
    });
    materials.push(innerMat);
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);

    // Central Nucleus: Octahedron
    const nucleusGeo = new THREE.OctahedronGeometry(0.38, 0);
    const nucleusMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: false,
      transparent: true,
      opacity: 0.55,
    });
    materials.push(nucleusMat);
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    coreGroup.add(nucleus);

    // Orbital Ring 1 (Inner Ring - Primary)
    const ring1Geo = new THREE.TorusGeometry(1.35, 0.012, 8, isMobile ? 32 : (isTablet ? 48 : 64));
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.48,
    });
    materials.push(ring1Mat);
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3.2;
    coreGroup.add(ring1);

    // Orbital Ring 2 (Middle Ring - Secondary)
    const ring2Geo = new THREE.TorusGeometry(1.68, 0.010, 8, isMobile ? 32 : (isTablet ? 48 : 64));
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      transparent: true,
      opacity: 0.42,
    });
    materials.push(ring2Mat);
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 3.8;
    ring2.rotation.x = -Math.PI / 5.5;
    coreGroup.add(ring2);

    // Orbital Ring 3 (Outer Ring - Highlights)
    const ring3Geo = new THREE.TorusGeometry(1.95, 0.009, 8, isMobile ? 32 : (isTablet ? 48 : 64));
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: highlightColor,
      transparent: true,
      opacity: 0.32,
    });
    materials.push(ring3Mat);
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.z = Math.PI / 4.5;
    coreGroup.add(ring3);

    // Particle Cloud
    let particleCount = 0;
    if (particlesEnabled) {
      if (particleQuality === 'HIGH') particleCount = 80;
      else if (particleQuality === 'MEDIUM') particleCount = 45;
      else if (particleQuality === 'LOW') particleCount = 20;
      else particleCount = isMobile ? 28 : (isTablet ? 45 : 75); // AUTO
    }

    let particlePoints = null;
    const geometries = [innerGeo, nucleusGeo, ring1Geo, ring2Geo, ring3Geo];

    if (particleCount > 0) {
      const particleGeo = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i += 3) {
        const radius = 1.2 + Math.random() * 0.85;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
        particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        particlePositions[i + 2] = radius * Math.cos(phi);
      }

      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particleMat = new THREE.PointsMaterial({
        size: 0.035,
        color: highlightColor,
        transparent: true,
        opacity: isNight ? 0.45 : 0.32,
      });
      materials.push(particleMat);
      particlePoints = new THREE.Points(particleGeo, particleMat);
      coreGroup.add(particlePoints);
      geometries.push(particleGeo);
    }

    // 4. Invisible Dedicated Hit Target Sphere for efficient Raycasting
    const hitGeo = new THREE.SphereGeometry(2.3, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({
      visible: false,
      wireframe: false,
    });
    materials.push(hitMat);
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    coreGroup.add(hitMesh);
    geometries.push(hitGeo);

    // Raycaster & Interaction State
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-999, -999);
    let isHovered = false;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let excitation = 1.0;
    let currentScaleMultiplier = 1.0;
    let pointerMoved = false;

    // Viewport intersection state to pause rendering when offscreen
    let isVisibleInViewport = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleInViewport = entry.isIntersecting;
      },
      { rootMargin: '100px' }
    );
    observer.observe(container);

    // Autonomous Rotation Accumulators (Always continuous!)
    let autoRotX = 0;
    let autoRotY = 0;

    const isMouseEnvironment = window.matchMedia('(pointer: fine) and (hover: hover)').matches;

    const handlePointerMove = (e) => {
      if (!isMouseEnvironment) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointerMoved = true;
    };

    const handlePointerLeave = () => {
      isHovered = false;
      targetTiltX = 0;
      targetTiltY = 0;
      pointerMoved = false;
      setCoreState((current) => (current === 'EXPLORING' || current === 'PRIVATE' || current === 'PROCESSING' ? current : 'READY'));
      if (onStateChangeRef.current) onStateChangeRef.current('CORE.READY');
    };

    const domElement = renderer.domElement;
    if (isMouseEnvironment) {
      domElement.addEventListener('pointermove', handlePointerMove, { passive: true });
      domElement.addEventListener('pointerleave', handlePointerLeave);
    }

    // Responsive Canvas Resize
    let resizeTimer = null;
    const handleResize = () => {
      if (!container) return;
      if (resizeTimer) cancelAnimationFrame(resizeTimer);
      resizeTimer = requestAnimationFrame(() => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        if (newWidth === 0 || newHeight === 0) return;

        const newIsMobile = window.innerWidth < 768;
        const newIsTablet = window.innerWidth >= 768 && window.innerWidth < 960;
        camera.position.z = newIsMobile ? 6.8 : newIsTablet ? 6.6 : 6.4;

        if (coreGroupRef.current) {
          const base = newIsMobile ? 0.85 : 1.0;
          coreGroupRef.current.scale.set(base, base, base);
        }

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        const newPixelRatio = Math.min(window.devicePixelRatio || 1, newIsMobile ? 1.05 : (newIsTablet ? 1.25 : 1.5));
        renderer.setPixelRatio(newPixelRatio);
        renderer.setSize(newWidth, newHeight);
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Skip render calculations when scrolled out of view to preserve CPU/GPU
      if (!isVisibleInViewport) return;

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Process raycasting smoothly once per frame instead of on every pointermove
      if (pointerMoved && isMouseEnvironment && interactionEnabled) {
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObject(hitMesh);

        if (intersects.length > 0) {
          if (!isHovered) {
            isHovered = true;
            setCoreState((current) => (current === 'EXPLORING' || current === 'PRIVATE' || current === 'PROCESSING' ? current : 'ACTIVE'));
            if (onStateChangeRef.current) onStateChangeRef.current('CORE.ACTIVE');
          }
          targetTiltX = pointer.y * 0.35;
          targetTiltY = pointer.x * 0.35;
        } else {
          if (isHovered) {
            isHovered = false;
            setCoreState((current) => (current === 'EXPLORING' || current === 'PRIVATE' || current === 'PROCESSING' ? current : 'READY'));
            if (onStateChangeRef.current) onStateChangeRef.current('CORE.READY');
          }
          targetTiltX = 0;
          targetTiltY = 0;
        }
        pointerMoved = false;
      }

      // 1. AUTONOMOUS ANIMATION (Never paused on hover)
      if (!prefersReducedMotion) {
        const speed = excitation;
        autoRotY += 0.25 * delta * speed;
        autoRotX += 0.12 * delta * speed;

        innerMesh.rotation.y = elapsedTime * 0.16 * speed;
        innerMesh.rotation.x = elapsedTime * 0.08 * speed;

        nucleus.rotation.y = -elapsedTime * 0.32 * speed;
        nucleus.rotation.z = elapsedTime * 0.22 * speed;

        ring1.rotation.z = elapsedTime * 0.18 * speed;
        ring2.rotation.y = -elapsedTime * 0.16 * speed;
        ring3.rotation.x = elapsedTime * 0.12 * speed;

        if (particlePoints) {
          particlePoints.rotation.y = elapsedTime * 0.05 * speed;
        }
        coreGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.08;
      }

      // 2. ADDITIVE TILT
      currentTiltX += (targetTiltX - currentTiltX) * 0.08;
      currentTiltY += (targetTiltY - currentTiltY) * 0.08;

      coreGroup.rotation.x = autoRotX + currentTiltX;
      coreGroup.rotation.y = autoRotY + currentTiltY;

      // 3. SCALE & GLOW
      const targetScale = isHovered ? (excitation > 1.1 ? 1.08 : 1.04) : 1.0;
      currentScaleMultiplier += (targetScale - currentScaleMultiplier) * 0.08;

      const baseScale = isMobile ? 0.85 : 1.0;
      coreGroup.scale.set(
        baseScale * currentScaleMultiplier,
        baseScale * currentScaleMultiplier,
        baseScale * currentScaleMultiplier
      );

      if (excitation > 1.0) {
        excitation = Math.max(1.0, excitation - delta * 0.8);
      }

      innerMat.opacity = (isNight ? 0.32 : 0.24) + (isHovered ? 0.15 : 0);
      nucleusMat.opacity = 0.55 + (isHovered ? 0.2 : 0);

      renderer.render(scene, camera);
    };

    animate();

    // Click Interaction: Normal vs Secret Shift+Click
    const handleCanvasClick = (e) => {
      e.stopPropagation();
      const now = Date.now();

      // Check for Shift + Click secret access trigger
      if (e.shiftKey) {
        excitation = 2.8;
        setCoreState('PRIVATE ACCESS');
        setTimeout(() => setCoreState('INITIALIZING'), 250);
        setTimeout(() => {
          setCoreState('PRIVATE WORKSPACE');
          if (onUnlockRef.current) {
            onUnlockRef.current('DIGITAL CORE (SHIFT+CLICK)');
          }
        }, 500);
        return;
      }

      // Easter Egg 1: Repeated rapid clicks cycle state
      if (now - lastClickTimeRef.current < 800) {
        clickCountRef.current++;
      } else {
        clickCountRef.current = 1;
      }
      lastClickTimeRef.current = now;

      excitation = 2.4;

      const states = ['ACTIVE', 'PROCESSING', 'EXPLORING', 'READY'];
      const nextCycleState = states[clickCountRef.current % states.length];
      setCoreState(nextCycleState);

      if (onStateChangeRef.current) onStateChangeRef.current(`CORE.${nextCycleState}`);

      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
      stateTimerRef.current = setTimeout(() => {
        setCoreState(isHovered ? 'ACTIVE' : 'READY');
        if (onStateChangeRef.current) onStateChangeRef.current(isHovered ? 'CORE.ACTIVE' : 'CORE.READY');
        stateTimerRef.current = null;
      }, 3500);
    };

    // Double-click secret trigger: SHIFT + Double Click
    const handleCanvasDblClick = (e) => {
      if (e.shiftKey) {
        e.stopPropagation();
        excitation = 3.0;
        setCoreState('PRIVATE WORKSPACE');
        if (onUnlockRef.current) {
          onUnlockRef.current('DIGITAL CORE (SHIFT+DBLCLICK)');
        }
      }
    };

    domElement.addEventListener('click', handleCanvasClick);
    domElement.addEventListener('dblclick', handleCanvasDblClick);

    // CLEANUP ON UNMOUNT
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (resizeTimer) cancelAnimationFrame(resizeTimer);
      domElement.removeEventListener('pointermove', handlePointerMove);
      domElement.removeEventListener('pointerleave', handlePointerLeave);
      domElement.removeEventListener('click', handleCanvasClick);
      domElement.removeEventListener('dblclick', handleCanvasDblClick);

      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();

      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme, threeEnabled, particlesEnabled, particleQuality, renderScale, interactionEnabled]);

  // Mobile / Tablet 1.5s Touch Long-Press Handling
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1 || !threeEnabled) return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    setTouchHolding(true);
    setTouchProgress(0);

    const startTime = Date.now();
    const duration = 1500;

    if (touchProgressIntervalRef.current) clearInterval(touchProgressIntervalRef.current);
    touchProgressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setTouchProgress(pct);
    }, 40);

    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      clearInterval(touchProgressIntervalRef.current);
      setTouchProgress(100);
      setTouchHolding(false);
      if (onUnlockRef.current) {
        onUnlockRef.current('DIGITAL CORE (LONG PRESS)');
      }
    }, duration);
  };

  const handleTouchMove = (e) => {
    if (!touchHolding) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);

    if (dx > 10 || dy > 10) {
      cancelTouchHold();
    }
  };

  const cancelTouchHold = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    if (touchProgressIntervalRef.current) clearInterval(touchProgressIntervalRef.current);
    setTouchHolding(false);
    setTouchProgress(0);
  };

  // Subtle Scroll Reaction
  useEffect(() => {
    if (coreGroupRef.current && scrollEffectsEnabled) {
      const scrollRotation = (scrollProgress || 0) * Math.PI * 1.2;
      coreGroupRef.current.rotation.z = scrollRotation * 0.35;
    }
  }, [scrollProgress, scrollEffectsEnabled]);

  return (
    <div
      ref={mountRef}
      className={`three-scene-container core-state-${coreState.toLowerCase().replace(/\s+/g, '-')}`}
      data-cursor={coreState === 'EXPLORING' ? 'EXPLORE' : 'INTERACT'}
      title="Click to explore Digital Core system (Shift+Click for developer workspace)"
      aria-label="Interactive 3D Digital Core"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={cancelTouchHold}
      onTouchCancel={cancelTouchHold}
    >
      {/* Interactive Core State Badge */}
      <div className="core-state-indicator" aria-live="polite">
        <span className={`core-state-dot ${!threeEnabled ? 'dot-standby' : `dot-${coreState.toLowerCase().replace(/\s+/g, '-')}`}`} />
        <span className="core-state-label">
          CORE.STATUS = {!threeEnabled ? 'STANDBY (BENCHMARK MODE)' : coreState}
        </span>
      </div>

      {/* Mobile Long Press Feedback Pill */}
      {touchHolding && (
        <div className="core-touch-feedback" role="status" aria-live="polite">
          <span className="feedback-label">PRIVATE ACCESS [{touchProgress}%]</span>
          <div className="feedback-progress-track">
            <div className="feedback-progress-bar" style={{ width: `${touchProgress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ThreeScene);

