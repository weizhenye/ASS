'use strict';

function ASS() {
  this.tree = {};
  this.position = 0;
  this.runline = [];
  this.scale = 1;
  this._resample = 'video_height';
  this.resolution = {x: null, y: null};
  this.container = document.createElement('div');
  this.container.className = 'ASS-container';
  this.container.appendChild($ffs);
  this.container.appendChild($clipPath);
  this.stage = document.createElement('div');
  this.stage.className = 'ASS-stage ASS-animation-paused';
}
ASS.prototype.init = function(data, video, opt) {
  if (!data || video.nodeName !== 'VIDEO') return;

  var that = this;
  if (!this.video) {
    var isPlaying = !video.paused;
    this.video = video;
    this.video.parentNode.insertBefore(this.container, this.video);
    this.container.appendChild(this.video);
    this.container.appendChild(this.stage);
    this.video.addEventListener('seeking', function() {that._seek();});
    this.video.addEventListener('play', function() {that._play();});
    this.video.addEventListener('pause', function() {that._pause();});
    if (isPlaying && this.video.paused) this.video.play();
  }

  this.tree = parseASS(data);
  if (!this.tree.ScriptInfo.PlayResX || !this.tree.ScriptInfo.PlayResY) {
    this.tree.ScriptInfo.PlayResX = this.video.videoWidth;
    this.tree.ScriptInfo.PlayResY = this.video.videoHeight;
  }

  if (opt && opt.resample) this._resample = opt.resample;

  var $style = document.getElementById('ASS-style');
  if (!$style) {
    $style = document.createElement('style');
    $style.type = 'text/css';
    $style.id = 'ASS-style';
    $style.appendChild(document.createTextNode(ASS_CSS));
    document.head.appendChild($style);
  }

  this.resize();
  return this;
};
ASS.prototype.resize = function() {
  if (!this.video) return;
  var cw = this.video.clientWidth,
      ch = this.video.clientHeight,
      vw = this.video.videoWidth,
      vh = this.video.videoHeight,
      sw = this.tree.ScriptInfo.PlayResX,
      sh = this.tree.ScriptInfo.PlayResY,
      videoScale = Math.min(cw / vw, ch / vh);
  this.resolution.x = sw;
  this.resolution.y = sh;
  if (this.resample === 'video_width') {
    this.resolution.y = sw / vw * vh;
  }
  if (this.resample === 'video_height') {
    this.resolution.x = sh / vh * vw;
  }
  this.scale = Math.min(cw / this.resolution.x, ch / this.resolution.y);
  if (this.resample === 'script_width') {
    this.scale = videoScale * (vw / this.resolution.x);
  }
  if (this.resample === 'script_height') {
    this.scale = videoScale * (vh / this.resolution.y);
  }
  this.width = this.scale * this.resolution.x;
  this.height = this.scale * this.resolution.y;

  var cssText = 'width:' + cw + 'px;height:' + ch + 'px;'
  this.container.style.cssText = cssText;
  cssText = 'width:' + this.width + 'px;' +
            'height:' + this.height + 'px;' +
            'top:' + (ch - this.height) / 2 + 'px;' +
            'left:' + (cw - this.width) / 2 + 'px;';
  this.stage.style.cssText = cssText;
  $clipPath.style.cssText = cssText;
  $clipPath.setAttributeNS(null, 'viewBox', [0, 0, sw, sh].join(' '));

  createAnimation.call(this);
  this._seek();
  return this;
};
ASS.prototype.show = function() {
  this.stage.style.visibility = 'visible';
  return this;
};
ASS.prototype.hide = function() {
  this.stage.style.visibility = 'hidden';
  return this;
};
Object.defineProperty(ASS.prototype, 'resample', {
  get: function() {
    var r = this._resample;
    if (r === 'video_width' ||
        r === 'video_height' ||
        r === 'script_width' ||
        r === 'script_height') {
      return r;
    } else return 'video_height';
  },
  set: function(r) {
    if (r === this._resample) return r;
    if (r === 'video_width' ||
        r === 'video_height' ||
        r === 'script_width' ||
        r === 'script_height') {
      this._resample = r;
      this.resize();
    }
  }
});
ASS.prototype._play = function() {
  var that = this;
  var frame = function() {
    that._launch();
    RAFID = RAF(frame);
  };
  RAFID = RAF(frame);
  this.stage.classList.remove('ASS-animation-paused');
};
ASS.prototype._pause = function() {
  CAF(RAFID);
  RAFID = 0;
  this.stage.classList.add('ASS-animation-paused');
};
ASS.prototype._seek = function() {
  var vct = this.video.currentTime,
      dias = this.tree.Events.Dialogue;
  while (this.stage.lastChild) {
    this.stage.removeChild(this.stage.lastChild);
  }
  while ($clipPathDefs.lastChild) {
    $clipPathDefs.removeChild($clipPathDefs.lastChild);
  }
  this.runline = [];
  channel = [];
  this.position = (function() {
    var from = 0,
        to = dias.length - 1;
    while (from + 1 < to && vct > dias[(to + from) >> 1].End) {
      from = (to + from) >> 1;
    }
    if (!from) return 0;
    for (var i = from; i < to; ++i) {
      if (dias[i].End > vct && vct >= dias[i].Start ||
          i && dias[i - 1].End < vct && vct < dias[i].Start)
        return i;
    }
    return to;
  })();
  this._launch();
};
ASS.prototype._launch = function() {
  var vct = this.video.currentTime,
      dias = this.tree.Events.Dialogue;
  for (var i = this.runline.length - 1; i >= 0; --i) {
    var dia = this.runline[i],
        end = dia.End;
    if (dia.Effect && /scroll/.test(dia.Effect.name)) {
      var effDur = (dia.Effect.y2 - dia.Effect.y1) / (1000 / dia.Effect.delay);
      end = Math.min(end, dia.Start + effDur);
    }
    if (end < vct) {
      this.stage.removeChild(dia.node);
      if (dia.clipPath) $clipPathDefs.removeChild(dia.clipPath);
      this.runline.splice(i, 1);
    }
  }
  while (this.position < dias.length && vct >= dias[this.position].Start) {
    if (vct < dias[this.position].End) {
      var dia = renderer.call(this, dias[this.position]);
      this.runline.push(dia);
    }
    ++this.position;
  }
};
