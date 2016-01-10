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
