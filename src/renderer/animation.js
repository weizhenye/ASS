import { assign } from 'ass-compiler/src/utils.js';
import { color2rgba, uuid, vendor, strokeTags, transformTags } from '../utils.js';
import { getRealFontSize } from './font-size.js';
import { createCSSStroke } from './stroke.js';
import { createTransform } from './transform.js';

function getKeyframeString(name, list) {
  return `@${vendor.animation}keyframes ${name} {${list}}\n`;
}

class KeyframeBlockList {
  constructor() {
    this.obj = {};
  }

  set(keyText, prop, value) {
    if (!this.obj[keyText]) this.obj[keyText] = {};
    this.obj[keyText][prop] = value;
  }

  setT({ t1, t2, duration, prop, from, to }) {
    this.set('0.000%', prop, from);
    if (t1 < duration) {
      this.set(`${(t1 / duration * 100).toFixed(3)}%`, prop, from);
    }
    if (t2 < duration) {
      this.set(`${(t2 / duration * 100).toFixed(3)}%`, prop, to);
    }
    this.set('100.000%', prop, to);
  }

  toString() {
    return Object.keys(this.obj)
      .map((keyText) => (
        `${keyText}{${
          Object.keys(this.obj[keyText])
            .map((prop) => `${vendor[prop] || ''}${prop}:${this.obj[keyText][prop]};`)
            .join('')
        }}`
      ))
      .join('');
  }
}

// TODO: multi \t can't be merged directly
function mergeT(ts) {
  return ts.reduceRight((results, t) => {
    let merged = false;
    return results
      .map((r) => {
        merged = t.t1 === r.t1 && t.t2 === r.t2 && t.accel === r.accel;
        return assign({}, r, merged ? { tag: assign({}, r.tag, t.tag) } : {});
      })
      .concat(merged ? [] : t);
  }, []);
}

