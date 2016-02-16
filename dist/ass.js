;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.ASS = factory();
  }
}(this, function() {
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

var RAF = window.requestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          function(cb) {return setTimeout(cb, 50 / 3);};
var CAF = window.cancelAnimationFrame ||
          window.mozCancelAnimationFrame ||
          window.webkitCancelAnimationFrame ||
          function(id) {clearTimeout(id);};
var RAFID = 0;
var channel = [];
var xmlns = 'http://www.w3.org/2000/svg';
var ASS_CSS = '.ASS-container{position:relative;overflow:hidden}.ASS-fix-font-size{position:absolute;visibility:hidden}.ASS-container video{position:absolute;top:0;left:0}.ASS-stage{overflow:hidden;z-index:2147483647;pointer-events:none;position:absolute}.ASS-dialogue{font-size:0;position:absolute}.ASS-fix-objectBoundingBox{width:100%;height:100%;position:absolute;top:0;left:0}.ASS-animation-paused *{-webkit-animation-play-state:paused!important;animation-play-state:paused!important}';

var generateUUID = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = (c === 'x' ? r : (r & 0x3 | 0x8));
    return v.toString(16);
  });
};

var parseASS = function(data) {
  data = data.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var tree = {
    ScriptInfo: {
      'Title': '&lt;untitled&gt;',
      'Original Script': '&lt;unknown&gt;'
    },
    V4Styles: {Format: {}, Style: {}},
    Events: {Format: {}, Dialogue: []}
  };
  var lines = data.split(/\r?\n/),
      state = 0;
  for (var len = lines.length, i = 0; i < len; ++i) {
    var line = lines[i].replace(/^\s+|\s+$/g, '');
    if (/^;/.test(line)) continue;

    if (/^\[Script Info\]/i.test(line)) state = 1;
    else if (/^\[V4\+ Styles\]/i.test(line)) state = 2;
    else if (/^\[Events\]/i.test(line)) state = 3;
    else if (/^\[.*\]/.test(line)) state = 0;

    if (state === 0) continue;
    if (state === 1) {
      if (/:/.test(line)) {
        var kv = line.match(/(.*?)\s*:\s*(.*)/);
        if (!isNaN(kv[2] * 1)) kv[2] *= 1;
        tree.ScriptInfo[kv[1]] = kv[2];
      }
    }
    if (state === 2) {
      if (/^Format:/.test(line)) {
        tree.V4Styles.Format = parseFormat(line);
      }
      if (/^Style:/.test(line)) {
        var s = parseStyle(line, tree);
        tree.V4Styles.Style[s.Name] = s;
      }
    }
    if (state === 3) {
      if (/^Format:/.test(line)) {
        tree.Events.Format = parseFormat(line);
      }
      if (/^Dialogue:/.test(line)) {
        var dia = parseDialogue(line, tree);
        if (dia.Start < dia.End) {
          dia._index = tree.Events.Dialogue.length;
          tree.Events.Dialogue.push(dia);
        }
      }
    }
  }
  tree.Events.Dialogue.sort(function(a, b) {
    return (a.Start - b.Start) || (a.End - b.End) || (a._index - b._index);
  });

  return tree;
};

var parseDialogue = function(data, tree) {
  var fields = data.match(/Dialogue:(.*)/)[1].split(',');
  var len = tree.Events.Format.length;
  if (fields.length > len) {
    var textField = fields.slice(len - 1).join();
    fields = fields.slice(0, len - 1);
    fields.push(textField);
  }

  var timer = (tree.ScriptInfo['Timer'] / 100) || 1;
  var dia = {};
  for (var i = 0; i < len; ++i) {
    dia[tree.Events.Format[i]] = fields[i].replace(/^\s+/, '');
  }
  dia.Layer *= 1;
  dia.Start = parseTime(dia.Start) / timer;
  dia.End = parseTime(dia.End) / timer;
  dia.Style = tree.V4Styles.Style[dia.Style] ? dia.Style : 'Default';
  dia.MarginL *= 1;
  dia.MarginR *= 1;
  dia.MarginV *= 1;
  dia.Effect = parseEffect(dia.Effect);
  dia._parsedText = parseTags(dia, tree.V4Styles.Style);

  return dia;
};

var parseDrawing = function(text) {
  text = text.replace(/([mnlbspc])/gi, ' $1 ')
             .replace(/^\s*|\s*$/g, '')
             .replace(/\s+/g, ' ')
             .toLowerCase();
  var rawCommands = text.split(/\s(?=[mnlbspc])/),
      commands = [];
  var s2b = function(ps, prevType, nextType) {
    // D3.js, d3_svg_lineBasisOpen()
    var bb1 = [0, 2/3, 1/3, 0],
        bb2 = [0, 1/3, 2/3, 0],
        bb3 = [0, 1/6, 2/3, 1/6];
    var dot4 = function(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    };
    var px = [ps[ps.length - 1].x, ps[0].x, ps[1].x, ps[2].x],
        py = [ps[ps.length - 1].y, ps[0].y, ps[1].y, ps[2].y];
    var path = ['L', new Point(dot4(bb3, px), dot4(bb3, py))];
    if (prevType === 'M') path[0] = 'M';
    for (var i = 3; i < ps.length; i++) {
      px = [ps[i - 3].x, ps[i - 2].x, ps[i - 1].x, ps[i].x];
      py = [ps[i - 3].y, ps[i - 2].y, ps[i - 1].y, ps[i].y];
      path.push('C' + new Point(dot4(bb1, px), dot4(bb1, py)),
                ',' + new Point(dot4(bb2, px), dot4(bb2, py)),
                ',' + new Point(dot4(bb3, px), dot4(bb3, py)));
    }
    if (nextType === 'L' || nextType === 'C') {
      path.push('L', ps[ps.length - 1]);
    }
    return path.join('');
  };
  function Point(x, y) {
    this.x = x;
    this.y = y;
    this.toString = function() {
      return this.x + ',' + this.y;
    };
  }
  function DrawingCommand(type) {
    this.points = [];
    this.type = null;
    this.prevType = null;
    this.nextType = null;
    if (/m/.test(type)) this.type = 'M';
    if (/n|l/.test(type)) this.type = 'L';
    if (/b/.test(type)) this.type = 'C';
    if (/s/.test(type)) this.type = '_S';
    this.isValid = function() {
      if (!this.points.length || !this.type) return false;
      if (/C|S/.test(this.type) && this.points.length < 3) return false;
      return true;
    };
    this.toString = function() {
      if (this.type === '_S') {
        return s2b(this.points, this.prevType, this.nextType);
      }
      return this.type + this.points.join();
    };
  }

  var i = 0;
  while (i < rawCommands.length) {
    var p = rawCommands[i].split(' '),
        command = new DrawingCommand(p[0]);
    for (var lenj = p.length - !(p.length & 1), j = 1; j < lenj; j += 2) {
      command.points.push(new Point(p[j], p[j + 1]));
    }
    if (/p|c/.test(p[0])) {
      if (commands[i - 1].type === '_S') {
        if (p[0] === 'p') {
          var prev = commands[i - 1].points.concat(command.points);
          commands[i - 1].points = prev;
        }
        if (p[0] === 'c') {
          var ps = commands[i - 1].points;
          commands[i - 1].points.push(new Point(ps[0].x, ps[0].y),
                                      new Point(ps[1].x, ps[1].y),
                                      new Point(ps[2].x, ps[2].y));
        }
      }
      rawCommands.splice(i, 1);
    } else {
      if (p[0] === 's') {
        var prev = commands[i - 1].points[commands[i - 1].points.length - 1];
        command.points.unshift(new Point(prev.x, prev.y));
      }
      if (command.isValid()) {
        if (i) {
          command.prevType = commands[i - 1].type;
          commands[i - 1].nextType = command.type;
        }
        commands.push(command);
      }
      i++;
    }
  }

  return commands;
};

