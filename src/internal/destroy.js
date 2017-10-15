import { unbindEvents } from './events.js';
import { clear } from './clear.js';
import { pause } from './pause.js';

export function destroy() {
  pause.call(this);
  clear.call(this);
  unbindEvents.call(this, this._.listener);
  if (!this._.hasInitContainer) {
    const isPlay = !this.video.paused;
    this.container.parentNode.insertBefore(this.video, this.container);
    this.container.parentNode.removeChild(this.container);
    if (isPlay && this.video.paused) {
      this.video.play();
    }
  }
  document.head.removeChild(this._.$animation);
  // eslint-disable-next-line no-restricted-syntax
  for (const key in this) {
    if (Object.prototype.hasOwnProperty.call(this, key)) {
      this[key] = null;
    }
  }

  return this;
}
