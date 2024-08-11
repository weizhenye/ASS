export function createStyle(dialogue) {
  const { layer, align, effect, pos, margin } = dialogue;
  let cssText = '';
  if (layer) cssText += `z-index:${layer};`;
  cssText += `text-align:${['left', 'center', 'right'][align.h]};`;
  if (!['banner', 'scroll up', 'scroll downn'].includes(effect?.name)) {
    cssText += `max-width:calc(100% - var(--ass-scale) * ${margin.left + margin.right}px);`;
    if (!pos) {
      if (align.h !== 0) {
        cssText += `padding-right:calc(var(--ass-scale) * ${margin.right}px);`;
      }
      if (align.h !== 2) {
        cssText += `padding-left:calc(var(--ass-scale) * ${margin.left}px);`;
      }
    }
  }
  return cssText;
}
