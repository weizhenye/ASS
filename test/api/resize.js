import ASS from '../../src/index.js';

describe('resize API', () => {
  const $video = document.createElement('video');
  $video.src = '/base/test/fixtures/2fa3fe_90_640x360.mp4';
  $video.style.width = '640px';
  $video.style.height = '360px';
  const $container = document.createElement('div');

  before(() => {
    document.body.appendChild($video);
    document.body.appendChild($container);
  });

  after(() => {
    document.body.removeChild($video);
    document.body.removeChild($container);
  });

  it('should resize container to video\'s size', () => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 640\nPlayResY: 360',
      $video,
      { container: $container }
    );
    expect(ass.container.clientWidth).to.equal(640);
    expect(ass.container.clientHeight).to.equal(360);

    $video.style.width = '1280px';
    $video.style.height = '720px';
    ass.resize();
    expect(ass.container.clientWidth).to.equal(1280);
    expect(ass.container.clientHeight).to.equal(720);

    ass.destroy();
  });

  it.skip('should calculate scale by resampling');

  it.skip('should update renders after resizing');
});
