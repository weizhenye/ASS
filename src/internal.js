/* eslint-disable no-param-reassign */
import { renderer } from './renderer/renderer.js';
import { setKeyframes } from './renderer/animation.js';
import { batchAnimate } from './utils.js';

export function clear(store) {
  const { box, defs } = store;
  while (box.lastChild) {
    box.lastChild.remove();
  }
  while (defs.lastChild) {
    defs.lastChild.remove();
  }
  store.actives = [];
  store.space = [];
}

function framing(store) {
  const { video, dialogues, actives, resampledRes } = store;
  const vct = video.currentTime;
  for (let i = actives.length - 1; i >= 0; i -= 1) {
    const dia = actives[i];
    let { end } = dia;
    if (dia.effect && /scroll/.test(dia.effect.name)) {
      const { y1, y2, delay } = dia.effect;
      const duration = ((y2 || resampledRes.height) - y1) / (1000 / delay);
      end = Math.min(end, dia.start + duration);
    }
    if (end < vct) {
      dia.$div.remove();
      dia.$clipPath?.remove();
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
        batchAnimate(dia.$div, 'play');
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
    const vct = video.currentTime;
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
    store.actives.forEach(({ $div }) => {
      batchAnimate($div, 'play');
    });
  };
}

export function createPause(store) {
  return function pause() {
    cancelAnimationFrame(store.requestId);
    store.requestId = 0;
    store.actives.forEach(({ $div }) => {
      batchAnimate($div, 'pause');
    });
  };
}

export function createResize(that, store) {
  const { video, box, svg, dialogues } = store;
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
    svg.style.cssText = cssText;
    svg.setAttributeNS(null, 'viewBox', `0 0 ${sw} ${sh}`);

    dialogues.forEach((dialogue) => {
      setKeyframes(dialogue, store);
    });

    createSeek(store)();
  };
}
