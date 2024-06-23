import { describe, it, expect } from 'vitest';
import { createEffectKeyframes, createFadeKeyframes } from '../../src/renderer/animation.js';

describe('render animation', () => {
  it('should create Banner keyframes', () => {
    expect(createEffectKeyframes({
      effect: { name: 'banner', delay: 0, leftToRight: 0, fadeAwayWidth: 0 },
      duration: 1000,
    })).to.deep.equal([
      { offset: 0, transform: 'translateX(0)' },
      { offset: 1, transform: 'translateX(calc(var(--ass-scale) * -1000px))' },
    ]);
    expect(createEffectKeyframes({
      effect: { name: 'banner', delay: 1, leftToRight: 0, fadeAwayWidth: 0 },
      duration: 1000,
    })).to.deep.equal([
      { offset: 0, transform: 'translateX(0)' },
      { offset: 1, transform: 'translateX(calc(var(--ass-scale) * -1000px))' },
    ]);
    expect(createEffectKeyframes({
      effect: { name: 'banner', delay: 2, leftToRight: 0, fadeAwayWidth: 0 },
      duration: 1000,
    })).to.deep.equal([
      { offset: 0, transform: 'translateX(0)' },
      { offset: 1, transform: 'translateX(calc(var(--ass-scale) * -500px))' },
    ]);
    expect(createEffectKeyframes({
      effect: { name: 'banner', delay: 1, leftToRight: 1, fadeAwayWidth: 0 },
      duration: 1000,
    })).to.deep.equal([
      { offset: 0, transform: 'translateX(0)' },
      { offset: 1, transform: 'translateX(calc(var(--ass-scale) * 1000px))' },
    ]);
    expect(createEffectKeyframes({
      effect: { name: 'banner', delay: 1, leftToRight: 0, fadeAwayWidth: 0 },
      duration: 5000,
    })).to.deep.equal([
      { offset: 0, transform: 'translateX(0)' },
      { offset: 1, transform: 'translateX(calc(var(--ass-scale) * -5000px))' },
    ]);
  });

  it('should create Scroll up/Scroll down keyframes', () => {
    expect(createEffectKeyframes({
      effect: { name: 'scroll up', y1: 0, y2: 360, delay: 1, fadeAwayHeight: 0 },
      duration: 1000,
    })).to.deep.equal([
      { offset: 0, transform: 'translateY(-100%)' },
      { offset: 1, transform: 'translateY(calc(var(--ass-scale) * -1000px))' },
    ]);
    expect(createEffectKeyframes({
      effect: { name: 'scroll up', y1: 0, y2: 360, delay: 1, fadeAwayHeight: 0 },
      duration: 2000,
    })).to.deep.equal([
      { offset: 0, transform: 'translateY(-100%)' },
      { offset: 1, transform: 'translateY(calc(var(--ass-scale) * -2000px))' },
    ]);
    expect(createEffectKeyframes({
      effect: { name: 'scroll up', y1: 0, y2: 360, delay: 2, fadeAwayHeight: 0 },
      duration: 1000,
    })).to.deep.equal([
      { offset: 0, transform: 'translateY(-100%)' },
      { offset: 1, transform: 'translateY(calc(var(--ass-scale) * -500px))' },
    ]);
    expect(createEffectKeyframes({
      effect: { name: 'scroll up', y1: 0, y2: 360, delay: 0, fadeAwayHeight: 0 },
      duration: 1000,
    })).to.deep.equal([
      { offset: 0, transform: 'translateY(-100%)' },
      { offset: 1, transform: 'translateY(calc(var(--ass-scale) * -1000px))' },
    ]);
    expect(createEffectKeyframes({
      effect: { name: 'scroll down', y1: 0, y2: 360, delay: 1, fadeAwayHeight: 0 },
      duration: 1000,
    })).to.deep.equal([
      { offset: 0, transform: 'translateY(-100%)' },
      { offset: 1, transform: 'translateY(calc(var(--ass-scale) * 1000px))' },
    ]);
    expect(createEffectKeyframes({
      effect: { name: 'scroll down', y1: 0, y2: 360, delay: 1, fadeAwayHeight: 0 },
      duration: 2000,
    })).to.deep.equal([
      { offset: 0, transform: 'translateY(-100%)' },
      { offset: 1, transform: 'translateY(calc(var(--ass-scale) * 2000px))' },
    ]);
    expect(createEffectKeyframes({
      effect: { name: 'scroll down', y1: 0, y2: 360, delay: 2, fadeAwayHeight: 0 },
      duration: 1000,
    })).to.deep.equal([
      { offset: 0, transform: 'translateY(-100%)' },
      { offset: 1, transform: 'translateY(calc(var(--ass-scale) * 500px))' },
    ]);
  });

  it('should create \\fad() keyframes', () => {
    expect(createFadeKeyframes({ type: 'fad', t1: 0, t2: 0 }, 5000)).to.deep.equal([
      { offset: 0, opacity: 1 },
      { offset: 1, opacity: 1 },
    ]);
    expect(createFadeKeyframes({ type: 'fad', t1: 2000, t2: 0 }, 5000)).to.deep.equal([
      { offset: 0, opacity: 0 },
      { offset: 0.4, opacity: 1 },
      { offset: 1, opacity: 1 },
    ]);
    expect(createFadeKeyframes({ type: 'fad', t1: 5000, t2: 0 }, 5000)).to.deep.equal([
      { offset: 0, opacity: 0 },
      { offset: 1, opacity: 1 },
    ]);
    expect(createFadeKeyframes({ type: 'fad', t1: 10000, t2: 0 }, 5000)).to.deep.equal([
      { offset: 0, opacity: 0 },
      { offset: 1, opacity: 0.5 },
    ]);
    expect(createFadeKeyframes({ type: 'fad', t1: 0, t2: 2000 }, 5000)).to.deep.equal([
      { offset: 0, opacity: 1 },
      { offset: 0.6, opacity: 1 },
      { offset: 1, opacity: 0 },
    ]);
    expect(createFadeKeyframes({ type: 'fad', t1: 0, t2: 5000 }, 5000)).to.deep.equal([
      { offset: 0, opacity: 1 },
      { offset: 1, opacity: 0 },
    ]);
    expect(createFadeKeyframes({ type: 'fad', t1: 0, t2: 10000 }, 5000)).to.deep.equal([
      { offset: 0, opacity: 0.5 },
      { offset: 1, opacity: 0 },
    ]);
    expect(createFadeKeyframes({ type: 'fad', t1: 2000, t2: 2000 }, 5000)).to.deep.equal([
      { offset: 0, opacity: 0 },
      { offset: 0.4, opacity: 1 },
      { offset: 0.6, opacity: 1 },
      { offset: 1, opacity: 0 },
    ]);
    expect(createFadeKeyframes({ type: 'fad', t1: 3000, t2: 2000 }, 5000)).to.deep.equal([
      { offset: 0, opacity: 0 },
      { offset: 0.6, opacity: 1 },
      { offset: 1, opacity: 0 },
    ]);
    expect(createFadeKeyframes({ type: 'fad', t1: 4000, t2: 2000 }, 5000)).to.deep.equal([
      { offset: 0, opacity: 0 },
      { offset: 0.8, opacity: 1 },
      { offset: 0.8001, opacity: 0.5 },
      { offset: 1, opacity: 0 },
    ]);
  });
});
