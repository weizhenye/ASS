import { seek } from './seek.js';
import { getKeyframes } from '../renderer/animation.js';

export function resize() {
  const cw = this.video.clientWidth;
  const ch = this.video.clientHeight;
  const vw = this.video.videoWidth || cw;
  const vh = this.video.videoHeight || ch;
  const sw = this._.scriptRes.width;
  const sh = this._.scriptRes.height;
  let rw = sw;
  let rh = sh;
  const videoScale = Math.min(cw / vw, ch / vh);
  if (this.resampling === 'video_width') {
    rh = sw / vw * vh;
  }
  if (this.resampling === 'video_height') {
    rw = sh / vh * vw;
  }
  this.scale = Math.min(cw / rw, ch / rh);
  if (this.resampling === 'script_width') {
    this.scale = videoScale * (vw / rw);
  }
  if (this.resampling === 'script_height') {
    this.scale = videoScale * (vh / rh);
  }
  this.width = this.scale * rw;
  this.height = this.scale * rh;
  this._.resampledRes = { width: rw, height: rh };

  this.container.style.cssText = `width:${cw}px;height:${ch}px;`;
  const cssText = (
    `width:${this.width}px;`
    + `height:${this.height}px;`
    + `top:${(ch - this.height) / 2}px;`
    + `left:${(cw - this.width) / 2}px;`
  );
  this._.$stage.style.cssText = cssText;
  this._.$svg.style.cssText = cssText;
  this._.$svg.setAttributeNS(null, 'viewBox', `0 0 ${sw} ${sh}`);

  this._.$animation.innerHTML = getKeyframes.call(this);
  seek.call(this);

  return this;
}
