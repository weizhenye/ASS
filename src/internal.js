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

function framing(store, mediaTime) {
  const { dialogues, actives } = store;
  const vct = mediaTime - store.delay;
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
      (dia.animations || []).forEach((animation) => {
        animation.currentTime = (vct - dia.start) * 1000;
      });
      actives.push(dia);
      if (!store.video.paused) {
        batchAnimate(dia, 'play');
      }
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
      for (let i = 0; i < dialogues.length; i += 1) {
        if (vct < dialogues[i].end) {
          return i;
        }
      }
      return (dialogues.length || 1) - 1;
    })();
    framing(store, video.currentTime);
  };
}

function createFrame(video) {
  const useVFC = video.requestVideoFrameCallback;
  return [
    useVFC ? video.requestVideoFrameCallback.bind(video) : requestAnimationFrame,
    useVFC ? video.cancelVideoFrameCallback.bind(video) : cancelAnimationFrame,
  ];
}

export function createPlay(store) {
  const { video } = store;
  const [requestFrame, cancelFrame] = createFrame(video);
  return function play() {
    const frame = (now, metadata) => {
      framing(store, metadata?.mediaTime || video.currentTime);
      store.requestId = requestFrame(frame);
    };
    cancelFrame(store.requestId);
    store.requestId = requestFrame(frame);
    store.actives.forEach((dia) => {
      batchAnimate(dia, 'play');
    });
  };
}

export function createPause(store) {
  const [, cancelFrame] = createFrame(store.video);
  return function pause() {
    cancelFrame(store.requestId);
    store.requestId = 0;
    store.actives.forEach((dia) => {
      batchAnimate(dia, 'pause');
    });
  };
}

export function createResize(that, store) {
  const { video, box, layoutRes } = store;
  return function resize() {
    const cw = video.clientWidth;
    const ch = video.clientHeight;
    const vw = video.videoWidth || cw;
    const vh = video.videoHeight || ch;
    const lw = layoutRes.width || vw;
    const lh = layoutRes.height || vh;
    const sw = store.scriptRes.width;
    const sh = store.scriptRes.height;
    let rw = sw;
    let rh = sh;
    const videoScale = Math.min(cw / lw, ch / lh);
    if (that.resampling === 'video_width') {
      rh = sw / lw * lh;
    }
    if (that.resampling === 'video_height') {
      rw = sh / lh * lw;
    }
    store.scale = Math.min(cw / rw, ch / rh);
    if (that.resampling === 'script_width') {
      store.scale = videoScale * (lw / rw);
    }
    if (that.resampling === 'script_height') {
      store.scale = videoScale * (lh / rh);
    }
    const bw = store.scale * rw;
    const bh = store.scale * rh;
    store.width = bw;
    store.height = bh;
    store.resampledRes = { width: rw, height: rh };

    box.style.cssText = `width:${bw}px;height:${bh}px;top:${(ch - bh) / 2}px;left:${(cw - bw) / 2}px;`;
    box.style.setProperty('--ass-scale', store.scale);
    box.style.setProperty('--ass-scale-stroke', store.sbas ? store.scale : 1);
    const boxScale = (vw / lw) / (vh / lh);
    if (boxScale > 1) {
      box.style.transform = `scaleX(${boxScale})`;
    }
    if (boxScale < 1) {
      box.style.transform = `scaleY(${1 / boxScale})`;
    }

    createSeek(store)();
  };
}
