import ASS from '../../src/index.js';
import { $video } from '../index.js';

describe('destroy API', () => {
  it('should destroy the instance and revert DOM structure', () => {
    const ass = new ASS('', $video);
    ass.destroy();
    expect(ass._).to.equal(null);
    expect($video.parentNode).to.equal(document.body);
  });
});
