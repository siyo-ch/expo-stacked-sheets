/**
 * Shared stack geometry for the mail draft deck.
 *
 * iOS and Android both feed the same Reanimated progress (settled draft count,
 * minus drag) through `sheetFrame`. Perspective, resting lean, peek, radius,
 * and the 300ms ease-out live here.
 *
 * The lean is the resting pose: each layer's rotateX depends only on how deep
 * it sits. A new draft's depth stays 0 while it rises, so it keeps the front
 * angle and slides up. Covered cards pick up a few more degrees of lean as
 * another draft is added. That is not a flip; the pivot is the top edge.
 */

/** Distance between successive card tops, before a short screen compresses it. */
export const PEEK = 300;
/** Projection distance. Smaller reads as a stronger taper. */
export const PERSPECTIVE = 900;
/** Front sheet lean. It rises at this angle and does not spin in. */
export const ROTATE_FRONT = 28;
/** Inbox lean with two drafts open. Depth 1 sits halfway between the two. */
export const ROTATE_DEEP = 60;
/** Top corner radius once a card is in the deck. */
export const RADIUS = 46;
/** Horizontal inset so the shorter top edge sits inside the black backdrop. */
export const SIDE_INSET = 28;
/** White alpha of the inbox once a draft covers it. */
export const INBOX_FILL = 0.84;
/** Push and dismiss duration, in milliseconds. */
export const MOTION_DURATION = 300;
/** Push and dismiss easing. `sheetMotion` builds the Reanimated curve from this. */
export const MOTION_EASING = 'ease-out' as const;

const TOP_GAP = 10;
const TILT_DEPTH = 2;

export type SheetFrame = {
  /** Resting top of the card's top edge. */
  top: number;
  /** Extra downward offset while the card is entering or leaving. */
  hidden: number;
  /** Height of the tilted face. The front face runs to the bottom of the screen. */
  face: number;
  scale: number;
  radius: number;
  appear: number;
  /** Grey dissolve over the lower part of a covered card. */
  dim: number;
  /** Resting lean in degrees, pivoted at the top edge. */
  rotateX: number;
  perspective: number;
  /** White fill alpha. The inbox goes translucent; drafts stay solid. */
  fill: number;
  inset: number;
  /** On-screen step down to the next card. Places the grey dissolve. */
  peek: number;
};

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, progress: number) {
  'worklet';
  return from + (to - from) * progress;
}

function tilt(depth: number) {
  'worklet';
  const t = clamp(depth, 0, TILT_DEPTH) / TILT_DEPTH;
  return ROTATE_FRONT + (ROTATE_DEEP - ROTATE_FRONT) * t;
}

export function stackMetrics(height: number, topInset: number, presented: number) {
  'worklet';
  const count = Math.max(presented, 0);
  const firstTop = topInset + TOP_GAP;
  const minFront = Math.max(220, Math.min(height * 0.32, 320));
  const maxFrontTop = Math.max(firstTop + 1, height - minFront);
  const natural = firstTop + count * PEEK;
  const frontRest = count > 0.001 ? Math.min(natural, maxFrontTop) : firstTop;
  const span = Math.max(0, frontRest - firstTop);
  const peek = count > 0.001 ? Math.min(PEEK, span / count) : 0;
  return { firstTop, frontRest, peek };
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
    return {
      top: 0,
      hidden: 0,
      face: height,
      scale: 1,
      radius: 0,
      appear: 1,
      dim: 0,
      rotateX: 0,
      perspective: PERSPECTIVE,
      fill: 1,
      inset: 0,
      peek: 0,
    };
  }

  const { firstTop, peek } = stackMetrics(height, topInset, presented);
  const stackedTop = firstTop + index * peek;
  const blend = clamp(presented, 0, 1);
  const top = index === 0 ? lerp(0, stackedTop, blend) : stackedTop;
  const hidden = (1 - appear) * Math.max(0, height - top);
  const full = Math.max(1, height - stackedTop);
  const slab = Math.min(full, Math.max(220, peek * 1.25));
  const face = lerp(full, slab, clamp(depth, 0, 1));
  const scale = 1 - Math.min(depth, TILT_DEPTH) * 0.015;
  const radius = index === 0 ? lerp(0, RADIUS, blend) : RADIUS;
  // Drafts use the resting lean for their depth the whole time they move,
  // including while the front one is still off the bottom of the screen.
  const resting = tilt(depth);
  const rotateX = index === 0 ? lerp(0, resting, blend) : resting;
  const dim = clamp(depth, 0, 1);
  const fill = index === 0 ? lerp(1, INBOX_FILL, blend) : 1;
  const inset = index === 0 ? lerp(0, SIDE_INSET, blend) : SIDE_INSET;

  return {
    top,
    hidden,
    face,
    scale,
    radius,
    appear,
    dim,
    rotateX,
    perspective: PERSPECTIVE,
    fill,
    inset,
    peek,
  };
}
