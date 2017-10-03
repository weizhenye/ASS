import { assign } from 'ass-compiler/src/utils.js';
import { createSVGEl, uuid, vendor } from '../utils.js';

export function createClipPath(clip) {
  const sw = this._.scriptRes.width;
  const sh = this._.scriptRes.height;
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
  $clipPath.appendChild(createSVGEl('path', [
    ['d', d],
    ['transform', `scale(${scale})`],
    ['clip-rule', 'evenodd'],
  ]));
  this._.$defs.appendChild($clipPath);
  return {
    $clipPath,
    cssText: `${vendor.clipPath}clip-path:url(#${id});`,
  };
}

export function setClipPath(dialogue) {
  if (!dialogue.clip) {
    return;
  }
  const $fobb = document.createElement('div');
  this._.$stage.insertBefore($fobb, dialogue.$div);
  $fobb.appendChild(dialogue.$div);
  $fobb.className = 'ASS-fix-objectBoundingBox';
  const { cssText, $clipPath } = createClipPath.call(this, dialogue.clip);
  this._.$defs.appendChild($clipPath);
  $fobb.style.cssText = cssText;
  assign(dialogue, { $div: $fobb, $clipPath });
}
