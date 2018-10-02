import { assign } from 'ass-compiler/src/utils.js';
import { uuid, createSVGEl } from '../utils.js';
import { createSVGStroke } from './stroke.js';

export function createDrawing(fragment, styleTag) {
  const tag = assign({}, styleTag, fragment.tag);
  const { minX, minY, width, height } = fragment.drawing;
  const baseScale = this.scale / (1 << (tag.p - 1));
  const scaleX = (tag.fscx ? tag.fscx / 100 : 1) * baseScale;
  const scaleY = (tag.fscy ? tag.fscy / 100 : 1) * baseScale;
  const blur = tag.blur || tag.be || 0;
  const vbx = tag.xbord + (tag.xshad < 0 ? -tag.xshad : 0) + blur;
  const vby = tag.ybord + (tag.yshad < 0 ? -tag.yshad : 0) + blur;
  const vbw = width * scaleX + 2 * tag.xbord + Math.abs(tag.xshad) + 2 * blur;
  const vbh = height * scaleY + 2 * tag.ybord + Math.abs(tag.yshad) + 2 * blur;
  const $svg = createSVGEl('svg', [
    ['width', vbw],
    ['height', vbh],
    ['viewBox', `${-vbx} ${-vby} ${vbw} ${vbh}`],
  ]);
  const strokeScale = /Yes/i.test(this.info.ScaledBorderAndShadow) ? this.scale : 1;
  const filterId = `ASS-${uuid()}`;
  const $defs = createSVGEl('defs');
  $defs.appendChild(createSVGStroke(tag, filterId, strokeScale));
  $svg.appendChild($defs);
  const symbolId = `ASS-${uuid()}`;
  const $symbol = createSVGEl('symbol', [
    ['id', symbolId],
    ['viewBox', `${minX} ${minY} ${width} ${height}`],
  ]);
  $symbol.appendChild(createSVGEl('path', [['d', fragment.drawing.d]]));
  $svg.appendChild($symbol);
  $svg.appendChild(createSVGEl('use', [
    ['width', width * scaleX],
    ['height', height * scaleY],
    ['xlink:href', `#${symbolId}`],
    ['filter', `url(#${filterId})`],
  ]));
  $svg.style.cssText = (
    'position:absolute;'
    + `left:${minX * scaleX - vbx}px;`
    + `top:${minY * scaleY - vby}px;`
  );
  return {
    $svg,
    cssText: `position:relative;width:${width * scaleX}px;height:${height * scaleY}px;`,
  };
}
