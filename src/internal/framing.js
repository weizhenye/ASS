import { renderer } from '../renderer/renderer.js';

export function framing() {
  const vct = this.video.currentTime;
  for (let i = this._.stagings.length - 1; i >= 0; i--) {
    const dia = this._.stagings[i];
    let { end } = dia;
    if (dia.effect && /scroll/.test(dia.effect.name)) {
      const { y1, y2, delay } = dia.effect;
      const duration = ((y2 || this._.resampledRes.height) - y1) / (1000 / delay);
      end = Math.min(end, dia.start + duration);
    }
    if (end < vct) {
      this._.$stage.removeChild(dia.$div);
      if (dia.$clipPath) {
        this._.$defs.removeChild(dia.$clipPath);
      }
      this._.stagings.splice(i, 1);
    }
  }
  const dias = this.dialogues;
  while (
    this._.index < dias.length
    && vct >= dias[this._.index].start
  ) {
    if (vct < dias[this._.index].end) {
      const dia = renderer.call(this, dias[this._.index]);
      this._.stagings.push(dia);
    }
    ++this._.index;
  }
}
