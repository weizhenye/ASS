'use strict';

function ASS() {
  this.tree = {};
  this.position = 0;
  this.runline = [];
  this.scale = 1;
  this.container = document.createElement('div');
  this.container.className = 'ASS-container';
  this.container.appendChild($ffs);
  this.container.appendChild($clipPath);
  this.stage = document.createElement('div');
  this.stage.className = 'ASS-stage ASS-animation-paused';
}
ASS.prototype.init = function(data, video) {
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
  var vb = [0, 0, this.tree.ScriptInfo.PlayResX, this.tree.ScriptInfo.PlayResY];
  $clipPath.setAttributeNS(null, 'viewBox', vb.join(' '));

  var styleNode = document.getElementById('ASS-style');
  if (!styleNode) {
    styleNode = document.createElement('style');
    styleNode.type = 'text/css';
    styleNode.id = 'ASS-style';
    styleNode.appendChild(document.createTextNode(ASS_CSS));
    document.head.appendChild(styleNode);
  }

  this.resize();
  return this;
};
ASS.prototype.resize = function() {
  if (!this.video) return;
  var cw = this.video.clientWidth,
      ch = this.video.clientHeight,
      cp = cw / ch,
      vw = this.video.videoWidth,
      vh = this.video.videoHeight,
      vp = vw / vh,
      w = (cp > vp) ? vp * ch : cw,
      h = (cp > vp) ? ch : cw / vp,
      t = (cp > vp) ? 0 : (ch - h) / 2,
      l = (cp > vp) ? (cw - w) / 2 : 0;
  this.width = w;
  this.height = h;
  var arr = ['width:', w, 'px;height:', h, 'px;'];
  this.container.style.cssText = arr.join('');
  arr.push('top:', t, 'px;left:', l, 'px;');
  this.stage.style.cssText = arr.join('');
  $clipPath.style.cssText = arr.join('');
  this.scale = Math.min(w / this.tree.ScriptInfo.PlayResX,
                        h / this.tree.ScriptInfo.PlayResY);
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
