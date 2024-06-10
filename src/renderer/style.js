export function createStyle(dialogue, store) {
  const { layer, align, effect, pos, margin, width } = dialogue;
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
  return cssText;
}
