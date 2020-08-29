import { framing } from './framing.js';

export function play() {
  const frame = () => {
    framing.call(this);
    this._.requestId = requestAnimationFrame(frame);
  };
  cancelAnimationFrame(this._.requestId);
  this._.requestId = requestAnimationFrame(frame);
  this._.$stage.classList.remove('ASS-animation-paused');
  return this;
}
