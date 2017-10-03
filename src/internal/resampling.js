const regex = /^(video|script)_(width|height)$/;

export function getter() {
  return regex.test(this._.resampling) ? this._.resampling : 'video_height';
}

export function setter(r) {
  if (r === this._.resampling) return r;
  if (regex.test(r)) {
    this._.resampling = r;
    this.resize();
  }
  return this._.resampling;
}
