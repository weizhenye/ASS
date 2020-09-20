import { assign } from 'ass-compiler/src/utils.js';
import { color2rgba, transformTags } from '../utils.js';
import { getRealFontSize } from './font-size.js';
import { createTransform } from './transform.js';

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

function createEffectKeyframes({ effect, duration }) {
  // TODO: when effect and move both exist, its behavior is weird, for now only move works.
  const { name, delay, lefttoright, y1 } = effect;
  const y2 = effect.y2 || this._.resampledRes.height;
  if (name === 'banner') {
    const tx = this.scale * (duration / delay) * (lefttoright ? 1 : -1);
    return [0, `${tx}px`].map((x, i) => ({
      offset: i,
      transform: `translateX(${x})`,
    }));
  }
  if (/^scroll/.test(name)) {
    const updown = /up/.test(name) ? -1 : 1;
    const dp = (y2 - y1) / (duration / delay);
    return [y1, y2]
      .map((y) => this.scale * y * updown)
      .map((y, i) => ({
        offset: Math.min(i, dp),
        transform: `translateY${y}`,
      }));
  }
  return [];
}

function createMoveKeyframes({ move, duration, dialogue }) {
  const { x1, y1, x2, y2, t1, t2 } = move;
  const t = [t1, t2 || duration];
  const pos = dialogue.pos || { x: 0, y: 0 };
  return [[x1, y1], [x2, y2]]
    .map(([x, y]) => [this.scale * (x - pos.x), this.scale * (y - pos.y)])
    .map(([x, y], index) => ({
      offset: Math.min(t[index] / duration, 1),
      transform: `translate(${x}px, ${y}px)`,
    }));
}

function createFadeKeyframes({ fade, duration }) {
  if (fade.type === 'fad') {
    const { t1, t2 } = fade;
    const kfs = [[0, 0]];
    if (t1 < duration) {
      kfs.push([t1 / duration, 1]);
      if (t1 + t2 < duration) {
        kfs.push([(duration - t2) / duration, 1]);
      }
      kfs.push([1, 0]);
    } else {
      kfs.push([1, duration / t1]);
    }
    return kfs.map(([offset, opacity]) => ({ offset, opacity }));
  }
  const { a1, a2, a3, t1, t2, t3, t4 } = fade;
  const opacities = [a1, a2, a3].map((a) => 1 - a / 255);
  return [0, t1, t2, t3, t4, duration]
    .map((t) => t / duration)
    .map((t, i) => ({ offset: t, opacity: opacities[i >> 1] }))
    .filter(({ offset }) => offset <= 1);
}

function createTransformKeyframes({ fromTag, tag, fragment }) {
  const hasTransfrom = transformTags.some((x) => (
    tag[x] !== undefined && tag[x] !== fromTag[x]
  ));
  if (!hasTransfrom) return null;
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
  return [
    'transform',
    createTransform(fromTag),
    createTransform(toTag),
  ];
}

// TODO: accel is not implemented yet, maybe it can be simulated by cubic-bezier?
export function setKeyframes(dialogue) {
  const { start, end, effect, move, fade, slices } = dialogue;
  const duration = (end - start) * 1000;
  const keyframes = [
    ...(effect && !move ? createEffectKeyframes.call(this, { effect, duration }) : []),
    ...(move ? createMoveKeyframes.call(this, { move, duration, dialogue }) : []),
    ...(fade ? createFadeKeyframes({ fade, duration }) : []),
  ].sort((a, b) => a.offset - b.offset);
  if (keyframes.length) {
    assign(dialogue, { keyframes });
  }
  slices.forEach((slice) => {
    const sliceTag = this.styles[slice.style].tag;
    slice.fragments.forEach((fragment) => {
      if (!fragment.tag.t || !fragment.tag.t.length) {
        return;
      }
      const fromTag = assign({}, sliceTag, fragment.tag);
      const tTags = mergeT(fragment.tag.t);
      const fDuration = Math.max(duration, ...tTags.map(({ t2 }) => t2));
      const kfs = tTags.map(({ t1, t2, tag }) => {
        const hasAlpha = (
          tag.a1 !== undefined
          && tag.a1 === tag.a2
          && tag.a2 === tag.a3
          && tag.a3 === tag.a4
        );
        return [
          tag.fs && [
            'font-size',
            `${this.scale * getRealFontSize(fromTag.fn, fromTag.fs)}px`,
            `${this.scale * getRealFontSize(tag.fn, tag.fs)}px`,
          ],
          tag.fsp && [
            'letter-spacing',
            `${this.scale * fromTag.fsp}px`,
            `${this.scale * tag.fsp}px`,
          ],
          (tag.c1 || (tag.a1 && !hasAlpha)) && [
            'color',
            color2rgba(fromTag.a1 + fromTag.c1),
            color2rgba((tag.a1 || fromTag.a1) + (tag.c1 || fromTag.c1)),
          ],
          hasAlpha && [
            'opacity',
            1 - parseInt(fromTag.a1, 16) / 255,
            1 - parseInt(tag.a1, 16) / 255,
          ],
          createTransformKeyframes({ fromTag, tag, fragment }),
        ].filter((x) => x).map(([prop, from, to]) => {
          const values = [from, to];
          // TODO: t1 < 0
          return [Math.max(0, t1), t2]
            .map((t) => t / fDuration)
            .map((offset, i) => ({ offset, [prop]: values[i] }));
        });
      }).flat(2).sort((a, b) => a.offset - b.offset);
      if (kfs.length) {
        assign(fragment, { keyframes: kfs, duration: fDuration });
      }
    });
  });
}
