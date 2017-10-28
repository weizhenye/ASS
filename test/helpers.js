const thenable = {
  then(cb) {
    cb();
    return this;
  },
};

export function playVideo($video) {
  return ($video.play() || thenable).then(() => {
    // video can't play without user gesture
    if ($video.paused) {
      this.skip();
    }
  }, () => { this.skip(); });
}
