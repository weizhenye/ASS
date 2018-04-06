const thenable = window.Promise ? Promise.resolve() : {
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

// eslint-disable-next-line import/no-mutable-exports
export let $video = null;

beforeEach((done) => {
  $video = document.createElement('video');
  const handler = () => {
    $video.removeEventListener('canplaythrough', handler);
    done();
  };
  $video.addEventListener('canplaythrough', handler);
  document.body.appendChild($video);
  $video.src = '/base/test/fixtures/2fa3fe_90_640x360.mp4';
  $video.muted = true;
  $video.style.width = '640px';
  $video.style.height = '360px';
});

afterEach(() => {
  document.body.removeChild($video);
  $video = null;
});
