/**
 * Shared stack interpolator for the mail draft cards.
 *
 * native-stack has no cardStyleInterpolator, so both platforms drive the same
 * Reanimated progress (`presented` draft count, minus the drag fraction) through
 * this function: scale, vertical rest position, and the distance a card still
 * has to travel while it is entering or leaving.
 */

const PEEK_MAX = 280;
const RADIUS = 36;
const SCALE_STEP = 0.042;

export type SheetFrame = {
  /** Resting top once this card has finished entering. */
  top: number;
  /** Extra downward offset while the card is entering or being dismissed. */
  hidden: number;
  scale: number;
  radius: number;
  appear: number;
};

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, progress: number) {
  'worklet';
  return from + (to - from) * progress;
}

const SHIFT_UP = 8;

export function stackMetrics(height: number, topInset: number, presented: number) {
  'worklet';
  const firstTop = topInset + 8;
  const minFront = Math.max(260, Math.min(height * 0.38, 280));
  const maxFrontTop = Math.max(firstTop + 1, height - minFront);
  const natural = firstTop + Math.max(presented, 0) * PEEK_MAX;
  const frontRest = Math.min(natural, maxFrontTop);
  return { firstTop, frontRest };
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
    return { top: 0, hidden: 0, scale: 1, radius: 0, appear: 1 };
  }

  const { firstTop, frontRest } = stackMetrics(height, topInset, presented);
  const room = Math.max(0, frontRest - firstTop);
  const peek = presented > 0.001 ? Math.min(PEEK_MAX, room / presented) : 0;
  const stackedTop = frontRest - depth * peek;
  const blend = clamp(presented, 0, 1);
  const lifted = Math.max(index === 0 ? topInset : 0, stackedTop - depth * SHIFT_UP);
  const top = index === 0 ? lerp(0, lifted, blend) : lifted;
  const hidden = (1 - appear) * Math.max(0, height - top);
  const scale = 1 - Math.min(depth, 6) * SCALE_STEP;
  const radius = index === 0 ? lerp(0, RADIUS, blend) : RADIUS;

  return { top, hidden, scale, radius, appear };
}
