import { createAnimation } from './animation.js';

export function createStyle(dialogue) {
  const { layer, start, end, alignment, effect, pos, margin } = dialogue;
  const { animationName, width, height, x, y } = dialogue;
  const vct = this.video.currentTime;
  let cssText = '';
  if (layer) cssText += `z-index:${layer};`;
  if (animationName) {
    cssText += createAnimation(animationName, end - start, Math.min(0, start - vct));
  }
  cssText += `text-align:${['right', 'left', 'center'][alignment % 3]};`;
  if (!effect) {
    const mw = this.width - this.scale * (margin.left + margin.right);
    cssText += `max-width:${mw}px;`;
    if (!pos) {
      if (alignment % 3 === 1) {
        cssText += `margin-left:${this.scale * margin.left}px;`;
      }
      if (alignment % 3 === 0) {
        cssText += `margin-right:${this.scale * margin.right}px;`;
      }
      if (width > this.width - this.scale * (margin.left + margin.right)) {
        cssText += `margin-left:${this.scale * margin.left}px;`;
        cssText += `margin-right:${this.scale * margin.right}px;`;
      }
    }
  }
  cssText += `width:${width}px;height:${height}px;left:${x}px;top:${y}px;`;
  return cssText;
}
