'use strict';
var TEST_VIDEO_FILE = '/test.mp4';
var TEST_ASS_FILE = 'https://raw.githubusercontent.com/Aegisub/Aegisub/master/docs/specs/ass-format-tests.ass';
var $ = function(s) {return document.querySelectorAll(s)};
var courl = (window.URL && window.URL.createObjectURL) ||
            (window.webkitURL && window.webkitURL.createObjectURL) ||
            window.createObjectURL ||
            window.createBlobURL;
var ass = new ASS();
var content = '';
var video = document.createElement('video');
video.controls = true;
var videoReady = false,
    ASSReady = false;
var dropVideo = $('#drop-video')[0],
    dropASS = $('#drop-ASS')[0];
dropVideo.ondragleave = dropASS.ondragleave = function() {this.style.borderColor = '#ccc';};
dropVideo.ondragover = dropASS.ondragover = function(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  this.style.borderColor = '#888';
};
dropVideo.ondrop = function(e) {
  e.preventDefault();
  this.style.borderColor = '#ccc';
  video.src = courl(e.dataTransfer.files[0]);
};
$('#drop-video input')[0].onchange = function() {
  video.src = courl(this.files[0]);
};
dropASS.ondrop = function(e) {
  e.preventDefault();
  this.style.borderColor = '#ccc';
  loadASS(e.dataTransfer.files[0]);
};
$('#drop-ASS input')[0].onchange = function() {
  loadASS(this.files[0]);
};
$('#init-video')[0].disabled = false;
$('#init-ass')[0].disabled = false;
$('#controls-resize')[0].disabled = true;
$('#controls-show')[0].disabled = true;
$('#controls-hide')[0].disabled = true;
$('#init-video')[0].onclick = function() {
  this.disabled = true;
  video.src = TEST_VIDEO_FILE;
};
$('#init-ass')[0].onclick = function() {
  var that = this;
  this.disabled = true;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', TEST_ASS_FILE, true);
  xhr.send(null);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        assOnLoaded(xhr.responseText);
      } else {
        showMessage('error', 'failed to fetch test file.');
        that.disabled = false;
      }
    }
  }
};
video.onloadedmetadata = function() {
  videoReady = true;
  $('#init-video')[0].disabled = true;
  showMessage('success', 'video is loaded.');
  dropVideo.style.display = 'none';
  $('#demo')[0].insertBefore(video, dropVideo);
  if (videoReady && ASSReady) init();
};
video.onerror = function(e) {
  videoReady = false;
  $('#init-video')[0].disabled = false;
  showMessage('error', 'failed to load video.');
};
$('#controls-resize')[0].onclick = function() {
  if (video.clientWidth === 960) {
    video.style.width = '640px';
    video.style.height = '360px';
    $('#info')[0].style.display = 'inline-block';
  } else {
    video.style.width = '960px';
    video.style.height = '540px';
    $('#info')[0].style.display = 'none';
  }
  ass.resize();
};
$('#controls-show')[0].onclick = function() {
  ass.show();
};
$('#controls-hide')[0].onclick = function() {
  ass.hide();
};
var loadASS = function(file) {
  var reader = new FileReader(file);
  if (!/\.ass$/i.test(file.name)) {
    showMessage('error', 'only supports ASS format.');
    return;
  }
  reader.readAsText(file);
  reader.onload = function(ev) {
    assOnLoaded(ev.target.result);
  };
};
var assOnLoaded = function(data) {
  content = data;
  showMessage('success', 'ASS file is loaded.');
  $('#init-ass')[0].disabled = true;
  $('#drop-ASS .drop-text')[0].innerHTML = 'ASS file is loaded';
  dropASS.style.border = '10px solid #ccc';
  ASSReady = true;
  if (videoReady && ASSReady) init();
};
var init = function() {
  ass.init(content, video);
  dropASS.style.display = 'none';
  $('#controls-resize')[0].disabled = false;
  $('#controls-show')[0].disabled = false;
  $('#controls-hide')[0].disabled = false;
  var info = document.createElement('div'),
      dl = document.createElement('dl'),
      dt = document.createElement('dt');
  info.id = 'info';
  dt.textContent = '[Script Info]';
  dl.appendChild(dt);
  for (var i in ass.tree.ScriptInfo) {
    var dd = document.createElement('dd');
    dd.innerHTML = i + ': <strong>' + ass.tree.ScriptInfo[i] + '</strong>';
    dl.appendChild(dd);
  }
  info.appendChild(dl);
  $('#demo')[0].appendChild(info);
};
var messageNode = $('#message')[0];
var showMessage = function(type, msg) {
  messageNode.textContent = msg;
  messageNode.className = type + ' transition';
  messageNode.style.opacity = 0;
  messageNode.addEventListener('transitionend', function() {
    messageNode.textContent = '';
    messageNode.className = '';
    messageNode.style.opacity = 1;
  });
};
document.onkeypress = function(e) {
  if (!ass.video) return;
  var key = e.keyCode || e.which,
      aen = document.activeElement.nodeName.toLowerCase();
  if (aen === 'textarea' || aen === 'input') return;
  if (key === 32) {
    e.preventDefault();
    video.paused ? video.play() : video.pause();
  }
};
