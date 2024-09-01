import { describe, it, expect } from 'vitest';
import { createEffect, createFadeList } from '../../src/renderer/animation.js';

describe('render animation', () => {
  it('should create Banner keyframes', () => {
    expect(createEffect(
      { name: 'banner', delay: 0, leftToRight: 0, fadeAwayWidth: 0 },
      1000,
    )[0]).to.deep.equal([
      { offset: 0, transform: 'translateX(100%)' },
      { offset: 1, transform: 'translateX(calc(100% + var(--ass-scale) * -1000px))' },
    ]);
    expect(createEffect(
      { name: 'banner', delay: 1, leftToRight: 0, fadeAwayWidth: 0 },
      1000,
    )[0]).to.deep.equal([
      { offset: 0, transform: 'translateX(100%)' },
      { offset: 1, transform: 'translateX(calc(100% + var(--ass-scale) * -1000px))' },
    ]);
    expect(createEffect(
      { name: 'banner', delay: 2, leftToRight: 0, fadeAwayWidth: 0 },
      1000,
    )[0]).to.deep.equal([
      { offset: 0, transform: 'translateX(100%)' },
      { offset: 1, transform: 'translateX(calc(100% + var(--ass-scale) * -500px))' },
    ]);
    expect(createEffect(
      { name: 'banner', delay: 1, leftToRight: 1, fadeAwayWidth: 0 },
      1000,
    )[0]).to.deep.equal([
      { offset: 0, transform: 'translateX(-100%)' },
      { offset: 1, transform: 'translateX(calc(-100% + var(--ass-scale) * 1000px))' },
    ]);
    expect(createEffect(
      { name: 'banner', delay: 1, leftToRight: 0, fadeAwayWidth: 0 },
      5000,
    )[0]).to.deep.equal([
      { offset: 0, transform: 'translateX(100%)' },
      { offset: 1, transform: 'translateX(calc(100% + var(--ass-scale) * -5000px))' },
    ]);
  });

  it('should create Scroll up/Scroll down keyframes', () => {
    expect(createEffect(
      { name: 'scroll up', y1: 0, y2: 360, delay: 1, fadeAwayHeight: 0 },
      1000,
    )[0]).to.deep.equal([
      { offset: 0, transform: 'translateY(100%)' },
      { offset: 1, transform: 'translateY(calc(100% + var(--ass-scale) * -1000px))' },
    ]);
    expect(createEffect(
      { name: 'scroll up', y1: 0, y2: 360, delay: 1, fadeAwayHeight: 0 },
      2000,
    )[0]).to.deep.equal([
      { offset: 0, transform: 'translateY(100%)' },
      { offset: 1, transform: 'translateY(calc(100% + var(--ass-scale) * -2000px))' },
    ]);
    expect(createEffect(
      { name: 'scroll up', y1: 0, y2: 360, delay: 2, fadeAwayHeight: 0 },
      1000,
    )[0]).to.deep.equal([
      { offset: 0, transform: 'translateY(100%)' },
      { offset: 1, transform: 'translateY(calc(100% + var(--ass-scale) * -500px))' },
    ]);
    expect(createEffect(
      { name: 'scroll up', y1: 0, y2: 360, delay: 0, fadeAwayHeight: 0 },
      1000,
    )[0]).to.deep.equal([
      { offset: 0, transform: 'translateY(100%)' },
      { offset: 1, transform: 'translateY(calc(100% + var(--ass-scale) * -1000px))' },
    ]);
    expect(createEffect(
      { name: 'scroll down', y1: 0, y2: 360, delay: 1, fadeAwayHeight: 0 },
      1000,
    )[0]).to.deep.equal([
      { offset: 0, transform: 'translateY(-100%)' },
      { offset: 1, transform: 'translateY(calc(-100% + var(--ass-scale) * 1000px))' },
    ]);
    expect(createEffect(
      { name: 'scroll down', y1: 0, y2: 360, delay: 1, fadeAwayHeight: 0 },
      2000,
    )[0]).to.deep.equal([
      { offset: 0, transform: 'translateY(-100%)' },
      { offset: 1, transform: 'translateY(calc(-100% + var(--ass-scale) * 2000px))' },
    ]);
    expect(createEffect(
      { name: 'scroll down', y1: 0, y2: 360, delay: 2, fadeAwayHeight: 0 },
      1000,
    )[0]).to.deep.equal([
      { offset: 0, transform: 'translateY(-100%)' },
      { offset: 1, transform: 'translateY(calc(-100% + var(--ass-scale) * 500px))' },
    ]);
  });

  it('should create \\fad() keyframes', () => {
    expect(createFadeList({ type: 'fad', t1: 4000, t2: 4000 }, 5000)).to.deep.equal([
      [[{ offset: 0, opacity: 1 }, { offset: 1, opacity: 0 }], { duration: 4000, delay: 1000, fill: 'forwards' }],
      [[{ offset: 0, opacity: 0 }, { offset: 1, opacity: 1 }], { duration: 4000, composite: 'replace' }],
    ]);
  });
});
