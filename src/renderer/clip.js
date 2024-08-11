import { createSVGEl } from '../utils.js';

export function createRectClip(clip, sw, sh) {
  const { x1, y1, x2, y2 } = clip.dots;
  const polygon = [[x1, y1], [x1, y2], [x2, y2], [x2, y1], [x1, y1]]
    .map(([x, y]) => [x / sw, y / sh])
    .concat(clip.inverse ? [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]] : [])
    .map((pair) => pair.map((n) => `${n * 100}%`).join(' '))
    .join(',');
  return `polygon(evenodd, ${polygon})`;
}

function addClipPath($defs, clip, id, sw, sh) {
  if (!clip.drawing || $defs.querySelector(`#${id}`)) return;
  let d = clip.drawing.instructions.map(({ type, points }) => (
    type + points.map(({ x, y }) => `${x / sw},${y / sh}`).join(',')
  )).join('');
  const scale = 1 / (1 << (clip.scale - 1));
  if (clip.inverse) {
    d += `M0,0L0,${scale},${scale},${scale},${scale},0,0,0Z`;
  }
  const $clipPath = createSVGEl('clipPath', [
    ['id', id],
    ['clipPathUnits', 'objectBoundingBox'],
  ]);
  $clipPath.append(createSVGEl('path', [
    ['d', d],
    ['transform', `scale(${scale})`],
    ['clip-rule', 'evenodd'],
  ]));
  $defs.append($clipPath);
}

export function getClipPath(dialogue, store) {
  const { id, clip } = dialogue;
  if (!clip) return {};
  const { width, height } = store.scriptRes;
  addClipPath(store.defs, clip, id, width, height);
  const $clipArea = document.createElement('div');
  store.box.insertBefore($clipArea, dialogue.$div);
  $clipArea.append(dialogue.$div);
  $clipArea.className = 'ASS-clip-area';
  $clipArea.style.clipPath = clip.dots
    ? createRectClip(clip, width, height)
    : `url(#${id})`;
  return { $div: $clipArea };
}
