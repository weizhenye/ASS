import { createSVGEl, uuid } from '../utils.js';

export function createClipPath(clip, store) {
  const sw = store.scriptRes.width;
  const sh = store.scriptRes.height;
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
  const id = `ASS-${uuid()}`;
  const $clipPath = createSVGEl('clipPath', [
    ['id', id],
    ['clipPathUnits', 'objectBoundingBox'],
  ]);
  $clipPath.append(createSVGEl('path', [
    ['d', d],
    ['transform', `scale(${scale})`],
    ['clip-rule', 'evenodd'],
  ]));
  store.defs.append($clipPath);
  return {
    $clipPath,
    cssText: `clip-path:url(#${id});`,
  };
}

export function getClipPath(dialogue, store) {
  if (!dialogue.clip) return {};
  const $fobb = document.createElement('div');
  store.box.insertBefore($fobb, dialogue.$div);
  $fobb.append(dialogue.$div);
  $fobb.className = 'ASS-fix-objectBoundingBox';
  const { cssText, $clipPath } = createClipPath(dialogue.clip, store);
  store.defs.append($clipPath);
  $fobb.style.cssText = cssText;
  return { $div: $fobb, $clipPath };
}
