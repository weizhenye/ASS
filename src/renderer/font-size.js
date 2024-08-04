// https://github.com/weizhenye/ASS/wiki/Font-Size-in-ASS

// It seems max line-height is 1200px in Firefox.
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
const unitsPerEm = isFirefox ? 512 : 2048;
const lineSpacing = Object.create(null);

export const $fixFontSize = document.createElement('div');
$fixFontSize.className = 'ASS-fix-font-size';
$fixFontSize.style.fontSize = `${unitsPerEm}px`;
const $span = document.createElement('span');
$span.textContent = '0';
$fixFontSize.append($span);

export function getRealFontSize(fn, fs) {
  if (!lineSpacing[fn]) {
    $span.style.fontFamily = fn;
    lineSpacing[fn] = $span.clientHeight;
  }
  return fs * unitsPerEm / lineSpacing[fn];
}
