import { color2rgba, createSVGEl } from '../utils.js';

export function createSVGStroke(tag, id, scale) {
  const hasBorder = tag.xbord || tag.ybord;
  const hasShadow = tag.xshad || tag.yshad;
  const isOpaque = tag.a1 !== 'FF';
  const blur = tag.blur || tag.be || 0;
  const $filter = createSVGEl('filter', [['id', id]]);
  $filter.appendChild(createSVGEl('feGaussianBlur', [
    ['stdDeviation', hasBorder ? 0 : blur],
    ['in', 'SourceGraphic'],
    ['result', 'sg_b'],
  ]));
  $filter.appendChild(createSVGEl('feFlood', [
    ['flood-color', color2rgba(tag.a1 + tag.c1)],
    ['result', 'c1'],
  ]));
  $filter.appendChild(createSVGEl('feComposite', [
    ['operator', 'in'],
    ['in', 'c1'],
    ['in2', 'sg_b'],
    ['result', 'main'],
  ]));
  if (hasBorder) {
    $filter.appendChild(createSVGEl('feMorphology', [
      ['radius', `${tag.xbord * scale} ${tag.ybord * scale}`],
      ['operator', 'dilate'],
      ['in', 'SourceGraphic'],
      ['result', 'dil'],
    ]));
    $filter.appendChild(createSVGEl('feGaussianBlur', [
      ['stdDeviation', blur],
      ['in', 'dil'],
      ['result', 'dil_b'],
    ]));
    $filter.appendChild(createSVGEl('feComposite', [
      ['operator', 'out'],
      ['in', 'dil_b'],
      ['in2', 'SourceGraphic'],
      ['result', 'dil_b_o'],
    ]));
    $filter.appendChild(createSVGEl('feFlood', [
      ['flood-color', color2rgba(tag.a3 + tag.c3)],
      ['result', 'c3'],
    ]));
    $filter.appendChild(createSVGEl('feComposite', [
      ['operator', 'in'],
      ['in', 'c3'],
      ['in2', 'dil_b_o'],
      ['result', 'border'],
    ]));
  }
  if (hasShadow && (hasBorder || isOpaque)) {
    $filter.appendChild(createSVGEl('feOffset', [
      ['dx', tag.xshad * scale],
      ['dy', tag.yshad * scale],
      ['in', hasBorder ? 'dil' : 'SourceGraphic'],
      ['result', 'off'],
    ]));
    $filter.appendChild(createSVGEl('feGaussianBlur', [
      ['stdDeviation', blur],
      ['in', 'off'],
      ['result', 'off_b'],
    ]));
    if (!isOpaque) {
      $filter.appendChild(createSVGEl('feOffset', [
        ['dx', tag.xshad * scale],
        ['dy', tag.yshad * scale],
        ['in', 'SourceGraphic'],
        ['result', 'sg_off'],
      ]));
      $filter.appendChild(createSVGEl('feComposite', [
        ['operator', 'out'],
        ['in', 'off_b'],
        ['in2', 'sg_off'],
        ['result', 'off_b_o'],
      ]));
    }
    $filter.appendChild(createSVGEl('feFlood', [
      ['flood-color', color2rgba(tag.a4 + tag.c4)],
      ['result', 'c4'],
    ]));
    $filter.appendChild(createSVGEl('feComposite', [
      ['operator', 'in'],
      ['in', 'c4'],
      ['in2', isOpaque ? 'off_b' : 'off_b_o'],
      ['result', 'shadow'],
    ]));
  }
  const $merge = createSVGEl('feMerge', []);
  if (hasShadow && (hasBorder || isOpaque)) {
    $merge.appendChild(createSVGEl('feMergeNode', [['in', 'shadow']]));
  }
  if (hasBorder) {
    $merge.appendChild(createSVGEl('feMergeNode', [['in', 'border']]));
  }
  $merge.appendChild(createSVGEl('feMergeNode', [['in', 'main']]));
  $filter.appendChild($merge);
  return $filter;
}

export function createCSSStroke(tag, scale) {
  const arr = [];
  const oc = color2rgba(tag.a3 + tag.c3);
  const ox = tag.xbord * scale;
  const oy = tag.ybord * scale;
  const sc = color2rgba(tag.a4 + tag.c4);
  const sx = tag.xshad * scale;
  const sy = tag.yshad * scale;
  const blur = tag.blur * scale;
  if (ox || oy) {
    const oavg = (ox + oy) / 2;
    arr.push(`-webkit-text-stroke: ${oavg}px ${oc};`);
    arr.push(`transform:${(ox > oy) ? `scaleY(${oy / oavg})` : `scaleX(${ox / oavg})`};`);
  }
  if (sx || sy) {
    arr.push(`text-shadow:${sx}px ${sy}px ${sc};`);
  }
  if (blur) arr.push(`filter:blur(${blur}px);`);
  return arr.join('');
}

export function createCSSBorder(tag, scale) {
  const arr = [];
  const oc = color2rgba(tag.a3 + tag.c3);
  const ox = tag.xbord * scale;
  const oy = tag.ybord * scale;
  const sc = color2rgba(tag.a4 + tag.c4);
  const sx = tag.xshad * scale;
  const sy = tag.yshad * scale;
  const blur = tag.blur * scale;
  if (ox) {
    arr.push(`margin-left:-${ox}px;`);
    arr.push(`border-left:${ox}px solid ${oc};`);
    arr.push(`border-right:${ox}px solid ${oc};`);
  }
  if (oy) {
    arr.push(`margin-top:-${oy}px;`);
    arr.push(`border-top:${oy}px solid ${oc};`);
    arr.push(`border-bottom:${oy}px solid ${oc};`);
  }
  if (sx || sy) {
    arr.push(`box-shadow:${sx}px ${sy}px ${sc};`);
  }
  if (blur) arr.push(`filter:blur(${blur}px);`);
  return arr.join('');
}
