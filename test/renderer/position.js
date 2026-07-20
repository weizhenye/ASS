import { describe, it, expect } from 'vitest';
import { getPosition } from '../../src/renderer/position.js';

/**
 * references:
 *   - https://github.com/libass/libass/wiki/ASS-File-Format-Guide
 *   - https://aegisub.org/docs/latest/styles/
 *   - https://aegisub.org/docs/latest/ass_tags/
 *
 * `Alignment`:
 *   7  top-left      8  top-center      9  top-right
 *   4  middle-left   5  middle-center   6  middle-right
 *   1  bottom-left   2  bottom-center   3  bottom-right
 *
 * `MarginV` - meaning depends on vertical alignment band:
 *   - Top-aligned     (7-9): distance from screen TOP to subtitle TOP
 *   - Middle-aligned  (4-6): ignored for vertical positioning
 *   - Bottom-aligned  (1-3): distance from screen BOTTOM to subtitle BOTTOM
 *
 * `MarginL` / `MarginR` - left and right indentation from screen edges.
 * All margin values and `\pos` / `\move` coordinates are in script-pixel space
 * (`PlayResX`, `PlayResY`) and are scaled by `store.scale` to CSS pixels.
 */

/**
 * Creates a minimal mock store for testing getPosition.
 */
function mockStore(overrides = {}) {
  return {
    video: { currentTime: 0 },
    scale: 1,
    width: 640, // = scale * PlayResX
    height: 360, // = scale * PlayResY
    space: [],
    delay: 0,
    ...overrides,
  };
}

/**
 * Creates a minimal mock dialogue for testing getPosition.
 * The `alignment` property is the raw ASS alignment value (1-9).
 * Default: center-bottom (alignment 2).
 * Override with `align` to auto-compute alignment, or set `alignment` directly.
 */
function mockDialogue(overrides = {}) {
  const base = {
    pos: null,
    move: null,
    align: { h: 1, v: 0 },
    width: 100,
    height: 15,
    margin: { left: 10, right: 10, vertical: 10 },
    slices: [{ fragments: [{ tag: {}, keyframes: undefined }] }],
    layer: 0,
    end: 10,
    ...overrides,
  };
  if (!('alignment' in overrides)) {
    base.alignment = base.align.v * 3 + base.align.h + 1;
  }
  return base;
}

