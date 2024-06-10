import { describe, it, expect } from 'vitest';
import ASS from '../../src/index.js';

describe('resampling API', () => {
  it('should handle `video_width`', ({ $video }) => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 1280\nPlayResY: 960',
      $video,
      { resampling: 'video_width' },
    );
    const $box = document.querySelector('.ASS-box');
    expect($box.clientWidth).to.equal(640);
    expect($box.clientHeight).to.equal(360);

    ass.destroy();
  });

  it('should handle `video_height`', ({ $video }) => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 1280\nPlayResY: 960',
      $video,
      { resampling: 'video_height' },
    );
    const $box = document.querySelector('.ASS-box');
    expect($box.clientWidth).to.equal(640);
    expect($box.clientHeight).to.equal(360);

    ass.destroy();
  });

  it('should handle `script_width`', ({ $video }) => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 1280\nPlayResY: 960',
      $video,
      { resampling: 'script_width' },
    );
    const $box = document.querySelector('.ASS-box');
    expect($box.clientWidth).to.equal(640);
    expect($box.clientHeight).to.equal(480);
    expect($box.style.top).to.equal('-60px');
    expect($box.style.left).to.equal('0px');

    ass.destroy();
  });

  it('should handle `script_height`', ({ $video }) => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 1280\nPlayResY: 960',
      $video,
      { resampling: 'script_height' },
    );
    const $box = document.querySelector('.ASS-box');
    expect($box.clientWidth).to.equal(480);
    expect($box.clientHeight).to.equal(360);
    expect($box.style.top).to.equal('0px');
    expect($box.style.left).to.equal('80px');

    ass.destroy();
  });

  it('should default resampling to `video_height`', ({ $video }) => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 1280\nPlayResY: 960',
      $video,
    );
    expect(ass.resampling).to.equal('video_height');

    ass.destroy();
  });

  it('should support to set resampling after initializing', ({ $video }) => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 1280\nPlayResY: 960',
      $video,
    );
    const $box = document.querySelector('.ASS-box');

    ass.resampling = 'video_height';
    expect($box.clientWidth).to.equal(640);
    expect($box.clientHeight).to.equal(360);

    ass.resampling = 'unknown';
    expect($box.clientWidth).to.equal(640);
    expect($box.clientHeight).to.equal(360);

    ass.resampling = 'script_height';
    expect($box.clientWidth).to.equal(480);
    expect($box.clientHeight).to.equal(360);

    ass.destroy();
  });
});
