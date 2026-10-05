import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_SCROLL_REVEAL,
  DEFAULT_CONTACT_TILT
} from '../../src/utils/performanceConfig.js';
import {
  normalizeSettingsDoc,
  validateSettingsPayload,
  DEFAULT_GLOBAL
} from '../services/settingsStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('🧪 Starting Scroll Reveal & Contact 3D Tilt Regression Tests...\n');

// =========================================================================
// Section 1: Schema Defaults & Fallbacks for Legacy Configurations
// =========================================================================
console.log('--- Section 1: Defaults & Backward-Compatibility Normalization ---');

// 1.1 DEFAULT_GLOBAL includes scrollReveal and contactTilt
assert.deepStrictEqual(
  DEFAULT_GLOBAL.scrollReveal,
  DEFAULT_SCROLL_REVEAL,
  'DEFAULT_GLOBAL must include DEFAULT_SCROLL_REVEAL'
);
assert.deepStrictEqual(
  DEFAULT_GLOBAL.contactTilt,
  DEFAULT_CONTACT_TILT,
  'DEFAULT_GLOBAL must include DEFAULT_CONTACT_TILT'
);
console.log('  ✓ DEFAULT_GLOBAL includes scrollReveal and contactTilt definitions');

// 1.2 normalizeSettingsDoc provides safe defaults when older docs omit scrollReveal or contactTilt
const legacyDoc = {
  version: 5,
  updatedAt: '2026-09-01T00:00:00.000Z',
  global: {
    theme: 'matrix',
    background: 'cyber-grid',
    performanceMode: 'HIGH_PERFORMANCE'
    // older doc: no scrollReveal or contactTilt
  },
  content: {
    notes: 'Legacy doc test'
  }
};

const normalized = normalizeSettingsDoc(legacyDoc);
assert.strictEqual(normalized.version, 5);
assert.strictEqual(normalized.global.theme, 'matrix');
assert.ok(normalized.global.scrollReveal, 'Normalized doc must populate missing scrollReveal');
assert.strictEqual(normalized.global.scrollReveal.enabled, true);
assert.strictEqual(normalized.global.scrollReveal.style, '3d-circle');
assert.strictEqual(normalized.global.scrollReveal.duration, 700);
assert.strictEqual(normalized.global.scrollReveal.distance, 24);
assert.strictEqual(normalized.global.scrollReveal.staggerDelay, 80);
assert.strictEqual(normalized.global.scrollReveal.rotation, 30);
assert.strictEqual(normalized.global.scrollReveal.scale, 0.8);
assert.strictEqual(normalized.global.scrollReveal.perspective, 1400);
assert.strictEqual(normalized.global.scrollReveal.blur, 8);
assert.strictEqual(normalized.global.scrollReveal.rangeEntry, 10);
assert.strictEqual(normalized.global.scrollReveal.rangeCover, 50);
assert.strictEqual(normalized.global.scrollReveal.threshold, 0.1);
assert.strictEqual(normalized.global.scrollReveal.replay, false);

assert.ok(normalized.global.contactTilt, 'Normalized doc must populate missing contactTilt');
assert.strictEqual(normalized.global.contactTilt.enabled, true);
assert.strictEqual(normalized.global.contactTilt.maxRotationX, 12);
assert.strictEqual(normalized.global.contactTilt.maxRotationY, 12);
assert.strictEqual(normalized.global.contactTilt.perspective, 1000);
assert.strictEqual(normalized.global.contactTilt.speed, 400);
assert.strictEqual(normalized.global.contactTilt.returnSpeed, 600);
assert.strictEqual(normalized.global.contactTilt.hoverScale, 1.02);
assert.strictEqual(normalized.global.contactTilt.lighting, true);
assert.strictEqual(normalized.global.contactTilt.lightingIntensity, 0.35);
console.log('  ✓ normalizeSettingsDoc gracefully backfills defaults for legacy configurations');

// =========================================================================
// Section 2: Input Validation & Boundary Clamping
// =========================================================================
console.log('\n--- Section 2: Validation & Extreme Bounds Clamping ---');

