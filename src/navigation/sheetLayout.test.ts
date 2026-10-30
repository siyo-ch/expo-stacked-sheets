import assert from 'node:assert/strict';

import { dismissTravel, sheetFrame } from './sheetLayout.ts';

const height = 852;
const topInset = 59;

const inboxAlone = sheetFrame({ presented: 0, index: 0, height, topInset });
assert.equal(inboxAlone.top, 0);
assert.equal(inboxAlone.hidden, 0);
assert.equal(inboxAlone.scale, 1);
assert.equal(inboxAlone.radius, 0);

const front = sheetFrame({ presented: 2, index: 2, height, topInset });
const middle = sheetFrame({ presented: 2, index: 1, height, topInset });
const back = sheetFrame({ presented: 2, index: 0, height, topInset });

assert.ok(back.top < middle.top, 'inbox sits above the middle draft');
assert.ok(middle.top < front.top, 'middle draft sits above the front draft');
assert.equal(front.hidden, 0);
assert.equal(front.scale, 1);
assert.ok(middle.scale < front.scale);
assert.ok(back.scale < middle.scale);

const peek = middle.top - back.top;
assert.ok(peek > 140 && peek < 320, `covered card peek was ${peek}`);
assert.ok(front.top - middle.top > 140);

const inboxOne = sheetFrame({ presented: 1, index: 0, height, topInset });
assert.ok(inboxOne.top < topInset + 24, 'one draft keeps the inbox under the status bar');
assert.ok(back.top < topInset + 24, 'two drafts keep the inbox under the status bar');

const compressed = sheetFrame({ presented: 3, index: 1, height, topInset });
assert.ok(
  compressed.top < middle.top - 40,
  'a covered draft shifts up once the stack runs out of room',
);

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
      assert.ok(Number.isFinite(frame.top + frame.hidden + frame.scale));
      assert.ok(frame.scale > 0.5 && frame.scale <= 1);
      assert.ok(frame.top >= -0.01);
      assert.ok(frame.top + frame.hidden <= screen + 0.01);
    }
  }
}

console.log('sheetLayout tests passed');
