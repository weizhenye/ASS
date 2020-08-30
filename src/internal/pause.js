import { batchAnimate } from '../utils.js';

export function pause() {
  cancelAnimationFrame(this._.requestId);
  this._.requestId = 0;
  this._.stagings.forEach(({ $div }) => {
    batchAnimate($div, 'pause');
  });
  return this;
}
