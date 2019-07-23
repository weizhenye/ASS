import { init } from './internal/init.js';
import { resize } from './internal/resize.js';
import { show } from './internal/show.js';
import { hide } from './internal/hide.js';
import { destroy } from './internal/destroy.js';
import { getter, setter } from './internal/resampling.js';

export default class ASS {
  constructor(source, video, options) {
    if (typeof source !== 'string') {
      return this;
    }
    return init.call(this, source, video, options);
  }

  resize() {
    return resize.call(this);
  }

  show() {
    return show.call(this);
  }

  hide() {
    return hide.call(this);
  }

  destroy() {
    return destroy.call(this);
  }

  get resampling() {
    return getter.call(this);
  }

  set resampling(r) {
    return setter.call(this, r);
  }
}
