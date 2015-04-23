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

  var CSSstr = '#ASS-stage { overflow: hidden; z-index: 2147483647; pointer-events: none; position: absolute; top: 0; left: 0; } .ASS-dialogue { position: absolute; } .ASS-dialogue div { display: inline; } .ASS-animation-paused * { animation-play-state: paused !important; }';
  for (var i in this.tree.V4Styles.Style) {
    var s = this.tree.V4Styles.Style[i],
        str = ' { ';
    str += 'font-family: \'' + s.Fontname + '\', Arial; ';
    str += 'color: ' + this._toRGBA(s.PrimaryColour) + '; ';
    str += 'font-weight: ' + ((s.Bold == -1) ? '900' : 'normal') + '; ';
    str += 'font-style: ' + ((s.Italic == -1) ? 'italic' : 'normal') + '; ';
    str += 'transform: scaleX(' + s.ScaleX / 100 + ') scaleY(' + s.ScaleY / 100 + ') rotateZ(' + (-s.Angle) + 'deg); ';
    str += 'background-color: ' + ((s.BorderStyle == 3) ? this._toRGBA(s.OutlineColour) : 'rgba(0, 0, 0, 0)') + '; ';
    if (s.Underline == -1 && s.StrikeOut == -1) str += 'text-decoration: underline line-through; ';
    else if (s.Underline == -1) str += 'text-decoration: underline; ';
    else if (s.StrikeOut == -1) str += 'text-decoration: line-through; ';
    else str += 'text-decoration: none; ';
    str += '}';
    CSSstr += ' .ASS-style-' + i + str;
  }
  // TODO: add CSS3 animation style
  var styleNode = document.createElement('style');
  styleNode.type = 'text/css';
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
    var m,
        l = 0,
        r = that.tree.Events.Dialogue.length - 1;
    while (l <= r) {
      m = (l + r) >> 1;
      if (ct < that.tree.Events.Dialogue[m].End) r = m - 1;
      else l = m + 1;
    }
    l = Math.min(l, that.tree.Events.Dialogue.length - 1);
    return Math.max(l, 0);
  })();
  this._launch();
};
ASS.prototype._launch = function() {
  var ct =this.video.currentTime,
      dia;
  for (var i = 0; i < this.runline.length; ++i) {
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
         this.tree.Events.Dialogue[this.position].Start <= ct &&
         ct < this.tree.Events.Dialogue[this.position].End) {
    dia = this._setStyle(this.tree.Events.Dialogue[this.position]);
    this.runline.push(dia);
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
        for (var j = 0; j < tmp1.length; ++j) {
          var tmp3 = tree.V4Styles.Format[j];
          tmp2[tmp3] = tmp1[j].match(/^\s*(.*)/)[1];
          if (!isNaN(tmp2[tmp3] * 1)) tmp2[tmp3] *= 1;
        }
        // tmp2.Fontsize = this._getRealFontSize(tmp2.Fontsize, tmp2.Fontname);
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
        for (var j = 0; j < tree.Events.Format.length; ++j) {
          tmp2[tree.Events.Format[j]] = tmp1[j].match(/^\s*(.*)/)[1];
        }
        tmp2.Layer *= 1;
        tmp2.Start = this._timeParser(tmp2.Start, tree.ScriptInfo['Timer']);
        tmp2.End = this._timeParser(tmp2.End, tree.ScriptInfo['Timer']);
        tmp2.MarginL *= 1;
        tmp2.MarginR *= 1;
        tmp2.MarginV *= 1;
        tmp2.parsedText = this._parseTags(tmp2, tree);
        tmp2._index = ++_index;
        if (tmp2.Start < tmp2.End) tree.Events.Dialogue.push(tmp2);
      }
    }
    if (state == 4) {
      continue;
    }
  }
  tree.Events.Dialogue.sort(function(a, b) {
    return (a.Start - b.Start) || (a._index - b._index);
  });
  return tree;
};
ASS.prototype._parseTags = function(dialogue, tree) {
  var text = dialogue.Text.replace(/\\n/g, (tree.ScriptInfo.wrapStyle == 2) ? '<br>' : '&nbsp;').replace(/\\N/g, '<br>').replace(/\\h/g, '&nbsp;'),
      style = tree.V4Styles.Style[dialogue.Style] ? dialogue.Style : 'Default',
      dia = {resets: []},
      rs = {style: style, content: []},
      kv = text.split(/{([^{}]*?)}/);
  if (kv[0].length) rs.content.push({text: kv[0], tags: {}});
  for (var i = 1; i < kv.length; i += 2) {
    var ct = {text: kv[i + 1], tags: {}, _reuse: reuse},
        cmd = kv[i].split('\\'); // split(/(?<!\(.*?)\\(?!.*?\))/)
    for (var j = 0; j < cmd.length; j++) {
      if (/^t\(/.test(cmd[j])) {
        while (!/\)$/.test(cmd[j + 1])) {
          cmd[j] += '\\' + cmd[j + 1];
          cmd.splice(j + 1, 1);
        }
        cmd[j] += '\\' + cmd[j + 1];
        cmd.splice(j + 1, 1);
      }
    }
    for (var j = 0; j < cmd.length; j++) {
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
      if (/^fade/.test(cmd[j]) && !dia.fade) { // TODO
        tmp = cmd[j].match(/^fade\((.*)\)/)[1].split(/\s*,\s*/);
        // if (tmp.length == 2) {};
        for (var k = 0; k < tmp.length; k++) tmp[k] *= 1;
        dia.fade = tmp;
      }
      if (/^r/.test(cmd[j])) {
        tmp = cmd[j].match(/^r(.*)/)[1];
        ct.tags = {};
        dia.resets.push(rs);
        rs = {style: (tree.V4Styles.Style[tmp] ? tmp : style), content: []};
      }
      if (/^t\(/.test(cmd[j])) {
        if (!ct.tags.t) ct.tags.t = [];
        tmp = cmd[j].replace(/\s/g, '').match(/^t\((.*)\)/)[1].split(',');
        if (!tmp[0]) continue;
        var tcmd = tmp[tmp.length - 1].split('\\'),
            tct = {t1: dialogue.Start, t2: dialogue.End, accel: 1, tags: {}, _reuse: reuse};
        for (var k = 0; k < tcmd.length; k++) tct._reuse(tcmd[k]);
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
    rs.content.push(ct);
  }
  dia.resets.push(rs);
  function reuse(cmd) {
    var tmp;
    if (/^fs[\d\+\-]/.test(cmd)) this.tags.fs = cmd.match(/^fs(.*)/)[1];
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
      s = this.tree.V4Styles.Style[pt.resets[0].style],
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



  for (var i = 0; i < pt.resets.length; i++) {
    var ct = pt.resets[i].content,
        rsNode = document.createElement('div'),
        prevNode = rsNode,
        sn = this.tree.V4Styles.Style[pt.resets[i].style],
        currStyle = {
          fn: sn.Fontname,
          fs: sn.Fontsize,
          c1: sn.PrimaryColour,
          c2: sn.SecondaryColour,
          c3: sn.OutlineColour,
          c4: sn.BackColour,
          ox: sn.Outline,
          oy: sn.Outline,
          sx: sn.Shadow,
          sy: sn.Shadow,
          blur: 0,
          fscx: 100,
          fscy: 100,
          frx: 0,
          fry: 0,
          frz: 0,
          fax: 0,
          fay: 0,
          p: 0,
          pbo: 0
        };
    rsNode.className = 'ASS-style-' + pt.resets[i].style;
    for (var j = 0; j < ct.length; j++) {
      var ctNode = document.createElement('div'),
          textNode = document.createElement('span');
      textNode.innerHTML = ct[j].text;
      ctNode.appendChild(textNode);
      while (/<br>$/.test(textNode.innerHTML)) {
        textNode.innerHTML = textNode.innerHTML.replace(/<br>$/, '');
        ctNode.appendChild(document.createElement('br'));
      }
      prevNode.appendChild(ctNode);
      prevNode = ctNode;
      this._setTagsStyle(ctNode, textNode, ct[j].tags, currStyle);
    }
    dia.node.appendChild(rsNode);
  }
  this.stage.appendChild(dia.node);

  dia.node.className = 'ASS-dialogue';
  dia.node.style.letterSpacing = this.scale * dia.Spacing + 'px';
  if (dia.move || dia.fad || dia.fade) {
    dia.node.style.animationName = 'ASS-animation-' + data._index;
    dia.node.style.animationDuration = (data.End - data.Start) + 's';
    dia.node.style.animationDelay = Math.min(0, data.Start - this.video.currentTime) + 's';
    dia.node.style.animationTimingFunction = 'linear';
    dia.node.style.animationIterationCount = 1;
  }
  if (dia.BorderStyle == 1) dia.node.style.textShadow = this._createShadow(dia.OutlineColour, dia.Outline, dia.Outline, dia.BackColour, dia.Shadow, dia.Shadow, 0);
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
ASS.prototype._setTagsStyle = function(cn, tn, t, cs) {
  for (var i in t) {
    if (i == 'b') {
      if (t.b == 0) cn.style.fontWeight = 'normal';
      else if (t.b == 1) cn.style.fontWeight = 'bold';
      else cn.style.fontWeight = t.b;
    }
    if (i == 'i') cn.style.fontStyle = (t.i ? 'italic' : 'normal');
    if (i == 'u') cn.style.textDecoration += (t.u ? ' underline' : '');
    if (i == 's') cn.style.textDecoration += (t.s ? ' line-through' : '');
    if (i == 'xbord') cs.ox = t.xbord;
    if (i == 'ybord') cs.oy = t.ybord;
    if (i == 'xshad') cs.sx = t.xshad;
    if (i == 'yshad') cs.sy = t.yshad;
    if (i == 'fn') {
      cs.fn = t.fn;
      cn.style.fontFamily = '\'' + t.fn + '\', Arial';
    }
    if (i == 'fs') {
      if (/^\d/.test(t.fs)) cs.fs = t.fs * 1;
      if (/^\+|-/.test(t.fs)) cs.fs *= (t.fs * 1 > -10 ? (10 + t.fs * 1) / 10 : 1);
    }
    if (i == 'fsp') cn.style.letterSpacing = this.scale * t.fsp + 'px';
    if (/fscx|fscy|frx|fry|frz|fax|fay|blur/.test(i)) cs[i] = t[i];
    if (/c\d/.test(i)) cs[i] = cs[i].replace(/\w{6}$/, t[i]);
    if (/a\d/.test(i)) cs['c' + i[1]] = cs['c' + i[1]].replace(/&H\w\w/, '&H' + t[i]);
    if (i == 'k') {}
    if (i == 'kf') {}
    if (i == 'ko') {}
    if (i == 'kt') {}
    if (i == 'q') {
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
    }
    if (i == 'p' || i == 'pbo') cs[i] = t[i];
    if (i == 'clip') {}
    if (i == 'iclip') {}
  }
  if (cs.fax || cs.fay || cs.frx || cs.fry || cs.frz || cs.fscx != 100 || cs.fscy != 100) {
    tn.style.transform = 'perspective(400px)';
    tn.style.display = 'inline-block';
    tn.style.wordBreak = 'normal';
    tn.style.whiteSpace = 'nowrap';
  }
  if (cs.p) {
    var data = tn.innerText;
    tn.innerHTML = this._createSVG(cs, data);
  } else {
    cn.style.fontSize = this.scale * this._getRealFontSize(cs.fs, cs.fn) + 'px';
    cn.style.color = this._toRGBA(cs.c1);
    cn.style.textShadow = this._createShadow(cs.c3, cs.ox, cs.oy, cs.c4, cs.sx, cs.sy, cs.blur);
    if (cs.fax || cs.fay) tn.style.transform += ' skew(' + Math.atan(cs.fax) + ', ' + Math.atan(cs.fay) + ')';
    if (cs.fscx != 100 || cs.fscy != 100) tn.style.transform += ' scale(' + cs.fscx / 100 + ', ' + cs.fscy / 100 + ')';
  }
  if (cs.fry) tn.style.transform += ' rotateY(' + cs.fry + 'deg)';
  if (cs.frx) tn.style.transform += ' rotateX(' + cs.frx + 'deg)';
  if (cs.frz) tn.style.transform += ' rotateZ(' + (-cs.frz) + 'deg)';
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
    for (var i = SH - V; i >= V; --i)
      if (judge(i)) break;
  } else if (dia.Alignment >= 7) {
    for (var i = V; i <= SH - V; ++i)
      if (judge(i)) break;
  } else {
    for (var i = (SH - H) >> 1; i <= SH - V; ++i) {
      if (judge(i)) break;
    }
  }
  if (dia.Alignment > 3) dia.channel -= H;
  for (var i = dia.channel; i <= dia.channel + H; ++i) {
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
  var t = c.match(/&H(\w\w)(\w\w)(\w\w)(\w\w)/),
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
  if (blur == undefined) blur = 0;
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
ASS.prototype._createSVG = function(cs, data) {
  var sx = cs.fscx ? cs.fscx / 100 : 1,
      sy = cs.fscy ? cs.fscy / 100 : 1,
      c1 = this._toRGBA(cs.c1),
      s = this.scale / Math.pow(2, cs.p - 1),
      tmp = this._parseDrawingCommands(cs.pbo, data),
      svg = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' + tmp.w * s * sx + '" height="' + tmp.h * s * sy + '">\n<g transform="scale(' + s * sx + ' ' + s * sy + ')">\n<path d="' + tmp.d + '" fill="' + c1 + '">\n</path>\n</g>\n</svg>'
  return svg;
};
ASS.prototype._parseDrawingCommands = function(pbo, data) {
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
  for (var i = cmds.length - 1; i >= 0; i--) {
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
  for (var i = 0; i < cmds.length; i++) {
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
  for (var i = 0; i < cmds.length; i++) {
    for (var j = 1; j < cmds[i].length + (cmds[i].length & 1) - 1; j += 2) {
      cmds[i][j] -= minX;
      cmds[i][j + 1] -= minY;
    }
  }
  for (var i = 0; i < cmds.length; i++)
    for (var j = 0; j < cmds[i].length + (cmds[i].length & 1) - 1; j++)
      str += cmds[i][j] + ' ';
  str += 'Z';
  return {
    d: str,
    w: maxX - minX,
    h: maxY -minY
  };
};
ASS.prototype._createAnimation = function() {
  var dia = this.tree.Events.Dialogue;
  var kfStr = '';
  for (var i = 0; i < dia.length; i++) {
    var pt = dia[i].parsedText;
    var kf = {};
    var dur = (dia[i].End - dia[i].Start) * 1000,
        t = [];
    if (!pt.fad && pt.fade && pt.fade.length == 2) pt.fad = pt.fade;
    if (pt.fad && pt.fad.length == 2) {
      t[0] = '0.000%';
      t[1] = (Math.min(dur, pt.fad[0]) / dur * 100).toFixed(3) + '%';
      t[2] = (Math.max(0, dur - pt.fad[1]) / dur * 100).toFixed(3) + '%';
      t[3] = '100.000%'
      for (var j = 0; j <= 3; j++) if (!kf[t[j]]) kf[t[j]] = [];
      kf[t[0]].push('opacity: 0;');
      kf[t[1]].push('opacity: 1;');
      kf[t[2]].push('opacity: 1;');
      kf[t[3]].push('opacity: 0;');
    }
    if (pt.fade && pt.fade.length == 7) {
      t[0] = '0.000%';
      for (var j = 1; j <= 4; j++) t[j] = (Math.min(dur, pt.fade[j + 2]) / dur * 100).toFixed(3) + '%';
      t[5] = '100.000%'
      for (var j = 0; j <= 5; j++) if (!kf[t[j]]) kf[t[j]] = [];
      kf[t[0]].push('opacity: ' + (1 - pt.fade[0] / 255) + ';');
      kf[t[1]].push('opacity: ' + (1 - pt.fade[0] / 255) + ';');
      kf[t[2]].push('opacity: ' + (1 - pt.fade[1] / 255) + ';');
      kf[t[3]].push('opacity: ' + (1 - pt.fade[1] / 255) + ';');
      kf[t[4]].push('opacity: ' + (1 - pt.fade[2] / 255) + ';');
      kf[t[5]].push('opacity: ' + (1 - pt.fade[2] / 255) + ';');
    }
    if (pt.move && pt.move.length == 6) {
      if (!pt.pos) pt.pos = {x: 0, y: 0};
      if (pt.move.length == 6) {
        t[0] = '0.000%';
        t[1] = (Math.min(dur, pt.move[4]) / dur * 100).toFixed(3) + '%';
        t[2] = (Math.min(dur, pt.move[5]) / dur * 100).toFixed(3) + '%';
        t[3] = '100.000%';
        for (var j = 0; j <= 3; j++) if (!kf[t[j]]) kf[t[j]] = [];
        // TODO: translate() will overwrite it's own transform, add matrix3d()
        kf[t[0]].push('transform: translate(' + this.scale * (pt.move[0] - pt.pos.x) + 'px, ' + this.scale * (pt.move[1] - pt.pos.y) + 'px);');
        kf[t[1]].push('transform: translate(' + this.scale * (pt.move[0] - pt.pos.x) + 'px, ' + this.scale * (pt.move[1] - pt.pos.y) + 'px);');
        kf[t[2]].push('transform: translate(' + this.scale * (pt.move[2] - pt.pos.x) + 'px, ' + this.scale * (pt.move[3] - pt.pos.y) + 'px);');
        kf[t[3]].push('transform: translate(' + this.scale * (pt.move[2] - pt.pos.x) + 'px, ' + this.scale * (pt.move[3] - pt.pos.y) + 'px);');
      }
    }
    if (JSON.stringify(kf) != '{}') {
      kfStr += '@keyframes ASS-animation-' + dia[i]._index + ' { ';
      for (var j in kf) {
        kfStr += j + ' {' + kf[j].join(' ') + '} ';
      }
      kfStr += '}\n';
    }
  }
  document.getElementById('ASS-animation').innerHTML = kfStr;
};
