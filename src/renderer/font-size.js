// https://github.com/weizhenye/ASS/wiki/Font-Size-in-ASS

export const $fixFontSize = document.createElement('div');
$fixFontSize.className = 'ASS-fix-font-size';
const $span = document.createElement('span');
$span.textContent = '0';
$fixFontSize.append($span);

const cache = Object.create(null);

export function getRealFontSize(fn, fs) {
  if (!cache[fn]) {
    $fixFontSize.style.fontFamily = `"${fn}",Arial`;
    cache[fn] = fs * 2048 / $span.clientHeight;
  }
  return cache[fn];
}
