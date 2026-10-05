export interface Rect { left: number; top: number; width: number; height: number }
export type Side = 'right' | 'left' | 'bottom' | 'top';
export interface PopupPosition extends Rect { side: Side | 'center' }
export const TOUR_GAP = 20;
export const TOUR_MARGIN = 12;

/** Choose an unobstructed viewport region, never clamp a popup across its target. */
export function positionPopup(target: Rect | null, popup: { width: number; height: number }, viewport: Rect, previous?: Side | 'center'): PopupPosition | null {
  const x = viewport.left + TOUR_MARGIN;
  const y = viewport.top + TOUR_MARGIN;
  const width = Math.max(0, viewport.width - 2 * TOUR_MARGIN);
  const height = Math.max(0, viewport.height - 2 * TOUR_MARGIN);
  const right = x + width;
  const bottom = y + height;
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
  if (!target) return { side: 'center', left: x + (width - Math.min(popup.width, width)) / 2, top: y + (height - Math.min(popup.height, height)) / 2, width: Math.min(popup.width, width), height: Math.min(popup.height, height) };
  const regions: (Rect & { side: Side })[] = [
    { side: 'right', left: Math.max(x, target.left + target.width + TOUR_GAP), top: y, width: right - Math.max(x, target.left + target.width + TOUR_GAP), height },
    { side: 'left', left: x, top: y, width: Math.min(right, target.left - TOUR_GAP) - x, height },
    { side: 'bottom', left: x, top: Math.max(y, target.top + target.height + TOUR_GAP), width, height: bottom - Math.max(y, target.top + target.height + TOUR_GAP) },
    { side: 'top', left: x, top: y, width, height: Math.min(bottom, target.top - TOUR_GAP) - y },
  ];
  const full = regions.filter((r) => r.width >= popup.width && r.height >= popup.height);
  // Keep a valid full placement to avoid flipping sides during small movements.
  let region = full.find((r) => r.side === previous) ?? full[0];
  if (!region) {
    const usable = regions.filter((r) => r.width >= Math.min(popup.width, width) && r.height >= 72);
    usable.sort((a, b) => Math.min(b.width, popup.width) * Math.min(b.height, popup.height) - Math.min(a.width, popup.width) * Math.min(a.height, popup.height));
    region = usable[0];
  }
  if (!region) return null;
  const w = Math.min(region.width, popup.width);
  const h = Math.min(region.height, popup.height);
  const horizontal = region.side === 'left' || region.side === 'right';
  return {
    side: region.side, width: w, height: h,
    left: horizontal ? (region.side === 'left' ? region.left + region.width - w : region.left) : clamp(target.left + (target.width - w) / 2, region.left, region.left + region.width - w),
    top: horizontal ? clamp(target.top + (target.height - h) / 2, region.top, region.top + region.height - h) : (region.side === 'top' ? region.top + region.height - h : region.top),
  };
}
