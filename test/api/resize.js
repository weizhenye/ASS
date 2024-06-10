/* eslint-disable no-param-reassign */
import { describe, it, expect } from 'vitest';
import ASS from '../../src/index.js';

describe('resize observer', () => {
  it('should resize box to video\'s size', ({ $video }) => {
    const ass = new ASS(
      '[Script Info]\nPlayResX: 640\nPlayResY: 360',
      $video,
    );
    const $box = document.querySelector('.ASS-box');
    expect($box.clientWidth).to.equal(640);
    expect($box.clientHeight).to.equal(360);

    $video.style.width = '1280px';
    $video.style.height = '720px';
    setTimeout(() => {
      expect($box.clientWidth).to.equal(1280);
      expect($box.clientHeight).to.equal(720);
      ass.destroy();
      $video.style.width = '640px';
      $video.style.height = '360px';
    }, 100);
  });
});
