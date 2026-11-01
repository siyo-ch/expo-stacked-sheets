import assert from 'node:assert/strict';

import {
  MOTION_DURATION,
  MOTION_EASING,
  PERSPECTIVE,
  RADIUS,
  REF_FIRST,
  REF_SCREEN,
  REF_STEP,
  ROTATE_DEEP,
  ROTATE_FRONT,
  SIDE_INSET,
  dismissTravel,
  sheetFrame,
} from './sheetLayout.ts';

assert.ok(PERSPECTIVE >= 700 && PERSPECTIVE <= 1200);
assert.ok(ROTATE_DEEP > ROTATE_FRONT);
assert.ok(ROTATE_DEEP <= 12, `deep lean ${ROTATE_DEEP} is still a hard tilt`);
assert.equal(SIDE_INSET, 10);
assert.ok(ROTATE_FRONT >= 6 && ROTATE_FRONT <= 9);
assert.equal(RADIUS, 46);
assert.ok(MOTION_DURATION >= 280 && MOTION_DURATION <= 320);
assert.equal(MOTION_EASING, 'ease-out');
assert.equal(REF_FIRST, 160);
assert.equal(REF_FIRST + REF_STEP, 465);
assert.equal(REF_FIRST + REF_STEP * 2, 770);

/** Visible width ratio from just under the radius to near the next card. */
function widthRatio(angleDeg: number, screen = 393) {
  const s = Math.sin((angleDeg * Math.PI) / 180);
  const layout = screen - SIDE_INSET * 2;
  const width = (y: number) =>
    Math.min(screen, (layout * PERSPECTIVE) / (PERSPECTIVE - y * s));
  return width(50) / width(220);
}

for (const angle of [ROTATE_FRONT, (ROTATE_FRONT + ROTATE_DEEP) / 2, ROTATE_DEEP]) {
  const ratio = widthRatio(angle);
  assert.ok(
    ratio >= 0.94 && ratio <= 0.972,
    `top/lower width at ${angle}deg was ${ratio.toFixed(3)}`,
  );
}

const ref = 1024;
const back = sheetFrame({ presented: 2, index: 0, height: ref, topInset: 59 });
const middle = sheetFrame({ presented: 2, index: 1, height: ref, topInset: 59 });
const front = sheetFrame({ presented: 2, index: 2, height: ref, topInset: 59 });

assert.ok(Math.abs(back.top - 160) < 0.5, `inbox top ${back.top}`);
assert.ok(Math.abs(middle.top - 465) < 0.5, `middle top ${middle.top}`);
assert.ok(Math.abs(front.top - 770) < 0.5, `front top ${front.top}`);
assert.equal(front.rotateX, ROTATE_FRONT);
assert.ok(middle.rotateX > front.rotateX);
assert.ok(back.rotateX > middle.rotateX);
assert.ok(back.rotateX <= 12);
assert.equal(front.dim, 0);
assert.equal(middle.dim, 1);
assert.equal(back.face, ref);
assert.ok(back.top + back.face > ref + 100, 'inbox runs past the bottom of the screen');
assert.ok(middle.top + middle.face > ref + 100, 'covered draft runs past the bottom');
assert.ok(front.top + front.face > ref + 100, 'front card runs past the bottom');
assert.equal(front.radius, RADIUS);
assert.equal(front.inset, SIDE_INSET);
assert.equal(back.inset, SIDE_INSET);

const short = sheetFrame({ presented: 2, index: 2, height: 700, topInset: 47 });
const shortBack = sheetFrame({ presented: 2, index: 0, height: 700, topInset: 47 });
const shortStep = short.top - sheetFrame({ presented: 2, index: 1, height: 700, topInset: 47 }).top;
assert.ok(
  Math.abs(shortStep / 700 - REF_STEP / REF_SCREEN) < 0.001,
  'a short screen keeps the 30% layer step',
);
assert.ok(shortBack.top / 700 - REF_FIRST / REF_SCREEN < 0.001);

const inboxAlone = sheetFrame({ presented: 0, index: 0, height: ref, topInset: 59 });
assert.equal(inboxAlone.top, 0);
assert.equal(inboxAlone.rotateX, 0);
assert.equal(inboxAlone.radius, 0);
assert.equal(inboxAlone.hidden, 0);

const risingEarly = sheetFrame({ presented: 1.2, index: 2, height: ref, topInset: 59 });
const risingLate = sheetFrame({ presented: 1.85, index: 2, height: ref, topInset: 59 });
assert.equal(risingEarly.rotateX, risingLate.rotateX);
assert.equal(risingEarly.rotateX, ROTATE_FRONT);
assert.ok(risingEarly.top + risingEarly.hidden > risingLate.top + risingLate.hidden);

const coveredAtOne = sheetFrame({ presented: 1, index: 1, height: ref, topInset: 59 });
const coveredAtTwo = sheetFrame({ presented: 2, index: 1, height: ref, topInset: 59 });
const leanStep = coveredAtTwo.rotateX - coveredAtOne.rotateX;
assert.ok(leanStep > 0 && leanStep < 4, `lean step ${leanStep} should settle, not flip`);

const entering = sheetFrame({ presented: 0.2, index: 1, height: ref, topInset: 59 });
assert.equal(entering.rotateX, ROTATE_FRONT);
assert.ok(entering.hidden > dismissTravel(ref, 59) * 0.7);

const dragged = sheetFrame({ presented: 1.65, index: 2, height: ref, topInset: 59 });
assert.ok(dragged.top + dragged.hidden > front.top);
assert.equal(dragged.rotateX, front.rotateX);
assert.ok(dismissTravel(ref, 59) > 200);

for (const screen of [700, 852, 932, 1024]) {
  for (const presented of [0, 0.2, 1, 1.5, 2, 3]) {
    const last = Math.ceil(presented);
    for (let index = 0; index <= last; index += 1) {
      const frame = sheetFrame({
        presented,
        index,
        height: screen,
        topInset: 47,
      });
      assert.ok(Number.isFinite(frame.top + frame.hidden + frame.face + frame.rotateX));
      assert.equal(frame.scale, 1);
      assert.ok(frame.rotateX >= 0 && frame.rotateX <= ROTATE_DEEP + 0.01);
      assert.equal(frame.perspective, PERSPECTIVE);
      assert.equal(frame.face, screen);
      assert.ok(frame.top >= -0.01);
    }
  }
}

console.log('sheetLayout tests passed');