// 2.1 Clamps out-of-range numeric values to safe bounds
const outOfBoundsPayload = {
  global: {
    scrollReveal: {
      enabled: 'yes',
      style: 'invalid-style',
      rotation: 180, // Clamps to 45
      scale: 3.5, // Clamps to 0.98
      perspective: 9000, // Clamps to 2500
      blur: 100, // Clamps to 20
      rangeEntry: 80, // Clamps to 30
      rangeCover: 120, // Clamps to 80
      duration: 999999, // Should clamp to max 3000
      staggerDelay: -50, // Should clamp to min 0
      distance: 500, // Should clamp to max 200
      threshold: 5.5, // Should clamp to max 1.0
      replay: 'false'
    },
    contactTilt: {
      enabled: false,
      maxRotationX: 180, // Should clamp to max 45
      maxRotationY: -90, // Should clamp to min 1
      perspective: 50, // Should clamp to min 300
      speed: 10000, // Should clamp to max 2000
      returnSpeed: 10, // Should clamp to min 100
      hoverScale: 5.0, // Should clamp to max 1.25
      lighting: false,
      lightingIntensity: 10 // Should clamp to max 1.0
    }
  }
};

const validated = validateSettingsPayload(outOfBoundsPayload);
const valSR = validated.global.scrollReveal;
assert.strictEqual(valSR.style, '3d-circle', 'Invalid animation style must default to 3d-circle');
assert.strictEqual(valSR.rotation, 45, 'Rotation must be clamped to max 45deg');
assert.strictEqual(valSR.scale, 0.98, 'Scale must be clamped to max 0.98');
assert.strictEqual(valSR.perspective, 2500, 'Perspective must be clamped to max 2500px');
assert.strictEqual(valSR.blur, 20, 'Blur must be clamped to max 20px');
assert.strictEqual(valSR.rangeEntry, 30, 'Range entry must be clamped to max 30%');
assert.strictEqual(valSR.rangeCover, 80, 'Range cover must be clamped to max 80%');
assert.strictEqual(valSR.duration, 3000, 'Duration must be clamped to max 3000ms');
assert.strictEqual(valSR.staggerDelay, 0, 'Stagger delay must be clamped to min 0ms');
assert.strictEqual(valSR.distance, 200, 'Distance must be clamped to max 200px');
assert.strictEqual(valSR.threshold, 1.0, 'Threshold must be clamped to max 1.0');

const valCT = validated.global.contactTilt;
assert.strictEqual(valCT.enabled, false);
assert.strictEqual(valCT.maxRotationX, 45, 'maxRotationX must be clamped to max 45deg');
assert.strictEqual(valCT.maxRotationY, 1, 'maxRotationY must be clamped to min 1deg');
assert.strictEqual(valCT.perspective, 300, 'perspective must be clamped to min 300px');
assert.strictEqual(valCT.speed, 2000, 'speed must be clamped to max 2000ms');
assert.strictEqual(valCT.returnSpeed, 100, 'returnSpeed must be clamped to min 100ms');
assert.strictEqual(valCT.hoverScale, 1.25, 'hoverScale must be clamped to max 1.25');
assert.strictEqual(valCT.lighting, false);
assert.strictEqual(valCT.lightingIntensity, 1.0, 'lightingIntensity must be clamped to max 1.0');
console.log('  ✓ validateSettingsPayload clamps extreme numeric settings to prevent breaking the UI');

// =========================================================================
// Section 3: Strict Component Scope for Contact 3D Tilt
// =========================================================================
console.log('\n--- Section 3: Strict Contact-Only Scope Verification ---');

// Verify Contact component has the tilt implementation
const contactJsxPath = path.join(rootDir, 'src/components/Contact/Contact.jsx');
const contactJsx = fs.readFileSync(contactJsxPath, 'utf8');

assert.ok(
  contactJsx.includes('contact-tilt-card'),
  'Contact.jsx must use the dedicated contact-tilt-card class'
);
assert.ok(
  contactJsx.includes('cardRef'),
  'Contact.jsx must use a scoped cardRef for pointer tracking'
);
assert.ok(
  contactJsx.includes('onPointerMove') && contactJsx.includes('pointermove'),
  'Contact.jsx must track pointer position on the contact card'
);
assert.ok(
  contactJsx.includes('onPointerLeave') && contactJsx.includes('pointerleave'),
  'Contact.jsx must handle pointer leave to return card to neutral'
);
console.log('  ✓ Contact.jsx implements scoped 3D tilt with ref and pointer tracking');

