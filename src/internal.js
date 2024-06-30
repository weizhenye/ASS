/* eslint-disable no-param-reassign */
import { renderer } from './renderer/renderer.js';
import { batchAnimate } from './utils.js';

export function clear(store) {
  const { box } = store;
  while (box.lastChild) {
    box.lastChild.remove();
  }
  store.actives = [];
  store.space = [];
}

function framing(store) {
  const { video, dialogues, actives } = store;
  const vct = video.currentTime - store.delay;
  for (let i = actives.length - 1; i >= 0; i -= 1) {
    const dia = actives[i];
    const { end } = dia;
    if (end < vct) {
      dia.$div.remove();
      actives.splice(i, 1);
    }
  }
  while (
    store.index < dialogues.length
    && vct >= dialogues[store.index].start
  ) {
    if (vct < dialogues[store.index].end) {
      const dia = renderer(dialogues[store.index], store);
      if (!video.paused) {
        batchAnimate(dia, 'play');
      }
      actives.push(dia);
    }
    store.index += 1;
  }
}

export function createSeek(store) {
  return function seek() {
    clear(store);
    const { video, dialogues } = store;
    const vct = video.currentTime - store.delay;
    store.index = (() => {
      let from = 0;
      const to = dialogues.length - 1;
      while (from + 1 < to && vct > dialogues[(to + from) >> 1].end) {
        from = (to + from) >> 1;
      }
      if (!from) return 0;
      for (let i = from; i < to; i += 1) {
        if (
          dialogues[i].end > vct && vct >= dialogues[i].start
          || (i && dialogues[i - 1].end < vct && vct < dialogues[i].start)
        ) {
          return i;
        }
      }
      return to;
    })();
    framing(store);
  };
}

export function createPlay(store) {
  return function play() {
    const frame = () => {
      framing(store);
      store.requestId = requestAnimationFrame(frame);
    };
    cancelAnimationFrame(store.requestId);
    store.requestId = requestAnimationFrame(frame);
    store.actives.forEach((dia) => {
      batchAnimate(dia, 'play');
    });
  };
}

export function createPause(store) {
  return function pause() {
    cancelAnimationFrame(store.requestId);
    store.requestId = 0;
    store.actives.forEach((dia) => {
      batchAnimate(dia, 'pause');
    });
  };
}

export function createResize(that, store) {
  const { video, box, svg } = store;
  return function resize() {
    const cw = video.clientWidth;
    const ch = video.clientHeight;
    const vw = video.videoWidth || cw;
    const vh = video.videoHeight || ch;
    const sw = store.scriptRes.width;
    const sh = store.scriptRes.height;
    let rw = sw;
    let rh = sh;
    const videoScale = Math.min(cw / vw, ch / vh);
    if (that.resampling === 'video_width') {
      rh = sw / vw * vh;
    }
    if (that.resampling === 'video_height') {
      rw = sh / vh * vw;
    }
    store.scale = Math.min(cw / rw, ch / rh);
    if (that.resampling === 'script_width') {
      store.scale = videoScale * (vw / rw);
    }
    if (that.resampling === 'script_height') {
      store.scale = videoScale * (vh / rh);
    }
    const bw = store.scale * rw;
    const bh = store.scale * rh;
    store.width = bw;
    store.height = bh;
    store.resampledRes = { width: rw, height: rh };

    const cssText = (
      `width:${bw}px;`
      + `height:${bh}px;`
      + `top:${(ch - bh) / 2}px;`
      + `left:${(cw - bw) / 2}px;`
    );
    box.style.cssText = cssText;
    box.style.setProperty('--ass-scale', store.scale);
    svg.style.cssText = cssText;

    createSeek(store)();
  };
}
