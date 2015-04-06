"use strict";
function ASS() {
  this.tree = {
    ScriptInfo: {},
    V4Styles: {
      Format: {},
      Style: {}
    },
    Events: {
      Format: {},
      Dialogue: []
    }
  };
  this.position = 0;
  this.runline = [];
  this.channel = [];
  this.scale = 1;
  this.stage = document.createElement('div');

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
      return msFullscreen;
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
    document.fullscreenElement
  }
}
ASS.prototype.init = function(data, video) {
  var that = this;
  if (video && !this.video) {
    this.video = video;
    var container = document.createElement('div');
    container.id = 'ASS-container';
    this.video.parentNode.insertBefore(container, this.video);
    container.style.position = this.video.style.position;
    this.video.style.position = 'absolute';
    container.appendChild(this.video);

    this.stage.id = 'ASS-stage';
    this.stage.style.position = 'absolute';
    this.stage.style.overflow = 'hidden';
    this.stage.style.pointerEvents = 'none';
    this.stage.style.zIndex = 2147483647;
    this.stage.style.top = 0;
    this.stage.style.left = 0;
    container.appendChild(this.stage);

    this.video.addEventListener('seeking', function() {
      for (var i = that.stage.childNodes.length - 1; i >= 0; --i) {
        that.stage.removeChild(that.stage.childNodes[i]);
      }
      that.runline = [];
      that.channel = [];
      that.position = (function() {
        var m,
            l = 0,
            r = that.tree.Events.Dialogue.length - 1;
        while (l <= r) {
          m = Math.floor((l + r) / 2);
          if (that.video.currentTime <= that.tree.Events.Dialogue[m].End) r = m - 1;
          else l = m + 1;
        }
        l = Math.min(l, that.tree.Events.Dialogue.length - 1);
        return Math.max(l, 0);
      })();
    });
    this.video.addEventListener('timeupdate', function() {
      for (var i = 0; i < that.runline.length; ++i) {
        if (that.runline[i].End < that.video.currentTime) {
          that._freeChannel(that.runline[i]);
          that.stage.removeChild(that.runline[i]);
          that.runline.splice(i, 1);
        }
      }
      if (that.position < that.tree.Events.Dialogue.length) {
        while (that.tree.Events.Dialogue[that.position].Start <= that.video.currentTime && that.video.currentTime < that.tree.Events.Dialogue[that.position].End) {
          that._launch(that.tree.Events.Dialogue[that.position]);
          ++that.position;
          if (that.position >= that.tree.Events.Dialogue.length) break;
        }
      }
    });
  }

  if (!data) return;

  data = data.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var lines = data.split('\n'),
      state = 0,
      _index = 0;
  this.tree.ScriptInfo['Title'] = '&lt;untitled&gt;';
  this.tree.ScriptInfo['Original Script'] = '&lt;unknown&gt;';
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
        this.tree.ScriptInfo[tmp[1]] = tmp[2];
      }
    }
    if (state == 2) {
      if (/^Format:/.test(lines[i])) {
        var tmp = lines[i].match(/Format:(.*)/);
        this.tree.V4Styles.Format = tmp[1].replace(/\s/g, '').split(',');
      }
      if (/^Style:/.test(lines[i])) {
        var tmp1 = lines[i].match(/Style:(.*)/)[1].split(','),
            tmp2 = {};
        for (var j = 0; j < tmp1.length; ++j) {
          var tmp3 = this.tree.V4Styles.Format[j];
          tmp2[tmp3] = tmp1[j].match(/^\s*(.*)/)[1];
          if (!isNaN(tmp2[tmp3] * 1)) tmp2[tmp3] *= 1;
        }
        tmp2.Fontsize = this._getRealFontSize(tmp2.Fontsize, tmp2.Fontname);
        this.tree.V4Styles.Style[tmp2.Name] = tmp2;
      }
    }
    if (state == 3) {
      if (/^Format:/.test(lines[i])) {
        var tmp = lines[i].match(/Format:(.*)/);
        this.tree.Events.Format = tmp[1].replace(/\s/g,'').split(',');
      }
      if (/^Dialogue:/.test(lines[i])) {
        var tmp1 = lines[i].match(/Dialogue:(.*)/)[1].split(','),
            tmp2 = {};
        if (tmp1.length > this.tree.Events.Format.length) {
          var tmp3 = tmp1.slice(this.tree.Events.Format.length - 1).join();
          tmp1 = tmp1.slice(0, this.tree.Events.Format.length - 1);
          tmp1.push(tmp3);
        }
        for (var j = 0; j < this.tree.Events.Format.length; ++j) {
          tmp2[this.tree.Events.Format[j]] = tmp1[j].match(/^\s*(.*)/)[1];
        }
        tmp2.Start = this._timeParser(tmp2.Start);
        tmp2.End = this._timeParser(tmp2.End);
        tmp2.MarginL *= 1;
        tmp2.MarginR *= 1;
        tmp2.MarginV *= 1;
        tmp2._index = ++_index;
        if (tmp2.Start < tmp2.End) this.tree.Events.Dialogue.push(tmp2);
      }
    }
    if (state == 4) {
      continue;
    }
  }
  if (this.video && (!this.tree.ScriptInfo.PlayResX || !this.tree.ScriptInfo.PlayResY)) {
    this.tree.ScriptInfo.PlayResX = this.video.clientWidth;
    this.tree.ScriptInfo.PlayResY = this.video.clientHeight;
  }
  var CSSstr = '';
  for (var i in this.tree.V4Styles.Style) {
    var s = this.tree.V4Styles.Style[i],
        str = '{';
    str += 'font-family: \'' + s.Fontname + '\', Arial;';
    str += 'color: ' + this._toRGBA(s.PrimaryColour) + ';';
    str += 'font-weight: ' + ((s.Bold == -1) ? '900' : 'normal') + ';';
    str += 'font-style: ' + ((s.Italic == -1) ? 'italic' : 'normal') + ';';
    str += 'text-decoration: ' + ((s.Underline == -1) ? ' underline' : '') + ((s.StrikeOut == -1) ? ' line-through' : '') + ';';
    str += '-webkit-transform: scaleX(' + s.ScaleX / 100 + ') scaleY(' + s.ScaleY / 100 + ') rotateZ(' + (-s.Angle) + 'deg);';
    str += '-moz-transform: scaleX(' + s.ScaleX / 100 + ') scaleY(' + s.ScaleY / 100 + ') rotateZ(' + (-s.Angle) + 'deg);';
    str += '-ms-transform: scaleX(' + s.ScaleX / 100 + ') scaleY(' + s.ScaleY / 100 + ') rotateZ(' + (-s.Angle) + 'deg);';
    str += 'transform: scaleX(' + s.ScaleX / 100 + ') scaleY(' + s.ScaleY / 100 + ') rotateZ(' + (-s.Angle) + 'deg);';
    if (s.BorderStyle == 3) str += 'background-color: ' + s.OutlineColour + ';';
    if (this.tree.ScriptInfo.WrapStyle == 1) str += 'word-break: break-all;';
    if (this.tree.ScriptInfo.WrapStyle == 2) str += 'white-space: nowrap;';
    str += '}'
    CSSstr += '.ASS-style-' + i + str;
  }
  document.getElementsByTagName('head')[0].innerHTML += '<style>' + CSSstr + '</style>';
  this.tree.Events.Dialogue.sort(function(a, b) {
    return (a.Start - b.Start) || (a._index - b._index);
  });
  this.resize();
};
ASS.prototype.resize = function() {
  for (var i = this.stage.childNodes.length - 1; i >= 0; --i) {
    this.stage.removeChild(this.stage.childNodes[i]);
  }
  this.runline = [];
  this.channel = [];
  if (this.video) {
    var w = this.video.clientWidth,
        h = this.video.clientHeight;
    this.stage.style.width = w + 'px';
    this.stage.style.height = h + 'px';
    if (this.tree.ScriptInfo.PlayResX) {
      this.scale = Math.min(w / this.tree.ScriptInfo.PlayResX, h / this.tree.ScriptInfo.PlayResY);
    }
  }
};
ASS.prototype.show = function() {
  this.stage.style.visibility = 'visible';
};
ASS.prototype.hide = function() {
  this.stage.style.visibility = 'hidden';
};
ASS.prototype._launch = function(data) {
  var dia = document.createElement('div');
  this._setStyle(dia, data);
  this.runline.push(dia);
};
ASS.prototype._setStyle = function(dia, data) {
  var s = this.tree.V4Styles.Style[data.Style] || this.tree.V4Styles.Style['Default'];
  for (var i in s) {
    dia[i] = s[i];
  }
  dia.Layer = data.Layer;
  dia.Start = data.Start;
  dia.End = data.End;
  dia.MarginL = data.MarginL || dia.MarginL;
  dia.MarginR = data.MarginR || dia.MarginR;
  dia.MarginV = data.MarginV || dia.MarginV;
  dia.Effect = data.Effect;

  dia.className = 'ASS-style-' + dia.Name;
  dia.style.position = 'absolute';
  dia.style.fontSize = this.scale * dia.Fontsize + 'px';
  dia.style.letterSpacing = this.scale * dia.Spacing + 'px';
  if (dia.BorderStyle == 1) {
    dia.style.textShadow = this._createShadow(dia.OutlineColour, dia.Outline, dia.BackColour, dia.Shadow);
  }

  this._parseCode(dia, data.Text);
  this.stage.appendChild(dia);

  // Solve WrapStyle first
  if (dia.pos) {
    var xy = dia.pos.match(/^pos\(\s*(.*?)\s*,\s*(.*?)\s*\)/);
    if (dia.Alignment % 3 == 1) {
      dia.style.left = this.scale * xy[1] + 'px';
      dia.style.textAlign = 'left';
    }
    if (dia.Alignment % 3 == 2) {
      dia.style.left = this.scale * xy[1] - dia.clientWidth / 2 + 'px';
      dia.style.textAlign = 'center';
    }
    if (dia.Alignment % 3 == 0) {
      dia.style.left = this.scale * xy[1] - dia.clientWidth + 'px';
      dia.style.textAlign = 'right';
    }
    if (dia.Alignment <= 3) dia.style.top = this.scale * xy[2] - dia.clientHeight + 'px';
    if (dia.Alignment >= 4 && dia.Alignment <= 6) dia.style.top = this.scale * xy[2] - dia.clientHeight / 2 + 'px';
    if (dia.Alignment >= 7) dia.style.top = this.scale * xy[2] + 'px';
  } else {
    if (dia.Alignment % 3 == 1) {
      dia.style.left = '0';
      dia.style.textAlign = 'left';
      dia.style.marginLeft = this.scale * dia.MarginL + 'px';
    }
    if (dia.Alignment % 3 == 2) {
      dia.style.left = (this.stage.clientWidth - dia.clientWidth) / 2 + 'px';
      dia.style.textAlign = 'center';
    }
    if (dia.Alignment % 3 == 0) {
      dia.style.right = '0';
      dia.style.textAlign = 'right';
      dia.style.marginRight = this.scale * dia.MarginR + 'px';
    }
    if (dia.clientWidth > this.stage.clientWidth - this.scale * (dia.MarginL + dia.MarginR)) {
      dia.style.marginLeft = this.scale * dia.MarginL + 'px';
      dia.style.marginRight = this.scale * dia.MarginR + 'px';
    }
    dia.channel = 0;
    dia.style.top = this._getChannel(dia) + 'px';
  }

  // TODO
  // if (/^Karaoke/i.test(data.Effect)) {}
  // if (/^Banner/i.test(data.Effect)) {}
  // if (/^Scroll up/i.test(data.Effect)) {}
  // if (/^Scroll down/i.test(data.Effect)) {}
};
ASS.prototype._parseCode = function(dia, text) {
  text = text.replace(/\\n/g, (this.tree.ScriptInfo.WrapStyle == 2) ? '<br>' : '&nbsp;');
  text = text.replace(/\\N/g, '<br>');
  text = text.replace(/\\h/g, '&nbsp;');
  var t = text.split('{'),
      nowFather = dia;
  dia.reset = false;
  dia.father = dia;
  for (var i = 0; i < t.length; ++i) {
    if (!/\}/.test(t[i])) {
      dia.innerHTML += t[i];
      continue;
    }
    var kv = t[i].split('}'),
        cmds = kv[0].split('\\'),
        diaChild = document.createElement('div');

    diaChild.father = nowFather;
    diaChild.father.appendChild(diaChild);

    diaChild.Fontsize = diaChild.father.Fontsize;
    diaChild.Fontname = diaChild.father.Fontname;
    diaChild.PrimaryColour = diaChild.father.PrimaryColour;
    diaChild.SecondaryColour = diaChild.father.SecondaryColour;
    diaChild.OutlineColour = diaChild.father.OutlineColour;
    diaChild.BackColour = diaChild.father.BackColour;
    diaChild.Outline = diaChild.father.Outline;
    diaChild.Shadow = diaChild.father.Shadow;
    diaChild.reset = false;

    diaChild.style.display = 'inline';
    diaChild.innerHTML = kv[1];
    for (var j = 0; j < cmds.length; ++j) {
      if (/^b\d/.test(cmds[j])) {
        if (cmds[j] == 'b0') diaChild.style.fontWeight = 'normal';
        else if (cmds[j] == 'b1') diaChild.style.fontWeight = 'bold';
        else diaChild.style.fontWeight = cmds[j].match(/^b(.*)/)[1];
      }
      if (cmds[j] == 'i0') diaChild.style.fontStyle = 'normal';
      if (cmds[j] == 'i1') diaChild.style.fontStyle = 'italic';
      if (cmds[j] == 'u1') diaChild.style.textDecoration += ' underline';
      if (cmds[j] == 's1') diaChild.style.textDecoration += ' line-through';
      if (/^bord/.test(cmds[j])) diaChild.Outline = cmds[j].match(/^bord(.*)/)[1];
      if (/^shad/.test(cmds[j])) diaChild.Shadow = cmds[j].match(/^shad(.*)/)[1];
      if (/^fn/.test(cmds[j])) diaChild.Fontname = cmds[j].match(/fn(.*)/)[1];
      if (/^fs\d/.test(cmds[j])) diaChild.Fontsize = this._getRealFontSize(cmds[j].match(/^fs(.*)/)[1], diaChild.Fontname);
      if (/^fs-\d/.test(cmds[j])) {
        var tt = cmds[j].match(/^fs-(.*)/)[1];
        if (tt > 9) tt = 0;
        diaChild.Fontsize *= (10 - tt) / 10;
      }
      if (/^fsc/.test(cmds[j])) {
        var tt = cmds[j].match(/^fsc(\w)(.*)/),
            tf = ' scale' + tt[1].toUpperCase() + '(' + tt[2] / 100 + ')';
        diaChild.style.webkitTransform += tf;
        diaChild.style.mozTransform += tf;
        diaChild.style.msTransform += tf;
        diaChild.style.transform += tf;
      }
      if (/^fsp/.test(cmds[j])) diaChild.style.letterSpacing = this.scale * cmds[j].match(/^fsp(.*)/)[1] + 'px';
      if (/^fr/.test(cmds[j])) {
        var tt = cmds[j].match(/^fr(\w)(.*)/);
        if (/^fr\d|\-/.test(cmds[j])) {
          tt[1] = 'z';
          tt[2] = cmds[j].match(/^fr(.*)/)[1];
        }
        diaChild['fr' + tt[1]] = tt[2];
        diaChild.style.display = 'inline-block';
        diaChild.style.whiteSpace = 'nowrap';
      }
      if (/^\d?c&H/.test(cmds[j])) {
        var tt = cmds[j].match(/^(\d?)c&H(\w+)/);
        while (tt[2].length < 6) tt[2] = '0' + tt[2];
        if (tt[1] == '1' || tt[1] == '') diaChild.PrimaryColour = diaChild.PrimaryColour.replace(/\w{6}$/, tt[2]);
        if (tt[1] == '2') diaChild.SecondaryColour = diaChild.SecondaryColour.replace(/\w{6}$/, tt[2]);
        if (tt[1] == '3') diaChild.OutlineColour = diaChild.OutlineColour.replace(/\w{6}$/, tt[2]);
        if (tt[1] == '4') diaChild.BackColour = diaChild.BackColour.replace(/\w{6}$/, tt[2]);
      }
      if (/^\d?a&H/.test(cmds[j])) {
        var tt = cmds[j].match(/^(\d?)a&H(\w\w)/);
        if (tt[1] == '1' || tt[1] == '') diaChild.PrimaryColour = diaChild.PrimaryColour.replace(/&H\w\w/, '&H' + tt[2]);
        if (tt[1] == '2') diaChild.SecondaryColour = diaChild.SecondaryColour.replace(/&H\w\w/, '&H' + tt[2]);
        if (tt[1] == '3') diaChild.OutlineColour = diaChild.OutlineColour.replace(/&H\w\w/, '&H' + tt[2]);
        if (tt[1] == '4') diaChild.BackColour = diaChild.BackColour.replace(/&H\w\w/, '&H' + tt[2]);
      }
      if (/^alpha&H/.test(cmds[j])) {
        var tt = cmds[j].match(/^alpha&H(\w\w)/)[1];
        diaChild.alpha[0] = cmds[j].match(/^alpha&H(\w\w)/)[1];
        diaChild.PrimaryColour = diaChild.PrimaryColour.replace(/&H\w\w/, '&H' + tt);
        diaChild.SecondaryColour = diaChild.SecondaryColour.replace(/&H\w\w/, '&H' + tt);
        diaChild.OutlineColour = diaChild.OutlineColour.replace(/&H\w\w/, '&H' + tt);
        diaChild.BackColour = diaChild.BackColour.replace(/&H\w\w/, '&H' + tt);
      }
      if (/^a\d/.test(cmds[j])) {
        var tt = cmds[j].match(/^a(\d)/)[1] * 1;
        if (tt < 4) {
          dia.Alignment = tt;
        } else if (tt > 8) {
          dia.Alignment = tt - 5;
        } else dia.Alignment = tt + 2;
      }
      if (/^an\d/.test(cmds[j])) dia.Alignment = cmds[j].match(/^an(\d)/)[1] * 1;
      if (/^pos/.test(cmds[j])) dia.pos = dia.pos || cmds[j];
      if (/^org/.test(cmds[j])) {// TODO: transform-origin should be stage's property
        var tt = cmds[j].match(/^org\((\d+).*?(\d+)\)/),
            to = parseInt(tt[1] / this.video.clientWidth * 100) + '% ' + parseInt(tt[2] / this.video.clientHeight * 100) + '%';
        diaChild.style.webkitTransformOrigin = to;
        diaChild.style.mozTransformOrigin = to;
        diaChild.style.msTransformOrigin = to;
        diaChild.style.transformOrigin = to;
      }
      if (/^q\d/.test(cmds[j])) {
        var tt = cmds[j].match(/^q(.*)/)[1];
        if (tt == '0') {
          // TODO
        }
        if (tt == '1') {
          diaChild.style.whiteSpace = 'normal';
          diaChild.style.wordBreak = 'break-all';
        }
        if (tt == '2') {
          diaChild.style.wordBreak = 'normal';
          diaChild.style.whiteSpace = 'nowrap';
        }
        if (tt == '3') {
          // TODO
        }
      }
      if (/^r/.test(cmds[j])) {
        diaChild.reset = true;
        var tt = cmds[j].match(/^r(.*)/)[1],
            ss = this.tree.V4Styles.Style[tt] || this.tree.V4Styles.Style['Default'];
        if (tt == '') ss = this.tree.V4Styles.Style[dia.Name];
        if (tt) {
          diaChild.Fontsize = ss.Fontsize;
          diaChild.Fontname = ss.Fontname;
          diaChild.PrimaryColour = ss.PrimaryColour;
          diaChild.SecondaryColour = ss.SecondaryColour;
          diaChild.OutlineColour = ss.OutlineColour;
          diaChild.BackColour = ss.BackColour;
          diaChild.Outline = ss.Outline;
          diaChild.Shadow = ss.Shadow;
          diaChild.className = 'ASS-style-' + ss.Name;
          diaChild.style.fontSize = this.scale * ss.Fontsize + 'px';
          diaChild.style.letterSpacing = this.scale * ss.Spacing + 'px';
          if (ss.BorderStyle == 1) diaChild.style.textShadow = this._createShadow(ss.OutlineColour, ss.Outline, ss.BackColour, ss.Shadow);
        }
      }
      if (/^t\(/.test(cmds[j]) && !/\)$/.test(cmds[j])) { // TODO
        cmds[j] += '\\' + cmds[j + 1];
        cmds[j + 1] = '';
      }
    }
    if (diaChild.reset) {
      diaChild.father.removeChild(diaChild);
      diaChild.father = dia;
      dia.appendChild(diaChild);
    } else {
      diaChild.style.fontFamily = '\'' + diaChild.Fontname + '\', Arial';
      diaChild.style.fontSize = this.scale * diaChild.Fontsize + 'px';
      diaChild.style.color = this._toRGBA(diaChild.PrimaryColour);
      diaChild.style.textShadow = this._createShadow(diaChild.OutlineColour, diaChild.Outline, diaChild.BackColour, diaChild.Shadow);
    }
    nowFather = diaChild;
    ['y', 'x', 'z'].forEach(function(e) {// TODO
      if (!diaChild['fr' + e]) return;
      if (e == 'z') diaChild['frz'] *= -1;
      var tf = ' rotate' + e.toUpperCase() + '(' + diaChild['fr' + e] + 'deg)';
      diaChild.style.webkitTransform += tf;
      diaChild.style.mozTransform += tf;
      diaChild.style.msTransform += tf;
      diaChild.style.transform += tf;
    });
  }
};
ASS.prototype._getChannel = function(dia) {
  var that = this,
      L = dia.Layer,
      SW = this.stage.clientWidth - dia.MarginL - dia.MarginR,
      SH = this.stage.clientHeight,
      W = dia.clientWidth,
      H = dia.clientHeight,
      V = dia.MarginV,
      count = 0;
  if (!this.channel[L]) {
    this.channel[L] = {
      left: new Uint16Array(SH + 1),
      middle: new Uint16Array(SH + 1),
      right: new Uint16Array(SH + 1)
    }
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
      return 1;
    } else return 0;
  }
  if (dia.Alignment <= 3) {
    for (var i = SH - V; i >= V; --i)
      if (judge(i)) break;
  } else if (dia.Alignment >= 7) {
    for (var i = V; i <= SH - V; ++i)
      if (judge(i)) break;
  } else {
    for (var i = Math.floor((SH - H) / 2); i <= SH - V; ++i) {
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
  for (var i = dia.channel; i <= dia.channel + dia.clientHeight; ++i) {
    if (dia.Alignment % 3 == 1) {
      this.channel[dia.Layer].left[i] = 0;
    } else if (dia.Alignment % 3 == 2) {
      this.channel[dia.Layer].middle[i] = 0;
    } else {
      this.channel[dia.Layer].right[i] = 0;
    }
  }
};
ASS.prototype._timeParser = function(time) {
  var t = time.match(/(.*):(.*):(.*)/),
      timer = (this.tree.ScriptInfo['Timer']) ? (this.tree.ScriptInfo['Timer'] / 100) : 1;
  return (t[1] * 3600 + t[2] * 60 + t[3] * 1) * timer;
};
ASS.prototype._toRGBA = function(c) {
  var t = c.match(/&H(\w\w)(\w\w)(\w\w)(\w\w)/),
      a = 1 - parseInt(t[1], 16) / 255,
      b = parseInt(t[2], 16),
      g = parseInt(t[3], 16),
      r = parseInt(t[4], 16);
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a.toFixed(1) + ')';
};
ASS.prototype._createShadow = function(oc, ow, sc, sw) {
  oc = this._toRGBA(oc);
  sc = this._toRGBA(sc);
  var ts = '';
  ow = parseFloat(ow);
  sw = parseFloat(sw);
  if (!ow && !sw) return 'none';
  if (!/No/i.test(this.tree.ScriptInfo['ScaledBorderAndShadow'])) {
    ow *= this.scale;
    sw *= this.scale;
  }
  if (ow) {
    for (var i = -1; i <= 1; ++i)
      for (var j = -1; j <= 1; ++j) {
        for (var k = 1; k < ow; ++k)
          ts += oc + ' ' + i * k + 'px ' + j * k + 'px, ';
        ts += oc + ' ' + i * ow + 'px ' + j * ow + 'px, ';
      }
  }
  if (sw) {
    sw += ow;
    ts += sc + ' ' + sw + 'px ' + sw + 'px ' + sw + 'px';
  } else ts = ts.substr(0, ts.length - 2);
  return ts;
};
ASS.prototype._getRealFontSize = function(fs, fn) {
  var rfs,
      fse = document.createElement('div'),
      container = document.getElementById('ASS-container');
  fse.innerHTML = 'ASS.js';
  fse.style.fontFamily = fn;
  fse.style.fontSize = fs + 'px';
  fse.style.visibility = 'hidden';
  container.appendChild(fse);
  rfs = fs * fs / fse.clientHeight;
  container.removeChild(fse);
  return rfs;
};
