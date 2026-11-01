/**
 * Shared stack geometry for the mail draft deck.
 *
 * iOS and Android both feed the same Reanimated progress (settled draft count,
 * minus drag) through `sheetFrame`.
 *
 * Resting pose on an 852pt phone: card tops sit at 133, 387, and 641
 * (160, 465, and 770 px on the 1024px reference, scaled by 0.833). The same
 * ratio is used on every screen. Each face is taller than the screen, so it
 * runs past the bottom edge and the next card's top covers it.
 *
 * The lean is a few degrees around the top edge. The top edge sits about 12pt
 * in from the screen; the face below it is only slightly wider. A new draft
 * holds the front angle and rises; it does not spin.
 */

/** Phone height the reference tops were scaled onto (393×852 pt). */
export const REF_SCREEN = 852;
/** Inbox top with two drafts open, in points on `REF_SCREEN`. */
export const REF_FIRST = 133;
/** Distance between card tops, in points on `REF_SCREEN`. */
export const REF_STEP = 254;
/** Projection distance. Large enough that these angles barely taper. */
export const PERSPECTIVE = 1000;
/** Front sheet lean. It rises at this angle and does not spin in. */
export const ROTATE_FRONT = 4;
/** Inbox lean with two drafts open. Depth 1 sits halfway between the two. */
export const ROTATE_DEEP = 8;
/** Top corner radius. */
export const RADIUS = 38;
/** Side inset at the top edge, about 15px on the reference image. */
export const SIDE_INSET = 12;
/** How far a stacked face continues past the bottom of the screen. */
export const OVERHANG = 320;
/** White alpha of the inbox once a draft covers it. */
export const INBOX_FILL = 0.9;
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
  /** White fill alpha. The inbox becomes translucent; drafts stay solid. */
  fill: number;
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
      fill: 1,
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
  const fill = index === 0 ? lerp(1, INBOX_FILL, blend) : 1;

  return {
    top,
    hidden,
    face: height + OVERHANG,
    scale: 1,
    radius,
    appear,
    dim: clamp(depth, 0, 1),
    rotateX,
    perspective: PERSPECTIVE,
    peek,
    inset,
    fill,
  };
}
