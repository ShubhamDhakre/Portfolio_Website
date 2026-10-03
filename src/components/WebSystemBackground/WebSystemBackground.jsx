import React, { useEffect, useRef, memo } from 'react';
import './WebSystemBackground.css';

/**
 * WebSystemBackground
 * Multi-Mode Environmental Background Architecture:
 * 1. digital-web (Default Organic Network)
 * 2. neural-flow (Synaptic interconnected data paths)
 * 3. data-stream (Directional high-tech data packet stream)
 * 4. organic-flow (Fluid procedural wave field)
 * 5. starfield (Layered parallax star particles)
 * 6. digital-code-flow (Floating technical code fragments)
 * 7. custom (User-configured parameters)
 */
function WebSystemBackground({
  theme = 'night',
  perfSettings = {},
  backgroundType = null,
  customBackgroundConfig = null
}) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  const effectiveBgType = backgroundType || perfSettings.background || perfSettings.backgroundType || 'digital-web';
  const backgroundEnabled = perfSettings.backgroundEnabled !== false;
  const backgroundQuality = perfSettings.backgroundQuality || 'AUTO';
  const mouseEffectsEnabled = perfSettings.mouseEffectsEnabled !== false;

  useEffect(() => {
    if (!mouseEffectsEnabled) return;

    const handleMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, [mouseEffectsEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundEnabled) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let resizeTimer = null;
    const handleResize = () => {
      if (resizeTimer) cancelAnimationFrame(resizeTimer);
      resizeTimer = requestAnimationFrame(() => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = width < 768;

    // Theme color extractors
    let primaryRGB = '109, 91, 166';
    let highlightRGB = '139, 123, 184';

    if (theme === 'technical') {
      primaryRGB = '2, 132, 199';
      highlightRGB = '56, 189, 248';
    } else if (theme === 'nature') {
      primaryRGB = '45, 106, 79';
      highlightRGB = '116, 198, 157';
    } else if (theme === 'minimal') {
      primaryRGB = '100, 116, 139';
      highlightRGB = '203, 213, 225';
    } else if (theme === 'aurora') {
      primaryRGB = '13, 148, 136';
      highlightRGB = '192, 132, 252';
    } else if (theme === 'monochrome') {
      primaryRGB = '160, 160, 160';
      highlightRGB = '240, 240, 240';
    } else if (theme === 'day') {
      primaryRGB = '92, 74, 148';
      highlightRGB = '122, 104, 173';
    }

    // Determine particle count based on quality
    let densityScale = 1;
    if (customBackgroundConfig?.density === 'HIGH') densityScale = 1.35;
    else if (customBackgroundConfig?.density === 'LOW') densityScale = 0.5;
    else if (backgroundQuality === 'HIGH') densityScale = 1.35;
    else if (backgroundQuality === 'MEDIUM') densityScale = 0.9;
    else if (backgroundQuality === 'LOW') densityScale = 0.5;

    // =========================================================================
    // MODE 1 & 2: DIGITAL WEB & NEURAL FLOW NODES
    // =========================================================================
    const nodeCount = Math.round((isMobile ? 14 : 30) * densityScale);
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isMobile ? 0.18 : 0.24) * (effectiveBgType === 'neural-flow' ? 0.65 : 1),
        vy: (Math.random() - 0.5) * (isMobile ? 0.18 : 0.24) * (effectiveBgType === 'neural-flow' ? 0.65 : 1),
        radius: (isMobile ? 1.2 : 1.6) + Math.random() * 1.6,
        baseAlpha: 0.15 + Math.random() * 0.25,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    const packets = [];
    const packetCount = isMobile ? 3 : 6;
    for (let i = 0; i < packetCount; i++) {
      packets.push({
        from: i % nodeCount,
        to: (i + 3) % nodeCount,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.003
      });
    }

    // =========================================================================
    // MODE 3: DATA STREAM PACKETS
    // =========================================================================
    const streamTracks = isMobile ? 5 : 9;
    const streamItems = [];
    for (let i = 0; i < (isMobile ? 12 : 24) * densityScale; i++) {
      streamItems.push({
        track: Math.floor(Math.random() * streamTracks),
        x: Math.random() * width,
        speed: (isMobile ? 0.8 : 1.2) + Math.random() * 1.5,
        length: 20 + Math.random() * 50,
        alpha: 0.12 + Math.random() * 0.35
      });
    }

    // =========================================================================
    // MODE 4: ORGANIC FLOW WAVE FIELD
    // =========================================================================
    let waveTime = 0;

    // =========================================================================
    // MODE 5: STARFIELD PARTICLES
    // =========================================================================
    const starCount = Math.round((isMobile ? 40 : 100) * densityScale);
    const stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        layer: Math.random(), // 0 to 1 depth
        size: 0.6 + Math.random() * 1.8,
        twinkleSpeed: 0.02 + Math.random() * 0.04,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }

    // =========================================================================
    // MODE 6: DIGITAL CODE FLOW TOKENS
    // =========================================================================
    const codeTokens = ['<React />', 'useState()', 'fetch(API)', 'Node.js', 'Express', 'HTTP 200', 'JSON', 'Three.js', 'Props', 'Async'];
    const floatingCodeItems = [];
    const codeCount = Math.round((isMobile ? 6 : 14) * densityScale);
    for (let i = 0; i < codeCount; i++) {
      floatingCodeItems.push({
        text: codeTokens[i % codeTokens.length],
        x: Math.random() * width,
        y: Math.random() * height,
        vy: -0.15 - Math.random() * 0.25,
        alpha: 0.12 + Math.random() * 0.28,
        size: isMobile ? 10 : 12
      });
    }

    const maxDistance = isMobile ? 120 : 180;
    const maxDistanceSq = maxDistance * maxDistance;

    // Main Render Loop
    const render = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const hasActiveMouse = mouseX >= 0 && mouseY >= 0;

      // -----------------------------------------------------------------------
      // MODE 1 & 2: DIGITAL WEB / NEURAL FLOW
      // -----------------------------------------------------------------------
      if (effectiveBgType === 'digital-web' || effectiveBgType === 'neural-flow') {
        const isNeural = effectiveBgType === 'neural-flow';

        // Update & Draw Nodes
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (!prefersReducedMotion) {
            node.x += node.vx;
            node.y += node.vy;
            if (node.x < 0) node.x = width;
            if (node.x > width) node.x = 0;
            if (node.y < 0) node.y = height;
            if (node.y > height) node.y = 0;
          }

          let mouseProximity = 0;
          if (hasActiveMouse) {
            const dx = node.x - mouseX;
            const dy = node.y - mouseY;
            if (Math.abs(dx) < 200 && Math.abs(dy) < 200) {
              const d = Math.sqrt(dx * dx + dy * dy);
              mouseProximity = Math.max(0, 1 - d / 200);
            }
          }

          const currentAlpha = Math.min(1, node.baseAlpha + mouseProximity * 0.45);
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + mouseProximity * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${highlightRGB}, ${currentAlpha})`;
          ctx.fill();
        }

        // Draw Connections
        for (let i = 0; i < nodes.length; i++) {
          const nA = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const nB = nodes[j];
            const dx = nA.x - nB.x;
            const dy = nA.y - nB.y;
            if (Math.abs(dx) < maxDistance && Math.abs(dy) < maxDistance) {
              const distSq = dx * dx + dy * dy;
              if (distSq < maxDistanceSq) {
                const dist = Math.sqrt(distSq);
                const alpha = (1 - dist / maxDistance) * (isNeural ? 0.28 : 0.18);
                ctx.beginPath();
                if (isNeural) {
                  const midX = (nA.x + nB.x) / 2 + Math.sin(nodeCount + i) * 6;
                  const midY = (nA.y + nB.y) / 2 + Math.cos(nodeCount + j) * 6;
                  ctx.moveTo(nA.x, nA.y);
                  ctx.quadraticCurveTo(midX, midY, nB.x, nB.y);
                } else {
                  ctx.moveTo(nA.x, nA.y);
                  ctx.lineTo(nB.x, nB.y);
                }
                ctx.strokeStyle = `rgba(${primaryRGB}, ${alpha})`;
                ctx.lineWidth = isNeural ? 1.2 : 0.9;
                ctx.stroke();
              }
            }
          }
        }

        // Draw Traveling Packets
        if (!prefersReducedMotion) {
          for (let i = 0; i < packets.length; i++) {
            const pkt = packets[i];
            pkt.progress += pkt.speed;
            if (pkt.progress >= 1) {
              pkt.progress = 0;
              pkt.from = Math.floor(Math.random() * nodes.length);
              pkt.to = (pkt.from + Math.floor(Math.random() * 4) + 1) % nodes.length;
            }

            const start = nodes[pkt.from];
            const end = nodes[pkt.to];
            if (start && end) {
              const px = start.x + (end.x - start.x) * pkt.progress;
              const py = start.y + (end.y - start.y) * pkt.progress;
              ctx.beginPath();
              ctx.arc(px, py, isMobile ? 1.8 : 2.4, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${highlightRGB}, 0.7)`;
              ctx.fill();
            }
          }
        }
      }

      // -----------------------------------------------------------------------
      // MODE 3: DATA STREAM
      // -----------------------------------------------------------------------
      else if (effectiveBgType === 'data-stream') {
        const trackHeight = height / streamTracks;
        for (let i = 0; i < streamItems.length; i++) {
          const item = streamItems[i];
          if (!prefersReducedMotion) {
            item.x += item.speed;
            if (item.x > width + item.length) {
              item.x = -item.length;
              item.track = Math.floor(Math.random() * streamTracks);
            }
          }

          const trackY = item.track * trackHeight + trackHeight / 2;
          const grad = ctx.createLinearGradient(item.x - item.length, trackY, item.x, trackY);
          grad.addColorStop(0, `rgba(${primaryRGB}, 0)`);
          grad.addColorStop(1, `rgba(${highlightRGB}, ${item.alpha})`);

          ctx.beginPath();
          ctx.moveTo(item.x - item.length, trackY);
          ctx.lineTo(item.x, trackY);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Packet head dot
          ctx.beginPath();
          ctx.arc(item.x, trackY, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${highlightRGB}, ${item.alpha * 1.5})`;
          ctx.fill();
        }
      }

      // -----------------------------------------------------------------------
      // MODE 4: ORGANIC FLOW
      // -----------------------------------------------------------------------
      else if (effectiveBgType === 'organic-flow') {
        if (!prefersReducedMotion) waveTime += 0.008;
        const waveCount = 4;
        for (let w = 0; w < waveCount; w++) {
          ctx.beginPath();
          const baseWaveY = height * (0.2 + (w * 0.22));
          ctx.moveTo(0, baseWaveY);
          for (let x = 0; x <= width; x += 40) {
            const y = baseWaveY + Math.sin(x * 0.003 + waveTime + w) * 35 + Math.cos(x * 0.0015 - waveTime * 0.5) * 20;
            ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `rgba(${primaryRGB}, ${0.08 + w * 0.03})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // -----------------------------------------------------------------------
      // MODE 5: STARFIELD
      // -----------------------------------------------------------------------
      else if (effectiveBgType === 'starfield') {
        for (let i = 0; i < stars.length; i++) {
          const star = stars[i];
          if (!prefersReducedMotion) {
            star.twinklePhase += star.twinkleSpeed;
            star.y -= (0.05 + star.layer * 0.15);
            if (star.y < 0) {
              star.y = height;
              star.x = Math.random() * width;
            }
          }

          const alpha = 0.2 + (Math.sin(star.twinklePhase) * 0.5 + 0.5) * (0.3 + star.layer * 0.5);
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * (0.7 + star.layer * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${highlightRGB}, ${alpha})`;
          ctx.fill();
        }
      }

      // -----------------------------------------------------------------------
      // MODE 6: DIGITAL CODE FLOW
      // -----------------------------------------------------------------------
      else if (effectiveBgType === 'digital-code-flow') {
        ctx.font = `600 11px var(--font-mono, monospace)`;
        for (let i = 0; i < floatingCodeItems.length; i++) {
          const item = floatingCodeItems[i];
          if (!prefersReducedMotion) {
            item.y += item.vy;
            if (item.y < -30) {
              item.y = height + 20;
              item.x = Math.random() * width;
            }
          }

          ctx.fillStyle = `rgba(${highlightRGB}, ${item.alpha})`;
          ctx.fillText(item.text, item.x, item.y);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (resizeTimer) cancelAnimationFrame(resizeTimer);
    };
  }, [theme, effectiveBgType, backgroundEnabled, backgroundQuality, mouseEffectsEnabled, customBackgroundConfig]);

  if (!backgroundEnabled) {
    return null;
  }

  return (
    <div className={`web-system-bg-wrapper bg-mode-${effectiveBgType}`} aria-hidden="true">
      {/* HTML5 Canvas Surface */}
      <canvas ref={canvasRef} className="web-system-canvas" />

      {/* Environmental Web Developer Ambient Badges & Signals (Shown only in digital-web & data-stream modes) */}
      {(effectiveBgType === 'digital-web' || effectiveBgType === 'data-stream') && (
        <div className="bg-env-layer">
          <div className="env-fragment env-react">&lt;React /&gt;</div>
          <div className="env-fragment env-hook">useState()</div>
          <div className="env-fragment env-fetch">fetch(API)</div>
          <div className="env-fragment env-node">node.js // runtime</div>
          <div className="env-fragment env-status">HTTP 200 // OK</div>
          <div className="env-fragment env-route">/api/v1/stream</div>
          <div className="env-fragment env-json">&#123; status: "active" &#125;</div>

          {/* Minimalist Browser Frame Artifact */}
          <div className="env-browser-frame">
            <div className="frame-header">
              <span className="frame-dot" />
              <span className="frame-dot" />
              <span className="frame-dot" />
              <span className="frame-url">localhost:5173 / workspace</span>
            </div>
            <div className="frame-lines">
              <div className="frame-line short" />
              <div className="frame-line med" />
            </div>
          </div>

          {/* Abstract Terminal Command Fragment */}
          <div className="env-terminal-fragment">
            <span className="term-prompt">$</span>
            <span className="term-cmd">npm run dev --host</span>
            <span className="term-pulse">_</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(WebSystemBackground);
