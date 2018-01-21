import ASS from '../../src/index.js';
import { $video } from '../index.js';

describe('resize API', () => {
  it('should resize container to video\'s size', () => {
    const $container = document.createElement('div');
    document.body.appendChild($container);
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
    document.body.removeChild($container);
  });
});
