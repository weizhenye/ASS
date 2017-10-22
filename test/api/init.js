import ASS from '../../src/index.js';

describe('init API', () => {
  it('shoud initialize an ass instance', () => {
    const $video = document.createElement('video');
    document.body.appendChild($video);
    const ass = new ASS('', $video);
    expect(ass._).to.be.an('object');
    expect(ass.container.classList.contains('ASS-container')).to.equal(true);
    expect(ass.video).to.equal($video);
    expect($video.parentNode).to.equal(ass.container);
    expect(ass.scale).to.be.an('number');
    ass.destroy();
    document.body.removeChild($video);
  });

  it('requires source and video', () => {
    let ass = null;
    ass = new ASS();
    expect(ass._).to.equal(undefined);

    ass = new ASS({});
    expect(ass._).to.equal(undefined);

    ass = new ASS('', document.createElement('div'));
    expect(ass._).to.equal(undefined);
  });

  it('should support options.container', () => {
    const $container = document.createElement('div');
    const ass = new ASS('', document.createElement('video'), {
      container: $container,
    });
    expect(ass.container).to.equal($container);
    ass.destroy();
  });

  it('should support options.resampling', () => {
    const ass = new ASS('', document.createElement('video'), {
      container: document.createElement('div'),
      resampling: 'script_height',
    });
    expect(ass.resampling).to.equal('script_height');
    ass.destroy();
  });

  it('should autoplay if video is playing', (done) => {
    const $video = document.createElement('video');
    $video.src = '/base/test/fixtures/2fa3fe_90_640x360.mp4';
    document.body.appendChild($video);
    $video.play();
    const ass = new ASS('', $video);
    setTimeout(() => {
      expect(ass._.requestId).to.be.above(0);
      ass.destroy();
      document.body.removeChild($video);
      done();
    }, 100);
  });
});
