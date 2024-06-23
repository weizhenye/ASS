export function getScrollEffect(dialogue, store) {
  const $scrollArea = document.createElement('div');
  $scrollArea.className = 'ASS-scroll-area';
  store.box.insertBefore($scrollArea, dialogue.$div);
  $scrollArea.append(dialogue.$div);
  const { height } = store.scriptRes;
  const { name, y1, y2 } = dialogue.effect;
  const min = Math.min(y1, y2);
  const max = Math.max(y1, y2);
  const top = min / height * 100;
  const bottom = (height - max) / height * 100;
  $scrollArea.style.cssText += `top:${top}%;bottom:${bottom}%;`;
  const up = /up/.test(name);
  // eslint-disable-next-line no-param-reassign
  dialogue.$div.style.cssText += up ? 'top:100%;' : 'top:0%;';
  return {
    $div: $scrollArea,
  };
}
