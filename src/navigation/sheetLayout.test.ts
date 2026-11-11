import assert from 'node:assert/strict';
import {
  deckFrame,
  deckMetrics,
  shouldMinimize,
  shouldDismissCard,
  paperTransform,
  draftDockFrame,
  fullEditorFrame,
  mixEditorFrames,
  overviewCardOpacity,
  overviewCardProgress,
  overviewPreviewOpacity,
} from '../../packages/stacked-sheets/src/sheetLayout.ts';

// The paper must land on the actual safe-area-aware dock, at every viewport.
// Interrupted drags start from their visible frame, including a partially
// flattened overview card; neither source dimensions nor content get reset.
for (const [width, height, topInset, bottomInset] of [[375, 667, 20, 0], [402, 874, 62, 34], [440, 956, 62, 34], [768, 1024, 24, 20]]) {
  for (const ios of [true, false]) {
    const dock = draftDockFrame(width, height, bottomInset, ios);
    const full = fullEditorFrame(width, height, topInset);
    assert.equal(dock.top + dock.height, height - (ios ? 2 : Math.max(bottomInset, 2)));
    assert.equal((width - dock.width) / 2, 16);
    assert.equal(dock.radius, dock.height / 2);
    const middle = mixEditorFrames(full, dock, 0.4);
    assert.deepEqual(mixEditorFrames(middle, dock, 0), middle, 'gesture takeover is continuous');
    assert.deepEqual(mixEditorFrames(middle, full, 0), middle, 'reversing keeps the current paper');
    for (let i = 0; i <= 60; i++) {
      const f = mixEditorFrames(full, dock, i / 60);
      assert.ok(f.width >= dock.width && f.width <= width);
      assert.ok(f.height >= dock.height - 1e-9 && f.height <= full.height);
      assert.ok(f.top >= full.top && f.top <= dock.top);
      assert.equal(f.cosine, 1, 'flat editor is never vertically squashed');
      assert.equal(f.taper, 0);
      assert.ok(Math.abs(f.top + f.height - (height - 2 * i / 60)) < 1e-8 || !ios, 'bottom edge stays anchored');
    }
    const dragged = mixEditorFrames(full, dock, 80 / (dock.top - full.top));
    assert.ok(Math.abs(dragged.top - full.top - 80) < 1e-8, 'header tracks vertical finger travel');
    assert.deepEqual(mixEditorFrames(full, dock, 1), dock);
  }
}

// Overview keeps a stable card rhythm and scrolls, rather than crushing every
// draft into the viewport. Even draft 20 must be reachable at maximum scroll.
for (const height of [667, 700, 852, 956, 1024]) {
  for (const count of [1, 2, 3, 6, 20]) {
    const { maxScroll, step } = deckMetrics(height, count);
    assert.ok(maxScroll >= 0);
    const last = deckFrame(count, count, height, maxScroll);
    assert.ok(last.top < height * 0.8, 'last draft can be brought into reach');
    assert.ok(last.top > 0, 'active header does not disappear above the screen');
    const previous = deckFrame(count - 1, count, height, maxScroll);
    assert.ok(Math.abs(last.top - previous.top - step) < 0.01);
    assert.ok(last.cosine > 0.6 && last.cosine < 0.9);
    assert.ok(last.taper > 0, 'paper narrows toward its lower edge');
    const moved = deckFrame(count, count, height, maxScroll - 40);
    assert.equal(Math.round(moved.top - last.top), 40, 'scroll follows the finger');
  }
}
assert.equal(shouldMinimize(20, 100, false), false, 'short drag springs back');
assert.equal(shouldMinimize(120, 0, false), true);
assert.equal(shouldMinimize(40, 900, false), true, 'quick flick minimizes');
assert.equal(shouldMinimize(400, 2000, true), false, 'cancelled drag retains draft');
assert.equal(shouldDismissCard(-150, 0, 393, false), true);
assert.equal(shouldDismissCard(40, -900, 393, false), true);
assert.equal(shouldDismissCard(50, 0, 393, false), false);
assert.equal(shouldDismissCard(-400, -2000, 393, true), false);

assert.equal(overviewCardOpacity(0), 0, 'closed overview shows only the dock');
assert.equal(overviewPreviewOpacity(0), 0);
assert.equal(overviewCardOpacity(1), 1, 'open cards are opaque');
assert.equal(overviewCardProgress(1), 1, 'open cards reach the deck');
assert.equal(overviewPreviewOpacity(1), 1);
for (let i = 0; i <= 60; i++) {
  const progress = i / 60;
  const dockOpacity = 1 - overviewCardOpacity(progress);
  assert.ok(
    dockOpacity === 0 || overviewPreviewOpacity(progress) === 0,
    'the card title and dock label never show together',
  );
  assert.ok(
    dockOpacity === 0 || overviewCardProgress(progress) === 0,
    'overlapping paper stays aligned with the dock',
  );
}
console.log('sheetLayout tests passed');

// A single matrix composes screen-space translation with perspective. The
// projected top edge must stay at the requested top even while swiping.
const matrix = paperTransform(320, -80, 0.72, 0.0004);
function project(x: number, y: number) {
  const w = matrix[3] * x + matrix[7] * y + matrix[15];
  return [
    (matrix[0] * x + matrix[4] * y + matrix[12]) / w,
    (matrix[1] * x + matrix[5] * y + matrix[13]) / w,
  ];
}
assert.deepEqual(project(0, 0), [-80, 320]);
const centerBelow = project(0, 200);
assert.equal(
  Math.round(centerBelow[0]),
  -80,
  'horizontal translation stays in screen space',
);
assert.ok(Math.abs(centerBelow[1] - (320 + 144 / 1.08)) < 0.001);

assert.equal(
  shouldDismissCard(20, 2000, 393, false),
  false,
  'tiny fast drags do not accidentally delete drafts',
);
assert.equal(
  shouldMinimize(20, 2000, false),
  false,
  'tiny fast drags do not accidentally minimize',
);
