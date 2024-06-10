import { describe, it, expect } from 'vitest';
import ASS from '../../src/index.js';

describe('destroy API', () => {
  it('should destroy the instance', ({ $video }) => {
    const ass = new ASS('', $video);
    ass.destroy();
    expect(document.querySelector('.ASS-box')).to.equal(null);
    expect($video.parentNode).to.equal(document.body);
  });
});
