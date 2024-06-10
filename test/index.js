import { beforeEach } from 'vitest';
import mp4 from './fixtures/2fa3fe_90_640x360.mp4';

const $video = document.createElement('video');
$video.src = mp4;
$video.muted = true;
$video.style.width = '640px';
$video.style.height = '360px';
document.body.append($video);
// TODO: video is not loaded, video.videoWidth is still 0

beforeEach((context) => {
  context.$video = $video;
});
