/* eslint-disable no-param-reassign */
import ASS from 'https://cdn.jsdelivr.net/npm/assjs@0.1/dist/ass.js';

const TEST_VIDEO_FILE = './test.mp4';
const TEST_ASS_FILE = 'https://raw.githubusercontent.com/Aegisub/Aegisub/master/docs/specs/ass-format-tests.ass';
const $ = function $(s) { return document.querySelectorAll(s); };

let ass;
let content = '';
const video = document.createElement('video');
video.controls = true;
video.muted = true;
const dropVideo = $('#drop-video')[0];
const dropASS = $('#drop-ASS')[0];

function init() {
  ass = new ASS(content, video);
  console.log(ass);
  dropASS.style.display = 'none';
  $('#controls-resize')[0].disabled = false;
  $('#controls-show')[0].disabled = false;
  $('#controls-hide')[0].disabled = false;
  $('#controls-destroy')[0].disabled = false;
}
function assOnLoaded(data) {
  const { dataset } = $('#main')[0];
  content = data;
  $('#init-ass')[0].disabled = true;
  $('#info')[0].textContent = content;
  dropASS.dataset.drop = '';
  dataset.assReady = '';
  if (dataset.videoReady === '' && dataset.assReady === '') init();
}

function onDragLeave(event) {
  Reflect.deleteProperty(event.target.dataset, 'dragging');
}
dropVideo.addEventListener('dragleave', onDragLeave);
dropASS.addEventListener('dragleave', onDragLeave);

function onDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  event.target.dataset.dragging = '';
}
dropVideo.addEventListener('dragover', onDragOver);
dropASS.addEventListener('dragover', onDragOver);

function loadVideo(event) {
  event.preventDefault();
  const [file] = (event.dataTransfer || event.target).files;
  video.src = window.URL.createObjectURL(file);
}
dropVideo.addEventListener('drop', loadVideo);
$('#drop-video input')[0].addEventListener('change', loadVideo);

function loadASS(event) {
  event.preventDefault();
  const [file] = (event.dataTransfer || event.target).files;
  if (!/\.ass$/i.test(file.name)) return;
  file.text().then(assOnLoaded);
}
dropASS.addEventListener('drop', loadASS);
$('#drop-ASS input')[0].addEventListener('change', loadASS);

$('#init-video')[0].addEventListener('click', (event) => {
  event.target.disabled = true;
  video.src = TEST_VIDEO_FILE;
});
video.addEventListener('loadedmetadata', () => {
  const { dataset } = $('#main')[0];
  dataset.videoReady = '';
  $('#init-video')[0].disabled = true;
  dropVideo.style.display = 'none';
  $('#container')[0].append(video);
  if (dataset.videoReady === '' && dataset.assReady === '') init();
});
video.addEventListener('error', () => {
  Reflect.deleteProperty($('#main')[0].dataset, 'videoReady');
  $('#init-video')[0].disabled = false;
});

$('#init-ass')[0].addEventListener('click', (event) => {
  event.target.disabled = true;
  fetch(TEST_ASS_FILE)
    .then((res) => res.text())
    .then((text) => assOnLoaded(text))
    .catch(() => {
      event.target.disabled = false;
    });
});

$('#controls-resize')[0].addEventListener('click', () => {
  const { dataset } = $('#main')[0];
  dataset.size = (dataset.size === 'lg' ? 'sm' : 'lg');
});
$('#controls-show')[0].addEventListener('click', () => {
  ass.show();
});
$('#controls-hide')[0].addEventListener('click', () => {
  ass.hide();
});
$('#controls-destroy')[0].addEventListener('click', () => {
  ass.destroy();
});
[...$('input[name="resampling"]')].forEach((el) => {
  el.addEventListener('click', (event) => {
    ass.resampling = event.target.dataset.value;
  });
});

document.addEventListener('keypress', (event) => {
  if (!ass.video) return;
  const aen = document.activeElement.nodeName.toLowerCase();
  if (aen === 'textarea' || aen === 'input') return;
  if (event.code !== 'Space') return;
  event.preventDefault();
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
});
