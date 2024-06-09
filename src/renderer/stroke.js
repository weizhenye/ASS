import { color2rgba, alpha2opacity, createSVGEl } from '../utils.js';

export function createSVGStroke(tag, id, scale) {
  const hasBorder = tag.xbord || tag.ybord;
  const hasShadow = tag.xshad || tag.yshad;
  const isOpaque = tag.a1 !== 'FF';
  const blur = tag.blur || tag.be || 0;
  const $filter = createSVGEl('filter', [['id', id]]);
  $filter.append(createSVGEl('feGaussianBlur', [
    ['stdDeviation', hasBorder ? 0 : blur],
    ['in', 'SourceGraphic'],
    ['result', 'sg_b'],
  ]));
  $filter.append(createSVGEl('feFlood', [
    ['flood-color', color2rgba(tag.a1 + tag.c1)],
    ['result', 'c1'],
  ]));
  $filter.append(createSVGEl('feComposite', [
    ['operator', 'in'],
    ['in', 'c1'],
    ['in2', 'sg_b'],
    ['result', 'main'],
  ]));
  if (hasBorder) {
    $filter.append(createSVGEl('feMorphology', [
      ['radius', `${tag.xbord * scale} ${tag.ybord * scale}`],
      ['operator', 'dilate'],
      ['in', 'SourceGraphic'],
      ['result', 'dil'],
    ]));
    $filter.append(createSVGEl('feGaussianBlur', [
      ['stdDeviation', blur],
      ['in', 'dil'],
      ['result', 'dil_b'],
    ]));
    $filter.append(createSVGEl('feComposite', [
      ['operator', 'out'],
      ['in', 'dil_b'],
      ['in2', 'SourceGraphic'],
      ['result', 'dil_b_o'],
    ]));
    $filter.append(createSVGEl('feFlood', [
      ['flood-color', color2rgba(tag.a3 + tag.c3)],
      ['result', 'c3'],
    ]));
    $filter.append(createSVGEl('feComposite', [
      ['operator', 'in'],
      ['in', 'c3'],
      ['in2', 'dil_b_o'],
      ['result', 'border'],
    ]));
  }
  if (hasShadow && (hasBorder || isOpaque)) {
    $filter.append(createSVGEl('feOffset', [
      ['dx', tag.xshad * scale],
      ['dy', tag.yshad * scale],
      ['in', hasBorder ? 'dil' : 'SourceGraphic'],
      ['result', 'off'],
    ]));
    $filter.append(createSVGEl('feGaussianBlur', [
      ['stdDeviation', blur],
      ['in', 'off'],
      ['result', 'off_b'],
    ]));
    if (!isOpaque) {
      $filter.append(createSVGEl('feOffset', [
        ['dx', tag.xshad * scale],
        ['dy', tag.yshad * scale],
        ['in', 'SourceGraphic'],
        ['result', 'sg_off'],
      ]));
      $filter.append(createSVGEl('feComposite', [
        ['operator', 'out'],
        ['in', 'off_b'],
        ['in2', 'sg_off'],
        ['result', 'off_b_o'],
      ]));
    }
    $filter.append(createSVGEl('feFlood', [
      ['flood-color', color2rgba(tag.a4 + tag.c4)],
      ['result', 'c4'],
    ]));
    $filter.append(createSVGEl('feComposite', [
      ['operator', 'in'],
      ['in', 'c4'],
      ['in2', isOpaque ? 'off_b' : 'off_b_o'],
      ['result', 'shadow'],
    ]));
  }
  const $merge = createSVGEl('feMerge', []);
  if (hasShadow && (hasBorder || isOpaque)) {
    $merge.append(createSVGEl('feMergeNode', [['in', 'shadow']]));
  }
  if (hasBorder) {
    $merge.append(createSVGEl('feMergeNode', [['in', 'border']]));
  }
  $merge.append(createSVGEl('feMergeNode', [['in', 'main']]));
  $filter.append($merge);
  return $filter;
}

function get4QuadrantPoints([x, y]) {
  return [[0, 0], [0, 1], [1, 0], [1, 1]]
    .filter(([i, j]) => (i || x) && (j || y))
    .map(([i, j]) => [(i || -1) * x, (j || -1) * y]);
}

function getOffsets(x, y) {
  if (x === y) return [];
  const nx = Math.min(x, y);
  const ny = Math.max(x, y);
  // const offsets = [[nx, ny]];
  // for (let i = 0; i < nx; i++) {
  //   for (let j = Math.round(nx + 0.5); j < ny; j++) {
  //     offsets.push([i, j]);
  //   }
  // }
  // return [].concat(...offsets.map(get4QuadrantPoints));
  return Array.from({ length: Math.ceil(ny) - 1 }, (_, i) => i + 1).concat(ny)
    .map((n) => [(ny - n) / ny * nx, n])
    .map(([i, j]) => (x > y ? [j, i] : [i, j]))
    .flatMap(get4QuadrantPoints);
}

// TODO: a1 === 'ff'
export function createCSSStroke(tag, scale) {
  const bc = color2rgba(`00${tag.c3}`);
  const bx = tag.xbord * scale;
  const by = tag.ybord * scale;
  const sc = color2rgba(`00${tag.c4}`);
  const sx = tag.xshad * scale;
  const sy = tag.yshad * scale;
  const blur = tag.blur || tag.be || 0;
  const deltaOffsets = getOffsets(bx, by);
  return [
    { key: 'border-width', value: `${Math.min(bx, by) * 2}px` },
    { key: 'border-color', value: bc },
    { key: 'border-opacity', value: alpha2opacity(tag.a3) },
    { key: 'border-delta', value: deltaOffsets.map(([x, y]) => `${x}px ${y}px ${bc}`).join(',') },
    { key: 'shadow-offset', value: `${sx}px, ${sy}px` },
    { key: 'shadow-color', value: sc },
    { key: 'shadow-opacity', value: alpha2opacity(tag.a4) },
    { key: 'shadow-delta', value: deltaOffsets.map(([x, y]) => `${x}px ${y}px ${sc}`).join(',') },
    { key: 'blur', value: `blur(${blur}px)` },
  ].map((kv) => Object.assign(kv, { key: `--ass-${kv.key}` }));
}
