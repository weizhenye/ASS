import { play } from './play.js';
import { pause } from './pause.js';
import { seek } from './seek.js';

export function bindEvents() {
  const l = this._.listener;
  l.play = play.bind(this);
  l.pause = pause.bind(this);
  l.seeking = seek.bind(this);
  this.video.addEventListener('play', l.play);
  this.video.addEventListener('pause', l.pause);
  this.video.addEventListener('seeking', l.seeking);
}

export function unbindEvents() {
  const l = this._.listener;
  this.video.removeEventListener('play', l.play);
  this.video.removeEventListener('pause', l.pause);
  this.video.removeEventListener('seeking', l.seeking);
  l.play = null;
  l.pause = null;
  l.seeking = null;
}
