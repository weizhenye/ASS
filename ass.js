(function(window) {
'use strict';

function ASS() {
  this.tree = {};
  this.position = 0;
  this.runline = [];
  this.scale = 1;
  this.container = document.createElement('div');
  this.container.className = 'ASS-container';
  this.container.appendChild(fontSizeElement);
  this.stage = document.createElement('div');
  this.stage.className = 'ASS-stage ASS-animation-paused';
}
ASS.prototype.init = function(data, video) {
  var that = this;
  if (video && !this.video) {
    var isPlaying = !video.paused;
    this.video = video;
    this.container.style.position = this.video.style.position;
    this.video.style.position = 'absolute';
    this.video.parentNode.insertBefore(this.container, this.video);
    this.container.appendChild(this.video);
    this.container.appendChild(this.stage);
    this.video.addEventListener('seeking', function() {that._seek();});
    this.video.addEventListener('play', function() {that._play();});
    this.video.addEventListener('pause', function() {that._pause();});
    if (isPlaying && this.video.paused) this.video.play();
  }

  if (!data) return;
  this.tree = parseASS(data);

  if (this.video && (!this.tree.ScriptInfo.PlayResX || !this.tree.ScriptInfo.PlayResY)) {
    this.tree.ScriptInfo.PlayResX = this.video.videoWidth;
    this.tree.ScriptInfo.PlayResY = this.video.videoHeight;
  }

  var CSSstr = '.ASS-stage{overflow:hidden;z-index:2147483647;pointer-events:none;position:absolute;}.ASS-dialogue{position: absolute;}.ASS-animation-paused *{animation-play-state:paused !important;-webkit-animation-play-state:paused !important;}.ASS-font-size-element{position:absolute;visibility:hidden;}';
  var styleNode = document.createElement('style');
  styleNode.type = 'text/css';
  styleNode.id = 'ASS-style';
  styleNode.appendChild(document.createTextNode(CSSstr));
  document.head.appendChild(styleNode);
  styleNode = document.createElement('style');
  styleNode.type = 'text/css';
  styleNode.id = 'ASS-animation';
  document.head.appendChild(styleNode);

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
  this.stage.style.cssText = 'width:' + w + 'px;height:' + h + 'px;top:' + t + 'px;left:' + l + 'px;';
  this.scale = Math.min(w / this.tree.ScriptInfo.PlayResX, h / this.tree.ScriptInfo.PlayResY);
  // this._createAnimation();
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
  function scan() {
    that._launch();
    RAFID = RAF(scan);
  }
  RAFID = RAF(scan);
  this.stage.classList.remove('ASS-animation-paused');
};
ASS.prototype._pause = function() {
  CAF(RAFID);
  RAFID = 0;
  this.stage.classList.add('ASS-animation-paused');
};
ASS.prototype._seek = function() {
  var ct = this.video.currentTime,
      dias = this.tree.Events.Dialogue;
  while (this.stage.lastChild) {
    this.stage.removeChild(this.stage.lastChild);
  }
  this.runline = [];
  channel = [];
  this.position = (function() {
    var from = 0,
        to = dias.length - 1;
    while (from + 1 < to && ct > dias[(to + from) >> 1].End) from = (to + from) >> 1;
    if (!from) return 0;
    for (var i = from; i < to; ++i) {
      if (dias[i].End > ct && ct >= dias[i].Start ||
          i && dias[i - 1].End < ct && ct < dias[i].Start)
        return i;
    }
    return to;
  })();
  this._launch();
};
ASS.prototype._launch = function() {
  var ct = this.video.currentTime,
      dias = this.tree.Events.Dialogue;
  for (var i = this.runline.length - 1; i >= 0; --i) {
    var dia = this.runline[i],
        end = dia.End;
    if (dia.Effect && /scroll/.test(dia.Effect.name)) {
      end = Math.min(end, dia.Start + (dia.Effect.y2 - dia.Effect.y1) / (1000 / dia.Effect.delay));
    }
    if (end < ct) {
      if (!dia.pos && !dia.Effect && !dia.t) this._freeChannel(dia);
      this.stage.removeChild(dia.node);
      this.runline.splice(i, 1);
    }
  }
  while (this.position < dias.length && ct >= dias[this.position].End) ++this.position;
  while (this.position < dias.length && ct >= dias[this.position].Start) {
    if (ct < dias[this.position].End) {
      var dia = this._render(dias[this.position]);
      this.runline.push(dia);
    }
    ++this.position;
  }
};
ASS.prototype._render = function(data) {
  var pt = data.parsedText,
      s = this.tree.V4Styles.Style[data.Style];
  var dia = {
    node: document.createElement('div'),
    Alignment: pt.alignment || s.Alignment,
    Layer: data.Layer,
    Start: data.Start,
    End: data.End,
    BorderStyle: s.BorderStyle,
    MarginL: data.MarginL || s.MarginL,
    MarginR: data.MarginR || s.MarginR,
    MarginV: data.MarginV || s.MarginV,
    Effect: data.Effect,
    parsedText: data.parsedText,
    _index: data._index,
    move: pt.move,
    fad: pt.fad,
    fade: pt.fade,
    pos: pt.pos || (pt.move ? {x: 0, y: 0} : null),
    org: pt.org,
    channel: 0,
    minX: 0,
    minY: 0,
    t: false,
  };
  dia.node.className = 'ASS-dialogue';
  this.stage.appendChild(dia.node);
  setTagsStyle.call(this, dia);
  var bcr = dia.node.getBoundingClientRect();
  dia.width = bcr.width;
  dia.height = bcr.height;
  if (dia.Effect) {
    if (dia.Effect.name === 'banner') {
      if (dia.Alignment <= 3) dia.y = this.height - dia.height - dia.MarginV + dia.minY;
      if (dia.Alignment >= 4 && dia.Alignment <= 6) dia.y = (this.height - dia.height) / 2 + dia.minY;
      if (dia.Alignment >= 7) dia.y = dia.MarginV + dia.minY;
      if (dia.Effect.lefttoright) dia.x = -dia.width + dia.minX;
      else dia.x = this.width + dia.minX;
    }
    if (/^scroll/.test(dia.Effect.name)) {
      dia.y = /up/.test(dia.Effect.name) ? -dia.height : this.height;
      if (dia.Alignment % 3 === 1) dia.x = dia.minX;
      if (dia.Alignment % 3 === 2) dia.x = (this.width - dia.width) / 2 + dia.minX;
      if (dia.Alignment % 3 === 0) dia.x = this.width - dia.width + dia.minX;
    }
  } else {
    if (dia.pos) {
      if (dia.Alignment % 3 === 1) dia.x = this.scale * dia.pos.x + dia.minX;
      if (dia.Alignment % 3 === 2) dia.x = this.scale * dia.pos.x - dia.width / 2 + dia.minX;
      if (dia.Alignment % 3 === 0) dia.x = this.scale * dia.pos.x - dia.width + dia.minX;
      if (dia.Alignment <= 3) dia.y = this.scale * dia.pos.y - dia.height + dia.minY;
      if (dia.Alignment >= 4 && dia.Alignment <= 6) dia.y = this.scale * dia.pos.y - dia.height / 2 + dia.minY;
      if (dia.Alignment >= 7) dia.y = this.scale * dia.pos.y + dia.minY;
    } else {
      if (dia.Alignment % 3 === 1) dia.x = dia.minX;
      if (dia.Alignment % 3 === 2) dia.x = (this.width - dia.width) / 2 + dia.minX;
      if (dia.Alignment % 3 === 0) dia.x = this.width - dia.width - this.scale * dia.MarginR - dia.minX;
      if (dia.t) {
        if (dia.Alignment <= 3) dia.y = this.height - dia.height - dia.MarginV + dia.minY;
        if (dia.Alignment >= 4 && dia.Alignment <= 6) dia.y = (this.height - dia.height) / 2 + dia.minY;
        if (dia.Alignment >= 7) dia.y = dia.MarginV + dia.minY;
      } else dia.y = this._getChannel(dia) + dia.minY;
    }
  }
  setDialogueStyle.call(this, dia);
  setTransformOrigin(dia);

  return dia;
};
ASS.prototype._getChannel = function(dia) {
  var L = dia.Layer,
      SW = this.width - Math.floor(this.scale * (dia.MarginL + dia.MarginR)),
      SH = this.height,
      W = dia.width,
      H = dia.height,
      V = Math.floor(this.scale * dia.MarginV),
      count = 0;
  channel[L] = channel[L] || {
    left: new Uint16Array(SH + 1),
    middle: new Uint16Array(SH + 1),
    right: new Uint16Array(SH + 1),
  };
  var judge = function(x) {
    var l = channel[L].left[x],
        m = channel[L].middle[x],
        r = channel[L].right[x];
    if ((l + m + r > 0) &&
        ( (dia.Alignment % 3 === 1 && (l || (m && W + m / 2 > SW / 2) || (W + r > SW))) ||
          (dia.Alignment % 3 === 2 && ((2 * l + W > SW) || m || (2 * r + W > SW))) ||
          (dia.Alignment % 3 === 0 && ((l + W > SW) || (m && W + m / 2 > SW / 2) || r))
        )) {
      count = 0;
    } else ++count;
    if (count >= H) {
      dia.channel = x;
      return true;
    } else return false;
  };
  if (dia.Alignment <= 3) {
    for (var i = SH - V - 1; i > V; --i) {
      if (judge(i)) break;
    }
  } else if (dia.Alignment >= 7) {
    for (var i = V + 1; i < SH - V; ++i) {
      if (judge(i)) break;
    }
  } else {
    for (var i = (SH - H) >> 1; i < SH - V; ++i) {
      if (judge(i)) break;
    }
  }
  if (dia.Alignment > 3) dia.channel -= H - 1;
  for (var i = dia.channel; i < dia.channel + H; ++i) {
    if (dia.Alignment % 3 === 1) {
      channel[L].left[i] = W;
    } else if (dia.Alignment % 3 === 2) {
      channel[L].middle[i] = W;
    } else {
      channel[L].right[i] = W;
    }
  }
  return dia.channel;
};
ASS.prototype._freeChannel = function(dia) {
  for (var i = dia.channel + dia.height; i >= dia.channel; i--) {
    if (dia.Alignment % 3 === 1) channel[dia.Layer].left[i] = 0;
    else if (dia.Alignment % 3 === 2) channel[dia.Layer].middle[i] = 0;
    else channel[dia.Layer].right[i] = 0;
  }
};
function KeyFrames(name) {
  this.obj = {};
  this.set = function(percentage, property, value) {
    if (!this.obj[percentage]) this.obj[percentage] = {};
    this.obj[percentage][property] = value;
  };
  this.toString = function() {
    if (JSON.stringify(this.obj) === '{}') return '';
    var str = 'keyframes ' + name + '{';
    for (var percentage in this.obj) {
      str += percentage + '{';
      for (var property in this.obj[percentage]) {
        if (property === 'transform') {
          str += '-webkit-transform:' + this.obj[percentage][property] + ';';
        }
        str += property + ':' + this.obj[percentage][property] + ';';
      }
      str += '}';
    }
    str += '}\n';
    return '@' + str + '@-webkit-' + str;
  };
}
var RAF = window.requestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          function(cb) {return setTimeout(cb, 50 / 3);};
var CAF = window.cancelAnimationFrame ||
          window.mozCancelAnimationFrame ||
          window.webkitCancelAnimationFrame ||
          function(id) {clearTimeout(id);};
var RAFID = 0;
var baseTags = {};
var channel = [];
var realFontSizeCache = {};
var fontSizeElement = document.createElement('div');
fontSizeElement.className = 'ASS-font-size-element';
fontSizeElement.textContent = 'M';
var PERSPECTIVE_NUM = 314; // TODO: I don't know why it's 314, it just performances well.
var parseASS = function(data) {
  data = data.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var lines = data.split('\n'),
      state = 0,
      _index = 0,
      tree = {
        ScriptInfo: {'Title': '&lt;untitled&gt;', 'Original Script': '&lt;unknown&gt;'},
        V4Styles: {Format: {}, Style: {}},
        Events: {Format: {}, Dialogue: []},
      };
  for (var len = lines.length, i = 0; i < len; ++i) {
    lines[i] = lines[i].replace(/^\s+|\s+$/g, '');
    if (/^;/.test(lines[i])) continue;

    if (/^\[Script Info\]/i.test(lines[i])) state = 1;
    else if (/^\[V4\+ Styles\]/i.test(lines[i])) state = 2;
    else if (/^\[Events\]/i.test(lines[i])) state = 3;
    else if (/^\[.*\]/.test(lines[i])) state = 0;

    if (state === 0) continue;
    if (state === 1) {
      if (/:/.test(lines[i])) {
        var tmp = lines[i].match(/(.*?)\s*:\s*(.*)/);
        if (!isNaN(tmp[2] * 1)) tmp[2] *= 1;
        tree.ScriptInfo[tmp[1]] = tmp[2];
      }
    }
    if (state === 2) {
      if (/^Format:/.test(lines[i])) {
        var tmp = lines[i].match(/Format:(.*)/);
        tree.V4Styles.Format = tmp[1].replace(/\s/g, '').split(',');
      }
      if (/^Style:/.test(lines[i])) {
        var tmp1 = lines[i].match(/Style:(.*)/)[1].split(','),
            tmp2 = {};
        for (var j = tmp1.length - 1; j >= 0; --j) {
          var tmp3 = tree.V4Styles.Format[j];
          tmp2[tmp3] = tmp1[j].replace(/^\s*/, '');
          if (!isNaN(tmp2[tmp3] * 1)) tmp2[tmp3] *= 1;
        }
        tree.V4Styles.Style[tmp2.Name] = tmp2;
        baseTags[tmp2.Name] = createBaseTags(tmp2);
        baseTags[tmp2.Name].q = tree.ScriptInfo.WrapStyle || 1;
      }
    }
    if (state === 3) {
      if (/^Format:/.test(lines[i])) {
        var tmp = lines[i].match(/Format:(.*)/);
        tree.Events.Format = tmp[1].replace(/\s/g, '').split(',');
      }
      if (/^Dialogue:/.test(lines[i])) {
        var tmp1 = lines[i].match(/Dialogue:(.*)/)[1].split(','),
            tmp2 = {},
            efLen = tree.Events.Format.length;
        if (tmp1.length > efLen) {
          var tmp3 = tmp1.slice(efLen - 1).join();
          tmp1 = tmp1.slice(0, efLen - 1);
          tmp1.push(tmp3);
        }
        for (var j = efLen - 1; j >= 0; --j) {
          tmp2[tree.Events.Format[j]] = tmp1[j].replace(/^\s+/, '');
        }
        tmp2.Layer *= 1;
        tmp2.Start = parseTime(tmp2.Start, tree.ScriptInfo['Timer']);
        tmp2.End = parseTime(tmp2.End, tree.ScriptInfo['Timer']);
        tmp2.Style = tree.V4Styles.Style[tmp2.Style] ? tmp2.Style : 'Default';
        tmp2.MarginL *= 1;
        tmp2.MarginR *= 1;
        tmp2.MarginV *= 1;
        tmp2.Effect = parseEffect(tmp2.Effect, tree.ScriptInfo.PlayResY);
        tmp2._index = ++_index;
        tmp2.parsedText = parseTags(tmp2);
        if (tmp2.Start < tmp2.End) tree.Events.Dialogue.push(tmp2);
      }
    }
  }
  tree.Events.Dialogue.sort(function(a, b) {
    return (a.Start - b.Start) || (a.End - b.End) || (a._index - b._index);
  });
  return tree;
};
var parseTime = function(time, timer) {
  var t = time.match(/(.*):(.*):(.*)/),
      tr = timer ? (timer / 100) : 1;
  return (t[1] * 3600 + t[2] * 60 + t[3] * 1) / tr;
};
var parseEffect = function(str, resY) {
  if (!str) return null;
  var tmp = str.toLowerCase().split(';'),
      eff = {};
  if (tmp[0] === 'banner') {
    eff.name = tmp[0];
    eff.delay = tmp[1] * 1 || 1;
    eff.lefttoright = tmp[2] * 1 || 0;
    eff.fadeawaywidth = tmp[3] * 1 || 0;
  }
  if (/^scroll\s/.test(tmp[0])) {
    eff.name = tmp[0];
    eff.y1 = Math.min(tmp[1] * 1, tmp[2] * 1);
    eff.y2 = Math.max(tmp[1] * 1, tmp[2] * 1) || resY;
    eff.delay = tmp[3] * 1 || 1;
    eff.fadeawayheight = tmp[4] * 1 || 0;
  }
  return eff;
};
var parseTags = function(dialogue) {
  var text = dialogue.Text.replace(/\\N/g, '<br>').replace(/\\h/g, '&nbsp;'),
      kv = text.split(/{([^{}]*?)}/),
      prevTags = JSON.parse(JSON.stringify(baseTags[dialogue.Style])),
      dia = {content: []};
  if (kv[0].length) dia.content.push({tags: prevTags, text: kv[0]});
  for (var i = 1; i < kv.length; i += 2) {
    var ct = {text: kv[i + 1], tags: {}},
        cmd = kv[i].split('\\'); // split(/(?<!\(.*?)\\(?!.*?\))/)
    for (var j = 0; j < cmd.length; ++j) {
      if (/^t\(/.test(cmd[j])) {
        while (!/\)$/.test(cmd[j + 1])) {
          cmd[j] += '\\' + cmd[j + 1];
          cmd.splice(j + 1, 1);
        }
        cmd[j] += '\\' + cmd[j + 1];
        cmd.splice(j + 1, 1);
      }
    }
    for (var j in prevTags) {
      if (j !== 't') ct.tags[j] = prevTags[j];
      else ct.tags[j] = JSON.parse(JSON.stringify(prevTags[j]));
    }
    for (var j = 0; j < cmd.length; ++j) {
      var tmp;
      parseAnimatableTags.call(ct, cmd[j]);
      if (/^b\d/.test(cmd[j])) ct.tags.b = cmd[j].match(/^b(\d+)/)[1] * 1;
      if (/^i\d/.test(cmd[j])) ct.tags.i = cmd[j][1] * 1;
      if (/^u\d/.test(cmd[j])) ct.tags.u = cmd[j][1] * 1;
      if (/^s\d/.test(cmd[j])) ct.tags.s = cmd[j][1] * 1;
      if (/^fn/.test(cmd[j])) ct.tags.fn = cmd[j].match(/^fn(.*)/)[1];
      if (/^fe/.test(cmd[j])) ct.tags.fe = cmd[j].match(/^fe(.*)/)[1] * 1;
      if (/^k\d/.test(cmd[j])) ct.tags.k = cmd[j].match(/^k(\d+)/)[1] * 1;
      if (/^K|kf\d/.test(cmd[j])) ct.tags.kf = cmd[j].match(/^(K|kf)(\d+)/)[2] * 1;
      if (/^ko\d/.test(cmd[j])) ct.tags.ko = cmd[j].match(/^ko(\d+)/)[1] * 1;
      if (/^kt\d/.test(cmd[j])) ct.tags.kt = cmd[j].match(/^kt(\d+)/)[1] * 1;
      if (/^q\d/.test(cmd[j])) ct.tags.q = cmd[j][1] * 1;
      if (/^p\d/.test(cmd[j])) ct.tags.p = cmd[j].match(/^p(\d+)/)[1] * 1;
      if (/^pbo/.test(cmd[j])) ct.tags.pbo = cmd[j].match(/^pbo(.*)/)[1] * 1;
      if (/^an\d/.test(cmd[j]) && !dia.alignment) dia.alignment = cmd[j][2] * 1;
      if (/^a\d/.test(cmd[j]) && !dia.alignment) {
        tmp = cmd[j].match(/^a(\d+)/)[1] * 1;
        if (tmp < 4) dia.alignment = tmp;
        else if (tmp > 8) dia.alignment = tmp - 5;
        else dia.alignment = tmp + 2;
      }
      if (/^pos/.test(cmd[j]) && !dia.pos) {
        tmp = cmd[j].match(/^pos\s*\(\s*(.*?)\s*,\s*(.*?)\s*\)*$/);
        dia.pos = {x: tmp[1] * 1, y: tmp[2] * 1};
      }
      if (/^org/.test(cmd[j]) && !dia.org) {
        tmp = cmd[j].match(/^org\s*\(\s*(.*?)\s*,\s*(.*?)\s*\)*$/);
        dia.org = {x: tmp[1] * 1, y: tmp[2] * 1};
      }
      if (/^move/.test(cmd[j]) && !dia.move) {
        tmp = cmd[j].match(/^move\s*\((.*)\)/)[1].split(/\s*,\s*/);
        for (var k = tmp.length - 1; k >= 0; k--) tmp[k] *= 1;
        if (tmp.length === 4) {
          tmp.push(0);
          tmp.push((dialogue.End - dialogue.Start) * 1000);
        }
        dia.move = tmp;
      }
      if (/^fad\s*\(/.test(cmd[j]) && !dia.fad) {
        tmp = cmd[j].match(/^fad\s*\((.*)\)/)[1].split(/\s*,\s*/);
        for (var k = tmp.length - 1; k >= 0; k--) tmp[k] *= 1;
        dia.fad = tmp;
      }
      if (/^fade/.test(cmd[j]) && !dia.fade) {
        tmp = cmd[j].match(/^fade\s*\((.*)\)/)[1].split(/\s*,\s*/);
        for (var k = tmp.length - 1; k >= 0; k--) tmp[k] *= 1;
        dia.fade = tmp;
      }
      if (/^r/.test(cmd[j])) {
        tmp = cmd[j].match(/^r(.*)/)[1];
        ct.tags = JSON.parse(JSON.stringify(baseTags[tmp] || baseTags[dialogue.Style]));
      }
      if (/^t\(/.test(cmd[j])) {
        if (!ct.tags.t) ct.tags.t = [];
        tmp = cmd[j].replace(/\s/g, '').match(/^t\((.*)\)/)[1].split(',');
        if (!tmp[0]) continue;
        var tcmd = tmp[tmp.length - 1].split('\\'),
            tct = {t1: 0, t2: (dialogue.End - dialogue.Start) * 1000, accel: 1, tags: {}};
        for (var k = tcmd.length - 1; k >= 0; k--) parseAnimatableTags.call(tct, tcmd[k]);
        if (tmp.length === 2) {
          tct.accel = tmp[0] * 1;
        }
        if (tmp.length === 3) {
          tct.t1 = tmp[0] * 1;
          tct.t2 = tmp[1] * 1;
        }
        if (tmp.length === 4) {
          tct.t1 = tmp[0] * 1;
          tct.t2 = tmp[1] * 1;
          tct.accel = tmp[2] * 1;
        }
        ct.tags.t.push(tct);
      }
    }
    if (ct.tags.t) {
      for (var j = 0; j < ct.tags.t.length - 1; ++j) {
        for (var k = j + 1; k < ct.tags.t.length; ++k) {
          if (ct.tags.t[j].t1 === ct.tags.t[k].t1 && ct.tags.t[j].t2 === ct.tags.t[k].t2) {
            for (var l in ct.tags.t[k].tags) ct.tags.t[j].tags[l] = ct.tags.t[k].tags[l];
            ct.tags.t.splice(k, 1);
          }
        }
      }
    }
    if (dialogue.Effect && dialogue.Effect.name === 'banner') ct.tags.q = 2;
    if (!ct.tags.p) ct.text = ct.text.replace(/\s/g, '&nbsp;');
    ct.text = ct.text.replace(/\\n/g, (ct.tags.q === 2) ? '<br>' : '&nbsp;');
    prevTags = ct.tags;
    dia.content.push(ct);
  }
  return dia;
};
var parseAnimatableTags = function(cmd) {
  var tmp;
  if (/^fs[\d\+\-]/.test(cmd)) {
    tmp = cmd.match(/^fs(.*)/)[1];
    if (/^\d/.test(tmp)) this.tags.fs = tmp * 1;
    if (/^\+|-/.test(tmp)) this.tags.fs *= (tmp * 1 > -10 ? (10 + tmp * 1) / 10 : 1);
  }
  if (/^fsp/.test(cmd)) this.tags.fsp = cmd.match(/^fsp(.*)/)[1] * 1;
  if (/^fscx/.test(cmd)) this.tags.fscx = cmd.match(/^fscx(.*)/)[1] * 1;
  if (/^fscy/.test(cmd)) this.tags.fscy = cmd.match(/^fscy(.*)/)[1] * 1;
  if (/^fsp/.test(cmd)) this.tags.fsp = cmd.match(/^fsp(.*)/)[1] * 1;
  if (/^frx/.test(cmd)) this.tags.frx = cmd.match(/^frx(.*)/)[1] * 1;
  if (/^fry/.test(cmd)) this.tags.fry = cmd.match(/^fry(.*)/)[1] * 1;
  if (/^fr[z\d\-]/.test(cmd)) this.tags.frz = cmd.match(/^frz?(.*)/)[1] * 1;
  if (/^blur\d|^be\d/.test(cmd)) this.tags.blur = cmd.match(/^(blur|be)(.*)/)[2] * 1;
  if (/^fax/.test(cmd)) this.tags.fax = cmd.match(/^fax(.*)/)[1] * 1;
  if (/^fay/.test(cmd)) this.tags.fay = cmd.match(/^fay(.*)/)[1] * 1;
  if (/^bord/.test(cmd)) this.tags.xbord = this.tags.ybord = cmd.match(/^bord(.*)/)[1] * 1;
  if (/^xbord/.test(cmd)) this.tags.xbord = cmd.match(/^xbord(.*)/)[1] * 1;
  if (/^ybord/.test(cmd)) this.tags.ybord = cmd.match(/^ybord(.*)/)[1] * 1;
  if (/^shad/.test(cmd)) this.tags.xshad = this.tags.yshad = cmd.match(/^shad(.*)/)[1] * 1;
  if (/^xshad/.test(cmd)) this.tags.xshad = cmd.match(/^xshad(.*)/)[1] * 1;
  if (/^yshad/.test(cmd)) this.tags.yshad = cmd.match(/^yshad(.*)/)[1] * 1;
  if (/^\d?c&H/.test(cmd)) {
    tmp = cmd.match(/^(\d?)c&H(\w+)/);
    if (!tmp[1]) tmp[1] = '1';
    while (tmp[2].length < 6) tmp[2] = '0' + tmp[2];
    this.tags['c' + tmp[1]] = tmp[2];
  }
  if (/^\d?a&H/.test(cmd)) {
    tmp = cmd.match(/^(\d?)a&H(\w\w)/);
    if (!tmp[1]) tmp[1] = '1';
    this.tags['a' + tmp[1]] = tmp[2];
  }
  if (/^alpha&H/.test(cmd)) {
    for (var i = 1; i <= 4; i++) this.tags['a' + i] = cmd.match(/^alpha&H(\w\w)/)[1];
  }
  if (/^i?clip/.test(cmd)) { // TODO
    var tn = cmd.match(/^(i?clip)/)[1];
    tmp = cmd.match(/^i?clip\s*\((.*)\)/)[1].split(/\s*,\s*/);
    if (tmp.length === 1) this.tags[tn] = {scale: 1, command: tmp[0]};
    if (tmp.length === 2) this.tags[tn] = {scale: tmp[0] * 1, command: tmp[1]};
    if (tmp.length === 4) {
      for (var i = tmp.length - 1; i >= 0; i--) tmp[i] *= 1;
      this.tags[tn] = tmp;
    }
  }
};
var parseDrawingCommands = function(t, text) {
  text = text.replace(/([mnlbspc])/gi, ' $1 ')
             .replace(/^\s*|\s*$/g, '')
             .replace(/\s+/g, ' ')
             .toLowerCase();
  var rawCommands = text.split(/\s(?=[mnlbspc])/),
      commands = [],
      prevCommand,
      nextCommand;
  var s2b = function(points) {
    // D3.js, d3_svg_lineBasisOpen()
    var bb1 = [0, 2/3, 1/3, 0],
        bb2 = [0, 1/3, 2/3, 0],
        bb3 = [0, 1/6, 2/3, 1/6];
    var dot4 = function(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    };
    var px = [points[points.length - 1].x, points[0].x, points[1].x, points[2].x],
        py = [points[points.length - 1].y, points[0].y, points[1].y, points[2].y];
    var path = ['L', new Point(dot4(bb3, px), dot4(bb3, py))];
    if (prevCommand.type === 'M') path[0] = 'M';
    for (var i = 3; i < points.length; i++) {
      px = [points[i - 3].x, points[i - 2].x, points[i - 1].x, points[i].x];
      py = [points[i - 3].y, points[i - 2].y, points[i - 1].y, points[i].y];
      path.push('C' + new Point(dot4(bb1, px), dot4(bb1, py)),
                ',' + new Point(dot4(bb2, px), dot4(bb2, py)),
                ',' + new Point(dot4(bb3, px), dot4(bb3, py)));
    }
    if (nextCommand.type === 'L' || nextCommand.type === 'C') {
      path.push('L', points[points.length - 1]);
    }
    return path.join('');
  };
  function Point(x, y) {
    this.x = x * 1;
    this.y = y * 1;
    this.toString = function() {
      return this.x + ',' + this.y;
    };
  }
  function DrawingCommand(type) {
    this.points = [];
    this.type = null;
    if (/m/.test(type)) this.type = 'M';
    if (/n|l/.test(type)) this.type = 'L';
    if (/b/.test(type)) this.type = 'C';
    if (/s/.test(type)) this.type = '_S';
    this.isValid = function() {
      if (!this.points.length || !this.type) return false;
      if (/C|S/.test(this.type) && this.points.length < 3) return false;
      return true;
    };
    this.offset = function(x, y) {
      for (var i = this.points.length - 1; i >= 0; i--) {
        this.points[i].x += x;
        this.points[i].y += y;
      }
    };
    this.toString = function() {
      if (this.type === '_S') return s2b(this.points);
      return this.type + this.points.join();
    };
  }
  var minX = 2147483647,
      minY = 2147483647,
      maxX = -2147483648,
      maxY = -2147483648;
  var i = 0;
  while (i < rawCommands.length) {
    var p = rawCommands[i].split(' '),
        command = new DrawingCommand(p[0]);
    for (var lenj = p.length - !(p.length & 1), j = 1; j < lenj; j += 2) {
      command.points.push(new Point(p[j], p[j + 1]));
      minX = Math.min(minX, p[j]);
      minY = Math.min(minY, p[j + 1]);
      maxX = Math.max(maxX, p[j]);
      maxY = Math.max(maxY, p[j + 1]);
    }
    if (/p|c/.test(p[0])) {
      if (commands[i - 1].type === '_S') {
        if (p[0] === 'p') {
          commands[i - 1].points = commands[i - 1].points.concat(command.points);
        }
        if (p[0] === 'c') {
          var tmp = commands[i - 1].points;
          commands[i - 1].points.push(new Point(tmp[0].x, tmp[0].y),
                                      new Point(tmp[1].x, tmp[1].y),
                                      new Point(tmp[2].x, tmp[2].y));
        }
      }
      rawCommands.splice(i, 1);
    } else {
      if (p[0] === 's') {
        var prev = commands[i - 1].points[commands[i - 1].points.length - 1];
        command.points.unshift(new Point(prev.x, prev.y));
      }
      if (command.isValid()) commands.push(command);
      i++;
    }
  }
  var arr = [];
  for (var len = commands.length, i = 0; i < len; i++) {
    prevCommand = commands[Math.max(i - 1, 0)];
    nextCommand = commands[Math.min(i + 1, len - 1)];
    commands[i].offset(-minX, -minY);
    arr.push(commands[i].toString());
  }
  return {
    d: arr.join('') + 'Z',
    pbo: t.pbo ? Math.max(t.pbo - maxY + minY, 0) : 0,
    w: maxX - minX,
    h: maxY - minY,
    minX: minX,
    minY: minY,
  };
};
var createAnimation = function() {
  var kfStr = '';
  for (var i = this.tree.Events.Dialogue.length - 1; i >= 0; i--) {
    var dia = this.tree.Events.Dialogue[i],
        pt = dia.parsedText,
        dur = (dia.End - dia.Start) * 1000,
        kf = new KeyFrames('ASS-animation-' + dia._index),
        t = [];
    if (dia.Effect && !pt.move) {
      var eff = dia.Effect;
      if (eff.name === 'banner') {
        kf.set('0.000%', 'transform', 'translateX(0)');
        kf.set('100.000%', 'transform', 'translateX(' + this.scale * (dur / eff.delay) * (eff.lefttoright ? 1 : -1) + 'px)');
      }
      if (/^scroll/.test(eff.name)) {
        var updown = /up/.test(eff.name) ? 1 : -1,
            tmp1 = 'translateY(' + this.scale * eff.y1 * updown + 'px)',
            tmp2 = 'translateY(' + this.scale * eff.y2 * updown + 'px)';
        t[1] = Math.min(100, (eff.y2 - eff.y1) / (dur / eff.delay) * 100).toFixed(3) + '%';
        kf.set('0.000%', 'transform', tmp1);
        kf.set(t[1], 'transform', tmp2);
        kf.set('100.000%', 'transform', tmp2);
      }
    }
    if (!pt.fad && pt.fade && pt.fade.length === 2) pt.fad = pt.fade;
    if (pt.fad && pt.fad.length === 2) {
      t[0] = '0.000%';
      t[1] = Math.min(100, pt.fad[0] / dur * 100).toFixed(3) + '%';
      t[2] = Math.max(0, (dur - pt.fad[1]) / dur * 100).toFixed(3) + '%';
      t[3] = '100.000%';
      kf.set(t[0], 'opacity', 0);
      kf.set(t[1], 'opacity', 1);
      kf.set(t[2], 'opacity', 1);
      kf.set(t[3], 'opacity', 0);
    }
    if (pt.fade && pt.fade.length === 7) {
      t[0] = '0.000%';
      t[5] = '100.000%';
      for (var j = 1; j <= 4; j++) t[j] = Math.min(100, pt.fade[j + 2] / dur * 100).toFixed(3) + '%';
      for (var j = 0; j <= 5; j++) kf.set(t[j], 'opacity', 1 - pt.fade[j >> 1] / 255);
    }
    if (pt.move && pt.move.length === 6) {
      if (!pt.pos) pt.pos = {x: 0, y: 0};
      if (pt.move.length === 6) {
        t[0] = '0.000%';
        t[1] = Math.min(100, pt.move[4] / dur * 100).toFixed(3) + '%';
        t[2] = Math.min(100, pt.move[5] / dur * 100).toFixed(3) + '%';
        t[3] = '100.000%';
        for (var j = 0; j <= 3; j++) kf.set(t[j], 'transform', 'translate(' + this.scale * (pt.move[j < 2 ? 0 : 2] - pt.pos.x) + 'px, ' + this.scale * (pt.move[j < 2 ? 1 : 3] - pt.pos.y) + 'px)');
      }
    }
    kfStr += kf.toString();

    for (var j = pt.content.length - 1; j >= 0; j--) {
      kf = new KeyFrames('ASS-animation-' + dia._index + '-' + j);
      var tags = pt.content[j].tags;
      if (tags.t) {
        for (var k = tags.t.length - 1; k >= 0; k--) {
          var ttags = tags.t[k].tags;
          t[0] = '0.000%';
          t[1] = Math.min(100, tags.t[k].t1 / dur * 100).toFixed(3) + '%';
          t[2] = Math.min(100, tags.t[k].t2 / dur * 100).toFixed(3) + '%';
          t[3] = '100.000%';
          if (ttags.fs) {
            var tmp1 = this.scale * getRealFontSize(tags.fs, tags.fn) + 'px',
                tmp2 = this.scale * getRealFontSize(ttags.fs, tags.fn) + 'px';
            kf.set(t[0], 'font-size', tmp1);
            kf.set(t[1], 'font-size', tmp1);
            kf.set(t[2], 'font-size', tmp2);
            kf.set(t[3], 'font-size', tmp2);
          }
          if (ttags.fsp) {
            var tmp1 = this.scale * tags.fsp + 'px',
                tmp2 = this.scale * ttags.fsp + 'px';
            kf.set(t[0], 'letter-spacing', tmp1);
            kf.set(t[1], 'letter-spacing', tmp1);
            kf.set(t[2], 'letter-spacing', tmp2);
            kf.set(t[3], 'letter-spacing', tmp2);
          }
          if (ttags.c1 || ttags.a1) {
            ttags.c1 = ttags.c1 || tags.c1;
            ttags.a1 = ttags.a1 || tags.a1;
            var tmp1 = toRGBA(tags.a1 + tags.c1),
                tmp2 = toRGBA(ttags.a1 + ttags.c1);
            kf.set(t[0], 'color', tmp1);
            kf.set(t[1], 'color', tmp1);
            kf.set(t[2], 'color', tmp2);
            kf.set(t[3], 'color', tmp2);
          }
          if (ttags.a1 && ttags.a2 && ttags.a3 && ttags.a4 &&
              ttags.a1 === ttags.a2 && ttags.a2 === ttags.a3 && ttags.a3 === ttags.a4) {
            var tmp1 = 1 - parseInt(tags.a1, 16) / 255,
                tmp2 = 1 - parseInt(ttags.a1, 16) / 255;
            kf.set(t[0], 'opacity', tmp1);
            kf.set(t[1], 'opacity', tmp1);
            kf.set(t[2], 'opacity', tmp2);
            kf.set(t[3], 'opacity', tmp2);
          }
          if (ttags.c3 || ttags.a3 || ttags.c3 || ttags.a4 || ttags.blur ||
              ttags.xbord || ttags.ybord || ttags.xshad || ttags.yshad) {
            ['c3', 'a3', 'c4', 'a4'].forEach(function(e) {
              if (!ttags[e]) ttags[e] = tags[e];
            });
            var sbas = /Yes/i.test(this.tree.ScriptInfo['ScaledBorderAndShadow']) ? this.scale : 1,
                tmp1 = createShadow(tags, sbas),
                tmp2 = createShadow(ttags, sbas);
            kf.set(t[0], 'text-shadow', tmp1);
            kf.set(t[1], 'text-shadow', tmp1);
            kf.set(t[2], 'text-shadow', tmp2);
            kf.set(t[3], 'text-shadow', tmp2);
          }
          if ((ttags.fscx && ttags.fscx !== 100) || (ttags.fscy && ttags.fscy !== 100) ||
              ttags.frx || ttags.fry || ttags.frz || ttags.fax || ttags.fay) {
            ['fscx', 'fscy', 'frx', 'fry', 'frz', 'fax', 'fay'].forEach(function(e) {
              if (!ttags[e]) ttags[e] = tags[e];
            });
            var tmp1 = createTransform(tags),
                tmp2 = createTransform(ttags);
            kf.set(t[0], 'transform', tmp1);
            kf.set(t[1], 'transform', tmp1);
            kf.set(t[2], 'transform', tmp2);
            kf.set(t[3], 'transform', tmp2);
          }
        }
      }
      kfStr += kf.toString();
    }
  }
  document.getElementById('ASS-animation').innerHTML = kfStr;
};
var createSVG = function(ct, dia, scale) {
  var t = ct.tags,
      sx = t.fscx ? t.fscx / 100 : 1,
      sy = t.fscy ? t.fscy / 100 : 1,
      c = toRGBA(t.a1 + t.c1),
      s = scale / (1 << (t.p - 1)),
      tmp = parseDrawingCommands(t, ct.text),
      svg = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' + tmp.w * s * sx + '" height="' + tmp.h * s * sy + '">\n<g transform="scale(' + s * sx + ' ' + s * sy + ')">\n<path d="' + tmp.d + '" fill="' + c + '">\n</path>\n</g>\n</svg>';
  dia.minX = sx * s * tmp.minX;
  dia.minY = sy * s * (tmp.minY + tmp.pbo);
  return svg;
};
var createShadow = function(t, scale) {
  var ts = '',
      oc = toRGBA(t.a3 + t.c3),
      ox = (t.xbord || 0) * scale,
      oy = (t.ybord || 0) * scale,
      sc = toRGBA(t.a4 + t.c4),
      sx = (t.xshad || 0) * scale,
      sy = (t.yshad || 0) * scale,
      blur = t.blur || 0;
  if (!(ox + oy + sx + sy)) return 'none';
  if (ox || oy) {
    for (var i = -1; i <= 1; ++i)
      for (var j = -1; j <= 1; ++j) {
        for (var x = 1; x < ox; ++x)
          for (var y = 1; y < oy; ++y)
            if (i || j)
              ts += oc + ' ' + i * x + 'px ' + j * y + 'px,';
        ts += oc + ' ' + i * ox + 'px ' + j * oy + 'px,';
      }
  }
  if (sx || sy) {
    for (var x = Math.max(sx - ox, ox); x <= sx + ox; x++)
      for (var y = Math.max(sy - oy, ox); y <= sy + oy; y++)
        ts += sc + ' ' + x + 'px ' + y + 'px ' + blur + 'px,';
    ts += sc + ' ' + (sx + ox) + 'px ' + (sy + oy) + 'px ' + blur + 'px';
  } else ts = ts.substr(0, ts.length - 1);
  return ts;
};
var createBaseTags = function(s) {
  return {
    fn: s.Fontname,
    fs: s.Fontsize,
    c1: s.PrimaryColour.match(/&H\w\w(\w{6})/)[1],
    a1: s.PrimaryColour.match(/&H(\w\w)\w{6}/)[1],
    c2: s.SecondaryColour.match(/&H\w\w(\w{6})/)[1],
    a2: s.SecondaryColour.match(/&H(\w\w)\w{6}/)[1],
    c3: s.OutlineColour.match(/&H\w\w(\w{6})/)[1],
    a3: s.OutlineColour.match(/&H(\w\w)\w{6}/)[1],
    c4: s.BackColour.match(/&H\w\w(\w{6})/)[1],
    a4: s.BackColour.match(/&H(\w\w)\w{6}/)[1],
    b: Math.abs(s.Bold),
    i: Math.abs(s.Italic),
    u: Math.abs(s.Underline),
    s: Math.abs(s.StrikeOut),
    fscx: s.ScaleX,
    fscy: s.ScaleY,
    fsp: s.Spacing,
    frz: s.Angle,
    xbord: s.Outline,
    ybord: s.Outline,
    xshad: s.Shadow,
    yshad: s.Shadow,
  };
};
var createTransform = function(t) {
  t.fscx = t.fscx || 100;
  t.fscy = t.fscy || 100;
  t.fax = t.fax || 0;
  t.fay = t.fay || 0;
  t.frx = t.frx || 0;
  t.fry = t.fry || 0;
  t.frz = t.frz || 0;
  var str = 'perspective(' + PERSPECTIVE_NUM + 'px)';
  str += ' rotateY(' + t.fry + 'deg)';
  str += ' rotateX(' + t.frx + 'deg)';
  str += ' rotateZ(' + (-t.frz) + 'deg)';
  str += ' scale(' + (t.p ? 1 : t.fscx / 100) + ', ' + (t.p ? 1 : t.fscy / 100) + ')';
  str += ' skew(' + t.fax + 'rad, ' + t.fay + 'rad)';
  return str;
};
var toRGBA = function(c) {
  var t = c.match(/(\w\w)(\w\w)(\w\w)(\w\w)/),
      a = (1 - ('0x' + t[1]) / 255).toFixed(1),
      b = +('0x' + t[2]),
      g = +('0x' + t[3]),
      r = +('0x' + t[4]);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
};
var getRealFontSize = function(fs, fn) {
  var key = fn + '-' + fs;
  if (!realFontSizeCache[key]) {
    fontSizeElement.style.cssText = 'font-size:' + fs + 'px;font-family:\'' + fn + '\',Arial;';
    realFontSizeCache[key] = fs * fs / fontSizeElement.clientHeight;
  }
  return realFontSizeCache[key];
};
var setTagsStyle = function(dia) {
  var df = document.createDocumentFragment();
  for (var len = dia.parsedText.content.length, i = 0; i < len; ++i) {
    var ct = dia.parsedText.content[i];
    if (!ct.text) continue;
    var t = ct.tags,
        cssText = 'display:inline-block;',
        vct = this.video.currentTime;
    if (!t.p) {
      cssText += 'font-family:\'' + t.fn + '\',Arial;';
      cssText += 'font-size:' + this.scale * getRealFontSize(t.fs, t.fn) + 'px;';
      cssText += 'color:' + toRGBA(t.a1 + t.c1) + ';';
      if (dia.BorderStyle === 1) cssText += 'text-shadow:' + createShadow(t, (/Yes/i.test(this.tree.ScriptInfo['ScaledBorderAndShadow']) ? this.scale : 1)) + ';';
      if (dia.BorderStyle === 3) {
        cssText += 'background-color:' + toRGBA(t.a3 + t.c3) + ';';
        cssText += 'box-shadow:' + createShadow(t, (/Yes/i.test(this.tree.ScriptInfo['ScaledBorderAndShadow']) ? this.scale : 1)) + ';';
      }
      if (t.b === 0) cssText += 'font-weight:normal;';
      else if (t.b === 1) cssText += 'font-weight:bold;';
      else cssText += 'font-weight:' + t.b + ';'; ;
      cssText += 'font-style:' + (t.i ? 'italic;' : 'normal;');
      if (t.u && t.s) cssText += 'text-decoration:underline line-through;';
      else if (t.u) cssText += 'text-decoration:underline;';
      else if (t.s) cssText += 'text-decoration:line-through;';
      cssText += 'letter-spacing:' + this.scale * t.fsp + 'px;';
      if (t.q === 0) {} // TODO
      if (t.q === 1) cssText += 'word-break:break-all;white-space:normal;';
      if (t.q === 2) cssText += 'word-break:normal;white-space:nowrap;';
      if (t.q === 3) {} // TODO
    }
    if (t.fax || t.fay || t.frx || t.fry || t.frz || t.fscx !== 100 || t.fscy !== 100) {
      var tmp = createTransform(t);
      ['', '-webkit-'].forEach(function(v) {
        cssText += v + 'transform:' + tmp + ';';
      });
      if (!t.p) cssText += 'transform-style:preserve-3d;word-break:normal;white-space:nowrap;';
    }
    if (t.t) {
      ['', '-webkit-'].forEach(function(v) {
        cssText += v + 'animation-name:ASS-animation-' + dia._index + '-' + i + ';';
        cssText += v + 'animation-duration:' + (dia.End - dia.Start) + 's;';
        cssText += v + 'animation-delay:' + Math.min(0, dia.Start - vct) + 's;';
        cssText += v + 'animation-timing-function:linear;';
        cssText += v + 'animation-iteration-count:1;';
      });
      dia.t = true;
    }

    dia.hasRotate = /"fr[xyz]":[^0]/.test(JSON.stringify(t));
    var parts = ct.text.split('<br>');
    for (var lenj = parts.length, j = 0; j < lenj; j++) {
      if (j) df.appendChild(document.createElement('br'));
      if (!parts[j]) continue;
      var cn = document.createElement('span');
      cn.dataset.hasRotate = dia.hasRotate;
      cn.innerHTML = t.p ? createSVG(ct, dia, this.scale) : parts[j];
      cn.style.cssText = cssText;
      df.appendChild(cn);
    }
  }
  dia.node.appendChild(df);
};
var setDialogueStyle = function(dia) {
  var cssText = '',
      vct = this.video.currentTime;
  if (dia.Layer) cssText += 'z-index:' + dia.Layer;
  if (dia.move || dia.fad || dia.fade || dia.Effect) {
    ['', '-webkit-'].forEach(function(v) {
      cssText += v + 'animation-name:ASS-animation-' + dia._index + ';';
      cssText += v + 'animation-duration:' + (dia.End - dia.Start) + 's;';
      cssText += v + 'animation-delay:' + Math.min(0, dia.Start - vct) + 's;';
      cssText += v + 'animation-timing-function:linear;';
      cssText += v + 'animation-iteration-count:1;';
    });
  }
  if (dia.Alignment % 3 === 1) cssText += 'text-align:left;';
  if (dia.Alignment % 3 === 2) cssText += 'text-align:center;';
  if (dia.Alignment % 3 === 0) cssText += 'text-align:right;';
  if (!dia.Effect) {
    cssText += 'max-width:' + (this.width - this.scale * (dia.MarginL + dia.MarginR)) + 'px;';
    if (!dia.pos) {
      if (dia.Alignment % 3 === 1) cssText += 'margin-left:' + this.scale * dia.MarginL + 'px;';
      if (dia.Alignment % 3 === 0) cssText += 'margin-right:' + this.scale * dia.MarginR + 'px;';
      if (dia.width > this.width - this.scale * (dia.MarginL + dia.MarginR)) {
        cssText += 'margin-left:' + this.scale * dia.MarginL + 'px;';
        cssText += 'margin-right:' + this.scale * dia.MarginR + 'px;';
      }
    }
  }
  cssText += 'left:' + dia.x + 'px;top:' + dia.y + 'px;';
  dia.node.style.cssText = cssText;
};
var setTransformOrigin = function(dia) {
  if (!dia.hasRotate) return;
  if (!dia.org) {
    dia.org = {x: 0, y: 0};
    if (dia.Alignment % 3 === 1) dia.org.x = dia.x;
    if (dia.Alignment % 3 === 2) dia.org.x = dia.x + dia.width / 2;
    if (dia.Alignment % 3 === 0) dia.org.x = dia.x + dia.width;
    if (dia.Alignment <= 3) dia.org.y = dia.y + dia.height;
    if (dia.Alignment >= 4 && dia.Alignment <= 6) dia.org.y = dia.y + dia.height / 2;
    if (dia.Alignment >= 7) dia.org.y = dia.y;
  }
  var children = dia.node.childNodes;
  for (var i = children.length - 1; i >= 0; i--) {
    if (children[i].dataset.hasRotate) {
      // It's not extremely precise for offsets are round the value to an integer.
      var top = children[i].offsetTop,
          left = children[i].offsetLeft;
      var to = 'transform-origin:' + (dia.org.x - dia.x - left) + 'px ' + (dia.org.y - dia.y - top) + 'px;';
      children[i].style.cssText += '-webkit-' + to + to;
    }
  }
};

window.ASS = ASS;
})(window);
