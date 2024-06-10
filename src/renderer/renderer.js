import { getClipPath } from './clip.js';
import { createDialogue } from './dom.js';
import { getPosition } from './position.js';
import { createStyle } from './style.js';
import { setTransformOrigin } from './transform.js';

export function renderer(dialogue, store) {
  const $div = createDialogue(dialogue, store);
  Object.assign(dialogue, { $div });

  // Apply max width to the $div, to make sure it line breaks
  // properly before measuring it:
  const mw = store.width - store.scale * (dialogue.margin.left + dialogue.margin.right);
  $div.style.cssText = `max-width:${mw}px`;

  store.box.append($div);
  const { width, height } = $div.getBoundingClientRect();
  Object.assign(dialogue, { width, height });
  Object.assign(dialogue, getPosition(dialogue, store));
  $div.style.cssText = createStyle(dialogue, store);
  setTransformOrigin(dialogue, store.scale);
  Object.assign(dialogue, getClipPath(dialogue, store));
  return dialogue;
}
