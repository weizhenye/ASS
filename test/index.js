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

export const $video = document.createElement('video');
$video.src = '/base/test/fixtures/2fa3fe_90_640x360.mp4';
$video.style.width = '640px';
$video.style.height = '360px';

before((done) => {
  let iid = 0;
  const handler = () => {
    $video.removeEventListener('canplaythrough', handler);
    clearInterval(iid);
    done();
  };
  $video.addEventListener('canplaythrough', handler);
  iid = setInterval(() => {
    if ($video.videoWidth) {
      clearInterval(iid);
      $video.removeEventListener('canplaythrough', handler);
      done();
    }
  }, 100);
  document.body.appendChild($video);
});

beforeEach((done) => {
  ($video.pause() || thenable).then(() => {
    $video.currentTime = 0;
    done();
  });
});
