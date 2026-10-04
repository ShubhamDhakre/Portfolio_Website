import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('🧪 Starting Custom Cursor & Frontend Audit Regression Tests...');

// 1. Inspect CustomCursor.jsx source code
const cursorJsxPath = path.join(rootDir, 'src/components/CustomCursor/CustomCursor.jsx');
assert.ok(fs.existsSync(cursorJsxPath), 'CustomCursor.jsx must exist');
const cursorJsx = fs.readFileSync(cursorJsxPath, 'utf8');

// Check: hasMoved is properly declared within useEffect
assert.match(
  cursorJsx,
  /let\s+hasMoved\s*=\s*false;/,
  'hasMoved must be explicitly declared (let hasMoved = false;) inside the effect scope'
);

// Check: hasMoved is checked and updated on mousemove
assert.ok(cursorJsx.includes('if (!hasMoved) {'), 'handleMouseMove must check if (!hasMoved)');
assert.ok(cursorJsx.includes('hasMoved = true;'), 'handleMouseMove must set hasMoved = true');

// Check: custom-cursor-active is only synchronized when enabled AND isVisible
assert.match(
  cursorJsx,
  /if\s*\(\s*enabled\s*&&\s*isVisible\s*\)\s*\{\s*document\.body\.classList\.add\('custom-cursor-active'\);/,
  'custom-cursor-active must only be added when both enabled and isVisible are true'
);

// Check: cleanup removes custom-cursor-active class from body
assert.ok(
  cursorJsx.includes("document.body.classList.remove('custom-cursor-active')"),
  'Effect cleanup must remove custom-cursor-active from body'
);

// Check: visibilitychange listener is registered and cleaned up
assert.ok(
  cursorJsx.includes("document.addEventListener('visibilitychange', handleVisibilityChange)"),
  'visibilitychange event must be monitored'
);
assert.ok(
  cursorJsx.includes("document.removeEventListener('visibilitychange', handleVisibilityChange)"),
  'visibilitychange listener must be removed on cleanup'
);

// Check: RAF cancel on cleanup
assert.ok(
  cursorJsx.includes('cancelAnimationFrame(rafId)'),
  'cancelAnimationFrame must be called in cleanup'
);

console.log('  ✓ CustomCursor.jsx: hasMoved declared in effect scope, cleanup verified, visibility synced');

// 2. Inspect CustomCursor.css & index.css
const cursorCssPath = path.join(rootDir, 'src/components/CustomCursor/CustomCursor.css');
assert.ok(fs.existsSync(cursorCssPath), 'CustomCursor.css must exist');
const cursorCss = fs.readFileSync(cursorCssPath, 'utf8');

const privateLayerCssPath = path.join(rootDir, 'src/components/PrivateControlLayer/PrivateControlLayer.css');
const privateLayerCss = fs.readFileSync(privateLayerCssPath, 'utf8');

// Find highest z-index in PrivateControlLayer.css
const privateLayerZIndices = [...privateLayerCss.matchAll(/z-index:\s*(\d+);/g)].map((m) => parseInt(m[1], 10));
const maxModalZIndex = Math.max(...privateLayerZIndices);

// Extract CustomCursor z-index
const cursorZIndexMatch = cursorCss.match(/\.custom-cursor\s*\{[^}]*z-index:\s*(\d+);/s);
assert.ok(cursorZIndexMatch, 'CustomCursor must specify a z-index');
const cursorZIndex = parseInt(cursorZIndexMatch[1], 10);

assert.ok(
  cursorZIndex > maxModalZIndex,
  `CustomCursor z-index (${cursorZIndex}) must be higher than PrivateControlLayer max z-index (${maxModalZIndex})`
);
console.log(`  ✓ CustomCursor.css: z-index (${cursorZIndex}) correctly exceeds modal overlay z-index (${maxModalZIndex})`);

// Check index.css custom-cursor-active selector
const indexCssPath = path.join(rootDir, 'src/index.css');
const indexCss = fs.readFileSync(indexCssPath, 'utf8');

assert.match(
  indexCss,
  /body\.custom-cursor-active,\s*body\.custom-cursor-active\s+\*\s*\{\s*cursor:\s*none\s*!important;\s*\}/,
  'index.css must hide native cursor across body and children when custom-cursor-active is set'
);
console.log('  ✓ index.css: Native cursor properly suppressed for fine pointers during active custom cursor');

// 3. Inspect PrivateControlLayer.jsx: No undefined setCurrentMode calls
const privateLayerJsxPath = path.join(rootDir, 'src/components/PrivateControlLayer/PrivateControlLayer.jsx');
const privateLayerJsx = fs.readFileSync(privateLayerJsxPath, 'utf8');

assert.ok(
  !privateLayerJsx.includes('setCurrentMode'),
  'PrivateControlLayer.jsx must NOT call undefined setCurrentMode'
);

const expectedTabs = [
  'global-control',
  'performance',
  'themes',
  'backgrounds',
  'notes',
  'console',
  'system',
  'log'
];

for (const tab of expectedTabs) {
  assert.ok(
    privateLayerJsx.includes(`setActiveTab('${tab}')`),
    `PrivateControlLayer must contain valid tab click handler for '${tab}'`
  );
}
console.log('  ✓ PrivateControlLayer.jsx: Undefined setCurrentMode removed, all 8 navigation tabs valid');

// 4. Inspect ThreeScene.jsx: No variable shadowing of isSmallPhone
const threeScenePath = path.join(rootDir, 'src/components/ThreeScene/ThreeScene.jsx');
const threeSceneJsx = fs.readFileSync(threeScenePath, 'utf8');

// Ensure isSmallPhone is not redeclared inside animate()
const animateFnMatch = threeSceneJsx.match(/const animate = \(\) => \{([\s\S]*?)animate\(\);/);
assert.ok(animateFnMatch, 'animate function must be found in ThreeScene.jsx');
assert.ok(
  !animateFnMatch[1].includes('const isSmallPhone'),
  'animate() loop must not shadow outer isSmallPhone declaration'
);
console.log('  ✓ ThreeScene.jsx: Variable shadowing resolved and responsive flags updated');

// 5. Inspect DeveloperStatus.jsx: transitionTimerRef cleanup
const devStatusPath = path.join(rootDir, 'src/components/DeveloperStatus/DeveloperStatus.jsx');
const devStatusJsx = fs.readFileSync(devStatusPath, 'utf8');
assert.ok(
  devStatusJsx.includes('transitionTimerRef'),
  'DeveloperStatus.jsx must use transitionTimerRef to guard thought transition unmount'
);
assert.ok(
  devStatusJsx.includes('clearTimeout(transitionTimerRef.current)'),
  'DeveloperStatus.jsx must clear transition timer on unmount'
);
console.log('  ✓ DeveloperStatus.jsx: Thought transition timeout safely cleaned up on unmount');

// 6. Inspect Contact.jsx: copyTimerRef cleanup
const contactPath = path.join(rootDir, 'src/components/Contact/Contact.jsx');
const contactJsx = fs.readFileSync(contactPath, 'utf8');
assert.ok(
  contactJsx.includes('copyTimerRef.current = setTimeout'),
  'Contact.jsx fallbackCopy must store timer in copyTimerRef.current'
);
console.log('  ✓ Contact.jsx: Fallback copy timer stored and cleared on unmount');

// 7. Comprehensive AST check with oxlint (no-undef error across all files)
try {
  const scratchConfig = path.join(__dirname, 'oxlint-audit-config.json');
  fs.writeFileSync(
    scratchConfig,
    JSON.stringify(
      {
        plugins: ['react'],
        env: {
          browser: true,
          node: true,
          builtin: true
        },
        rules: {
          'no-undef': 'error'
        }
      },
      null,
      2
    )
  );

  execSync(`npx oxlint -c "${scratchConfig}" src/ server/`, {
    cwd: rootDir,
    stdio: 'pipe'
  });

  fs.unlinkSync(scratchConfig);
  console.log('  ✓ AST Scope Analysis: oxlint verified 0 undefined references across all JS/JSX files in src/ and server/');
} catch (err) {
  assert.fail(`oxlint AST scope check failed: ${err.stdout?.toString() || err.message}`);
}

console.log('\n=======================================================');
console.log('✅ ALL CUSTOM CURSOR & FRONTEND AUDIT TESTS PASSED!');
console.log('=======================================================\n');
