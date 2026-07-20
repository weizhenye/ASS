import { getClipPath } from './clip.js';
import { createDialogue } from './dom.js';
import { getPosition } from './position.js';
import { createStyle } from './style.js';
import { setTransformOrigin } from './transform.js';
import { setEffect } from './effect.js';

export function renderer(dialogue, store) {
  const { $div, animations } = createDialogue(dialogue, store);
  Object.assign(dialogue, { $div, animations });
  store.box.append($div);
  $div.style.cssText += createStyle(dialogue);
  // width and height may be changed after createStyle (e.g. max-width, padding from margins)
  const { width, height } = $div.getBoundingClientRect();
  Object.assign(dialogue, { width, height });
  const { x, y } = getPosition(dialogue, store);
  Object.assign(dialogue, { x, y });
  $div.style.cssText += `left:${x}px;top:${y}px;`;
  setTransformOrigin(dialogue, store.scale);
  // TODO: refactor to create .clip-area or .effect-area wrappers in `createDialogue`
  Object.assign(dialogue, getClipPath(dialogue, store));
  if (dialogue.effect) {
    Object.assign(dialogue, { $div: setEffect(dialogue, store) });
  }
  return dialogue;
}
