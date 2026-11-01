/**
 * Shared stack geometry for the mail draft deck.
 *
 * iOS and Android both feed the same Reanimated progress (settled draft count,
 * minus drag) through `sheetFrame`.
 *
 * Resting pose, measured on a 1024pt screen: card tops sit near 160, 465, and
 * 770 (about 30% of the screen per layer) on every phone, with no short-screen
 * squeeze. Each face is a full screen tall, so it runs past the bottom edge and
 * the next card's top covers it. There is no gap to the backdrop.
 *
 * The lean is a few degrees around the top edge. Across one layer the top of
 * the card stays about 94–97% as wide as the face below it. A new draft holds
 * the front angle and rises; it does not spin.
 */

/** Reference screen the top offsets were measured on. */
export const REF_SCREEN = 1024;
/** Inbox top with two drafts open, on `REF_SCREEN`. */
export const REF_FIRST = 160;
/** Distance between card tops, on `REF_SCREEN` (465 - 160, 770 - 465). */
export const REF_STEP = 305;
/** Projection distance. Large enough that a few degrees only taper slightly. */
export const PERSPECTIVE = 800;
/** Front sheet lean. It rises at this angle and does not spin in. */
export const ROTATE_FRONT = 8;
/** Inbox lean with two drafts open. Depth 1 sits halfway between the two. */
export const ROTATE_DEEP = 10;
/** Top corner radius. The front card must show the whole curve. */
export const RADIUS = 46;
/** A few points of side inset. Perspective opens the face back toward the screen edge. */
export const SIDE_INSET = 10;
/** Push and dismiss duration, in milliseconds. */
export const MOTION_DURATION = 300;
/** Push and dismiss easing. `sheetMotion` builds the Reanimated curve from this. */
export const MOTION_EASING = 'ease-out' as const;

const TILT_DEPTH = 2;

export type SheetFrame = {
  /** Resting top of the card's top edge. */
  top: number;
  /** Extra downward offset while the card is entering or leaving. */
  hidden: number;
  /** Face height. A full screen tall, so the card continues past the bottom. */
  face: number;
  scale: number;
  radius: number;
  appear: number;
  /** Strength of the light grey dissolve on a covered card. */
  dim: number;
  /** Resting lean in degrees, pivoted at the top edge. */
  rotateX: number;
  perspective: number;
  /** On-screen step down to the next card. Places the grey dissolve. */
  peek: number;
  inset: number;
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

export function stackMetrics(height: number, _topInset: number, presented: number) {
  'worklet';
  const count = Math.max(presented, 0);
  const firstTop = (height * REF_FIRST) / REF_SCREEN;
  const peek = (height * REF_STEP) / REF_SCREEN;
  const frontRest = firstTop + count * peek;
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
      peek: 0,
      inset: 0,
    };
  }

  const { firstTop, peek } = stackMetrics(height, topInset, presented);
  const stackedTop = firstTop + index * peek;
  const blend = clamp(presented, 0, 1);
  const top = index === 0 ? lerp(0, stackedTop, blend) : stackedTop;
  const hidden = (1 - appear) * Math.max(0, height - top);
  const radius = index === 0 ? lerp(0, RADIUS, blend) : RADIUS;
  const resting = tilt(depth);
  const rotateX = index === 0 ? lerp(0, resting, blend) : resting;
  const inset = index === 0 ? lerp(0, SIDE_INSET, blend) : SIDE_INSET;

  return {
    top,
    hidden,
    face: height,
    scale: 1,
    radius,
    appear,
    dim: clamp(depth, 0, 1),
    rotateX,
    perspective: PERSPECTIVE,
    peek,
    inset,
  };
}
