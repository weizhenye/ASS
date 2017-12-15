import ASS from '../../src/index.js';

describe('resampling API', () => {
  const $video = document.createElement('video');
  $video.src = '/base/test/fixtures/2fa3fe_90_640x360.mp4';
  $video.style.width = '640px';
  $video.style.height = '360px';

  before(() => {
    document.body.appendChild($video);
  });

  after(() => {
    document.body.removeChild($video);
  });

  it('should handle `video_width`', () => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 1280\nPlayResY: 960',
      $video,
      { resampling: 'video_width' }
    );
    expect(ass.scale).to.equal(0.5);
    expect(ass.width).to.equal(640);
    expect(ass.height).to.equal(360);
    expect(ass._.$stage.style.top).to.equal('0px');
    expect(ass._.$stage.style.left).to.equal('0px');

    ass.destroy();
  });

  it('should handle `video_height`', () => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 1280\nPlayResY: 960',
      $video,
      { resampling: 'video_height' }
    );
    expect(ass.scale).to.equal(0.375);
    expect(ass.width).to.equal(640);
    expect(ass.height).to.equal(360);
    expect(ass._.$stage.style.top).to.equal('0px');
    expect(ass._.$stage.style.left).to.equal('0px');

    ass.destroy();
  });

  it('should handle `script_width`', () => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 1280\nPlayResY: 960',
      $video,
      { resampling: 'script_width' }
    );
    expect(ass.scale).to.equal(0.5);
    expect(ass.width).to.equal(640);
    expect(ass.height).to.equal(480);
    expect(ass._.$stage.style.top).to.equal('-60px');
    expect(ass._.$stage.style.left).to.equal('0px');

    ass.destroy();
  });

  it('should handle `script_height`', () => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 1280\nPlayResY: 960',
      $video,
      { resampling: 'script_height' }
    );
    expect(ass.scale).to.equal(0.375);
    expect(ass.width).to.equal(480);
    expect(ass.height).to.equal(360);
    expect(ass._.$stage.style.top).to.equal('0px');
    expect(ass._.$stage.style.left).to.equal('80px');

    ass.destroy();
  });

  it('should default resampling to `video_height`', () => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 1280\nPlayResY: 960',
      $video
    );
    expect(ass.resampling).to.equal('video_height');

    ass.destroy();
  });

  it('should support to set resampling after initializing', () => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 1280\nPlayResY: 960',
      $video
    );
    ass.resampling = 'video_height';
    expect(ass.scale).to.equal(0.375);

    ass.resampling = 'unknown';
    expect(ass.scale).to.equal(0.375);

    ass.resampling = 'video_width';
    expect(ass.scale).to.equal(0.5);

    ass.destroy();
  });
});
