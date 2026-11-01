/**
 * Shared stack geometry for mail draft cards.
 *
 * native-stack has no cardStyleInterpolator, so iOS and Android both feed the
 * same Reanimated progress (settled draft count, minus any drag) through
 * `sheetFrame`. Peek, radius, scale, dim, and push/dismiss timing live here
 * so the two platforms cannot drift.
 *
 * Settled stack, top to bottom:
 *   inbox card, then one peek strip per covered draft, then the front sheet.
 * Pushing a draft slides the new sheet up from the bottom. Until the inbox
 * touches the ceiling, every card already on screen moves up by one peek and
 * scales down. Dismiss plays the same curve backwards.
 */

/** Visible strip of each covered card, including its top bar. */
export const PEEK = 60;
/** Top corner radius of every card once it is in the stack. */
export const RADIUS = 40;
/** Inbox scale with two drafts open. */
export const INBOX_SCALE = 0.93;
/** Scale lost per layer of depth. Two layers land on `INBOX_SCALE`. */
export const SCALE_STEP = (1 - INBOX_SCALE) / 2;
/** Black veil over the inbox while a draft covers it. */
export const INBOX_DIM = 0.2;
/** Push and dismiss duration, in milliseconds. */
export const MOTION_DURATION = 300;
/** Push and dismiss easing. `sheetMotion` builds the Reanimated curve from this. */
export const MOTION_EASING = 'ease-out' as const;

const TOP_GAP = 8;
const SCALE_DEPTH = 2;

export type SheetFrame = {
  /** Resting top once this card has finished entering. */
  top: number;
  /** Extra downward offset while the card is entering or being dismissed. */
  hidden: number;
  scale: number;
  radius: number;
  appear: number;
  /** Black overlay strength. Only the inbox is dimmed. */
  dim: number;
};

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, progress: number) {
  'worklet';
  return from + (to - from) * progress;
}

export function stackMetrics(height: number, topInset: number, presented: number) {
  'worklet';
  const count = Math.max(presented, 0);
  const firstTop = topInset + TOP_GAP;
  const minFront = Math.max(220, Math.min(height * 0.45, 340));
  const maxFrontTop = Math.max(firstTop + 1, height - minFront);
  // One draft sits a peek below the ceiling so the next push can lift the
  // inbox and the covered sheet by exactly one strip.
  const riseUnits = Math.max(0, 2 - count);
  const units = riseUnits + count;
  const naturalFront = firstTop + units * PEEK;
  const frontRest = Math.min(naturalFront, maxFrontTop);
  const span = Math.max(0, frontRest - firstTop);
  const peek = units > 0.001 ? Math.min(PEEK, span / units) : 0;
  const rise = riseUnits * peek;
  return { firstTop, frontRest, peek, rise };
}

/** Finger travel that maps onto the front sheet sliding off from its current rest. */
export function dismissTravel(height: number, topInset: number, presented = 1) {
  'worklet';
  const { frontRest } = stackMetrics(height, topInset, Math.max(presented, 0));
  return Math.max(1, height - frontRest);
}

export function sheetFrame(input: {
  presented: number;
  index: number;
  height: number;
  topInset: number;
}): SheetFrame {
  'worklet';
  const presented = Math.max(0, input.presented);
  const { index, height, topInset } = input;
  const appear = index === 0 ? 1 : clamp(presented - (index - 1), 0, 1);
  const depth = Math.max(0, presented - index);

  if (presented <= 0.001 && index === 0) {
    return { top: 0, hidden: 0, scale: 1, radius: 0, appear: 1, dim: 0 };
  }

  const { firstTop, peek, rise } = stackMetrics(height, topInset, presented);
  const stackedTop = firstTop + rise + index * peek;
  const blend = clamp(presented, 0, 1);
  const top = index === 0 ? lerp(0, stackedTop, blend) : stackedTop;
  const hidden = (1 - appear) * Math.max(0, height - top);
  const scale = 1 - Math.min(depth, SCALE_DEPTH) * SCALE_STEP;
  const radius = index === 0 ? lerp(0, RADIUS, blend) : RADIUS;
  const dim = index === 0 ? blend * INBOX_DIM : 0;

  return { top, hidden, scale, radius, appear, dim };
}
