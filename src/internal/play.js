import { raf, caf } from '../utils.js';
import { framing } from './framing.js';

export function play() {
  const frame = () => {
    framing.call(this);
    this._.requestId = raf(frame);
  };
  caf(this._.requestId);
  this._.requestId = raf(frame);
  this._.$stage.classList.remove('ASS-animation-paused');
  return this;
}
