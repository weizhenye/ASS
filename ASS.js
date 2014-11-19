function ASS() {
  this.ASS = {
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
  this.runTimer = 0;
  this.runline = [];
  this.position = 0;
  this.channel = [];
  this.scale = 1;
  this.stage = document.createElement('div');
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
    this.updateScale();
    this.stage.style.position = 'relative';
    this.stage.style.overflow = 'hidden';
    container.appendChild(this.stage);
  }

  if (!data) return;

  data = data.replace(/</g, '&lt;');
  data = data.replace(/>/g, '&gt;');
  var content = data.split('\n'),
      state = 0;
  this.ASS.ScriptInfo['Title'] = '&lt;untitled&gt;';
  this.ASS.ScriptInfo['Original Script'] = '&lt;unknown&gt;';
  for(var i = 0; i < content.length; ++i) {
    if (/^;/.test(content[i])) continue;

    if (/^\[Script Info\]/i.test(content[i])) state = 1;
    else if (/^\[V4\+ Styles\]/i.test(content[i])) state = 2;
    else if (/^\[Events\]/i.test(content[i])) state = 3;
    else if (/^\[Fonts|Graphics\]/i.test(content[i])) state = 4;

    if (state == 1) {
      if (/:/.test(content[i])) {
        var tmp = content[i].match(/(.*?)\s*:\s*(.*)/);
        if (/^\d+$/.test(tmp[2])) tmp[2] *= 1;
        this.ASS.ScriptInfo[tmp[1]] = tmp[2];
      }
    }
    if (state == 2) {
      if (/^Format:/.test(content[i])) {
        var tmp = content[i].match(/Format:(.*)/);
        this.ASS.V4Styles.Format = tmp[1].replace(/\s/g, '').split(',');
      }
      if (/^Style:/.test(content[i])) {
        var tmp1 = content[i].match(/Style:(.*)/)[1].split(','),
            tmp2 = {};
        for(var j = 0; j < tmp1.length; ++j) {
          var tmp3 = this.ASS.V4Styles.Format[j];
          tmp2[tmp3] = tmp1[j].match(/^\s*(.*)/)[1];
          if (/^\d+$/.test(tmp2[tmp3])) tmp2[tmp3] *= 1;
        }
        tmp2.PrimaryColour = this._toRGBA(tmp2.PrimaryColour);
        tmp2.SecondaryColour = this._toRGBA(tmp2.SecondaryColour);
        tmp2.OutlineColour = this._toRGBA(tmp2.OutlineColour);
        tmp2.BackColour = this._toRGBA(tmp2.BackColour);

        this.ASS.V4Styles.Style[tmp2.Name] = tmp2;
      }
    }
    if (state == 3) {
      if (/^Format:/.test(content[i])) {
        var tmp = content[i].match(/Format:(.*)/);
        this.ASS.Events.Format = tmp[1].replace(/\s/g,'').split(',');
      }
      if (/^Dialogue:/.test(content[i])) {
        var tmp1 = content[i].match(/Dialogue:(.*)/)[1].split(','),
            tmp2 = {};
        while(tmp1.length > this.ASS.Events.Format.length) {
          tmp1[tmp1.length - 2] += ',' + tmp1[tmp1.length - 1];
          tmp1.splice(tmp1.length - 1,1);
        }
        for(var j = 0; j < this.ASS.Events.Format.length; ++j) {
          tmp2[this.ASS.Events.Format[j]] = tmp1[j].match(/^\s*(.*)/)[1];
        }
        function timeParser(time) {
          var t = time.match(/(.*):(.*):(.*)/);
          return t[1] * 3600 + t[2] * 60 + t[3] * 1;
        }
        tmp2.Start = timeParser(tmp2.Start);
        tmp2.End = timeParser(tmp2.End);
        tmp2.MarginL *= 1;
        tmp2.MarginR *= 1;
        tmp2.MarginV *= 1;
        this.ASS.Events.Dialogue.push(tmp2);
      }
    }
    if (state == 4) {
      continue;
    }
  }
  if (this.video && (!this.ASS.ScriptInfo.PlayResX || !this.ASS.ScriptInfo.PlayResY)) {
    this.ASS.ScriptInfo.PlayResX = this.video.offsetWidth;
    this.ASS.ScriptInfo.PlayResY = this.video.offsetHeight;
  }
  var CSSstr = '';
  for(var i in this.ASS.V4Styles.Style) {
    var s = this.ASS.V4Styles.Style[i],
        str = '{';
    str += 'font-family: \'' + s.Fontname + '\', Arial;';
    str += 'color: ' + s.PrimaryColour + ';';
    str += 'font-weight: ' + ((s.Bold == -1) ? '900' : 'normal') + ';';
    str += 'font-style: ' + ((s.Italic == -1) ? 'italic' : 'normal') + ';';
    str += 'text-decoration: ' + ((s.Underline == -1) ? ' underline' : '') + ((s.StrikeOut == -1) ? ' line-through' : '') + ';';
    str += '-webkit-transform: scaleX(' + s.ScaleX / 100 + ') scaleY(' + s.ScaleY / 100 + ') rotateZ(' + (-s.Angle) + 'deg);';
    str += '-moz-transform: scaleX(' + s.ScaleX / 100 + ') scaleY(' + s.ScaleY / 100 + ') rotateZ(' + (-s.Angle) + 'deg);';
    str += '-ms-transform: scaleX(' + s.ScaleX / 100 + ') scaleY(' + s.ScaleY / 100 + ') rotateZ(' + (-s.Angle) + 'deg);';
    str += 'transform: scaleX(' + s.ScaleX / 100 + ') scaleY(' + s.ScaleY / 100 + ') rotateZ(' + (-s.Angle) + 'deg);';
    if (s.BorderStyle == 3) str += 'background-color: ' + s.OutlineColour + ';';
    if (this.ASS.ScriptInfo.WrapStyle == 1) str += 'word-break: break-all;';
    if (this.ASS.ScriptInfo.WrapStyle == 2) str += 'white-space: nowrap;';
    str += '}'
    CSSstr += '.ASS-style-' + i + str;
  }
  document.getElementsByTagName('head')[0].innerHTML += '<style>' + CSSstr + '</style>';
  this.ASS.Events.Dialogue.sort(function(a, b) {
    return a.Start - b.Start;
  });
  this.updateScale();
  console.log(this.ASS);
};
ASS.prototype.play = function() {
  var that = this;
  if (this.runTimer > 0) return;
  this.runTimer = setInterval(function() {
    for(var i = 0; i < that.runline.length; ++i) {
      if (that.runline[i].End < that.video.currentTime) {
        that._freeChannel(that.runline[i]);
        that.stage.removeChild(that.runline[i]);
        that.runline.splice(i, 1);
      }
    }
    if (that.position < that.ASS.Events.Dialogue.length) {
      while(that.ASS.Events.Dialogue[that.position].Start <= that.video.currentTime && that.video.currentTime <= that.ASS.Events.Dialogue[that.position].End) {
        that._launch(that.ASS.Events.Dialogue[that.position]);
        ++that.position;
        if (that.position >= that.ASS.Events.Dialogue.length) break;
      }
    }
  }, 10);
};
ASS.prototype.pause = function() {
  clearInterval(this.runTimer);
  this.runTimer = 0;
};
ASS.prototype.setCurrentTime = function(time) {
  var that = this;
  for(var i = 0; i < this.runline.length; ++i)
    this.stage.removeChild(this.runline[i]);
  this.runline = [];
  this.channel = [];
  this.position = (function() {
    var m,
        l = 0,
        r = that.ASS.Events.Dialogue.length - 1;
    while(l <= r) {
      m = Math.floor((l + r) / 2);
      if (time <= that.ASS.Events.Dialogue[m].End) r = m - 1;
      else l = m + 1;
    }
    l = Math.min(l, that.ASS.Events.Dialogue.length - 1);
    return Math.max(l, 0);
  })();
  if (this.position < this.ASS.Events.Dialogue.length) {
    while(this.ASS.Events.Dialogue[this.position].Start <= this.video.currentTime &&
          this.video.currentTime <= this.ASS.Events.Dialogue[this.position].End) {
      this._launch(this.ASS.Events.Dialogue[this.position]);
      ++this.position;
      if (this.position >= this.ASS.Events.Dialogue.length) break;
    }
  }
  for(var i = 0; i < this.runline.length; ++i) {
    if (this.runline[i].End < this.video.currentTime) {
      this.stage.removeChild(this.runline[i]);
      this.runline.splice(i, 1);
    }
  }
};
ASS.prototype.updateScale = function() {
  if (this.video) {
    this.stage.style.width = this.video.offsetWidth + 'px';
    this.stage.style.height = this.video.offsetHeight + 'px';
    if (this.ASS.ScriptInfo.PlayResX) {
      this.scale = Math.min(this.video.offsetWidth / this.ASS.ScriptInfo.PlayResX,
                            this.video.offsetHeight / this.ASS.ScriptInfo.PlayResY);
    }
  }
};
ASS.prototype._launch = function(data) {
  var dia = document.createElement('div');
  this._set(dia, data);
  this.runline.push(dia);
};
ASS.prototype._set = function(dia, data) {
  var s = this.ASS.V4Styles.Style[data.Style];
  dia.className = 'ASS-style-' + (s ? data.Style : 'Default');
  dia.style.position = 'absolute';
  s = s || this.ASS.V4Styles.Style.Default;

  dia.style.fontSize = this.scale * s.Fontsize + 'px';
  dia.style.letterSpacing = this.scale * s.Spacing + 'px';
  if (s.BorderStyle == 1) dia.style.textShadow = this._createTextShadow(s.OutlineColour, s.Outline, s.BackColour, s.Shadow);
  dia.SecondaryColour = s.SecondaryColour;
  dia.OutlineColour = s.OutlineColour;
  dia.Outline = s.Outline;
  dia.BackColour = s.BackColour;
  dia.Shadow = s.Shadow;
  dia.Layer = data.Layer;
  dia.Start = data.Start;
  dia.End = data.End;

  this.stage.appendChild(dia);
  data.Text = data.Text.replace(/\\n/g, (this.ASS.ScriptInfo.WrapStyle == 2) ? '<br>' : '&nbsp;');
  data.Text = data.Text.replace(/\\N/g, '<br>');
  data.Text = data.Text.replace(/\\h/g, '&nbsp;');
  var t = data.Text.split('{'),
      nowFather = dia;
  dia.r = 0;
  dia.father = dia;
  for(var i = 0; i < t.length; ++i) {
    if (!/\}/.test(t[i])) {
      dia.innerHTML += t[i];
      continue;
    }
    var kv = t[i].split('}'),
        cmds = kv[0].split('\\'),
        diaChild = document.createElement('div');

    diaChild.alpha = [];
    diaChild.r = 0;
    diaChild.father = nowFather;
    diaChild.father.appendChild(diaChild);
    diaChild.style.display = 'inline';
    diaChild.innerHTML = kv[1];
    for(var j = 0; j < cmds.length; ++j) {
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
      if (/^fn/.test(cmds[j])) diaChild.style.fontFamily = '\'' + cmds[j].match(/fn(.*)/)[1] + '\', Arial';
      if (/^fs\d/.test(cmds[j])) diaChild.style.fontSize = this.scale * cmds[j].match(/^fs(.*)/)[1] + 'px';
      if (/^fs-\d/.test(cmds[j])) {// TODO
        console.log(cmds[j].match(/^fs-(.*)/)[1]);
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
        while(tt[2].length < 6) tt[2] = '0' + tt[2];
        if (tt[1] == '1' || tt[1] == '') diaChild.PrimaryColour = tt[2];
        if (tt[1] == '2') diaChild.SecondaryColour = tt[2];
        if (tt[1] == '3') diaChild.OutlineColour = tt[2];
        if (tt[1] == '4') diaChild.BackColour = tt[2];
      }
      if (/^\da&H/.test(cmds[j])) {
        var tt = cmds[j].match(/^(\d)a&H(\w+)/);
        diaChild.alpha[tt[1] * 1] = tt[2];
      }
      if (/^alpha&H/.test(cmds[j])) diaChild.alpha[0] = cmds[j].match(/^alpha&H(\w+)/)[1];
      if (/^a\d/.test(cmds[j])) dia.a = dia.a || cmds[j];
      if (/^an\d/.test(cmds[j])) dia.a = dia.a || cmds[j];
      if (/^pos/.test(cmds[j])) dia.pos = dia.pos || cmds[j];
      if (/^org/.test(cmds[j])) {// TODO: transform-origin should be stage's property
        var tt = cmds[j].match(/^org\((\d+).*?(\d+)\)/),
            to = parseInt(tt[1] / this.video.offsetWidth * 100) + '% ' + parseInt(tt[2] / this.video.offsetHeight * 100) + '%';
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
        diaChild.r = 1;
        var tt = cmds[j].match(/^r(.*)/)[1],
            ss = this.ASS.V4Styles.Style[tt];
        if (tt) diaChild.className = 'ASS-style-' + (ss ? tt : 'Default');
        ss = ss || this.ASS.V4Styles.Style.Default;
        diaChild.style.fontSize = this.scale * ss.Fontsize + 'px';
        diaChild.style.letterSpacing = this.scale * ss.Spacing + 'px';
        diaChild.SecondaryColour = ss.SecondaryColour;
        if (ss.BorderStyle == 1) diaChild.style.textShadow = this._createTextShadow(ss.OutlineColour, ss.Outline, ss.BackColour, ss.Shadow);
      }
      if (/^t\(/.test(cmds[j]) && !/\)$/.test(cmds[j])) {
        cmds[j] += '\\' + cmds[j + 1];
        cmds[j + 1] = '';
      }
    }
    if (diaChild.r) {
      diaChild.father.removeChild(diaChild);
      diaChild.father = nowFather.father;
      diaChild.father.appendChild(diaChild);
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
    if (diaChild.PrimaryColour) diaChild.style.color = this._toRGBA('&H' + (diaChild.alpha[1] || '00') + diaChild.PrimaryColour);
    else if (diaChild.alpha[0]) diaChild.style.opacity = 1 - parseInt(diaChild.alpha[0], 16) / 255;
    if (diaChild.OutlineColour) diaChild.OutlineColour = this._toRGBA('&H' + (diaChild.alpha[3] || '00') + diaChild.OutlineColour);
    if (diaChild.BackColour) diaChild.BackColour = this._toRGBA('&H' + (diaChild.alpha[4] || '00') + diaChild.BackColour);
    if (diaChild.OutlineColour || diaChild.Outline != undefined || diaChild.BackColour || diaChild.Shadow != undefined) {
      for(var tmpf = diaChild.father; diaChild.OutlineColour == undefined; tmpf = tmpf.father) diaChild.OutlineColour = tmpf.OutlineColour;
      for(var tmpf = diaChild.father; diaChild.BackColour == undefined; tmpf = tmpf.father) diaChild.BackColour = tmpf.BackColour;
      for(var tmpf = diaChild.father; diaChild.Outline == undefined; tmpf = tmpf.father) diaChild.Outline = tmpf.Outline;
      for(var tmpf = diaChild.father; diaChild.Shadow == undefined; tmpf = tmpf.father) diaChild.Shadow = tmpf.Shadow;
      diaChild.style.textShadow = this._createTextShadow(diaChild.OutlineColour, diaChild.Outline, diaChild.BackColour, diaChild.Shadow);
    }
  }
  dia.MarginL = data.MarginL || s.MarginL;
  dia.MarginR = data.MarginR || s.MarginR;
  dia.MarginV = data.MarginV || s.MarginV;
  if (dia.a) {
    if (/a\d/.test(dia.a)) {
      var ali = dia.a.match(/a(\d+)/)[1];
      if (ali < 4) dia.a = ali;
      else if (ali < 8) dia.a = ali + 2;
      else dia.a = ali - 5;
    } else dia.a = dia.a.match(/an(\d+)/)[1];
  } else dia.a = s.Alignment;
  dia.a *= 1;
  // Solve WrapStyle first
  if (dia.pos) {
    var xy = dia.pos.match(/^pos\(\s*(.*?)\s*,\s*(.*?)\s*\)/);
    if (dia.a % 3 == 1) {
      dia.style.left = this.scale * xy[1] + 'px';
      dia.style.textAlign = 'left';
    }
    if (dia.a % 3 == 2) {
      dia.style.left = this.scale * xy[1] - dia.offsetWidth / 2 + 'px';
      dia.style.textAlign = 'center';
    }
    if (dia.a % 3 == 0) {
      dia.style.left = this.scale * xy[1] - dia.offsetWidth + 'px';
      dia.style.textAlign = 'right';
    }
    if (dia.a <= 3) dia.style.top = this.scale * xy[2] - dia.offsetHeight + 'px';
    if (dia.a >= 4 && dia.a <= 6) dia.style.top = this.scale * xy[2] - dia.offsetHeight / 2 + 'px';
    if (dia.a >= 7) dia.style.top = this.scale * xy[2] + 'px';
  } else {
    if (dia.a % 3 == 1) {
      dia.style.left = '0';
      dia.style.textAlign = 'left';
      dia.style.marginLeft = this.scale * dia.MarginL + 'px';
    }
    if (dia.a % 3 == 2) {
      dia.style.left = (this.stage.offsetWidth - dia.offsetWidth) / 2 + 'px';
      dia.style.textAlign = 'center';
    }
    if (dia.a % 3 == 0) {
      dia.style.right = '0';
      dia.style.textAlign = 'right';
      dia.style.marginRight = this.scale * dia.MarginR + 'px';
    }
    if (dia.offsetWidth > this.stage.offsetWidth - this.scale * (dia.MarginL + dia.MarginR)) {
      dia.style.marginLeft = this.scale * dia.MarginL + 'px';
      dia.style.marginRight = this.scale * dia.MarginR + 'px';
    }
    dia.style.top = this._getChannel(dia) + 'px';
  }

  // TODO
  // if (/^Karaoke/i.test(data.Effect)) {}
  // if (/^Banner/i.test(data.Effect)) {}
  // if (/^Scroll up/i.test(data.Effect)) {}
  // if (/^Scroll down/i.test(data.Effect)) {}
};
ASS.prototype._getChannel = function(dia) {
  var that = this,
      L = dia.Layer,
      SW = this.stage.offsetWidth - dia.MarginL - dia.MarginR,
      SH = this.stage.offsetHeight,
      W = dia.offsetWidth,
      H = dia.offsetHeight,
      V = dia.MarginV,
      count = 0;
  if (!this.channel[L]) {
    this.channel[L] = [];
    for(var i = 0; i <= SH; ++i) this.channel[L][i] = [0, 0, 0];
  }
  function judge(i) {
    var T = that.channel[L][i];
    if ((dia.a % 3 == 1 && (T[0] || (T[1] && W + T[1] / 2 > SW / 2) || (W + T[2] > SW))) ||
      (dia.a % 3 == 2 && ((2 * T[0] + W > SW) || T[1] || (2 * T[2] + W > SW))) ||
      (dia.a % 3 == 0 && ((T[0] + W > SW) || (T[1] && W + T[1] / 2 > SW / 2) || T[2]))) {
      count = 0;
    } else ++count;
    if (count > H) {
      dia.channel = i;
      return 1;
    } else return 0;
  }
  if (dia.a <= 3) {
    for(var i = SH - V; i >= V; --i)
      if (judge(i)) break;
  } else if (dia.a >= 7) {
    for(var i = V; i <= SH - V; ++i)
      if (judge(i)) break;
  } else {
    for(var i = (SH - H) / 2; i <= SH - V; ++i)
      if (judge(i)) break;
  }
  if (dia.a > 3) dia.channel -= H;
  for(var i = dia.channel; i <= dia.channel + H; ++i)
    this.channel[L][i][(dia.a - 1) % 3] = W;
  return dia.channel;
};
ASS.prototype._freeChannel = function(dia) {
  for(var i = dia.channel; i <= dia.channel + dia.offsetHeight; ++i)
    this.channel[dia.Layer][i][(dia.a - 1) % 3] = 0;
};
ASS.prototype._toRGBA = function(c) {
  var t = c.match(/&H(\w\w)(\w\w)(\w\w)(\w\w)/),
      a = 1 - parseInt(t[1], 16) / 255,
      b = parseInt(t[2], 16),
      g = parseInt(t[3], 16),
      r = parseInt(t[4], 16);
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a.toFixed(1) + ')';
};
ASS.prototype._createTextShadow = function(oc, ow, sc, sw) {
  var ts = '';
  ow = parseFloat(ow);
  sw = parseFloat(sw);
  if (!ow && !sw) return 'none';
  if (!/No/i.test(this.ASS.ScriptInfo['ScaledBorderAndShadow'])) {
    ow *= this.scale;
    sw *= this.scale;
  }
  if (ow) {
    for(var i = -1; i <= 1; ++i)
      for(var j = -1; j <= 1; ++j) {
        for(var k = 1; k < ow; ++k)
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
ASS.prototype._getRealFontSize = function(fs) {
  var tmp = document.createElement('div');
  // tmp.style.fontFamily = 
  tmp.style.fontSize = fs + 'px';
  return fs * fs / tmp.offsetHeight;
};
