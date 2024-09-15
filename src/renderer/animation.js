import { color2rgba, initAnimation } from '../utils.js';
import { getRealFontSize } from './font-size.js';
// eslint-disable-next-line import/no-cycle
import { createRectClip } from './clip.js';
import { rotateTags, skewTags, scaleTags } from './transform.js';

const strokeTags = ['blur', 'xbord', 'ybord', 'xshad', 'yshad'];
if (window.CSS.registerProperty) {
  [
    'real-fs', 'tag-fs', 'tag-fsp', 'border-width',
    ...[...strokeTags, ...rotateTags, ...skewTags].map((tag) => `tag-${tag}`),
  ].forEach((k) => {
    window.CSS.registerProperty({
      name: `--ass-${k}`,
      syntax: '<number>',
      inherits: true,
      initialValue: 0,
    });
  });
  [
    'border-opacity', 'shadow-opacity',
    ...scaleTags.map((tag) => `tag-${tag}`),
  ].forEach((k) => {
    window.CSS.registerProperty({
      name: `--ass-${k}`,
      syntax: '<number>',
      inherits: true,
      initialValue: 1,
    });
  });
  ['fill-color', 'border-color', 'shadow-color'].forEach((k) => {
    window.CSS.registerProperty({
      name: `--ass-${k}`,
      syntax: '<color>',
      inherits: true,
      initialValue: 'transparent',
    });
  });
}

export function createEffect(effect, duration) {
  // TODO: when effect and move both exist, its behavior is weird, for now only move works.
  const { name, delay, leftToRight } = effect;
  const translate = name === 'banner' ? 'X' : 'Y';
  const dir = ({
    X: leftToRight ? 1 : -1,
    Y: /up/.test(name) ? -1 : 1,
  })[translate];
  const start = -100 * dir;
  // speed is 1000px/s when delay=1
  const distance = (duration / (delay || 1)) * dir;
  const keyframes = [
    { offset: 0, transform: `translate${translate}(${start}%)` },
    { offset: 1, transform: `translate${translate}(calc(${start}% + var(--ass-scale) * ${distance}px))` },
  ];
  return [keyframes, { duration, fill: 'forwards' }];
}

function multiplyScale(v) {
  return `calc(var(--ass-scale) * ${v}px)`;
}

export function createMove(move, duration) {
  const { x1, y1, x2, y2, t1, t2 } = move;
  const start = `translate(${multiplyScale(x1)}, ${multiplyScale(y1)})`;
  const end = `translate(${multiplyScale(x2)}, ${multiplyScale(y2)})`;
  const moveDuration = Math.max(t2, duration);
  const keyframes = [
    { offset: 0, transform: start },
    t1 > 0 ? { offset: t1 / moveDuration, transform: start } : null,
    (t2 > 0 && t2 < duration) ? { offset: t2 / moveDuration, transform: end } : null,
    { offset: 1, transform: end },
  ].filter(Boolean);
  const options = { duration: moveDuration, fill: 'forwards' };
  return [keyframes, options];
}

export function createFadeList(fade, duration) {
  const { type, a1, a2, a3, t1, t2, t3, t4 } = fade;
  // \fad(<t1>, <t2>)
  if (type === 'fad') {
    // For example dialogue starts at 0 and ends at 5000 with \fad(4000, 4000)
    // * <t1> means opacity from 0 to 1 in (0, 4000)
    // * <t2> means opacity from 1 to 0 in (1000, 5000)
    // <t1> and <t2> are overlaped in (1000, 4000), <t1> will take affect
    // so the result is:
    // * opacity from 0 to 1 in (0, 4000)
    // * opacity from 0.25 to 0 in (4000, 5000)
    const t1Keyframes = [{ offset: 0, opacity: 0 }, { offset: 1, opacity: 1 }];
    const t2Keyframes = [{ offset: 0, opacity: 1 }, { offset: 1, opacity: 0 }];
    return [
      [t2Keyframes, { duration: t2, delay: duration - t2, fill: 'forwards' }],
      [t1Keyframes, { duration: t1, composite: 'replace' }],
    ];
  }
  // \fade(<a1>, <a2>, <a3>, <t1>, <t2>, <t3>, <t4>)
  const fadeDuration = Math.max(duration, t4);
  const opacities = [a1, a2, a3].map((a) => 1 - a / 255);
  const offsets = [0, t1, t2, t3, t4].map((t) => t / fadeDuration);
  const keyframes = offsets.map((t, i) => ({ offset: t, opacity: opacities[i >> 1] }));
  return [
    [keyframes, { duration: fadeDuration, fill: 'forwards' }],
  ];
}

