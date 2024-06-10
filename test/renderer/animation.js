import { describe, it, expect } from 'vitest';
import { createFadeKeyframes } from '../../src/renderer/animation.js';

describe('render animation', () => {
  it('shoud create \\fad() keyframes', () => {
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
