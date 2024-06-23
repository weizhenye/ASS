import { color2rgba } from '../utils.js';
import { getRealFontSize } from './font-size.js';
import { createTransform } from './transform.js';

// TODO: multi \t can't be merged directly
function mergeT(ts) {
  return ts.reduceRight((results, t) => {
    let merged = false;
    return results
      .map((r) => {
        merged = t.t1 === r.t1 && t.t2 === r.t2 && t.accel === r.accel;
        return { ...r, ...(merged ? { tag: { ...r.tag, ...t.tag } } : {}) };
      })
      .concat(merged ? [] : t);
  }, []);
}

export function createEffectKeyframes({ effect, duration }) {
  // TODO: when effect and move both exist, its behavior is weird, for now only move works.
  const { name, delay, leftToRight } = effect;
  if (name === 'banner') {
    const tx = (duration / (delay || 1)) * (leftToRight ? 1 : -1);
    return [0, `calc(var(--ass-scale) * ${tx}px)`].map((x, i) => ({
      offset: i,
      transform: `translateX(${x})`,
    }));
  }
  if (name.startsWith('scroll')) {
    // speed is 1000px/s when delay=1
    const updown = /up/.test(name) ? -1 : 1;
    const y = duration / (delay || 1) * updown;
    return [
      { offset: 0, transform: 'translateY(-100%)' },
      { offset: 1, transform: `translateY(calc(var(--ass-scale) * ${y}px))` },
    ];
  }
  return [];
}

function createMoveKeyframes({ move, duration, dialogue }) {
  const { x1, y1, x2, y2, t1, t2 } = move;
  const t = [t1, t2 || duration];
  const pos = dialogue.pos || { x: 0, y: 0 };
  return [[x1, y1], [x2, y2]]
    .map(([x, y]) => [(x - pos.x), (y - pos.y)])
    .map(([x, y], index) => ({
      offset: Math.min(t[index] / duration, 1),
      transform: `translate(calc(var(--ass-scale) * ${x}px), calc(var(--ass-scale) * ${y}px))`,
    }));
}

export function createFadeKeyframes(fade, duration) {
  if (fade.type === 'fad') {
    const { t1, t2 } = fade;
    const kfs = [];
    if (t1) {
      kfs.push([0, 0]);
    }
    if (t1 < duration) {
      if (t2 <= duration) {
        kfs.push([t1 / duration, 1]);
      }
      if (t1 + t2 < duration) {
        kfs.push([(duration - t2) / duration, 1]);
      }
      if (t2 > duration) {
        kfs.push([0, (t2 - duration) / t2]);
      } else if (t1 + t2 > duration) {
        kfs.push([(t1 + 0.5) / duration, 1 - (t1 + t2 - duration) / t2]);
      }
      if (t2) {
        kfs.push([1, 0]);
      }
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
  const toTag = { ...fromTag, ...tag };
  if (fragment.drawing) {
    // scales will be handled inside svg
    Object.assign(toTag, {
      p: 0,
      fscx: ((tag.fscx || fromTag.fscx) / fromTag.fscx) * 100,
      fscy: ((tag.fscy || fromTag.fscy) / fromTag.fscy) * 100,
    });
    Object.assign(fromTag, { fscx: 100, fscy: 100 });
  }
  return { transform: createTransform(toTag) };
}

// TODO: accel is not implemented yet, maybe it can be simulated by cubic-bezier?
export function setKeyframes(dialogue, store) {
  const { start, end, effect, move, fade, slices } = dialogue;
  const duration = (end - start) * 1000;
  const keyframes = [
    ...(effect && !move ? createEffectKeyframes({ effect, duration }) : []),
    ...(move ? createMoveKeyframes({ move, duration, dialogue }) : []),
    ...(fade ? createFadeKeyframes(fade, duration) : []),
  ].sort((a, b) => a.offset - b.offset);
  if (keyframes.length > 0) {
    Object.assign(dialogue, { keyframes });
  }
  slices.forEach((slice) => {
    const sliceTag = store.styles[slice.style].tag;
    slice.fragments.forEach((fragment) => {
      if (!fragment.tag.t || fragment.tag.t.length === 0) {
        return;
      }
      const fromTag = { ...sliceTag, ...fragment.tag };
      const tTags = mergeT(fragment.tag.t).sort((a, b) => a.t2 - b.t2 || a.t1 - b.t1);
      if (tTags[0].t1 > 0) {
        tTags.unshift({ t1: 0, t2: tTags[0].t1, tag: fromTag });
      }
      tTags.reduce((prevTag, curr) => {
        const tag = { ...prevTag, ...curr.tag };
        tag.t = null;
        Object.assign(curr.tag, tag);
        return tag;
      }, {});
      const fDuration = Math.max(duration, ...tTags.map(({ t2 }) => t2));
      const kfs = tTags.map(({ t2, tag }) => {
        const hasAlpha = (
          tag.a1 !== undefined
          && tag.a1 === tag.a2
          && tag.a2 === tag.a3
          && tag.a3 === tag.a4
        );
        // TODO: border and shadow, should animate CSS vars
        return {
          offset: t2 / fDuration,
          ...(tag.fs && { 'font-size': `calc(calc(var(--ass-scale) * ${getRealFontSize(tag.fn, tag.fs)}px)` }),
          ...(tag.fsp && { 'letter-spacing': `calc(calc(var(--ass-scale) * ${tag.fsp}px)` }),
          ...((tag.c1 || (tag.a1 && !hasAlpha)) && {
            color: color2rgba((tag.a1 || fromTag.a1) + (tag.c1 || fromTag.c1)),
          }),
          ...(hasAlpha && { opacity: 1 - Number.parseInt(tag.a1, 16) / 255 }),
          ...createTransformKeyframes({ fromTag, tag, fragment }),
        };
      }).sort((a, b) => a.offset - b.offset);
      if (kfs.length > 0) {
        Object.assign(fragment, { keyframes: kfs, duration: fDuration });
      }
    });
  });
}
