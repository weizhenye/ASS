"use strict";
function ASS() {
  this.tree = {};
  this.requestID = 0;
  this.position = 0;
  this.runline = [];
  this.channel = [];
  this.scale = 1;
  this.stage = document.createElement('div');
  this.stage.id = 'ASS-stage';
  this.stage.className = 'ASS-animation-paused';

  var that = this;
  document.addEventListener(fullscreenchange(), function() {
    if (fullScreenElement() == that.video || !isFullScreen()) {
      that.resize();
    }
  });
  function isFullScreen() {
    if ('webkitIsFullScreen' in document)
      return document.webkitIsFullScreen;
    else if ('mozFullScreen' in document)
      return document.mozFullScreen;
    else if ('msExitFullscreen' in document)
      return (document.msFullscreenElement ? true : false);
  }
  function fullscreenchange() {
    if ('webkitCancelFullScreen' in document)
      return 'webkitfullscreenchange';
    else if ('mozCancelFullScreen' in document)
      return 'mozfullscreenchange';
    else if ('msExitFullscreen' in document)
      return 'MSFullscreenChange';
  }
  function fullScreenElement() {
    if ('webkitFullscreenElement' in document)
      return document.webkitFullscreenElement;
    else if ('mozFullScreenElement' in document)
      return document.mozFullScreenElement;
    else if ('msFullscreenElement' in document)
      return document.msFullscreenElement;
  }
}
ASS.prototype.init = function(data, video) {
  var that = this;
  if (video && !this.video) {
    this.video = video;
    var container = document.createElement('div');
    container.id = 'ASS-container';
    container.style.position = this.video.style.position;
    this.video.style.position = 'absolute';
    this.video.parentNode.insertBefore(container, this.video);
    container.appendChild(this.video);
    container.appendChild(this.stage);

    this.video.addEventListener('seeking', function() {
      that._seek();
    });
    this.video.addEventListener('play', function() {
      that._play();
    });
    this.video.addEventListener('pause', function() {
      that._pause();
    });
  }

  if (!data) return;
  this.tree = this._parse(data);

  if (this.video && (!this.tree.ScriptInfo.PlayResX || !this.tree.ScriptInfo.PlayResY)) {
    this.tree.ScriptInfo.PlayResX = this.video.clientWidth;
    this.tree.ScriptInfo.PlayResY = this.video.clientHeight;
  }
  if (this.tree.ScriptInfo.WrapStyle == 1) this.stage.style.wordBreak = 'break-all';
  if (this.tree.ScriptInfo.WrapStyle == 2) this.stage.style.whiteSpace = 'nowrap';

  var CSSstr = '#ASS-stage { overflow: hidden; z-index: 2147483647; pointer-events: none; position: absolute; top: 0; left: 0; } .ASS-dialogue { position: absolute; } .ASS-animation-paused * { animation-play-state: paused !important; }';
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
};
ASS.prototype.resize = function() {
  if (this.video) {
    var w = this.video.clientWidth,
        h = this.video.clientHeight;
    this.stage.style.width = w + 'px';
    this.stage.style.height = h + 'px';
    if (this.tree.ScriptInfo.PlayResX) {
      this.scale = Math.min(w / this.tree.ScriptInfo.PlayResX, h / this.tree.ScriptInfo.PlayResY);
    }
  }
  this._seek();
  this._createAnimation();
};
ASS.prototype.show = function() {
  this.stage.style.visibility = 'visible';
};
ASS.prototype.hide = function() {
  this.stage.style.visibility = 'hidden';
};
ASS.prototype._play = function() {
  var that = this;
  function scan() {
    that._launch();
    that.requestID = requestAnimationFrame(scan);
  }
  this.requestID = requestAnimationFrame(scan);
  this.stage.className = '';
};
ASS.prototype._pause = function() {
  cancelAnimationFrame(this.requestID);
  this.requestID = 0;
  this.stage.className = 'ASS-animation-paused';
};
ASS.prototype._seek = function() {
  var that = this,
      ct = this.video.currentTime;
  this.stage.innerHTML = '';
  this.runline = [];
  this.channel = [];
  this.position = (function() {
    var from = 0,
        to = that.tree.Events.Dialogue.length - 1;
    while (from + 1 < to && ct > that.tree.Events.Dialogue[(to + from) >> 1].End) from = (to + from) >> 1;
    for (var i = from; i < to; ++i) {
      if (that.tree.Events.Dialogue[i].End > ct && ct >= that.tree.Events.Dialogue[i].Start)
        return i;
    }
    return to;
  })();
  this._launch();
};
ASS.prototype._launch = function() {
  var ct = this.video.currentTime;
  for (var i = this.runline.length - 1; i >= 0; --i) {
    if (this.runline[i].End < ct) {
      if (!this.runline[i].pos) this._freeChannel(this.runline[i]);
      this.stage.removeChild(this.runline[i].node);
      this.runline.splice(i, 1);
    }
  }
  while (this.position < this.tree.Events.Dialogue.length &&
         ct >= this.tree.Events.Dialogue[this.position].End) {
    ++this.position;
  }
  while (this.position < this.tree.Events.Dialogue.length &&
         ct >= this.tree.Events.Dialogue[this.position].Start) {
    if (ct < this.tree.Events.Dialogue[this.position].End) {
      var dia = this._setStyle(this.tree.Events.Dialogue[this.position]);
      this.runline.push(dia);
    }
    ++this.position;
  }
};
ASS.prototype._parse = function(data) {
  data = data.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var lines = data.split('\n'),
      state = 0,
      _index = 0,
      tree = {
        ScriptInfo: {},
        V4Styles: { Format: {}, Style: {} },
        Events: { Format: {}, Dialogue: [] }
      };
  tree.ScriptInfo['Title'] = '&lt;untitled&gt;';
  tree.ScriptInfo['Original Script'] = '&lt;unknown&gt;';
  for (var i = 0; i < lines.length; ++i) {
    lines[i] = lines[i].replace(/^\s*|\s*$/g, '');
    if (/^;/.test(lines[i])) continue;

    if (/^\[Script Info\]/i.test(lines[i])) state = 1;
    else if (/^\[V4\+ Styles\]/i.test(lines[i])) state = 2;
    else if (/^\[Events\]/i.test(lines[i])) state = 3;
    else if (/^\[Fonts|Graphics\]/i.test(lines[i])) state = 4;

    if (state == 1) {
      if (/:/.test(lines[i])) {
        var tmp = lines[i].match(/(.*?)\s*:\s*(.*)/);
        if (!isNaN(tmp[2] * 1)) tmp[2] *= 1;
        tree.ScriptInfo[tmp[1]] = tmp[2];
      }
    }
    if (state == 2) {
      if (/^Format:/.test(lines[i])) {
        var tmp = lines[i].match(/Format:(.*)/);
        tree.V4Styles.Format = tmp[1].replace(/\s/g, '').split(',');
      }
      if (/^Style:/.test(lines[i])) {
        var tmp1 = lines[i].match(/Style:(.*)/)[1].split(','),
            tmp2 = {};
        for (var j = tmp1.length - 1; j >= 0; --j) {
          var tmp3 = tree.V4Styles.Format[j];
          tmp2[tmp3] = tmp1[j].match(/^\s*(.*)/)[1];
          if (!isNaN(tmp2[tmp3] * 1)) tmp2[tmp3] *= 1;
        }
        tree.V4Styles.Style[tmp2.Name] = tmp2;
      }
    }
    if (state == 3) {
      if (/^Format:/.test(lines[i])) {
        var tmp = lines[i].match(/Format:(.*)/);
        tree.Events.Format = tmp[1].replace(/\s/g,'').split(',');
      }
      if (/^Dialogue:/.test(lines[i])) {
        var tmp1 = lines[i].match(/Dialogue:(.*)/)[1].split(','),
            tmp2 = {};
        if (tmp1.length > tree.Events.Format.length) {
          var tmp3 = tmp1.slice(tree.Events.Format.length - 1).join();
          tmp1 = tmp1.slice(0, tree.Events.Format.length - 1);
          tmp1.push(tmp3);
        }
        for (var j = tree.Events.Format.length - 1; j >= 0; --j) {
          tmp2[tree.Events.Format[j]] = tmp1[j].match(/^\s*(.*)/)[1];
        }
        tmp2.Layer *= 1;
        tmp2.Start = this._timeParser(tmp2.Start, tree.ScriptInfo['Timer']);
        tmp2.End = this._timeParser(tmp2.End, tree.ScriptInfo['Timer']);
        tmp2.MarginL *= 1;
        tmp2.MarginR *= 1;
        tmp2.MarginV *= 1;
        tmp2.Style = tree.V4Styles.Style[tmp2.Style] ? tmp2.Style : 'Default';
        tmp2._index = ++_index;
        tmp2.parsedText = this._parseTags(tmp2, tree);
        if (tmp2.Start < tmp2.End) tree.Events.Dialogue.push(tmp2);
      }
    }
    if (state == 4) {
      continue;
    }
  }
  tree.Events.Dialogue.sort(function(a, b) {
    return (a.Start - b.Start) || (a.End - b.End) || (a._index - b._index);
  });
  return tree;
};
ASS.prototype._createBaseTags = function(style, tree) {
  var s = tree.V4Styles.Style[style];
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
    yshad: s.Shadow
  };
};
ASS.prototype._parseTags = function(dialogue, tree) {
  var text = dialogue.Text.replace(/\\n/g, (tree.ScriptInfo.WrapStyle == 2) ? '<br>' : '&nbsp;').replace(/\\N/g, '<br>').replace(/\\h/g, '&nbsp;'),
      kv = text.split(/{([^{}]*?)}/),
      prevTags = this._createBaseTags(dialogue.Style, tree),
      dia = {content: []};
  if (kv[0].length) dia.content.push({text: kv[0], tags: prevTags});
  for (var i = 1; i < kv.length; i += 2) {
    var ct = {text: kv[i + 1], tags: {}, _reuse: reuse},
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
      if (j != 't') ct.tags[j] = prevTags[j];
      else ct.tags[j] = JSON.parse(JSON.stringify(prevTags[j]));
    }
    for (var j = 0; j < cmd.length; ++j) {
      var tmp;
      ct._reuse(cmd[j]);
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
      if (/^an\d/.test(cmd[j]) && !dia.alignment) dia.alignment = cmd[j][2] * 1;
      if (/^a\d/.test(cmd[j]) && !dia.alignment) {
        tmp = cmd[j].match(/^a(\d+)/)[1] * 1;
        if (tmp < 4) {
          dia.alignment = tmp;
        } else if (tmp > 8) {
          dia.alignment = tmp - 5;
        } else dia.alignment = tmp + 2;
      }
      if (/^pos/.test(cmd[j]) && !dia.pos) {
        tmp = cmd[j].match(/^pos\(\s*(.*?)\s*,\s*(.*?)\s*\)/);
        dia.pos = {
          x: tmp[1] * 1,
          y: tmp[2] * 1
        };
      }
      if (/^org/.test(cmd[j]) && !dia.org) {
        tmp = cmd[j].match(/^org\(\s*(.*?)\s*,\s*(.*?)\s*\)/);
        dia.org = {
          x: tmp[1] * 1,
          y: tmp[2] * 1
        };
      }
      if (/^move/.test(cmd[j]) && !dia.move) {
        tmp = cmd[j].match(/^move\((.*)\)/)[1].split(/\s*,\s*/);
        for (var k = 0; k < tmp.length; k++) tmp[k] *= 1;
        if (tmp.length == 4) {
          tmp.push(0);
          tmp.push((dialogue.End - dialogue.Start) * 1000);
        }
        dia.move = tmp;
      }
      if (/^fad\(/.test(cmd[j]) && !dia.fad) {
        tmp = cmd[j].match(/^fad\((.*)\)/)[1].split(/\s*,\s*/);
        for (var k = 0; k < tmp.length; k++) tmp[k] *= 1;
        dia.fad = tmp;
      }
      if (/^fade/.test(cmd[j]) && !dia.fade) {
        tmp = cmd[j].match(/^fade\((.*)\)/)[1].split(/\s*,\s*/);
        for (var k = 0; k < tmp.length; k++) tmp[k] *= 1;
        dia.fade = tmp;
      }
      if (/^r/.test(cmd[j])) {
        tmp = cmd[j].match(/^r(.*)/)[1];
        ct.tags = this._createBaseTags((tree.V4Styles.Style[tmp] ? tmp : dialogue.Style), tree);
      }
      if (/^t\(/.test(cmd[j])) {
        if (!ct.tags.t) ct.tags.t = [];
        tmp = cmd[j].replace(/\s/g, '').match(/^t\((.*)\)/)[1].split(',');
        if (!tmp[0]) continue;
        var tcmd = tmp[tmp.length - 1].split('\\'),
            tct = {t1: 0, t2: (dialogue.End - dialogue.Start) * 1000, accel: 1, tags: {}, _reuse: reuse};
        for (var k = tcmd.length - 1; k >= 0; --k) tct._reuse(tcmd[k]);
        if (tmp.length == 2) {
          tct.accel = tmp[0] * 1;
        }
        if (tmp.length == 3) {
          tct.t1 = tmp[0] * 1;
          tct.t2 = tmp[1] * 1;
        }
        if (tmp.length == 4) {
          tct.t1 = tmp[0] * 1;
          tct.t2 = tmp[1] * 1;
          tct.accel = tmp[2] * 1;
        }
        ct.tags.t.push(tct);
      }
      if (/^p\d/.test(cmd[j])) ct.tags.p = cmd[j].match(/^p(\d+)/)[1] * 1;
      if (/^pbo/.test(cmd[j])) ct.tags.pbo = cmd[j].match(/^pbo(.*)/)[1] * 1;
    }
    if (ct.tags.t) {
      for (var j = 0; j < ct.tags.t.length - 1; ++j) {
        for (var k = j + 1; k < ct.tags.t.length; ++k) {
          if (ct.tags.t[j].t1 == ct.tags.t[k].t1 && ct.tags.t[j].t2 == ct.tags.t[k].t2) {
            for (var l in ct.tags.t[k].tags) ct.tags.t[j].tags[l] = ct.tags.t[k].tags[l];
            ct.tags.t.splice(k, 1);
          }
        }
      }
    }
    prevTags = ct.tags;
    dia.content.push(ct);
  }
  function reuse(cmd) {
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
      for (var k = 1; k <= 4; k++) {
        this.tags['a' + k] = cmd.match(/^alpha&H(\w\w)/)[1];
      }
    }
    if (/^clip/.test(cmd)) { // TODO
      tmp = cmd.match(/^clip\((.*)\)/)[1].split(/\s*,\s*/);
      if (tmp.length == 4) {
        for (var i = 0; i < tmp.length; i++) tmp[i] *= 1;
        this.tags.clip = tmp;
      }
      if (tmp.length == 1) this.tags.clip = {scale: 1, command: tmp[0]};
      if (tmp.length == 2) this.tags.clip = {scale: tmp[0] * 1, command: tmp[1]};
    }
    if (/^iclip/.test(cmd)) { // TODO
      tmp = cmd.match(/^iclip\((.*)\)/)[1].split(/\s*,\s*/);
      if (tmp.length == 4) {
        for (var i = 0; i < tmp.length; i++) tmp[i] *= 1;
        this.tags.iclip = tmp;
      }
      if (tmp.length == 1) this.tags.iclip = {scale: 1, command: tmp[0]};
      if (tmp.length == 2) this.tags.iclip = {scale: tmp[0] * 1, command: tmp[1]};
    }
  }
  return dia;
};
ASS.prototype._setStyle = function(data) {
  var pt = data.parsedText,
      s = this.tree.V4Styles.Style[data.Style],
      dia = {};
  dia.node = document.createElement('div');
  for (var i in s) dia[i] = s[i];
  dia.Layer = data.Layer;
  dia.Start = data.Start;
  dia.End = data.End;
  dia.MarginL = data.MarginL || dia.MarginL;
  dia.MarginR = data.MarginR || dia.MarginR;
  dia.MarginV = data.MarginV || dia.MarginV;
  dia.Effect = data.Effect;
  dia.channel = 0;
  if (pt.alignment) dia.Alignment = pt.alignment;
  if (pt.pos) dia.pos = pt.pos;
  if (pt.org) dia.org = pt.org;
  if (pt.move) dia.move = pt.move;
  if (pt.fad) dia.fad = pt.fad;
  if (pt.fade) dia.fade = pt.fade;

  this.stage.appendChild(dia.node);
  for (var i = 0; i < pt.content.length; ++i) {
    if (!pt.content[i].text) continue;
    var ctNode = document.createElement('span');
    ctNode.innerHTML = pt.content[i].text;
    dia.node.appendChild(ctNode);
    while (/<br>$/.test(ctNode.innerHTML)) {
      ctNode.innerHTML = ctNode.innerHTML.replace(/<br>$/, '');
      dia.node.appendChild(document.createElement('br'));
    }
    this._setTagsStyle(ctNode, pt.content[i].tags, data, i);
  }

  dia.node.className = 'ASS-dialogue';
  if (dia.Layer) dia.node.style.zIndex = dia.Layer;
  if (dia.move || dia.fad || dia.fade) {
    dia.node.style.animationName = 'ASS-animation-' + data._index;
    dia.node.style.animationDuration = (data.End - data.Start) + 's';
    dia.node.style.animationDelay = Math.min(0, data.Start - this.video.currentTime) + 's';
    dia.node.style.animationTimingFunction = 'linear';
    dia.node.style.animationIterationCount = 1;
  }
  if (dia.Alignment % 3 == 1) dia.node.style.textAlign = 'left';
  if (dia.Alignment % 3 == 2) dia.node.style.textAlign = 'center';
  if (dia.Alignment % 3 == 0) dia.node.style.textAlign = 'right';
  if (dia.pos) {
    if (dia.Alignment % 3 == 1) dia.node.style.left = this.scale * dia.pos.x + 'px';
    if (dia.Alignment % 3 == 2) dia.node.style.left = this.scale * dia.pos.x - dia.node.clientWidth / 2 + 'px';
    if (dia.Alignment % 3 == 0) dia.node.style.left = this.scale * dia.pos.x - dia.node.clientWidth + 'px';
    if (dia.Alignment <= 3) dia.node.style.top = this.scale * dia.pos.y - dia.node.clientHeight + 'px';
    if (dia.Alignment >= 4 && dia.Alignment <= 6) dia.node.style.top = this.scale * dia.pos.y - dia.node.clientHeight / 2 + 'px';
    if (dia.Alignment >= 7) dia.node.style.top = this.scale * dia.pos.y + 'px';
  } else {
    if (dia.Alignment % 3 == 1) {
      dia.node.style.left = '0';
      dia.node.style.marginLeft = this.scale * dia.MarginL + 'px';
    }
    if (dia.Alignment % 3 == 2) {
      dia.node.style.left = (this.stage.clientWidth - dia.node.clientWidth) / 2 + 'px';
    }
    if (dia.Alignment % 3 == 0) {
      dia.node.style.right = '0';
      dia.node.style.marginRight = this.scale * dia.MarginR + 'px';
    }
    if (dia.clientWidth > this.stage.clientWidth - this.scale * (dia.MarginL + dia.MarginR)) {
      dia.node.style.marginLeft = this.scale * dia.MarginL + 'px';
      dia.node.style.marginRight = this.scale * dia.MarginR + 'px';
    }
    dia.node.style.top = this._getChannel(dia) + 'px';
  }
  return dia;
};
ASS.prototype._setTagsStyle = function(cn, t, data, index) {
  cn.style.fontFamily = '\'' + t.fn + '\', Arial';
  cn.style.fontSize = this.scale * this._getRealFontSize(t.fs, t.fn) + 'px';
  if (t.b == 0) cn.style.fontWeight = 'normal';
  else if (t.b == 1) cn.style.fontWeight = 'bold';
  else cn.style.fontWeight = t.b;
  cn.style.fontStyle = (t.i ? 'italic' : 'normal');
  if (t.u && t.i) cn.style.textDecoration = 'underline line-through';
  else if (t.u) cn.style.textDecoration = 'underline';
  else if (t.s) cn.style.textDecoration = 'line-through';
  cn.style.letterSpacing = this.scale * t.fsp + 'px';
  if (t.q == 0) {} // TODO
  if (t.q == 1) {
    cn.style.wordBreak = 'break-all';
    cn.style.whiteSpace = 'normal';
  }
  if (t.q == 2) {
    cn.style.wordBreak = 'normal';
    cn.style.whiteSpace = 'nowrap';
  }
  if (t.q == 3) {} // TODO

  if (t.fax || t.fay || t.frx || t.fry || t.frz || t.fscx != 100 || t.fscy != 100) {
    cn.style.transform = 'perspective(400px)';
    cn.style.display = 'inline-block';
    cn.style.wordBreak = 'normal';
    cn.style.whiteSpace = 'nowrap';
  }
  if (t.p) {
    var tmp = cn.innerText;
    cn.innerHTML = this._createSVG(t, tmp);
    if (t.pbo) cn.style.transform += ' translateY(' + this.scale * t.pbo + 'px)';
  } else {
    cn.style.fontSize = this.scale * this._getRealFontSize(t.fs, t.fn) + 'px';
    cn.style.color = this._toRGBA(t.a1 + t.c1);
    cn.style.textShadow = this._createShadow(t.a3 + t.c3, t.xbord, t.ybord, t.a4 + t.c4, t.xshad, t.yshad, t.blur);
    if (t.fscx != 100 || t.fscy != 100) cn.style.transform += ' scale(' + t.fscx / 100 + ', ' + t.fscy / 100 + ')';
  }
  if (t.fax || t.fay) cn.style.transform += ' skew(' + Math.atan(t.fax) + ', ' + Math.atan(t.fay) + ')';
  if (t.fry) cn.style.transform += ' rotateY(' + t.fry + 'deg)';
  if (t.frx) cn.style.transform += ' rotateX(' + t.frx + 'deg)';
  if (t.frz) cn.style.transform += ' rotateZ(' + (-t.frz) + 'deg)';
  if (t.t) {
    cn.style.animationName = 'ASS-animation-' + data._index + '-' + index;
    cn.style.animationDuration = (data.End - data.Start) + 's';
    cn.style.animationDelay = Math.min(0, data.Start - this.video.currentTime) + 's';
    cn.style.animationTimingFunction = 'linear';
    cn.style.animationIterationCount = 1;
  }
};
ASS.prototype._getChannel = function(dia) {
  var that = this,
      L = dia.Layer,
      SW = this.stage.clientWidth - dia.MarginL - dia.MarginR,
      SH = this.stage.clientHeight,
      W = dia.node.clientWidth,
      H = dia.node.clientHeight,
      V = dia.MarginV,
      count = 0;
  if (!this.channel[L]) {
    this.channel[L] = {
      left: new Uint16Array(SH + 1),
      middle: new Uint16Array(SH + 1),
      right: new Uint16Array(SH + 1)
    };
  }
  function judge(x) {
    var l = that.channel[L].left[x],
        m = that.channel[L].middle[x],
        r = that.channel[L].right[x];
    if ((l + m + r > 0) &&
        ( (dia.Alignment % 3 == 1 && (l || (m && W + m / 2 > SW / 2) || (W + r > SW))) ||
          (dia.Alignment % 3 == 2 && ((2 * l + W > SW) || m || (2 * r + W > SW))) ||
          (dia.Alignment % 3 == 0 && ((l + W > SW) || (m && W + m / 2 > SW / 2) || r))
        )) {
      count = 0;
    } else ++count;
    if (count >= H) {
      dia.channel = x;
      return true;
    } else return false;
  }
  if (dia.Alignment <= 3) {
    for (var i = SH - V - 1; i > V; --i)
      if (judge(i)) break;
  } else if (dia.Alignment >= 7) {
    for (var i = V + 1; i < SH - V; ++i)
      if (judge(i)) break;
  } else {
    for (var i = (SH - H) >> 1; i < SH - V; ++i) {
      if (judge(i)) break;
    }
  }
  if (dia.Alignment > 3) dia.channel -= H - 1;
  for (var i = dia.channel; i < dia.channel + H; ++i) {
    if (dia.Alignment % 3 == 1) {
      this.channel[L].left[i] = W;
    } else if (dia.Alignment % 3 == 2) {
      this.channel[L].middle[i] = W;
    } else {
      this.channel[L].right[i] = W;
    }
  }
  return dia.channel;
};
ASS.prototype._freeChannel = function(dia) {
  for (var i = dia.channel; i <= dia.channel + dia.node.clientHeight; ++i) {
    if (dia.Alignment % 3 == 1) {
      this.channel[dia.Layer].left[i] = 0;
    } else if (dia.Alignment % 3 == 2) {
      this.channel[dia.Layer].middle[i] = 0;
    } else {
      this.channel[dia.Layer].right[i] = 0;
    }
  }
};
ASS.prototype._timeParser = function(time, timer) {
  var t = time.match(/(.*):(.*):(.*)/),
      tr = timer ? (timer / 100) : 1;
  return (t[1] * 3600 + t[2] * 60 + t[3] * 1) * tr;
};
ASS.prototype._toRGBA = function(c) {
  var t = c.match(/(\w\w)(\w\w)(\w\w)(\w\w)/),
      a = (1 - parseInt(t[1], 16) / 255).toFixed(1),
      b = parseInt(t[2], 16),
      g = parseInt(t[3], 16),
      r = parseInt(t[4], 16);
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
};
ASS.prototype._createShadow = function(oc, ox, oy, sc, sx, sy, blur) {
  oc = this._toRGBA(oc);
  sc = this._toRGBA(sc);
  var ts = '';
  blur = blur || 0;
  if (!(ox + oy + sx + sy)) return 'none';
  if (!/No/i.test(this.tree.ScriptInfo['ScaledBorderAndShadow'])) {
    ox *= this.scale;
    oy *= this.scale;
    sx *= this.scale;
    sy *= this.scale;
  }
  if (ox || oy) {
    for (var i = -1; i <= 1; ++i)
      for (var j = -1; j <= 1; ++j) {
        for (var x = 1; x < ox; ++x)
          for (var y = 1; y < oy; ++y)
            if (i || j)
              ts += oc + ' ' + i * x + 'px ' + j * y + 'px, ';
        ts += oc + ' ' + i * ox + 'px ' + j * oy + 'px, ';
      }
  }
  if (sx || sy) {
    for (var x = Math.max(sx - ox, ox); x <= sx + ox; x++)
      for (var y = Math.max(sy - oy, ox); y <= sy + oy; y++)
        ts += sc + ' ' + x + 'px ' + y + 'px ' + blur + 'px, ';
    ts += sc + ' ' + (sx + ox) + 'px ' + (sy + oy) + 'px ' + blur + 'px';
  } else ts = ts.substr(0, ts.length - 2);
  return ts;
};
ASS.prototype._getRealFontSize = function(fs, fn) {
  var rfs,
      fse = document.createElement('div'),
      container = document.getElementById('ASS-container');
  fse.innerHTML = 'ASS.js';
  fse.style.fontFamily = '\'' + fn + '\', Arial';
  fse.style.fontSize = fs + 'px';
  fse.style.visibility = 'hidden';
  container.appendChild(fse);
  rfs = fs * fs / fse.clientHeight;
  container.removeChild(fse);
  return rfs;
};
ASS.prototype._createSVG = function(t, data) {
  var sx = t.fscx ? t.fscx / 100 : 1,
      sy = t.fscy ? t.fscy / 100 : 1,
      c = this._toRGBA(t.a1 + t.c1),
      s = this.scale / Math.pow(2, t.p - 1),
      tmp = this._parseDrawingCommands(t, data),
      svg = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' + tmp.w * s * sx + '" height="' + tmp.h * s * sy + '">\n<g transform="scale(' + s * sx + ' ' + s * sy + ')">\n<path d="' + tmp.d + '" fill="' + c + '">\n</path>\n</g>\n</svg>';
  return svg;
};
ASS.prototype._parseDrawingCommands = function(t, data) {
  data = data.replace(/^\s*|\s*$/g, '').replace(/\s+/g, ' ').toLowerCase();
  var ele = data.split(' '),
      cmd = [],
      cmds = [],
      minX = 2147483647,
      minY = 2147483647,
      maxX = 0,
      maxY = 0,
      str = '';
  for (var i = 0; i < ele.length; ++i) {
    if (/[mnlbspc]/.test(ele[i])) {
      if (cmd.length) cmds.push(cmd);
      cmd = [];
    }
    cmd.push(ele[i]);
  }
  cmds.push(cmd);
  cmd = [];
  for (var i = cmds.length - 1; i >= 0; --i) {
    if (cmds[i][0] == 'p') {
      cmd.push(cmds[i][2]);
      cmd.push(cmds[i][1]);
      cmds.splice(i, 1);
    } else if (cmds[i][0] == 's') {
      cmds[i] = cmds[i].concat(cmd.reverse());
    } else {
      cmd = [];
    }
  }
  for (var i = cmds.length - 1; i >= 0; --i) {
    if (/m/.test(cmds[i][0])) cmds[i][0] = 'M';
    if (/n|l/.test(cmds[i][0])) cmds[i][0] = 'L';
    if (/b|s/.test(cmds[i][0])) cmds[i][0] = 'C';
    for (var j = 1; j < cmds[i].length + (cmds[i].length & 1) - 1; j += 2) {
      cmds[i][j] *= 1;
      cmds[i][j + 1] *= 1;
      if (cmds[i][j] < minX) minX = cmds[i][j];
      if (cmds[i][j + 1] < minY) minY = cmds[i][j + 1];
      if (cmds[i][j] > maxX) maxX = cmds[i][j];
      if (cmds[i][j + 1] > maxY) maxY = cmds[i][j + 1];
    }
  }
  for (var i = cmds.length - 1; i >= 0; --i) {
    for (var j = 1; j < cmds[i].length + (cmds[i].length & 1) - 1; j += 2) {
      cmds[i][j] -= minX;
      cmds[i][j + 1] -= minY;
    }
  }
  for (var i = 0; i < cmds.length; ++i)
    for (var j = 0; j < cmds[i].length + (cmds[i].length & 1) - 1; ++j)
      str += cmds[i][j] + ' ';
  str += 'Z';
  if (t.pbo) t.pbo = Math.max(t.pbo - maxY + minY, 0);
  return {
    d: str,
    w: maxX - minX,
    h: maxY - minY
  };
};
ASS.prototype._createAnimation = function() {
  var dia = this.tree.Events.Dialogue,
      kfStr = '',
      that = this;
  for (var i = dia.length - 1; i >= 0; --i) {
    var pt = dia[i].parsedText,
        dur = (dia[i].End - dia[i].Start) * 1000,
        kf = {},
        t = [];
    if (!pt.fad && pt.fade && pt.fade.length == 2) pt.fad = pt.fade;
    if (pt.fad && pt.fad.length == 2) {
      t[0] = '0.000%';
      t[1] = (Math.min(dur, pt.fad[0]) / dur * 100).toFixed(3) + '%';
      t[2] = (Math.max(0, dur - pt.fad[1]) / dur * 100).toFixed(3) + '%';
      t[3] = '100.000%';
      for (var j = 0; j <= 3; j++) if (!kf[t[j]]) kf[t[j]] = {};
      kf[t[0]]['opacity'] = 0;
      kf[t[1]]['opacity'] = 1;
      kf[t[2]]['opacity'] = 1;
      kf[t[3]]['opacity'] = 0;
    }
    if (pt.fade && pt.fade.length == 7) {
      t[0] = '0.000%';
      for (var j = 1; j <= 4; ++j) t[j] = (Math.min(dur, pt.fade[j + 2]) / dur * 100).toFixed(3) + '%';
      t[5] = '100.000%';
      for (var j = 0; j <= 5; ++j) if (!kf[t[j]]) kf[t[j]] = {};
      for (var j = 0; j <= 5; ++j) kf[t[j]]['opacity'] = 1 - pt.fade[j >> 1] / 255;
    }
    if (pt.move && pt.move.length == 6) {
      if (!pt.pos) pt.pos = {x: 0, y: 0};
      if (pt.move.length == 6) {
        t[0] = '0.000%';
        t[1] = (Math.min(dur, pt.move[4]) / dur * 100).toFixed(3) + '%';
        t[2] = (Math.min(dur, pt.move[5]) / dur * 100).toFixed(3) + '%';
        t[3] = '100.000%';
        for (var j = 0; j <= 3; ++j) if (!kf[t[j]]) kf[t[j]] = {};
        for (var j = 0; j <= 3; ++j) kf[t[j]]['transform'] = 'translate(' + this.scale * (pt.move[j < 2 ? 0 : 2] - pt.pos.x) + 'px, ' + this.scale * (pt.move[j < 2 ? 1 : 3] - pt.pos.y) + 'px)';
      }
    }
    if (JSON.stringify(kf) != '{}') {
      kfStr += '@keyframes ASS-animation-' + dia[i]._index + ' { ';
      for (var j in kf) {
        kfStr += j + '{';
        for (var k in kf[j]) {
          kfStr += k + ': ' + kf[j][k] + ';';
        }
        kfStr += '} '
      }
      kfStr += '}\n';
    }

    for (var j = pt.content.length - 1; j >= 0; --j) {
      kf = {};
      var tags = pt.content[j].tags;
      if (tags.t) {
        for (var k = tags.t.length - 1; k >= 0; --k) {
          var ttags = tags.t[k].tags;
          t[0] = '0.000%';
          t[1] = (Math.min(dur, tags.t[k].t1 + .1) / dur * 100).toFixed(3) + '%';
          t[2] = (Math.min(dur, tags.t[k].t2) / dur * 100).toFixed(3) + '%';
          t[3] = '100.000%';
          for (var l = 0; l <= 3; ++l) if (!kf[t[l]]) kf[t[l]] = [];
          if (ttags.fs) {
            kf[t[0]]['font-size'] = this.scale * this._getRealFontSize(tags.fs, tags.fn) + 'px';
            kf[t[1]]['font-size'] = this.scale * this._getRealFontSize(tags.fs, tags.fn) + 'px';
            kf[t[2]]['font-size'] = this.scale * this._getRealFontSize(ttags.fs, tags.fn) + 'px';
            kf[t[3]]['font-size'] = this.scale * this._getRealFontSize(ttags.fs, tags.fn) + 'px';
          }
          if (ttags.fsp) {
            kf[t[0]]['letter-spacing'] = this.scale * tags.fsp + 'px';
            kf[t[1]]['letter-spacing'] = this.scale * tags.fsp + 'px';
            kf[t[2]]['letter-spacing'] = this.scale * ttags.fsp + 'px';
            kf[t[3]]['letter-spacing'] = this.scale * ttags.fsp + 'px';
          }
          if (ttags.c1 || ttags.a1) {
            if (!ttags.c1) ttags.c1 = tags.c1;
            if (!ttags.a1) ttags.a1 = tags.a1;
            kf[t[0]]['color'] = this._toRGBA(tags.a1 + tags.c1);
            kf[t[1]]['color'] = this._toRGBA(tags.a1 + tags.c1);
            kf[t[2]]['color'] = this._toRGBA(ttags.a1 + ttags.c1);
            kf[t[3]]['color'] = this._toRGBA(ttags.a1 + ttags.c1);
          }
          if (ttags.a1 && ttags.a2 && ttags.a3 && ttags.a4 &&
              ttags.a1 == ttags.a2 && ttags.a2 == ttags.a3 && ttags.a3 == ttags.a4) {
            kf[t[0]]['opacity'] = 1 - parseInt(tags.a1, 16) / 255;
            kf[t[1]]['opacity'] = 1 - parseInt(tags.a1, 16) / 255;
            kf[t[2]]['opacity'] = 1 - parseInt(ttags.a1, 16) / 255;
            kf[t[3]]['opacity'] = 1 - parseInt(ttags.a1, 16) / 255;
          }
          // if (ttags.c3 || ttags.a3 || ttags.c3 || ttags.a4 || ttags.xbord || ttags.ybord || ttags.xshad || ttags.yshad || ttags.blur) {
          //   ['c3', 'a3', 'c4', 'a4'].forEach(function(e) {
          //     if (!ttags[e]) ttags[e] = tags[e];
          //   });
          //   kf[t[0]]['text-shadow'] = this._createShadow(tags.a3 + tags.c3, tags.xbord, tags.ybord, tags.a4 + tags.c4, tags.xshad, tags.yshad, tags.blur);
          //   kf[t[1]]['text-shadow'] = this._createShadow(tags.a3 + tags.c3, tags.xbord, tags.ybord, tags.a4 + tags.c4, tags.xshad, tags.yshad, tags.blur);
          //   kf[t[2]]['text-shadow'] = this._createShadow(ttags.a3 + ttags.c3, ttags.xbord, ttags.ybord, ttags.a4 + ttags.c4, ttags.xshad, ttags.yshad, ttags.blur);
          //   kf[t[3]]['text-shadow'] = this._createShadow(ttags.a3 + ttags.c3, ttags.xbord, ttags.ybord, ttags.a4 + ttags.c4, ttags.xshad, ttags.yshad, ttags.blur);
          // }
          /* use matrix3d() */
          if (ttags.fscx != 100 || ttags.fscy != 100 || ttags.frx || ttags.fry || ttags.frz || ttags.fax || ttags.fay) {
            ['fscx', 'fscy', 'frx', 'fry', 'frz', 'fax', 'fay'].forEach(function(e) {
              if (!ttags[e]) ttags[e] = tags[e];
            });
            kf[t[0]]['transform'] = this._createTransform(tags);
            kf[t[1]]['transform'] = this._createTransform(tags);
            kf[t[2]]['transform'] = this._createTransform(ttags);
            kf[t[3]]['transform'] = this._createTransform(ttags);
          }
        }
      }
      if (JSON.stringify(kf) != '{}') {
        kfStr += '@keyframes ASS-animation-' + dia[i]._index + '-' + j + ' { ';
        for (var k in kf) {
          kfStr += k + '{';
          for (var l in kf[k]) {
            kfStr += l + ': ' + kf[k][l] + ';';
          }
          kfStr += '} '
        }
        kfStr += '}\n';
      }
    }
  }
  document.getElementById('ASS-animation').innerHTML = kfStr;
};
ASS.prototype._createMatrix3d = function(t) {
  // too slow
  var te = document.createElement('div'),
      container = document.getElementById('ASS-container'),
      str = 'perspective(400px)',
      matrix3d;
  if (t.fscx != 100 || t.fscy != 100) str += ' scale(' + t.fscx / 100 + ', ' + t.fscy / 100 + ')'
  if (t.fax || t.fay) str += ' skew(' + Math.atan(t.fax) + ', ' + Math.atan(t.fay) + ')';
  if (t.fry) str += ' rotateY(' + t.fry + 'deg)';
  if (t.frx) str += ' rotateX(' + t.frx + 'deg)';
  if (t.frz) str += ' rotateZ(' + (-t.frz) + 'deg)';
  te.innerHTML = 'ASS.js';
  te.style.visibility = 'hidden';
  te.style.transform = str;
  container.appendChild(te);
  matrix3d = window.getComputedStyle(te, null).getPropertyValue('transform');
  container.removeChild(te);
  return matrix3d;
};
ASS.prototype._createTransform = function(t) {
  var str = 'perspective(400px)';
  t.fax = t.fax || 0;
  t.fay = t.fay || 0;
  t.frx = t.frx || 0;
  t.fry = t.fry || 0;
  t.frz = t.frz || 0;
  str += ' scale(' + (t.p ? 1 : t.fscx / 100) + ', ' + (t.p ? 1 : t.fscy / 100) + ')';
  str += ' skew(' + Math.atan(t.fax) + ', ' + Math.atan(t.fay) + ')';
  str += ' rotateY(' + t.fry + 'deg)';
  str += ' rotateX(' + t.frx + 'deg)';
  str += ' rotateZ(' + (-t.frz) + 'deg)';
  return str;
};
// ASS.prototype._createSimulationPoints = function(a, num) {
//   if (a <= 0 || a == 1) return [0.000, 100.000];
//   a = a < 1 ? 1 / a : a;
//   var arr = [];
//   for (var i = 0; i <= num; i++) arr.push(Math.log(a * i / num) / Math.log(a - 1));
//   return arr;
// };