export function getKeyframes() {
  let keyframes = '';
  this.dialogues.forEach((dialogue) => {
    const { start, end, effect, move, fade, slices } = dialogue;
    const duration = (end - start) * 1000;
    const diaKbl = new KeyframeBlockList();
    // TODO: when effect and move both exist, its behavior is weird, for now only move works.
    if (effect && !move) {
      const { name, delay, lefttoright, y1 } = effect;
      const y2 = effect.y2 || this._.resampledRes.height;
      if (name === 'banner') {
        const tx = this.scale * (duration / delay) * (lefttoright ? 1 : -1);
        diaKbl.set('0.000%', 'transform', 'translateX(0)');
        diaKbl.set('100.000%', 'transform', `translateX(${tx}px)`);
      }
      if (/^scroll/.test(name)) {
        const updown = /up/.test(name) ? -1 : 1;
        const tFrom = `translateY(${this.scale * y1 * updown}px)`;
        const tTo = `translateY(${this.scale * y2 * updown}px)`;
        const dp = (y2 - y1) / (duration / delay) * 100;
        diaKbl.set('0.000%', 'transform', tFrom);
        if (dp < 100) {
          diaKbl.set(`${dp.toFixed(3)}%`, 'transform', tTo);
        }
        diaKbl.set('100.000%', 'transform', tTo);
      }
    }
    if (move) {
      const { x1, y1, x2, y2, t1 } = move;
      const t2 = move.t2 || duration;
      const pos = dialogue.pos || { x: 0, y: 0 };
      const values = [{ x: x1, y: y1 }, { x: x2, y: y2 }].map(({ x, y }) => (
        `translate(${this.scale * (x - pos.x)}px, ${this.scale * (y - pos.y)}px)`
      ));
      diaKbl.setT({ t1, t2, duration, prop: 'transform', from: values[0], to: values[1] });
    }
    if (fade) {
      if (fade.type === 'fad') {
        const { t1, t2 } = fade;
        diaKbl.set('0.000%', 'opacity', 0);
        if (t1 < duration) {
          diaKbl.set(`${(t1 / duration * 100).toFixed(3)}%`, 'opacity', 1);
          if (t1 + t2 < duration) {
            diaKbl.set(`${((duration - t2) / duration * 100).toFixed(3)}%`, 'opacity', 1);
          }
          diaKbl.set('100.000%', 'opacity', 0);
        } else {
          diaKbl.set('100.000%', 'opacity', duration / t1);
        }
      } else {
        const { a1, a2, a3, t1, t2, t3, t4 } = fade;
        const keyTexts = [t1, t2, t3, t4].map((t) => `${(t / duration * 100).toFixed(3)}%`);
        const values = [a1, a2, a3].map((a) => 1 - a / 255);
        diaKbl.set('0.000%', 'opacity', values[0]);
        if (t1 < duration) diaKbl.set(keyTexts[0], 'opacity', values[0]);
        if (t2 < duration) diaKbl.set(keyTexts[1], 'opacity', values[1]);
        if (t3 < duration) diaKbl.set(keyTexts[2], 'opacity', values[1]);
        if (t4 < duration) diaKbl.set(keyTexts[3], 'opacity', values[2]);
        diaKbl.set('100.000%', 'opacity', values[2]);
      }
    }
    const diaList = diaKbl.toString();
    if (diaList) {
      assign(dialogue, { animationName: `ASS-${uuid()}` });
      keyframes += getKeyframeString(dialogue.animationName, diaList);
    }
    slices.forEach((slice) => {
      slice.fragments.forEach((fragment) => {
        if (!fragment.tag.t || !fragment.tag.t.length) {
          return;
        }
        const kbl = new KeyframeBlockList();
        const fromTag = assign({}, slice.tag, fragment.tag);
        // TODO: accel is not implemented yet
        mergeT(fragment.tag.t).forEach(({ t1, t2, tag }) => {
          if (tag.fs) {
            const from = `${this.scale * getRealFontSize(fromTag.fn, fromTag.fs)}px`;
            const to = `${this.scale * getRealFontSize(tag.fn, fromTag.fs)}px`;
            kbl.setT({ t1, t2, duration, prop: 'font-size', from, to });
          }
          if (tag.fsp) {
            const from = `${this.scale * fromTag.fsp}px`;
            const to = `${this.scale * tag.fsp}px`;
            kbl.setT({ t1, t2, duration, prop: 'letter-spacing', from, to });
          }
          const hasAlpha = (
            tag.a1 !== undefined
            && tag.a1 === tag.a2
            && tag.a2 === tag.a3
            && tag.a3 === tag.a4
          );
          if (tag.c1 || (tag.a1 && !hasAlpha)) {
            const from = color2rgba(fromTag.a1 + fromTag.c1);
            const to = color2rgba((tag.a1 || fromTag.a1) + (tag.c1 || fromTag.c1));
            kbl.setT({ t1, t2, duration, prop: 'color', from, to });
          }
          if (hasAlpha) {
            const from = 1 - parseInt(fromTag.a1, 16) / 255;
            const to = 1 - parseInt(tag.a1, 16) / 255;
            kbl.setT({ t1, t2, duration, prop: 'opacity', from, to });
          }
          const hasStroke = strokeTags.some((x) => (
            tag[x] !== undefined
            && tag[x] !== (fragment.tag[x] || slice.tag[x])
          ));
          if (hasStroke) {
            const scale = /Yes/i.test(this.info.ScaledBorderAndShadow) ? this.scale : 1;
            const from = createCSSStroke(fromTag, scale);
            const to = createCSSStroke(assign({}, fromTag, tag), scale);
            kbl.setT({ t1, t2, duration, prop: 'text-shadow', from, to });
          }
          const hasTransfrom = transformTags.some((x) => (
            tag[x] !== undefined
            && tag[x] !== (fragment.tag[x] || slice.tag[x])
          ));
          if (hasTransfrom) {
            const toTag = assign({}, fromTag, tag);
            if (fragment.drawing) {
              // scales will be handled inside svg
              assign(toTag, {
                p: 0,
                fscx: ((tag.fscx || fromTag.fscx) / fromTag.fscx) * 100,
                fscy: ((tag.fscy || fromTag.fscy) / fromTag.fscy) * 100,
              });
              assign(fromTag, { fscx: 100, fscy: 100 });
            }
            const from = createTransform(fromTag);
            const to = createTransform(toTag);
            kbl.setT({ t1, t2, duration, prop: 'transform', from, to });
          }
        });
        const list = kbl.toString();
        assign(fragment, { animationName: `ASS-${uuid()}` });
        keyframes += getKeyframeString(fragment.animationName, list);
      });
    });
  });
  return keyframes;
}

export function createAnimation(name, duration, delay) {
  const va = vendor.animation;
  return (
    `${va}animation-name:${name};`
    + `${va}animation-duration:${duration}s;`
    + `${va}animation-delay:${delay}s;`
    + `${va}animation-timing-function:linear;`
    + `${va}animation-iteration-count:1;`
    + `${va}animation-fill-mode:forwards;`
  );
}
