export const $fixFontSize = document.createElement('div');
$fixFontSize.className = 'ASS-fix-font-size';
$fixFontSize.textContent = 'M';

const cache = Object.create(null);

export function getRealFontSize(fn, fs) {
  const key = `${fn}-${fs}`;
  if (!cache[key]) {
    $fixFontSize.style.cssText = `line-height:normal;font-size:${fs}px;font-family:"${fn}",Arial;`;
    cache[key] = fs * fs / $fixFontSize.clientHeight;
  }
  return cache[key];
}
