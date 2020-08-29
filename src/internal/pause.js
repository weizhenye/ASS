export function pause() {
  cancelAnimationFrame(this._.requestId);
  this._.requestId = 0;
  this._.$stage.classList.add('ASS-animation-paused');
  return this;
}
