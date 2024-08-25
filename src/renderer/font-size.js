// https://github.com/weizhenye/ASS/wiki/Font-Size-in-ASS

const useTextMetrics = 'fontBoundingBoxAscent' in TextMetrics.prototype;

// It seems max line-height is 1200px in Firefox.
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
const unitsPerEm = !useTextMetrics && isFirefox ? 512 : 2048;
const lineSpacing = Object.create(null);

const ctx = document.createElement('canvas').getContext('2d');

const $div = document.createElement('div');
$div.className = 'ASS-fix-font-size';
$div.style.fontSize = `${unitsPerEm}px`;
const $span = document.createElement('span');
$span.textContent = '0';
$div.append($span);

export const $fixFontSize = useTextMetrics ? null : $div;

export function getRealFontSize(fn, fs) {
  if (!lineSpacing[fn]) {
    if (useTextMetrics) {
      ctx.font = `${unitsPerEm}px "${fn}"`;
      const tm = ctx.measureText('');
      lineSpacing[fn] = tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent;
    } else {
      $span.style.fontFamily = `"${fn}"`;
      lineSpacing[fn] = $span.clientHeight;
    }
  }
  return fs * unitsPerEm / lineSpacing[fn];
}
