// https://github.com/weizhenye/ASS/wiki/Font-Size-in-ASS

export const $fixFontSize = document.createElement('div');
$fixFontSize.className = 'ASS-fix-font-size';
const $span = document.createElement('span');
$span.textContent = '0';
$fixFontSize.append($span);

const unitsPerEm = 2048;
const lineSpacing = Object.create(null);

export function getRealFontSize(fn, fs) {
  if (!lineSpacing[fn]) {
    $span.style.fontFamily = fn;
    lineSpacing[fn] = $span.clientHeight;
  }
  return fs * unitsPerEm / lineSpacing[fn];
}
