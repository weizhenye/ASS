import { assign } from 'ass-compiler/src/utils.js';
import { setClipPath } from './clip.js';
import { createDialogue } from './dom.js';
import { getPosition } from './position.js';
import { createStyle } from './style.js';
import { setTransformOrigin } from './transform.js';

export function renderer(dialogue) {
  const $div = createDialogue.call(this, dialogue);
  assign(dialogue, { $div });

  // Apply max width to the $div, to make sure it line breaks
  // properly before measuring it:
  const mw = this.width - this.scale * (dialogue.margin.left + dialogue.margin.right);
  $div.style.cssText = `max-width:${mw}px`;

  this._.$stage.appendChild($div);
  const { width, height } = $div.getBoundingClientRect();
  assign(dialogue, { width, height });
  assign(dialogue, getPosition.call(this, dialogue));
  $div.style.cssText = createStyle.call(this, dialogue);
  setTransformOrigin(dialogue);
  setClipPath.call(this, dialogue);
  return dialogue;
}
