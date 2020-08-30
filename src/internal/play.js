import { framing } from './framing.js';
import { batchAnimate } from '../utils.js';

export function play() {
  const frame = () => {
    framing.call(this);
    this._.requestId = requestAnimationFrame(frame);
  };
  cancelAnimationFrame(this._.requestId);
  this._.requestId = requestAnimationFrame(frame);
  this._.stagings.forEach(({ $div }) => {
    batchAnimate($div, 'play');
  });
  return this;
}