export function createAnimatableVars(tag) {
  return [
    ['real-fs', getRealFontSize(tag.fn, tag.fs)],
    ['tag-fs', tag.fs],
    ['tag-fsp', tag.fsp],
    ['fill-color', color2rgba(tag.a1 + tag.c1)],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => [`--ass-${k}`, v]);
}

// use linear() to simulate accel
function getEasing(duration, accel) {
  if (accel === 1) return 'linear';
  // 60fps
  const frames = Math.ceil(duration / 1000 * 60);
  const points = Array.from({ length: frames + 1 })
    .map((_, i) => (i / frames) ** accel);
  return `linear(${points.join(',')})`;
}

export function createDialogueAnimations(el, dialogue) {
  const { start, end, effect, move, fade } = dialogue;
  const duration = (end - start) * 1000;
  return [
    effect && !move ? createEffect(effect, duration) : null,
    move ? createMove(move, duration) : null,
    ...(fade ? createFadeList(fade, duration) : []),
  ]
    .filter(Boolean)
    .map(([keyframes, options]) => initAnimation(el, keyframes, options));
}

function createTagKeyframes(fromTag, tag, key) {
  const value = tag[key];
  if (value === undefined) return [];
  if (key === 'clip') return [];
  if (key === 'a1' || key === 'c1') {
    return [['fill-color', color2rgba((tag.a1 || fromTag.a1) + (tag.c1 || fromTag.c1))]];
  }
  if (key === 'a3' || key === 'c3') {
    return [['border-color', color2rgba((tag.a3 || fromTag.a3) + (tag.c3 || fromTag.c3))]];
  }
  if (key === 'a4' || key === 'c4') {
    return [['shadow-color', color2rgba((tag.a4 || fromTag.a4) + (tag.c4 || fromTag.c4))]];
  }
  if (key === 'fs') {
    return [
      ['real-fs', getRealFontSize(tag.fn || fromTag.fn, tag.fs)],
      ['tag-fs', value],
    ];
  }
  if (key === 'fscx' || key === 'fscy') {
    return [[`tag-${key}`, (value || 100) / 100]];
  }
  if (key === 'xbord' || key === 'ybord') {
    return [['border-width', value * 2]];
  }
  return [[`tag-${key}`, value]];
}

export function createTagAnimations(el, fragment, sliceTag) {
  const fromTag = { ...sliceTag, ...fragment.tag };
  return (fragment.tag.t || []).map(({ t1, t2, accel, tag }) => {
    const keyframe = Object.fromEntries(
      Object.keys(tag)
        .flatMap((key) => createTagKeyframes(fromTag, tag, key))
        .map(([k, v]) => [`--ass-${k}`, v])
        // .concat(tag.clip ? [['clipPath', ]] : [])
        .concat([['offset', 1]]),
    );
    const duration = Math.max(0, t2 - t1);
    return initAnimation(el, [keyframe], {
      duration,
      delay: t1,
      fill: 'forwards',
      easing: getEasing(duration, accel),
    });
  });
}

export function createClipAnimations(el, dialogue, store) {
  return dialogue.slices
    .flatMap((slice) => slice.fragments)
    .flatMap((fragment) => fragment.tag.t || [])
    .filter(({ tag }) => tag.clip)
    .map(({ t1, t2, accel, tag }) => {
      const keyframe = {
        offset: 1,
        clipPath: createRectClip(tag.clip, store.scriptRes.width, store.scriptRes.height),
      };
      const duration = Math.max(0, t2 - t1);
      return initAnimation(el, [keyframe], {
        duration,
        delay: t1,
        fill: 'forwards',
        easing: getEasing(duration, accel),
      });
    });
}
