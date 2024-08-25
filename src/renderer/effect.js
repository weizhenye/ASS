export function setEffect(dialogue, store) {
  const $area = document.createElement('div');
  $area.className = 'ASS-effect-area';
  store.box.insertBefore($area, dialogue.$div);
  $area.append(dialogue.$div);
  const { width, height } = store.scriptRes;
  const { name, y1, y2, leftToRight, fadeAwayWidth, fadeAwayHeight } = dialogue.effect;
  const min = Math.min(y1, y2);
  const max = Math.max(y1, y2);
  $area.dataset.effect = name;
  if (name === 'banner') {
    $area.style.alignItems = leftToRight ? 'flex-start' : 'flex-end';
    $area.style.justifyContent = ['flex-end', 'center', 'flex-start'][dialogue.align.v];
  }
  if (name.startsWith('scroll')) {
    const top = min / height * 100;
    const bottom = (height - max) / height * 100;
    $area.style.cssText = `top:${top}%;bottom:${bottom}%;`;
    $area.style.justifyContent = ['flex-start', 'center', 'flex-end'][dialogue.align.h];
  }
  if (fadeAwayHeight) {
    const p = fadeAwayHeight / (max - min) * 100;
    $area.style.maskImage = [
      `linear-gradient(#000 ${100 - p}%, transparent)`,
      `linear-gradient(transparent, #000 ${p}%)`,
    ].join(',');
  }
  if (fadeAwayWidth) {
    const p = fadeAwayWidth / width * 100;
    // only left side has fade away effect in VSFilter
    $area.style.maskImage = `linear-gradient(90deg, transparent, #000 ${p}%)`;
  }
  return $area;
}
