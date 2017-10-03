import { vendor } from '../utils.js';

export function createTransform(tag) {
  return [
    // TODO: I don't know why perspective is 314, it just performances well.
    'perspective(314px)',
    `rotateY(${tag.fry || 0}deg)`,
    `rotateX(${tag.frx || 0}deg)`,
    `rotateZ(${-tag.frz || 0}deg)`,
    `scale(${tag.p ? 1 : (tag.fscx || 100) / 100},${tag.p ? 1 : (tag.fscy || 100) / 100})`,
    `skew(${tag.fax || 0}rad,${tag.fay || 0}rad)`,
  ].join(' ');
}

export function setTransformOrigin(dialogue) {
  const { alignment, width, height, x, y, $div } = dialogue;
  let { org } = dialogue;
  if (!org) {
    org = { x: 0, y: 0 };
    if (alignment % 3 === 1) org.x = x;
    if (alignment % 3 === 2) org.x = x + width / 2;
    if (alignment % 3 === 0) org.x = x + width;
    if (alignment <= 3) org.y = y + height;
    if (alignment >= 4 && alignment <= 6) org.y = y + height / 2;
    if (alignment >= 7) org.y = y;
  }
  for (let i = $div.childNodes.length - 1; i >= 0; i--) {
    const node = $div.childNodes[i];
    if (node.dataset.hasRotate === 'true') {
      // It's not extremely precise for offsets are round the value to an integer.
      const tox = org.x - x - node.offsetLeft;
      const toy = org.y - y - node.offsetTop;
      node.style.cssText += `${vendor.transform}transform-origin:${tox}px ${toy}px;`;
    }
  }
}
