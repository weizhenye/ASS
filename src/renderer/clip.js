import { createSVGEl } from '../utils.js';

function addClipPath($defs, clip, id, sw, sh) {
  if ($defs.querySelector(`#${id}`)) return;
  let d = '';
  if (clip.dots !== null) {
    let { x1, y1, x2, y2 } = clip.dots;
    x1 /= sw;
    y1 /= sh;
    x2 /= sw;
    y2 /= sh;
    d = `M${x1},${y1}L${x1},${y2},${x2},${y2},${x2},${y1}Z`;
  }
  if (clip.drawing !== null) {
    d = clip.drawing.instructions.map(({ type, points }) => (
      type + points.map(({ x, y }) => `${x / sw},${y / sh}`).join(',')
    )).join('');
  }
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
  $clipArea.style.clipPath = `url(#${id})`;
  return { $div: $clipArea };
}
