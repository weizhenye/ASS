export function createStyle(dialogue, store) {
  const { layer, align, effect, pos, margin } = dialogue;
  const { width, height, x, y } = dialogue;
  let cssText = '';
  if (layer) cssText += `z-index:${layer};`;
  cssText += `text-align:${['left', 'center', 'right'][align.h]};`;
  if (!effect) {
    const mw = store.width - store.scale * (margin.left + margin.right);
    cssText += `max-width:${mw}px;`;
    if (!pos) {
      if (align.h === 0) {
        cssText += `margin-left:${store.scale * margin.left}px;`;
      }
      if (align.h === 2) {
        cssText += `margin-right:${store.scale * margin.right}px;`;
      }
      if (width > store.width - store.scale * (margin.left + margin.right)) {
        cssText += `margin-left:${store.scale * margin.left}px;`;
        cssText += `margin-right:${store.scale * margin.right}px;`;
      }
    }
  }
  cssText += `width:${width}px;height:${height}px;left:${x}px;top:${y}px;`;
  return cssText;
}
