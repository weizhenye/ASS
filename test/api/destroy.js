import ASS from '../../src/index.js';

describe('destroy API', () => {
  it('should destroy the instance and revert DOM structure', () => {
    const $video = document.createElement('video');
    document.body.appendChild($video);
    const ass = new ASS('', $video);
    ass.destroy();
    expect(ass._).to.equal(null);
    expect(document.querySelectorAll('.ASS-animation').length).to.equal(0);
    expect($video.parentNode).to.equal(document.body);
    document.body.removeChild($video);
  });
});
