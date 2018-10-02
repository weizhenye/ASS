import { clear } from './clear.js';
import { framing } from './framing.js';

export function seek() {
  const vct = this.video.currentTime;
  const dias = this.dialogues;
  clear.call(this);
  this._.index = (() => {
    let from = 0;
    const to = dias.length - 1;
    while (from + 1 < to && vct > dias[(to + from) >> 1].end) {
      from = (to + from) >> 1;
    }
    if (!from) return 0;
    for (let i = from; i < to; i++) {
      if (
        dias[i].end > vct && vct >= dias[i].start
        || (i && dias[i - 1].end < vct && vct < dias[i].start)
      ) {
        return i;
      }
    }
    return to;
  })();
  framing.call(this);
}
