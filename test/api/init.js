import { describe, it, expect } from 'vitest';
import ASS from '../../src/index.js';

describe('init API', () => {
  it('requires source and video', () => {
    // eslint-disable-next-line no-unused-vars
    let ass = null;

    expect(() => { ass = new ASS(); }).to.throw();

    expect(() => { ass = new ASS('', document.createElement('video')); }).to.throw();
  });

  it('should support option.container', ({ $video }) => {
    const $container = document.createElement('div');
    const ass = new ASS('', $video, {
      container: $container,
    });
    expect($video.parentNode.querySelector('.ASS-box')).to.equal(null);
    ass.destroy();
  });

  it('should support option.resampling', ({ $video }) => {
    const ass = new ASS('', $video, {
      resampling: 'script_height',
    });
    expect(ass.resampling).to.equal('script_height');
    ass.destroy();
  });

  it('should work in Shadow DOM', () => {
    const $shadow = document.createElement('div');
    if (!($shadow.getRootNode) || !($shadow.attachShadow)) {
      this.skip();
      return;
    }
    const shadowRoot = $shadow.attachShadow({ mode: 'open' });
    const $v = document.createElement('video');
    shadowRoot.append($v);
    document.body.append($shadow);
    const ass = new ASS('', $v);
    expect(shadowRoot.querySelector('#ASS-global-style')).to.not.equal(undefined);
    ass.destroy();
    $shadow.remove();
  });
});
