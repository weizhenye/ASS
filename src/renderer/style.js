export function createStyle(dialogue) {
  const { layer, align, effect, pos, margin } = dialogue;
  let cssText = '';
  if (layer) cssText += `z-index:${layer};`;
  cssText += `text-align:${['left', 'center', 'right'][align.h]};`;
  if (!effect) {
    cssText += `max-width:calc(100% - var(--ass-scale) * ${margin.left + margin.right}px);`;
    if (!pos) {
      if (align.h !== 0) {
        cssText += `margin-right:calc(var(--ass-scale) * ${margin.right}px);`;
      }
      if (align.h !== 2) {
        cssText += `margin-left:calc(var(--ass-scale) * ${margin.left}px);`;
      }
    }
  }
  return cssText;
}
