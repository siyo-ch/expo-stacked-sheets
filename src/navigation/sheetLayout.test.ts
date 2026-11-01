import assert from 'node:assert/strict';

import {
  INBOX_FILL,
  MOTION_DURATION,
  MOTION_EASING,
  PEEK,
  PERSPECTIVE,
  RADIUS,
  ROTATE_DEEP,
  ROTATE_FRONT,
  SIDE_INSET,
  dismissTravel,
  sheetFrame,
} from './sheetLayout.ts';

const height = 852;
const topInset = 59;

assert.ok(PEEK >= 260 && PEEK <= 340, `peek constant ${PEEK}`);
assert.ok(PERSPECTIVE >= 700 && PERSPECTIVE <= 1000, `perspective ${PERSPECTIVE}`);
assert.ok(ROTATE_DEEP >= 50 && ROTATE_DEEP <= 70, `deep lean ${ROTATE_DEEP}`);
assert.ok(ROTATE_FRONT >= 20 && ROTATE_FRONT < ROTATE_DEEP);
assert.ok(RADIUS >= 40 && RADIUS <= 52);
assert.ok(SIDE_INSET >= 16 && SIDE_INSET <= 40);
assert.ok(MOTION_DURATION >= 280 && MOTION_DURATION <= 320, `duration ${MOTION_DURATION}`);
assert.equal(MOTION_EASING, 'ease-out');
assert.ok(INBOX_FILL > 0.7 && INBOX_FILL < 0.95);

const inboxAlone = sheetFrame({ presented: 0, index: 0, height, topInset });
assert.equal(inboxAlone.top, 0);
assert.equal(inboxAlone.hidden, 0);
assert.equal(inboxAlone.rotateX, 0);
assert.equal(inboxAlone.radius, 0);
assert.equal(inboxAlone.fill, 1);
assert.equal(inboxAlone.inset, 0);

const front = sheetFrame({ presented: 2, index: 2, height, topInset });
const middle = sheetFrame({ presented: 2, index: 1, height, topInset });
const back = sheetFrame({ presented: 2, index: 0, height, topInset });

assert.ok(back.top < middle.top, 'inbox sits above the middle draft');
assert.ok(middle.top < front.top, 'middle draft sits above the front draft');
assert.equal(front.hidden, 0);
assert.equal(front.rotateX, ROTATE_FRONT);
assert.ok(middle.rotateX > front.rotateX + 8, 'a covered draft leans further back');
assert.ok(back.rotateX > middle.rotateX + 8, 'the inbox leans furthest');
assert.ok(back.rotateX >= 50 && back.rotateX <= 70, `inbox lean ${back.rotateX}`);
assert.equal(front.perspective, PERSPECTIVE);
assert.equal(front.dim, 0);
assert.ok(middle.dim > 0.9);
assert.ok(back.fill < 0.95, 'covered inbox is translucent');
assert.ok(front.fill === 1);
assert.equal(front.inset, SIDE_INSET);

const gap = middle.top - back.top;
assert.ok(gap > 180 && gap <= PEEK, `visible step was ${gap}`);
assert.ok(Math.abs(front.top - middle.top - gap) < 0.01, 'each layer steps down by the same peek');
assert.ok(back.top < topInset + 24, 'two drafts keep the inbox under the status bar');
assert.ok(Math.abs(front.face - (height - front.top)) < 1, 'the front face runs to the bottom of the screen');
assert.ok(middle.face < height - middle.top - 40, 'a covered face is only the visible slab');

const risingEarly = sheetFrame({ presented: 1.2, index: 2, height, topInset });
const risingLate = sheetFrame({ presented: 1.85, index: 2, height, topInset });
assert.equal(risingEarly.rotateX, risingLate.rotateX, 'the incoming sheet does not spin');
assert.equal(risingEarly.rotateX, ROTATE_FRONT);
assert.ok(
  risingEarly.top + risingEarly.hidden > risingLate.top + risingLate.hidden,
  'the incoming sheet rises',
);

const coveredAtOne = sheetFrame({ presented: 1, index: 1, height, topInset });
const coveredAtTwo = sheetFrame({ presented: 2, index: 1, height, topInset });
const leanStep = coveredAtTwo.rotateX - coveredAtOne.rotateX;
assert.ok(leanStep > 8 && leanStep < 28, `lean step ${leanStep} should be a settle, not a flip`);

const entering = sheetFrame({ presented: 0.2, index: 1, height, topInset });
assert.equal(entering.rotateX, ROTATE_FRONT);
assert.ok(
  entering.hidden > dismissTravel(height, topInset) * 0.7,
  'a new draft is still mostly below its resting position',
);

const dragged = sheetFrame({ presented: 1.65, index: 2, height, topInset });
assert.ok(
  dragged.top + dragged.hidden > front.top + front.hidden,
  'pulling the front draft down follows the gesture progress',
);
assert.equal(dragged.rotateX, front.rotateX);

assert.ok(dismissTravel(height, topInset) > 200);

const tall = sheetFrame({ presented: 2, index: 1, height: 1100, topInset: 59 });
const tallBack = sheetFrame({ presented: 2, index: 0, height: 1100, topInset: 59 });
assert.ok(Math.abs(tall.top - tallBack.top - PEEK) < 1, 'a tall phone uses the full 300pt peek');

for (const screen of [400, 700, 852, 932]) {
  for (const presented of [0, 0.2, 1, 1.5, 2, 3, 5]) {
    const last = Math.ceil(presented);
    for (let index = 0; index <= last; index += 1) {
      const frame = sheetFrame({
        presented,
        index,
        height: screen,
        topInset: 47,
      });
      assert.ok(Number.isFinite(frame.top + frame.hidden + frame.face + frame.rotateX));
      assert.ok(frame.scale > 0.9 && frame.scale <= 1);
      assert.ok(frame.rotateX >= 0 && frame.rotateX <= ROTATE_DEEP + 0.01);
      assert.equal(frame.perspective, PERSPECTIVE);
      assert.ok(frame.face > 0);
      assert.ok(frame.top >= -0.01);
      assert.ok(frame.top + frame.hidden <= screen + 0.01);
      if (index > 0) {
        assert.equal(frame.radius, RADIUS);
      }
    }
  }
}

console.log('sheetLayout tests passed');
