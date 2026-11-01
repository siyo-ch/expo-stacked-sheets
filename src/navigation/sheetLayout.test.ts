import assert from 'node:assert/strict';

import {
  INBOX_DIM,
  INBOX_SCALE,
  MOTION_DURATION,
  MOTION_EASING,
  PEEK,
  RADIUS,
  dismissTravel,
  sheetFrame,
} from './sheetLayout.ts';

const height = 852;
const topInset = 59;

assert.ok(PEEK >= 56 && PEEK <= 64, `peek ${PEEK}`);
assert.ok(RADIUS >= 38 && RADIUS <= 40, `radius ${RADIUS}`);
assert.ok(INBOX_SCALE >= 0.92 && INBOX_SCALE <= 0.94, `inbox scale constant ${INBOX_SCALE}`);
assert.ok(MOTION_DURATION >= 280 && MOTION_DURATION <= 320, `duration ${MOTION_DURATION}`);
assert.equal(MOTION_EASING, 'ease-out');
assert.ok(INBOX_DIM > 0 && INBOX_DIM < 0.45);

const inboxAlone = sheetFrame({ presented: 0, index: 0, height, topInset });
assert.equal(inboxAlone.top, 0);
assert.equal(inboxAlone.hidden, 0);
assert.equal(inboxAlone.scale, 1);
assert.equal(inboxAlone.radius, 0);
assert.equal(inboxAlone.dim, 0);

const front = sheetFrame({ presented: 2, index: 2, height, topInset });
const middle = sheetFrame({ presented: 2, index: 1, height, topInset });
const back = sheetFrame({ presented: 2, index: 0, height, topInset });

assert.ok(back.top < middle.top, 'inbox sits above the middle draft');
assert.ok(middle.top < front.top, 'middle draft sits above the front draft');
assert.equal(front.hidden, 0);
assert.equal(front.scale, 1);
assert.ok(middle.scale < front.scale);
assert.ok(back.scale < middle.scale);
assert.ok(back.scale >= 0.92 && back.scale <= 0.94, `inbox scale ${back.scale}`);
assert.equal(front.dim, 0);
assert.ok(back.dim > 0.1, 'covered inbox is dimmed');

const peek = middle.top - back.top;
assert.ok(peek >= 56 && peek <= 64, `covered card peek was ${peek}`);
const frontGap = front.top - middle.top;
assert.ok(frontGap >= 56 && frontGap <= 64, `front gap was ${frontGap}`);
assert.ok(Math.abs(peek - frontGap) < 0.01, 'each layer exposes the same strip');

assert.ok(front.radius >= 38 && front.radius <= 40);
assert.ok(middle.radius >= 38 && middle.radius <= 40);
assert.ok(back.radius >= 38 && back.radius <= 40);

assert.ok(back.top < topInset + 24, 'two drafts keep the inbox under the status bar');

const inboxOne = sheetFrame({ presented: 1, index: 0, height, topInset });
const draftOne = sheetFrame({ presented: 1, index: 1, height, topInset });
assert.ok(inboxOne.top > back.top + 40, 'the second draft lifts the inbox');
assert.ok(middle.top < draftOne.top - 40, 'the covered draft moves up to expose its top bar');
assert.ok(inboxOne.scale > back.scale, 'the inbox compresses further as another draft opens');
assert.ok(draftOne.top - inboxOne.top >= 56 && draftOne.top - inboxOne.top <= 64);

function visible(presented: number, index: number) {
  const frame = sheetFrame({ presented, index, height, topInset });
  return frame.top + frame.hidden;
}

assert.ok(visible(0.25, 1) > visible(0.75, 1), 'the first draft slides up');
assert.ok(visible(1.25, 2) > visible(1.75, 2), 'the next draft slides up');
assert.ok(visible(1.25, 2) > height * 0.45, 'a draft that just started is still low on the screen');

const third = sheetFrame({ presented: 3, index: 1, height, topInset });
const thirdPeek = third.top - sheetFrame({ presented: 3, index: 0, height, topInset }).top;
assert.ok(thirdPeek >= 56 && thirdPeek <= 64, `third-draft peek was ${thirdPeek}`);

const entering = sheetFrame({ presented: 0.2, index: 1, height, topInset });
assert.ok(
  entering.hidden > dismissTravel(height, topInset) * 0.7,
  'a new draft is still mostly below its resting position',
);

const dragged = sheetFrame({ presented: 1.65, index: 2, height, topInset });
assert.ok(
  dragged.top + dragged.hidden > front.top + front.hidden,
  'pulling the front draft down follows the gesture progress',
);

assert.ok(dismissTravel(height, topInset) > 200);

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
      assert.ok(Number.isFinite(frame.top + frame.hidden + frame.scale + frame.dim));
      assert.ok(frame.scale > 0.5 && frame.scale <= 1);
      assert.ok(frame.dim >= 0 && frame.dim <= INBOX_DIM + 0.001);
      assert.ok(frame.top >= -0.01);
      assert.ok(frame.top + frame.hidden <= screen + 0.01);
      if (index > 0 && presented >= index) {
        assert.ok(frame.radius >= 38 && frame.radius <= 40);
      }
    }
  }
}

console.log('sheetLayout tests passed');
