/** Geometry from the supplied iOS Mail video. Editing is flat; only the
 * scrollable draft overview uses perspective. All distances are in points. */
export const SPRING = { stiffness: 340, damping: 36, mass: 1, overshootClamping: true };
export const CARD_RADIUS = 36;
export const CARD_INSET = 12;
export const PERSPECTIVE = 1800;
export function clamp(value: number, low: number, high: number) {
  'worklet';
  return Math.max(low, Math.min(high, value));
}
export type EditorFrame = {
  top: number;
  width: number;
  height: number;
  radius: number;
  cosine: number;
  taper: number;
  progress: number;
  compact: number;
};
export function draftDockFrame(width: number, height: number, bottomInset: number, ios: boolean) {
  'worklet';
  const dockHeight = Math.max(74, bottomInset + 40);
  const bottom = ios ? 2 : Math.max(bottomInset, 2);
  return {
    top: height - bottom - dockHeight,
    width: width - 32,
    height: dockHeight,
    radius: dockHeight / 2,
    cosine: 1,
    taper: 0,
    progress: 0,
    compact: 1,
  };
}
export function fullEditorFrame(width: number, height: number, topInset: number): EditorFrame {
  'worklet';
  const top = topInset + 4;
  return { top, width, height: height - top, radius: 28, cosine: 1, taper: 0, progress: 1, compact: 0 };
}
/** Interpolate a captured frame, so taking over an unfinished animation never
 * resets the paper to its fully open position. Content itself is never scaled. */
export function mixEditorFrames(from: EditorFrame, to: EditorFrame, progress: number): EditorFrame {
  'worklet';
  const p = clamp(progress, 0, 1);
  return {
    top: from.top + (to.top - from.top) * p,
    width: from.width + (to.width - from.width) * p,
    height: from.height + (to.height - from.height) * p,
    radius: from.radius + (to.radius - from.radius) * p,
    cosine: from.cosine + (to.cosine - from.cosine) * p,
    taper: from.taper + (to.taper - from.taper) * p,
    progress: from.progress + (to.progress - from.progress) * p,
    compact: from.compact + (to.compact - from.compact) * p,
  };
}
export function deckMetrics(height: number, count: number) {
  'worklet';
  const first = height * 0.155;
  const step = height * (0.298 - 0.053 * clamp(count - 2, 0, 1));
  const maxScroll = Math.max(0, first + count * step - height * 0.64);
  return { first, step, maxScroll };
}
export function deckFrame(
  index: number,
  count: number,
  height: number,
  scroll: number,
) {
  'worklet';
  const { first, step } = deckMetrics(height, count);
  const top = first + index * step - scroll;
  // Cards change their lean gently as they pass through the viewport.
  const angle = -(38 + 10 * clamp(top / height, 0, 1));
  const radians = (angle * Math.PI) / 180;
  return { top, cosine: Math.cos(radians), taper: -Math.sin(radians) / PERSPECTIVE };
}
export function shouldMinimize(distance: number, velocity: number, canceled: boolean) {
  'worklet';
  return !canceled && (distance > 110 || (distance > 32 && velocity > 850));
}
export function shouldDismissCard(
  distance: number,
  velocity: number,
  width: number,
  canceled: boolean,
) {
  'worklet';
  return (
    !canceled &&
    (Math.abs(distance) > width * 0.28 ||
      (Math.abs(distance) > 32 && Math.abs(velocity) > 850))
  );
}

/** One homography keeps the paper in the XY plane. RN requires matrix to be
 * the sole transform; translation is composed into its numerator here. */
export function paperTransform(
  top: number,
  x: number,
  cosine: number,
  taper: number,
  scaleX = 1,
) {
  'worklet';
  return [
    scaleX,
    0,
    0,
    0,
    x * taper,
    cosine + top * taper,
    0,
    taper,
    0,
    0,
    1,
    0,
    x,
    top,
    0,
    1,
  ];
}

export function paperTransforms(
  android: boolean,
  top: number,
  cosine: number,
  taper: number,
  scaleX = 1,
) {
  'worklet';
  if (!android) return [{ matrix: paperTransform(top, 0, cosine, taper, scaleX) }];

  // Android's native View only preserves the camera's Z perspective when
  // decomposing transforms. Reconstruct the camera and X rotation explicitly.
  const angle = -Math.asin(clamp(taper * PERSPECTIVE, -1, 1));
  return [
    { translateY: top },
    { perspective: PERSPECTIVE },
    { rotateX: `${angle}rad` as const },
    { scaleX },
    { scaleY: cosine / Math.cos(angle) },
  ];
}