describe('getPosition', () => {
  describe('without \\pos or \\move (auto-position)', () => {
    /*
     * Style: Alignment, MarginL, MarginR fields.
     * When no \pos or \move override is present, horizontal position is
     * derived from MarginL/MarginR and the alignment anchor.
     *
     * Horizontal anchor (the x returned by getPosition):
     *   left   → anchor at left   edge → x = 0 + MarginL
     *   center → anchor at center      → x = stageWidth / 2
     *   right  → anchor at right  edge → x = stageWidth - MarginR
     */
    it('should left-anchor for alignment 1/4/7 (align.h = 0)', () => {
      // alignment 1 (bottom-left): anchor x = 0
      const store = mockStore({ width: 640 });
      const dialogue = mockDialogue({
        width: 100,
        align: { h: 0, v: 0 },
      });
      const { x } = getPosition(dialogue, store);
      expect(x).toBe(0);
    });

    it('should center-anchor for alignment 2/5/8 (align.h = 1)', () => {
      // alignment 2 (bottom-center): anchor x = stageWidth / 2 = 320
      const store = mockStore({ width: 640 });
      const dialogue = mockDialogue({ width: 100 });
      const { x } = getPosition(dialogue, store);
      expect(x).toBe(320);
    });

    it('should right-anchor for alignment 3/6/9 (align.h = 2)', () => {
      // alignment 3 (bottom-right):
      // anchor x = stageWidth - MarginR = 640 - 10 = 630
      const store = mockStore({ width: 640 });
      const dialogue = mockDialogue({
        width: 100,
        margin: { left: 10, right: 10, vertical: 10 },
        align: { h: 2, v: 0 },
      });
      const { x } = getPosition(dialogue, store);
      expect(x).toBe(630);
    });

    /*
     * Style: MarginV field.
     *
     * vertical anchor (the y returned by getPosition):
     *   bottom → anchor at bottom → y = stageHeight - MarginV
     *   middle → anchor at center → y = stageHeight / 2
     *   top    → anchor at top    → y = MarginV
     */
    it('should position bottom-aligned text with bottom at stageHeight - MarginV', () => {
      // alignment 2 (bottom-center): anchor y = 360 - 60 = 300
      const store = mockStore({ width: 640, height: 360 });
      const dialogue = mockDialogue({
        width: 120,
        height: 15,
        margin: { left: 10, right: 10, vertical: 60 },
        align: { h: 1, v: 0 },
      });
      const { y } = getPosition(dialogue, store);
      expect(y).toBe(300);
    });

    it('should position middle-aligned text at vertical center', () => {
      // alignment 5 (middle-center): anchor y ≈ stageHeight / 2
      const store = mockStore({ width: 640, height: 360 });
      const dialogue = mockDialogue({
        width: 120,
        height: 15,
        margin: { left: 10, right: 10, vertical: 10 },
        align: { h: 1, v: 1 },
      });
      const { y } = getPosition(dialogue, store);
      expect(y).toBe(179.5);
    });

    it('should position top-aligned text with top at MarginV', () => {
      // alignment 8 (top-center): anchor y = MarginV = 30
      const store = mockStore({ width: 640, height: 360 });
      const dialogue = mockDialogue({
        width: 120,
        height: 15,
        margin: { left: 10, right: 10, vertical: 30 },
        align: { h: 1, v: 2 },
      });
      const { y } = getPosition(dialogue, store);
      expect(y).toBe(31);
    });

    it('should handle large MarginV when bottom margin exceeds available space', () => {
      // Regression test for the bug: with MarginV=331 on a 360px canvas
      // (alignment 2), the bottom should be at 360 - 331 = 29.
      // Before the fix the collision scan never ran (initial result=28 was
      // below the old loop bound i > 331), so the element stayed at y≈43
      // — about 1 line-height too low.
      const store = mockStore({ width: 640, height: 360 });
      const dialogue = mockDialogue({
        width: 120,
        height: 15,
        margin: { left: 469, right: 11, vertical: 331 },
        align: { h: 1, v: 0 },
      });
      const { y } = getPosition(dialogue, store);
      expect(y).toBe(29);
    });
  });

  describe('with explicit \\pos', () => {
    /*
     * \pos(x,y) - sets the subtitle anchor point to exact script-pixel coordinates.
     * Margins are ignored when \pos is present.
     */
    it('should position anchor at \\pos coordinates for alignment 2 (bottom-center)', () => {
      // \pos(319,255) → anchor at script coords (319, 255)
      const store = mockStore({ scale: 1 });
      const dialogue = mockDialogue({
        pos: { x: 319, y: 255 },
        align: { h: 1, v: 0 },
      });
      const { x, y } = getPosition(dialogue, store);
      expect(x).toBe(319);
      expect(y).toBe(255);
    });

    it('should position anchor at \\pos coordinates for alignment 7 (top-left)', () => {
      // \pos(100,50) → anchor at script coords (100, 50)
      const store = mockStore({ scale: 1 });
      const dialogue = mockDialogue({
        pos: { x: 100, y: 50 },
        align: { h: 0, v: 2 },
      });
      const { x, y } = getPosition(dialogue, store);
      expect(x).toBe(100);
      expect(y).toBe(50);
    });

    it('should apply PlayRes → CSS scale to \\pos coordinates', () => {
      // \pos(200,100) with scale=2 → anchor at CSS pixels (400, 200)
      const store = mockStore({ scale: 2 });
      const dialogue = mockDialogue({
        pos: { x: 200, y: 100 },
        align: { h: 1, v: 1 },
      });
      const { x, y } = getPosition(dialogue, store);
      expect(x).toBe(400);
      expect(y).toBe(200);
    });
  });

  describe('with \\move (no explicit \\pos)', () => {
    /*
     * \move(x1,y1,x2,y2[,t1,t2]):
     * the \move tag defines start and end coordinates for a movement
     * animation. when \move is present without \pos, the library
     * delegates positioning to a WAAPI animation on the CSS transform
     * property. `getPosition` returns the neutral origin (0,0) — the
     * animation's `translate()` handles the actual screen position.
     */
    it('should return origin when \\move is present without \\pos', () => {
      const store = mockStore({ scale: 1 });
      const dialogue = mockDialogue({
        pos: null,
        move: { x1: 351, y1: 37, x2: 290, y2: 220, t1: 29, t2: 1730 },
        align: { h: 1, v: 0 },
      });
      const { x, y } = getPosition(dialogue, store);
      expect(x).toBe(0);
      expect(y).toBe(0);
    });

    it('should use \\pos coordinates when both \\pos and \\move are present', () => {
      // \pos takes precedence over \move start coordinates for the
      // anchor point. \pos(100,200) wins over move.x1=351.
      const store = mockStore({ scale: 1 });
      const dialogue = mockDialogue({
        pos: { x: 100, y: 200 },
        move: { x1: 351, y1: 37, x2: 290, y2: 220, t1: 29, t2: 1730 },
        align: { h: 1, v: 0 },
      });
      const { x, y } = getPosition(dialogue, store);
      expect(x).toBe(100);
      expect(y).toBe(200);
    });
  });
});
