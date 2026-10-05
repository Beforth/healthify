import assert from 'node:assert/strict';
import test from 'node:test';
import { positionPopup, TOUR_GAP, TOUR_MARGIN } from '../src/tour/positionPopup.ts';

const popup = { width: 280, height: 240 };
const viewport = (width, height) => ({ left: 0, top: 0, width, height });
function verify(target, p, v) {
  assert.ok(p);
  assert.ok(p.left >= v.left + TOUR_MARGIN - .001);
  assert.ok(p.top >= v.top + TOUR_MARGIN - .001);
  assert.ok(p.left + p.width <= v.left + v.width - TOUR_MARGIN + .001);
  assert.ok(p.top + p.height <= v.top + v.height - TOUR_MARGIN + .001);
  if (target) assert.ok(
    p.left >= target.left + target.width + TOUR_GAP - .001 ||
    p.left + p.width <= target.left - TOUR_GAP + .001 ||
    p.top >= target.top + target.height + TOUR_GAP - .001 ||
    p.top + p.height <= target.top - TOUR_GAP + .001,
    JSON.stringify({ target, p, v }),
  );
}

test('uses all four sides based on available space', () => {
  const v = viewport(1000, 800);
  const targets = [
    [{ left: 20, top: 300, width: 100, height: 100 }, 'right'],
    [{ left: 850, top: 300, width: 100, height: 100 }, 'left'],
    [{ left: 200, top: 20, width: 600, height: 100 }, 'bottom'],
    [{ left: 200, top: 650, width: 600, height: 100 }, 'top'],
  ];
  for (const [target, side] of targets) {
    const p = positionPopup(target, popup, v);
    verify(target, p, v);
    assert.equal(p.side, side);
  }
});

test('mobile uses vertical space and constrains height without overlap', () => {
  const v = viewport(360, 640);
  const target = { left: 20, top: 230, width: 320, height: 220 };
  const p = positionPopup(target, popup, v);
  verify(target, p, v);
  assert.ok(p.height < popup.height);
});

test('keeps the previous side when it still fits fully', () => {
  const v = viewport(1400, 900);
  const target = { left: 650, top: 400, width: 100, height: 80 };
  assert.equal(positionPopup(target, popup, v, 'left').side, 'left');
});

test('centered steps fit small viewports, including visual viewport offsets', () => {
  const v = { left: 30, top: 120, width: 260, height: 200 };
  verify(null, positionPopup(null, popup, v), v);
});

test('impossible geometry requests layout recovery instead of overlapping', () => {
  assert.equal(positionPopup({ left: 0, top: 0, width: 360, height: 640 }, popup, viewport(360, 640)), null);
});

test('desktop, laptop, tablet and mobile target positions never overlap', () => {
  for (const [width, height] of [[1440, 900], [1024, 768], [768, 1024], [390, 844], [320, 568], [844, 390]]) {
    const v = viewport(width, height);
    const size = { width: Math.min(280, width - 24), height: 250 };
    for (let x = 12; x < width - 50; x += 41) {
      for (let y = 12; y < height - 40; y += 37) {
        const target = { left: x, top: y, width: Math.min(200, width - x), height: Math.min(140, height - y) };
        const p = positionPopup(target, size, v);
        if (p) verify(target, p, v);
      }
    }
  }
});