var parseEffect = function(text) {
  var param = text.toLowerCase().split(';');
  if (param[0] === 'banner') {
    return {
      name: param[0],
      delay: param[1] * 1 || 1,
      lefttoright: param[2] * 1 || 0,
      fadeawaywidth: param[3] * 1 || 0,
    };
  }
  if (/^scroll\s/.test(param[0])) {
    return {
      name: param[0],
      y1: Math.min(param[1], param[2]),
      y2: Math.max(param[1], param[2]),
      delay: param[3] * 1 || 1,
      fadeawayheight: param[4] * 1 || 0,
    };
  }
  return null;
};

var parseFormat = function(data) {
  return data.match(/Format:(.*)/)[1].replace(/\s/g, '').split(',');
};

var parseStyle = function(data, tree) {
  var fields = data.match(/Style:(.*)/)[1].split(','),
      s = {};
  for (var i = fields.length - 1; i >= 0; --i) {
    var field = tree.V4Styles.Format[i];
    s[field] = fields[i].replace(/^\s*/, '');
    if (!isNaN(s[field] * 1)) s[field] *= 1;
  }
  s._tags = {
    fn: s.Fontname,
    fs: s.Fontsize,
    c1: s.PrimaryColour.match(/&H(\w\w)?(\w{6})&?/)[2],
    a1: s.PrimaryColour.match(/&H(\w\w)?(\w{6})&?/)[1] || '00',
    c2: s.SecondaryColour.match(/&H(\w\w)?(\w{6})&?/)[2],
    a2: s.SecondaryColour.match(/&H(\w\w)?(\w{6})&?/)[1] || '00',
    c3: s.OutlineColour.match(/&H(\w\w)?(\w{6})&?/)[2],
    a3: s.OutlineColour.match(/&H(\w\w)?(\w{6})&?/)[1] || '00',
    c4: s.BackColour.match(/&H(\w\w)?(\w{6})&?/)[2],
    a4: s.BackColour.match(/&H(\w\w)?(\w{6})&?/)[1] || '00',
    b: Math.abs(s.Bold),
    i: Math.abs(s.Italic),
    u: Math.abs(s.Underline),
    s: Math.abs(s.StrikeOut),
    q: tree.ScriptInfo.WrapStyle || 1,
    fscx: s.ScaleX,
    fscy: s.ScaleY,
    fsp: s.Spacing,
    frz: s.Angle,
    xbord: s.Outline,
    ybord: s.Outline,
    xshad: s.Shadow,
    yshad: s.Shadow,
  };
  return s;
};

