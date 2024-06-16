// https://github.com/weizhenye/ASS/wiki/Font-Size-in-ASS

export const $fixFontSize = document.createElement('div');
$fixFontSize.className = 'ASS-fix-font-size';
$fixFontSize.textContent = '0';

const cache = Object.create(null);

export function getRealFontSize(fn, fs) {
  if (!cache[fn]) {
    $fixFontSize.style.fontFamily = `font-family:"${fn}",Arial;`;
    cache[fn] = fs * 2048 / $fixFontSize.clientHeight;
  }
  return cache[fn];
}
