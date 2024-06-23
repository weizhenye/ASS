export function alpha2opacity(a) {
  return 1 - `0x${a}` / 255;
}

export function color2rgba(c) {
  const t = c.match(/(\w\w)(\w\w)(\w\w)(\w\w)/);
  const a = alpha2opacity(t[1]);
  const b = +`0x${t[2]}`;
  const g = +`0x${t[3]}`;
  const r = +`0x${t[4]}`;
  return `rgba(${r},${g},${b},${a})`;
}

export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.trunc(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * @param {string} name SVG tag
 * @param {[string, string][]} attrs
 * @returns
 */
export function createSVGEl(name, attrs = []) {
  const $el = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (let i = 0; i < attrs.length; i += 1) {
    const attr = attrs[i];
    $el.setAttributeNS(
      attr[0] === 'xlink:href' ? 'http://www.w3.org/1999/xlink' : null,
      attr[0],
      attr[1],
    );
  }
  return $el;
}

function getVendor(prop) {
  const { style } = document.body;
  const Prop = prop.replace(/^\w/, (x) => x.toUpperCase());
  if (prop in style) return '';
  if (`webkit${Prop}` in style) return '-webkit-';
  if (`moz${Prop}` in style) return '-moz-';
  return '';
}

export const vendor = {
  clipPath: getVendor('clipPath'),
};

const GLOBAL_CSS = '__GLOBAL_CSS__';
/**
 * @param {HTMLElement} container
 */
export function addGlobalStyle(container) {
  const rootNode = container.getRootNode() || document;
  const styleRoot = rootNode === document ? document.head : rootNode;
  let $style = styleRoot.querySelector('#ASS-global-style');
  if (!$style) {
    $style = document.createElement('style');
    $style.type = 'text/css';
    $style.id = 'ASS-global-style';
    $style.append(document.createTextNode(GLOBAL_CSS));
    styleRoot.append($style);
  }
}

export const strokeTags = ['c3', 'a3', 'c4', 'a4', 'xbord', 'ybord', 'xshad', 'yshad', 'blur', 'be'];
export const transformTags = ['fscx', 'fscy', 'frx', 'fry', 'frz', 'fax', 'fay'];

export function initAnimation($el, keyframes, options) {
  const animation = $el.animate(keyframes, options);
  animation.pause();
  return animation;
}

export function batchAnimate(dia, action) {
  (dia.animations || []).forEach((animation) => {
    animation[action]();
  });
}