var parseTags = function(dialogue, styles) {
  var text = dialogue.Text.replace(/\\N/g, '<br>').replace(/\\h/g, '&nbsp;'),
      prevTags = JSON.parse(JSON.stringify(styles[dialogue.Style]._tags)),
      kv = text.split(/{([^{}]*?)}/),
      dia = {content: []};
  if (kv[0].length) {
    dia.content.push({
      text: kv[0],
      tags: prevTags
    });
  }
  for (var i = 1; i < kv.length; i += 2) {
    var ct = {
      text: kv[i + 1],
      tags: JSON.parse(JSON.stringify(prevTags))
    };

    /* JavaScript doesn't support split(/(?<!\(.*?)\\(?!.*?\))/) */
    var cmds = kv[i].split('\\');
    for (var j = 0; j < cmds.length; ++j) {
      if (/^t\(/.test(cmds[j]) && !/\)$/.test(cmds[j])) {
        while (!/\)$/.test(cmds[j + 1])) {
          cmds[j] += '\\' + cmds[j + 1];
          cmds.splice(j + 1, 1);
        }
        cmds[j] += '\\' + cmds[j + 1];
        cmds.splice(j + 1, 1);
      }
    }

    for (var j = 0; j < cmds.length; ++j) {
      var cmd = cmds[j];
      parseAnimatableTags.call(ct, cmd);
      if (ct.tags.clip) dia.clip = ct.tags.clip;
      if (/^b\d/.test(cmd)) ct.tags.b = cmd.match(/^b(\d+)/)[1] * 1;
      if (/^i\d/.test(cmd)) ct.tags.i = cmd[1] * 1;
      if (/^u\d/.test(cmd)) ct.tags.u = cmd[1] * 1;
      if (/^s\d/.test(cmd)) ct.tags.s = cmd[1] * 1;
      if (/^fn/.test(cmd)) ct.tags.fn = cmd.match(/^fn(.*)/)[1];
      if (/^fe/.test(cmd)) ct.tags.fe = cmd.match(/^fe(.*)/)[1] * 1;
      if (/^k\d/.test(cmd)) ct.tags.k = cmd.match(/^k(\d+)/)[1] * 1;
      if (/^K\d/.test(cmd)) ct.tags.kf = cmd.match(/^K(\d+)/)[1] * 1;
      if (/^kf\d/.test(cmd)) ct.tags.kf = cmd.match(/^kf(\d+)/)[1] * 1;
      if (/^ko\d/.test(cmd)) ct.tags.ko = cmd.match(/^ko(\d+)/)[1] * 1;
      if (/^kt\d/.test(cmd)) ct.tags.kt = cmd.match(/^kt(\d+)/)[1] * 1;
      if (/^q\d/.test(cmd)) ct.tags.q = cmd[1] * 1;
      if (/^p\d/.test(cmd)) ct.tags.p = cmd.match(/^p(\d+)/)[1] * 1;
      if (/^pbo/.test(cmd)) ct.tags.pbo = cmd.match(/^pbo(.*)/)[1] * 1;
      if (/^an\d/.test(cmd) && !dia.alignment) dia.alignment = cmd[2] * 1;
      if (/^a\d/.test(cmd) && !dia.alignment) {
        var val = cmd.match(/^a(\d+)/)[1] * 1;
        if (val < 4) dia.alignment = val;
        else if (val > 8) dia.alignment = val - 5;
        else dia.alignment = val + 2;
      }
      if (/^pos/.test(cmd) && !dia.pos && !dia.move) {
        var p = cmd.replace(/\s/g, '').match(/^pos\((.*?)\)?$/)[1].split(',');
        dia.pos = {x: p[0] * 1, y: p[1] * 1};
      }
      if (/^org/.test(cmd) && !dia.org) {
        var p = cmd.replace(/\s/g, '').match(/^org\((.*?)\)?$/)[1].split(',');
        dia.org = {x: p[0] * 1, y: p[1] * 1};
      }
      if (/^move/.test(cmd) && !dia.move && !dia.pos) {
        var p = cmd.replace(/\s/g, '')
                   .match(/^move\((.*?)\)?$/)[1]
                   .split(',')
                   .map(function(x) { return x * 1; });
        dia.pos = {x: p[0] * 1, y: p[1] * 1};
        if (p.length === 4) {
          p.push(0);
          p.push((dialogue.End - dialogue.Start) * 1000);
        }
        dia.move = p;
      }
      if (/^fad\s*\(/.test(cmd) && !dia.fad) {
        dia.fad = cmd.replace(/\s/g, '')
                     .match(/^fad\((.*?)\)?$/)[1]
                     .split(',')
                     .map(function(x) { return x * 1; });
      }
      if (/^fade/.test(cmd) && !dia.fade) {
        dia.fade = cmd.replace(/\s/g, '')
                      .match(/^fade\((.*?)\)?$/)[1]
                      .split(',')
                      .map(function(x) { return x * 1; });
      }
      if (/^r/.test(cmd)) {
        var name = cmd.match(/^r(.*)/)[1];
        var rStyle = styles[name] || styles[dialogue.Style];
        ct.tags = JSON.parse(JSON.stringify(rStyle._tags));
      }
      if (/^t\(/.test(cmd)) {
        var args = cmd.replace(/\s/g, '').match(/^t\((.*)\)/)[1].split(',');
        if (!args[0]) continue;
        var tcmds = args[args.length - 1].split('\\');
        var tct = {
          t1: 0,
          t2: (dialogue.End - dialogue.Start) * 1000,
          accel: 1,
          tags: {}
        };
        for (var k = tcmds.length - 1; k >= 0; k--) {
          parseAnimatableTags.call(tct, tcmds[k]);
        }
        if (args.length === 2) {
          tct.accel = args[0] * 1;
        }
        if (args.length === 3) {
          tct.t1 = args[0] * 1;
          tct.t2 = args[1] * 1;
        }
        if (args.length === 4) {
          tct.t1 = args[0] * 1;
          tct.t2 = args[1] * 1;
          tct.accel = args[2] * 1;
        }
        if (!ct.tags.t) ct.tags.t = [];
        ct.tags.t.push(tct);
      }
    }
    if (ct.tags.t) {
      for (var j = 0; j < ct.tags.t.length - 1; ++j) {
        for (var k = j + 1; k < ct.tags.t.length; ++k) {
          if (ct.tags.t[j].t1 === ct.tags.t[k].t1 &&
              ct.tags.t[j].t2 === ct.tags.t[k].t2) {
            for (var l in ct.tags.t[k].tags) {
              ct.tags.t[j].tags[l] = ct.tags.t[k].tags[l];
            }
            ct.tags.t.splice(k, 1);
          }
        }
      }
    }
    if (dialogue.Effect && dialogue.Effect.name === 'banner') ct.tags.q = 2;
    if (!ct.tags.p) ct.text = ct.text.replace(/\s/g, '&nbsp;');
    else ct.commands = parseDrawing(ct.text);
    ct.text = ct.text.replace(/\\n/g, (ct.tags.q === 2) ? '<br>' : '&nbsp;');
    prevTags = ct.tags;
    dia.content.push(ct);
  }
  return dia;
};
var parseAnimatableTags = function(cmd) {
  if (/^fs[\d\+\-]/.test(cmd)) {
    var val = cmd.match(/^fs(.*)/)[1];
    if (/^\d/.test(val)) this.tags.fs = val * 1;
    if (/^\+|-/.test(val)) {
      this.tags.fs *= (val * 1 > -10 ? (1 + val / 10) : 1);
    }
  }
  if (/^fsp/.test(cmd)) this.tags.fsp = cmd.match(/^fsp(.*)/)[1] * 1;
  if (/^fscx/.test(cmd)) this.tags.fscx = cmd.match(/^fscx(.*)/)[1] * 1;
  if (/^fscy/.test(cmd)) this.tags.fscy = cmd.match(/^fscy(.*)/)[1] * 1;
  if (/^fsp/.test(cmd)) this.tags.fsp = cmd.match(/^fsp(.*)/)[1] * 1;
  if (/^frx/.test(cmd)) this.tags.frx = cmd.match(/^frx(.*)/)[1] * 1;
  if (/^fry/.test(cmd)) this.tags.fry = cmd.match(/^fry(.*)/)[1] * 1;
  if (/^fr[z\d\-]/.test(cmd)) this.tags.frz = cmd.match(/^frz?(.*)/)[1] * 1;
  if (/^blur\d/.test(cmd)) this.tags.blur = cmd.match(/^blur(.*)/)[1] * 1;
  if (/^be\d/.test(cmd)) this.tags.blur = cmd.match(/^be(.*)/)[1] * 1;
  if (this.tags.blur < 0) this.tags.blur = 0;
  if (/^fax/.test(cmd)) this.tags.fax = cmd.match(/^fax(.*)/)[1] * 1;
  if (/^fay/.test(cmd)) this.tags.fay = cmd.match(/^fay(.*)/)[1] * 1;
  if (/^x*bord/.test(cmd)) this.tags.xbord = cmd.match(/^x*bord(.*)/)[1] * 1;
  if (/^y*bord/.test(cmd)) this.tags.ybord = cmd.match(/^y*bord(.*)/)[1] * 1;
  if (this.tags.xbord < 0) this.tags.xbord = 0;
  if (this.tags.ybord < 0) this.tags.ybord = 0;
  if (/^x*shad/.test(cmd)) this.tags.xshad = cmd.match(/^x*shad(.*)/)[1] * 1;
  if (/^y*shad/.test(cmd)) this.tags.yshad = cmd.match(/^y*shad(.*)/)[1] * 1;
  if (/^\d?c&?H?[0-9a-f]+/i.test(cmd)) {
    var args = cmd.match(/^(\d?)c&?H?(\w+)/);
    if (!args[1]) args[1] = '1';
    while (args[2].length < 6) args[2] = '0' + args[2];
    this.tags['c' + args[1]] = args[2];
  }
  if (/^\da&?H?[0-9a-f]+/i.test(cmd)) {
    var args = cmd.match(/^(\d)a&?H?(\w\w)/);
    this.tags['a' + args[1]] = args[2];
  }
  if (/^alpha&?H?[0-9a-f]+/i.test(cmd)) {
    for (var i = 1; i <= 4; i++) {
      this.tags['a' + i] = cmd.match(/^alpha&?H?(\w\w)/)[1];
    }
  }
  if (/^i?clip/.test(cmd)) {
    var p = cmd.match(/^i?clip\s*\((.*)\)/)[1].split(/\s*,\s*/);
    this.tags.clip = {
      inverse: /iclip/.test(cmd),
      scale: 1,
      commands: null,
      dots: null,
    };
    if (p.length === 1) {
      this.tags.clip.commands = parseDrawing(p[0]);
    }
    if (p.length === 2) {
      this.tags.clip.scale = p[0] * 1;
      this.tags.clip.commands = parseDrawing(p[1]);
    }
    if (p.length === 4) {
      this.tags.clip.dots = [p[0] * 1, p[1] * 1, p[2] * 1, p[3] * 1];
    }
  }
};

var parseTime = function(time) {
  var t = time.split(':');
  return t[0] * 3600 + t[1] * 60 + t[2] * 1;
};

var renderer = function(dialogue) {
  var pt = dialogue._parsedText,
      s = this.tree.V4Styles.Style[dialogue.Style];
  var dia = {
    node: document.createElement('div'),
    Alignment: pt.alignment || s.Alignment,
    Layer: dialogue.Layer,
    Start: dialogue.Start,
    End: dialogue.End,
    BorderStyle: s.BorderStyle,
    MarginL: dialogue.MarginL || s.MarginL,
    MarginR: dialogue.MarginR || s.MarginR,
    MarginV: dialogue.MarginV || s.MarginV,
    Effect: dialogue.Effect,
    parsedText: pt,
    animationName: pt.animationName,
    move: pt.move,
    fad: pt.fad,
    fade: pt.fade,
    pos: pt.pos || (pt.move ? {x: 0, y: 0} : null),
    org: pt.org,
    clip: pt.clip,
    channel: 0,
    t: false,
  };
  dia.node.className = 'ASS-dialogue';

  setTagsStyle.call(this, dia);
  this.stage.appendChild(dia.node);

  var bcr = dia.node.getBoundingClientRect();
  dia.width = bcr.width;
  dia.height = bcr.height;

  setDialoguePosition.call(this, dia);
  setDialogueStyle.call(this, dia);
  setTransformOrigin(dia);
  setClipPath.call(this, dia);

  return dia;
};
var setTagsStyle = function(dia) {
  var df = document.createDocumentFragment();
  for (var len = dia.parsedText.content.length, i = 0; i < len; ++i) {
    var ct = dia.parsedText.content[i];
    if (!ct.text) continue;
    var t = ct.tags,
        cssText = ['display:inline-block'],
        vct = this.video.currentTime;
    if (!t.p) {
      cssText.push('font-family:\'' + t.fn + '\',Arial');
      var rfs = this.scale * getRealFontSize(t.fs, t.fn);
      cssText.push('font-size:' + rfs + 'px');
      cssText.push('color:' + toRGBA(t.a1 + t.c1));
      var sisbas = this.tree.ScriptInfo['ScaledBorderAndShadow'],
          sbas = /Yes/i.test(sisbas) ? this.scale : 1;
      if (dia.BorderStyle === 1) {
        cssText.push('text-shadow:' + createCSSBS(t, sbas));
      }
      if (dia.BorderStyle === 3) {
        cssText.push('background-color:' + toRGBA(t.a3 + t.c3));
        cssText.push('box-shadow:' + createCSSBS(t, sbas));
      }
      if (t.b === 0) cssText.push('font-weight:normal');
      else if (t.b === 1) cssText.push('font-weight:bold');
      else cssText.push('font-weight:' + t.b);
      cssText.push('font-style:' + (t.i ? 'italic' : 'normal'));
      if (t.u && t.s) cssText.push('text-decoration:underline line-through');
      else if (t.u) cssText.push('text-decoration:underline');
      else if (t.s) cssText.push('text-decoration:line-through');
      cssText.push('letter-spacing:' + this.scale * t.fsp + 'px');
      if (t.q === 0) {} // TODO
      if (t.q === 1) {
        cssText.push('word-break:break-all');
        cssText.push('white-space:normal');
      }
      if (t.q === 2) {
        cssText.push('word-break:normal');
        cssText.push('white-space:nowrap');
      }
      if (t.q === 3) {} // TODO
    }
    if (t.fax || t.fay ||
        t.frx || t.fry || t.frz ||
        t.fscx !== 100 || t.fscy !== 100) {
      var tf = createTransform(t);
      ['', '-webkit-'].forEach(function(v) {
        cssText.push(v + 'transform:' + tf);
      });
      if (!t.p) {
        cssText.push('transform-style:preserve-3d');
        cssText.push('word-break:normal');
        cssText.push('white-space:nowrap');
      }
    }
    if (t.t) {
      ['', '-webkit-'].forEach(function(v) {
        var delay = Math.min(0, dia.Start - vct);
        cssText.push(v + 'animation-name:' + ct.animationName);
        cssText.push(v + 'animation-duration:' + (dia.End - dia.Start) + 's');
        cssText.push(v + 'animation-delay:' + delay + 's');
        cssText.push(v + 'animation-timing-function:linear');
        cssText.push(v + 'animation-iteration-count:1');
        cssText.push(v + 'animation-fill-mode:forwards');
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
      if (t.p) {
        cn.appendChild(createDrawing.call(this, cn, ct, dia));
        if (t.pbo) {
          var pbo = this.scale * -t.pbo * (t.fscy || 100) / 100;
          cssText.push('vertical-align:' + pbo + 'px');
        }
      } else cn.innerHTML = parts[j];
      cn.style.cssText += cssText.join(';');
      df.appendChild(cn);
    }
  }
  dia.node.appendChild(df);
};
var setDialoguePosition = function(dia) {
  if (dia.Effect) {
    if (dia.Effect.name === 'banner') {
      if (dia.Alignment <= 3) dia.y = this.height - dia.height - dia.MarginV;
      if (dia.Alignment >= 4 && dia.Alignment <= 6) {
        dia.y = (this.height - dia.height) / 2;
      }
      if (dia.Alignment >= 7) dia.y = dia.MarginV;
      if (dia.Effect.lefttoright) dia.x = -dia.width;
      else dia.x = this.width;
    }
    if (/^scroll/.test(dia.Effect.name)) {
      dia.y = /up/.test(dia.Effect.name) ? this.height : -dia.height;
      if (dia.Alignment % 3 === 1) dia.x = 0;
      if (dia.Alignment % 3 === 2) dia.x = (this.width - dia.width) / 2;
      if (dia.Alignment % 3 === 0) dia.x = this.width - dia.width;
    }
  } else {
    if (dia.pos) {
      if (dia.Alignment % 3 === 1) dia.x = this.scale * dia.pos.x;
      if (dia.Alignment % 3 === 2) {
        dia.x = this.scale * dia.pos.x - dia.width / 2;
      }
      if (dia.Alignment % 3 === 0) dia.x = this.scale * dia.pos.x - dia.width;
      if (dia.Alignment <= 3) dia.y = this.scale * dia.pos.y - dia.height;
      if (dia.Alignment >= 4 && dia.Alignment <= 6) {
        dia.y = this.scale * dia.pos.y - dia.height / 2;
      }
      if (dia.Alignment >= 7) dia.y = this.scale * dia.pos.y;
    } else {
      if (dia.Alignment % 3 === 1) dia.x = 0;
      if (dia.Alignment % 3 === 2) dia.x = (this.width - dia.width) / 2;
      if (dia.Alignment % 3 === 0) {
        dia.x = this.width - dia.width - this.scale * dia.MarginR;
      }
      if (dia.t) {
        if (dia.Alignment <= 3) dia.y = this.height - dia.height - dia.MarginV;
        if (dia.Alignment >= 4 && dia.Alignment <= 6) {
          dia.y = (this.height - dia.height) / 2;
        }
        if (dia.Alignment >= 7) dia.y = dia.MarginV;
      } else dia.y = getChannel.call(this, dia);
    }
  }
};
var setDialogueStyle = function(dia) {
  var cssText = [],
      vct = this.video.currentTime;
  if (dia.Layer) cssText.push('z-index:' + dia.Layer);
  if (dia.move || dia.fad || dia.fade || dia.Effect) {
    ['', '-webkit-'].forEach(function(v) {
      cssText.push(v + 'animation-name:' + dia.animationName);
      cssText.push(v + 'animation-duration:' + (dia.End - dia.Start) + 's');
      cssText.push(v + 'animation-delay:' + Math.min(0, dia.Start - vct) + 's');
      cssText.push(v + 'animation-timing-function:linear');
      cssText.push(v + 'animation-iteration-count:1');
      cssText.push(v + 'animation-fill-mode:forwards');
    });
  }
  if (dia.Alignment % 3 === 1) cssText.push('text-align:left');
  if (dia.Alignment % 3 === 2) cssText.push('text-align:center');
  if (dia.Alignment % 3 === 0) cssText.push('text-align:right');
  if (!dia.Effect) {
    var mw = this.width - this.scale * (dia.MarginL + dia.MarginR);
    cssText.push('max-width:' + mw + 'px');
    if (!dia.pos) {
      if (dia.Alignment % 3 === 1) {
        cssText.push('margin-left:' + this.scale * dia.MarginL + 'px');
      }
      if (dia.Alignment % 3 === 0) {
        cssText.push('margin-right:' + this.scale * dia.MarginR + 'px');
      }
      if (dia.width > this.width - this.scale * (dia.MarginL + dia.MarginR)) {
        cssText.push('margin-left:' + this.scale * dia.MarginL + 'px');
        cssText.push('margin-right:' + this.scale * dia.MarginR + 'px');
      }
    }
  }
  cssText.push('width:' + dia.width + 'px');
  cssText.push('height:' + dia.height + 'px');
  cssText.push('left:' + dia.x + 'px');
  cssText.push('top:' + dia.y + 'px');
  dia.node.style.cssText = cssText.join(';');
};
var setTransformOrigin = function(dia) {
  if (!dia.hasRotate) return;
  if (!dia.org) {
    dia.org = {x: 0, y: 0};
    if (dia.Alignment % 3 === 1) dia.org.x = dia.x;
    if (dia.Alignment % 3 === 2) dia.org.x = dia.x + dia.width / 2;
    if (dia.Alignment % 3 === 0) dia.org.x = dia.x + dia.width;
    if (dia.Alignment <= 3) dia.org.y = dia.y + dia.height;
    if (dia.Alignment >= 4 && dia.Alignment <= 6) {
      dia.org.y = dia.y + dia.height / 2;
    }
    if (dia.Alignment >= 7) dia.org.y = dia.y;
  }
  var children = dia.node.childNodes;
  for (var i = children.length - 1; i >= 0; i--) {
    if (children[i].dataset.hasRotate) {
      // It's not extremely precise for offsets are round the value to an integer.
      var tox = dia.org.x - dia.x - children[i].offsetLeft,
          toy = dia.org.y - dia.y - children[i].offsetTop,
          to = 'transform-origin:' + tox + 'px ' + toy + 'px;';
      children[i].style.cssText += '-webkit-' + to + to;
    }
  }
};
var setClipPath = function(dia) {
  if (dia.clip) {
    var fobb = document.createElement('div');
    this.stage.insertBefore(fobb, dia.node);
    fobb.appendChild(dia.node);
    dia.node = fobb;
    fobb.className = 'ASS-fix-objectBoundingBox';
    fobb.style.cssText += createClipPath.call(this, dia);
  }
};

var $animation = document.createElement('style');
$animation.type = 'text/css';
$animation.className = 'ASS-animation';
document.head.appendChild($animation);
var createAnimation = function() {
  function KeyFrames() {
    this.obj = {};
    this.set = function(percentage, property, value) {
      if (!this.obj[percentage]) this.obj[percentage] = {};
      this.obj[percentage][property] = value;
    };
    this.toString = function() {
      var arr = ['{'];
      for (var percentage in this.obj) {
        arr.push(percentage + '{');
        for (var property in this.obj[percentage]) {
          var rule = property + ':' + this.obj[percentage][property] + ';';
          if (property === 'transform') arr.push('-webkit-' + rule);
          arr.push(rule);
        }
        arr.push('}');
      }
      arr.push('}\n');
      return arr.join('');
    };
  }
  var kfObj = {};
  var getName = function(str) {
    for (var name in kfObj) {
      if (kfObj[name] === str) return name;
    }
    return null;
  };
  for (var i = this.tree.Events.Dialogue.length - 1; i >= 0; i--) {
    var dia = this.tree.Events.Dialogue[i],
        pt = dia._parsedText,
        dur = (dia.End - dia.Start) * 1000,
        kf = new KeyFrames(),
        kfStr = '',
        t = [];
    if (dia.Effect && !pt.move) {
      var eff = dia.Effect;
      if (eff.name === 'banner') {
        var tx = this.scale * (dur / eff.delay) * (eff.lefttoright ? 1 : -1);
        kf.set('0.000%', 'transform', 'translateX(0)');
        kf.set('100.000%', 'transform', 'translateX(' + tx + 'px)');
      }
      if (/^scroll/.test(eff.name)) {
        var updown = /up/.test(eff.name) ? -1 : 1,
            y1 = eff.y1,
            y2 = eff.y2 || this.resolution.y,
            tFrom = 'translateY(' + this.scale * y1 * updown + 'px)',
            tTo = 'translateY(' + this.scale * y2 * updown + 'px)',
            dp = (y2 - y1) / (dur / eff.delay) * 100;
        t[1] = Math.min(100, dp).toFixed(3) + '%';
        kf.set('0.000%', 'transform', tFrom);
        kf.set(t[1], 'transform', tTo);
        kf.set('100.000%', 'transform', tTo);
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
      for (var j = 1; j <= 4; j++) {
        t[j] = Math.min(100, pt.fade[j + 2] / dur * 100).toFixed(3) + '%';
      }
      for (var j = 0; j <= 5; j++) {
        kf.set(t[j], 'opacity', 1 - pt.fade[j >> 1] / 255);
      }
    }
    if (pt.move && pt.move.length === 6) {
      if (!pt.pos) pt.pos = {x: 0, y: 0};
      if (pt.move.length === 6) {
        t[0] = '0.000%';
        t[1] = Math.min(100, pt.move[4] / dur * 100).toFixed(3) + '%';
        t[2] = Math.min(100, pt.move[5] / dur * 100).toFixed(3) + '%';
        t[3] = '100.000%';
        for (var j = 0; j <= 3; j++) {
          var tx = this.scale * (pt.move[j < 2 ? 0 : 2] - pt.pos.x),
              ty = this.scale * (pt.move[j < 2 ? 1 : 3] - pt.pos.y);
          kf.set(t[j], 'transform', 'translate(' + tx + 'px, ' + ty + 'px)');
        }
      }
    }
    kfStr = kf.toString();
    var name = getName(kfStr);
    if (name === null) {
      name = 'ASS-' + generateUUID();
      kfObj[name] = kfStr;
    }
    pt.animationName = name;

    for (var j = pt.content.length - 1; j >= 0; j--) {
      kf = new KeyFrames();
      var tags = JSON.parse(JSON.stringify(pt.content[j].tags));
      if (tags.t) {
        for (var k = tags.t.length - 1; k >= 0; k--) {
          var ttags = JSON.parse(JSON.stringify(tags.t[k].tags));
          t[0] = '0.000%';
          t[1] = Math.min(100, tags.t[k].t1 / dur * 100).toFixed(3) + '%';
          t[2] = Math.min(100, tags.t[k].t2 / dur * 100).toFixed(3) + '%';
          t[3] = '100.000%';
          if (ttags.fs) {
            var fsFrom = this.scale * getRealFontSize(tags.fs, tags.fn) + 'px',
                fsTo = this.scale * getRealFontSize(ttags.fs, tags.fn) + 'px';
            kf.set(t[0], 'font-size', fsFrom);
            kf.set(t[1], 'font-size', fsFrom);
            kf.set(t[2], 'font-size', fsTo);
            kf.set(t[3], 'font-size', fsTo);
          }
          if (ttags.fsp) {
            var fspFrom = this.scale * tags.fsp + 'px',
                fspTo = this.scale * ttags.fsp + 'px';
            kf.set(t[0], 'letter-spacing', fspFrom);
            kf.set(t[1], 'letter-spacing', fspFrom);
            kf.set(t[2], 'letter-spacing', fspTo);
            kf.set(t[3], 'letter-spacing', fspTo);
          }
          if (ttags.c1 || ttags.a1) {
            ttags.c1 = ttags.c1 || tags.c1;
            ttags.a1 = ttags.a1 || tags.a1;
            var cFrom = toRGBA(tags.a1 + tags.c1),
                cTo = toRGBA(ttags.a1 + ttags.c1);
            kf.set(t[0], 'color', cFrom);
            kf.set(t[1], 'color', cFrom);
            kf.set(t[2], 'color', cTo);
            kf.set(t[3], 'color', cTo);
          }
          if (ttags.a1 &&
              ttags.a1 === ttags.a2 &&
              ttags.a2 === ttags.a3 &&
              ttags.a3 === ttags.a4) {
            var aFrom = 1 - parseInt(tags.a1, 16) / 255,
                aTo = 1 - parseInt(ttags.a1, 16) / 255;
            kf.set(t[0], 'opacity', aFrom);
            kf.set(t[1], 'opacity', aFrom);
            kf.set(t[2], 'opacity', aTo);
            kf.set(t[3], 'opacity', aTo);
          }
          var bsTags = ['c3', 'a3', 'c4', 'a4',
                        'xbord', 'ybord', 'xshad', 'yshad', 'blur'];
          var hasTextShadow = function(t) {
            for (var i = bsTags.length - 1; i >= 0; --i) {
              if (t[bsTags[i]] !== undefined) return true;
            }
            return false;
          };
          if (hasTextShadow(ttags)) {
            bsTags.forEach(function(e) {
              if (ttags[e] === undefined) ttags[e] = tags[e];
            });
            var sisbas = this.tree.ScriptInfo['ScaledBorderAndShadow'],
                sbas = /Yes/i.test(sisbas) ? this.scale : 1,
                bsFrom = createCSSBS(tags, sbas),
                bsTo = createCSSBS(ttags, sbas);
            kf.set(t[0], 'text-shadow', bsFrom);
            kf.set(t[1], 'text-shadow', bsFrom);
            kf.set(t[2], 'text-shadow', bsTo);
            kf.set(t[3], 'text-shadow', bsTo);
          }
          if ((ttags.fscx && ttags.fscx !== 100) ||
              (ttags.fscy && ttags.fscy !== 100) ||
              ttags.frx !== undefined ||
              ttags.fry !== undefined ||
              ttags.frz !== undefined ||
              ttags.fax !== undefined ||
              ttags.fay !== undefined) {
            var tfTags = ['fscx', 'fscy', 'frx', 'fry', 'frz', 'fax', 'fay'];
            tfTags.forEach(function(e) {
              if (ttags[e] === undefined) ttags[e] = tags[e];
            });
            if (tags.p) {
              ttags.fscx = (ttags.fscx / tags.fscx) * 100;
              ttags.fscy = (ttags.fscy / tags.fscy) * 100;
              tags.fscx = tags.fscy = 100;
            }
            var tFrom = createTransform(tags),
                tTo = createTransform(ttags);
            kf.set(t[0], 'transform', tFrom);
            kf.set(t[1], 'transform', tFrom);
            kf.set(t[2], 'transform', tTo);
            kf.set(t[3], 'transform', tTo);
          }
        }
      }
      kfStr = kf.toString();
      var name = getName(kfStr);
      if (name === null) {
        name = 'ASS-' + generateUUID();
        kfObj[name] = kfStr;
      }
      pt.content[j].animationName = name;
    }
  }
  var cssText = [];
  for (var name in kfObj) {
    cssText.push('@keyframes ' + name + kfObj[name]);
    cssText.push('@-webkit-keyframes ' + name + kfObj[name]);
  }
  $animation.innerHTML = cssText.join('');
};

var createSVGBS = function(t, id, s) {
  var hasBorder = t.xbord || t.ybord,
      hasShadow = t.xshad || t.yshad,
      isTrans = (t.a1 === 'FF'),
      blur = t.blur || 0;
  var filter = document.createElementNS(xmlns, 'filter');
  filter.setAttributeNS(null, 'id', id);
  var sg_b = document.createElementNS(xmlns, 'feGaussianBlur');
  sg_b.setAttributeNS(null, 'stdDeviation', hasBorder ? 0 : blur);
  sg_b.setAttributeNS(null, 'in', 'SourceGraphic');
  sg_b.setAttributeNS(null, 'result', 'sg_b');
  filter.appendChild(sg_b);
  var c1 = document.createElementNS(xmlns, 'feFlood');
  c1.setAttributeNS(null, 'flood-color', toRGBA(t.a1 + t.c1));
  c1.setAttributeNS(null, 'result', 'c1');
  filter.appendChild(c1);
  var main = document.createElementNS(xmlns, 'feComposite');
  main.setAttributeNS(null, 'operator', 'in');
  main.setAttributeNS(null, 'in', 'c1');
  main.setAttributeNS(null, 'in2', 'sg_b');
  main.setAttributeNS(null, 'result', 'main');
  filter.appendChild(main);
  if (hasBorder) {
    var dil = document.createElementNS(xmlns, 'feMorphology');
    dil.setAttributeNS(null, 'radius', t.xbord * s + ' ' + t.ybord * s);
    dil.setAttributeNS(null, 'operator', 'dilate');
    dil.setAttributeNS(null, 'in', 'SourceGraphic');
    dil.setAttributeNS(null, 'result', 'dil');
    filter.appendChild(dil);
    var dil_b = document.createElementNS(xmlns, 'feGaussianBlur');
    dil_b.setAttributeNS(null, 'stdDeviation', blur);
    dil_b.setAttributeNS(null, 'in', 'dil');
    dil_b.setAttributeNS(null, 'result', 'dil_b');
    filter.appendChild(dil_b);
    var dil_b_o = document.createElementNS(xmlns, 'feComposite');
    dil_b_o.setAttributeNS(null, 'operator', 'out');
    dil_b_o.setAttributeNS(null, 'in', 'dil_b');
    dil_b_o.setAttributeNS(null, 'in2', 'SourceGraphic');
    dil_b_o.setAttributeNS(null, 'result', 'dil_b_o');
    filter.appendChild(dil_b_o);
    var c3 = document.createElementNS(xmlns, 'feFlood');
    c3.setAttributeNS(null, 'flood-color', toRGBA(t.a3 + t.c3));
    c3.setAttributeNS(null, 'result', 'c3');
    filter.appendChild(c3);
    var border = document.createElementNS(xmlns, 'feComposite');
    border.setAttributeNS(null, 'operator', 'in');
    border.setAttributeNS(null, 'in', 'c3');
    border.setAttributeNS(null, 'in2', 'dil_b_o');
    border.setAttributeNS(null, 'result', 'border');
    filter.appendChild(border);
  }
  if (hasShadow && (hasBorder || !isTrans)) {
    var off = document.createElementNS(xmlns, 'feOffset');
    off.setAttributeNS(null, 'dx', t.xshad * s);
    off.setAttributeNS(null, 'dy', t.yshad * s);
    off.setAttributeNS(null, 'in', hasBorder ? 'dil' : 'SourceGraphic');
    off.setAttributeNS(null, 'result', 'off');
    filter.appendChild(off);
    var off_b = document.createElementNS(xmlns, 'feGaussianBlur');
    off_b.setAttributeNS(null, 'stdDeviation', blur);
    off_b.setAttributeNS(null, 'in', 'off');
    off_b.setAttributeNS(null, 'result', 'off_b');
    filter.appendChild(off_b);
    if (isTrans) {
      var sg_off = document.createElementNS(xmlns, 'feOffset');
      sg_off.setAttributeNS(null, 'dx', t.xshad * s);
      sg_off.setAttributeNS(null, 'dy', t.yshad * s);
      sg_off.setAttributeNS(null, 'in', 'SourceGraphic');
      sg_off.setAttributeNS(null, 'result', 'sg_off');
      filter.appendChild(sg_off);
      var off_b_o = document.createElementNS(xmlns, 'feComposite');
      off_b_o.setAttributeNS(null, 'operator', 'out');
      off_b_o.setAttributeNS(null, 'in', 'off_b');
      off_b_o.setAttributeNS(null, 'in2', 'sg_off');
      off_b_o.setAttributeNS(null, 'result', 'off_b_o');
      filter.appendChild(off_b_o);
    }
    var c4 = document.createElementNS(xmlns, 'feFlood');
    c4.setAttributeNS(null, 'flood-color', toRGBA(t.a4 + t.c4));
    c4.setAttributeNS(null, 'result', 'c4');
    filter.appendChild(c4);
    var shadow = document.createElementNS(xmlns, 'feComposite');
    shadow.setAttributeNS(null, 'operator', 'in');
    shadow.setAttributeNS(null, 'in', 'c4');
    shadow.setAttributeNS(null, 'in2', isTrans ? 'off_b_o' : 'off_b');
    shadow.setAttributeNS(null, 'result', 'shadow');
    filter.appendChild(shadow);
  }
  var merge = document.createElementNS(xmlns, 'feMerge');
  if (hasShadow && (hasBorder || !isTrans)) {
    var nodeShadow = document.createElementNS(xmlns, 'feMergeNode');
    nodeShadow.setAttributeNS(null, 'in', 'shadow');
    merge.appendChild(nodeShadow);
  }
  if (hasBorder) {
    var nodeBorder = document.createElementNS(xmlns, 'feMergeNode');
    nodeBorder.setAttributeNS(null, 'in', 'border');
    merge.appendChild(nodeBorder);
  }
  var nodeMain = document.createElementNS(xmlns, 'feMergeNode');
  nodeMain.setAttributeNS(null, 'in', 'main');
  merge.appendChild(nodeMain);
  filter.appendChild(merge);
  return filter;
};
var createCSSBS = function(t, s) {
  var arr = [],
      oc = toRGBA(t.a3 + t.c3),
      ox = t.xbord * s,
      oy = t.ybord * s,
      sc = toRGBA(t.a4 + t.c4),
      sx = t.xshad * s,
      sy = t.yshad * s,
      blur = t.blur || 0;
  if (!(ox + oy + sx + sy)) return 'none';
  if (ox || oy) {
    for (var i = -1; i <= 1; i++)
      for (var j = -1; j <= 1; j++) {
        for (var x = 1; x < ox; x++) {
          for (var y = 1; y < oy; y++)
            if (i || j) arr.push(oc + ' ' +
                                 i * x + 'px ' +
                                 j * y + 'px ' +
                                 blur + 'px');
        }
        arr.push(oc + ' ' +
                 i * ox + 'px ' +
                 j * oy + 'px ' +
                 blur + 'px');
      }
  }
  if (sx || sy) {
    var pnx = sx > 0 ? 1 : -1,
        pny = sy > 0 ? 1 : -1;
    sx = Math.abs(sx);
    sy = Math.abs(sy);
    for (var x = Math.max(ox, sx - ox); x < sx + ox; x++) {
      for (var y = Math.max(oy, sy - oy); y < sy + oy; y++)
        arr.push(sc + ' ' +
                 x * pnx + 'px ' +
                 y * pny + 'px ' +
                 blur + 'px');
    }
    arr.push(sc + ' ' +
            (sx + ox) * pnx + 'px ' +
            (sy + oy) * pny + 'px ' +
            blur + 'px');
  }
  return arr.join();
};

var $clipPath = document.createElementNS(xmlns, 'svg');
$clipPath.setAttributeNS(null, 'class', 'ASS-clip-path');
var $clipPathDefs = document.createElementNS(xmlns, 'defs');
$clipPath.appendChild($clipPathDefs);
var createClipPath = function(dia) {
  if (dia.clip) {
    var d = '',
        id = 'ASS-' + generateUUID(),
        s = 1 / (1 << (dia.clip.scale - 1));
    var prx = this.tree.ScriptInfo.PlayResX,
        pry = this.tree.ScriptInfo.PlayResY;
    if (dia.clip.dots !== null) {
      var n = dia.clip.dots.map(function(d, i) {
        if (i & 1) return d / pry;
        else return d / prx;
      });
      d += 'M' + [n[0], n[1]].join();
      d += 'L' + [n[0], n[3], n[2], n[3], n[2], n[1]].join() + 'Z';
    }
    if (dia.clip.commands !== null) {
      d = getDrawingAttributes(dia.clip.commands, prx, pry).d;
    }
    if (dia.clip.inverse) {
      d += 'M0,0L' + [0, s, s, s, s, 0, 0, 0].join() + 'Z';
    }
    dia.clipPath = document.createElementNS(xmlns, 'clipPath');
    dia.clipPath.setAttributeNS(null, 'id', id);
    dia.clipPath.setAttributeNS(null, 'clipPathUnits', 'objectBoundingBox');
    var path = document.createElementNS(xmlns, 'path');
    path.setAttributeNS(null, 'd', d);
    path.setAttributeNS(null, 'transform', 'scale(' + s + ')');
    path.setAttributeNS(null, 'clip-rule', 'evenodd');
    dia.clipPath.appendChild(path);
    $clipPathDefs.appendChild(dia.clipPath);
    var cp = 'clip-path:url(#' + id + ');';
    return '-webkit-' + cp + cp;
  }
  return '';
};

var getChannel = function(dia) {
  var L = dia.Layer,
      SW = this.width - Math.floor(this.scale * (dia.MarginL + dia.MarginR)),
      SH = this.height,
      W = dia.width,
      H = dia.height,
      V = Math.floor(this.scale * dia.MarginV),
      vct = this.video.currentTime,
      count = 0;
  channel[L] = channel[L] || {
    left: new Uint16Array(SH + 1),
    center: new Uint16Array(SH + 1),
    right: new Uint16Array(SH + 1),
    leftEnd: new Uint32Array(SH + 1),
    centerEnd: new Uint32Array(SH + 1),
    rightEnd: new Uint32Array(SH + 1),
  };
  var align = ['right', 'left', 'center'][dia.Alignment % 3];
  var willCollide = function(x) {
    var l = channel[L].left[x],
        c = channel[L].center[x],
        r = channel[L].right[x],
        le = channel[L].leftEnd[x] / 100,
        ce = channel[L].centerEnd[x] / 100,
        re = channel[L].rightEnd[x] / 100;
    if (align === 'left') {
      if ((le > vct && l) ||
          (ce > vct && c && 2 * W + c > SW) ||
          (re > vct && r && W + r > SW)) return true;
    }
    if (align === 'center') {
      if ((le > vct && l && 2 * l + W > SW) ||
          (ce > vct && c) ||
          (re > vct && r && 2 * r + W > SW)) return true;
    }
    if (align === 'right') {
      if ((le > vct && l && l + W > SW) ||
          (ce > vct && c && 2 * W + c > SW) ||
          (re > vct && r)) return true;
    }
    return false;
  };
  var found = function(x) {
    if (willCollide(x)) count = 0;
    else count++;
    if (count >= H) {
      dia.channel = x;
      return true;
    } else return false;
  };
  if (dia.Alignment <= 3) {
    for (var i = SH - V - 1; i > V; i--) if (found(i)) break;
  } else if (dia.Alignment >= 7) {
    for (var i = V + 1; i < SH - V; i++) if (found(i)) break;
  } else for (var i = (SH - H) >> 1; i < SH - V; i++) if (found(i)) break;
  if (dia.Alignment > 3) dia.channel -= H - 1;
  for (var i = dia.channel; i < dia.channel + H; i++) {
    channel[L][align][i] = W;
    channel[L][align + 'End'][i] = dia.End * 100;
  }
  return dia.channel;
};

var createDrawing = function(cn, ct, dia) {
  var t = ct.tags,
      s = this.scale / (1 << (t.p - 1)),
      sx = (t.fscx ? t.fscx / 100 : 1) * s,
      sy = (t.fscy ? t.fscy / 100 : 1) * s,
      gda = getDrawingAttributes(ct.commands),
      vb = [gda.minX, gda.minY, gda.width, gda.height].join(' '),
      filterID = 'ASS-' + generateUUID(),
      symbolID = 'ASS-' + generateUUID(),
      sisbas = this.tree.ScriptInfo['ScaledBorderAndShadow'],
      sbas = /Yes/i.test(sisbas) ? this.scale : 1,
      xlink = 'http://www.w3.org/1999/xlink';
  var blur = t.blur || 0,
      vbx = t.xbord + (t.xshad < 0 ? -t.xshad : 0) + blur,
      vby = t.ybord + (t.yshad < 0 ? -t.yshad : 0) + blur,
      vbw = gda.width * sx + 2 * t.xbord + Math.abs(t.xshad) + 2 * blur,
      vbh = gda.height * sx + 2 * t.ybord + Math.abs(t.yshad) + 2 * blur;
  var svg = document.createElementNS(xmlns, 'svg');
  svg.setAttributeNS(null, 'width', vbw);
  svg.setAttributeNS(null, 'height', vbh);
  svg.setAttributeNS(null, 'viewBox', [-vbx, -vby, vbw, vbh].join(' '));
  var defs = document.createElementNS(xmlns, 'defs');
  defs.appendChild(createSVGBS(t, filterID, sbas));
  svg.appendChild(defs);
  var symbol = document.createElementNS(xmlns, 'symbol');
  symbol.setAttributeNS(null, 'id', symbolID);
  symbol.setAttributeNS(null, 'viewBox', vb);
  svg.appendChild(symbol);
  var path = document.createElementNS(xmlns, 'path');
  path.setAttributeNS(null, 'd', gda.d);
  symbol.appendChild(path);
  var use = document.createElementNS(xmlns, 'use');
  use.setAttributeNS(null, 'width', gda.width * sx);
  use.setAttributeNS(null, 'height', gda.height * sy);
  use.setAttributeNS(xlink, 'xlink:href', '#' + symbolID);
  use.setAttributeNS(null, 'filter', 'url(#' + filterID + ')');
  svg.appendChild(use);
  cn.style.cssText += 'position:relative;' +
                      'width:' + gda.width * sx + 'px;' +
                      'height:' + gda.height * sy + 'px;';
  svg.style.cssText = 'position:absolute;' +
                      'left:' + (gda.minX * sx - vbx) + 'px;' +
                      'top:' + (gda.minY * sy - vby) + 'px;';
  return svg;
};
var getDrawingAttributes = function(commands, normalizeX, normalizeY) {
  normalizeX = normalizeX || 1;
  normalizeY = normalizeY || 1;
  var minX = Number.MAX_VALUE,
      minY = Number.MAX_VALUE,
      maxX = Number.MIN_VALUE,
      maxY = Number.MIN_VALUE;
  var arr = [];
  for (var len = commands.length, i = 0; i < len; i++) {
    commands[i].points.forEach(function(p) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
      p.x /= normalizeX;
      p.y /= normalizeY;
    });
    arr.push(commands[i].toString());
    commands[i].points.forEach(function(p) {
      p.x *= normalizeX;
      p.y *= normalizeY;
    });
  }

  return {
    d: arr.join('') + 'Z',
    minX: minX,
    minY: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

var fontSizeCache = {};
var $ffs = document.createElement('div');
$ffs.className = 'ASS-fix-font-size';
$ffs.textContent = 'M';
var getRealFontSize = function(fs, fn) {
  var key = fn + '-' + fs;
  if (!fontSizeCache[key]) {
    var cssText = 'font-size:' + fs + 'px;font-family:\'' + fn + '\',Arial;';
    $ffs.style.cssText = cssText;
    fontSizeCache[key] = fs * fs / $ffs.clientHeight;
  }
  return fontSizeCache[key];
};

var toRGBA = function(c) {
  var t = c.match(/(\w\w)(\w\w)(\w\w)(\w\w)/),
      a = 1 - ('0x' + t[1]) / 255,
      b = +('0x' + t[2]),
      g = +('0x' + t[3]),
      r = +('0x' + t[4]);
  return 'rgba(' + [r, g, b, a].join() + ')';
};

var createTransform = function(t) {
  // TODO: I don't know why perspective is 314, it just performances well.
  var arr = [];
  arr.push('perspective(314px)');
  arr.push('rotateY(' + (t.fry || 0) + 'deg)');
  arr.push('rotateX(' + (t.frx || 0) + 'deg)');
  arr.push('rotateZ(' + (-t.frz || 0) + 'deg)');
  arr.push('scale(' + (t.p ? 1 : (t.fscx || 100) / 100) + ',' +
                      (t.p ? 1 : (t.fscy || 100) / 100) + ')');
  arr.push('skew(' + (t.fax || 0) + 'rad,' + (t.fay || 0) + 'rad)');
  return arr.join(' ');
};

return ASS;
}));