// Verify NO other components have 3D tilt logic or contact-tilt-card
const componentsDir = path.join(rootDir, 'src/components');
const otherComponentFiles = [
  'Projects/Projects.jsx',
  'Skills/Skills.jsx',
  'Navbar/Navbar.jsx',
  'Footer/Footer.jsx',
  'Hero/Hero.jsx',
  'About/About.jsx',
  'Experience/Experience.jsx'
];

for (const relFile of otherComponentFiles) {
  const fullPath = path.join(componentsDir, relFile);
  if (fs.existsSync(fullPath)) {
    const code = fs.readFileSync(fullPath, 'utf8');
    assert.strictEqual(
      code.includes('contact-tilt-card'),
      false,
      `Component ${relFile} MUST NOT use contact-tilt-card`
    );
    assert.strictEqual(
      code.includes('previewTiltRef'),
      false,
      `Component ${relFile} MUST NOT use tilt refs`
    );
  }
}
console.log('  ✓ Verified 0 other components have 3D tilt applied (strictly Contact only)');

// Verify Contact.css scopes tilt to .contact-card.contact-tilt-card
const contactCssPath = path.join(rootDir, 'src/components/Contact/Contact.css');
const contactCss = fs.readFileSync(contactCssPath, 'utf8');
assert.ok(
  contactCss.includes('.contact-card.contact-tilt-card'),
  'Contact.css must scope tilt styles specifically to .contact-card.contact-tilt-card'
);
assert.strictEqual(
  contactCss.includes('.project-card.contact-tilt-card'),
  false,
  'Contact.css must not target project cards'
);
console.log('  ✓ Contact.css styles are strictly scoped to .contact-card.contact-tilt-card');

// =========================================================================
// Section 4: Global Control Center Integration
// =========================================================================
console.log('\n--- Section 4: Global Control Center Integration Verification ---');

const gccJsxPath = path.join(rootDir, 'src/components/PrivateControlLayer/PrivateControlLayer.jsx');
const gccJsx = fs.readFileSync(gccJsxPath, 'utf8');

// 4.1 Tab navigation includes both features
assert.ok(gccJsx.includes("setActiveTab('scroll-reveal')"), 'GCC must support scroll-reveal tab');
assert.ok(gccJsx.includes("setActiveTab('contact-tilt')"), 'GCC must support contact-tilt tab');

// 4.2 Publishing includes both configuration namespaces
assert.ok(
  gccJsx.includes('scrollReveal: {') && gccJsx.includes('contactTilt: {'),
  'GCC handlePublishGlobal must include both scrollReveal and contactTilt in publish payload'
);

// 4.3 Reset handlers exist for both features
assert.ok(
  gccJsx.includes('handleResetScrollReveal'),
  'GCC must provide handleResetScrollReveal'
);
assert.ok(
  gccJsx.includes('handleResetContactTilt'),
  'GCC must provide handleResetContactTilt'
);

// 4.4 Live preview widgets are present
assert.ok(
  gccJsx.includes('reveal-preview-viewport'),
  'GCC must render live preview viewport for scroll reveal'
);
assert.ok(
  gccJsx.includes('preview-tilt-card'),
  'GCC must render live preview interactive stage for contact 3D tilt'
);
console.log('  ✓ GCC correctly integrates settings, tabs, live preview, resets, and publishing');

// =========================================================================
// Section 5: App.jsx Integration & Dynamic CSS Properties
// =========================================================================
console.log('\n--- Section 5: App.jsx Integration Verification ---');

const appJsxPath = path.join(rootDir, 'src/App.jsx');
const appJsx = fs.readFileSync(appJsxPath, 'utf8');

assert.ok(
  appJsx.includes('perfSettings?.scrollReveal'),
  'App.jsx must extract scrollReveal settings from active perfSettings'
);
assert.ok(
  appJsx.includes('--reveal-duration'),
  'App.jsx must configure --reveal-duration CSS variable'
);
assert.ok(
  appJsx.includes('--reveal-distance'),
  'App.jsx must configure --reveal-distance CSS variable'
);
assert.ok(
  appJsx.includes('tiltSettings={perfSettings?.contactTilt || DEFAULT_CONTACT_TILT}'),
  'App.jsx must pass tiltSettings to Contact component'
);
console.log('  ✓ App.jsx dynamically sets CSS variables and forwards tiltSettings to Contact');

console.log('\n========================================================================');
console.log('✅ ALL SCROLL REVEAL & CONTACT 3D TILT REGRESSION TESTS PASSED!');
console.log('========================================================================\n');
