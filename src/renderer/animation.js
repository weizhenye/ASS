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
            tmp1 = 'translateY(' + this.scale * eff.y1 * updown + 'px)',
            tmp2 = 'translateY(' + this.scale * eff.y2 * updown + 'px)',
            dp = (eff.y2 - eff.y1) / (dur / eff.delay) * 100;
        t[1] = Math.min(100, dp).toFixed(3) + '%';
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
          if (ttags.a1 &&
              ttags.a1 === ttags.a2 &&
              ttags.a2 === ttags.a3 &&
              ttags.a3 === ttags.a4) {
            var tmp1 = 1 - parseInt(tags.a1, 16) / 255,
                tmp2 = 1 - parseInt(ttags.a1, 16) / 255;
            kf.set(t[0], 'opacity', tmp1);
            kf.set(t[1], 'opacity', tmp1);
            kf.set(t[2], 'opacity', tmp2);
            kf.set(t[3], 'opacity', tmp2);
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
                tmp1 = createCSSBS(tags, sbas),
                tmp2 = createCSSBS(ttags, sbas);
            kf.set(t[0], 'text-shadow', tmp1);
            kf.set(t[1], 'text-shadow', tmp1);
            kf.set(t[2], 'text-shadow', tmp2);
            kf.set(t[3], 'text-shadow', tmp2);
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
            var tmp1 = createTransform(tags),
                tmp2 = createTransform(ttags);
            kf.set(t[0], 'transform', tmp1);
            kf.set(t[1], 'transform', tmp1);
            kf.set(t[2], 'transform', tmp2);
            kf.set(t[3], 'transform', tmp2);
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
