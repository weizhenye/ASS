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
        if (t.pbo) cssText.push('vertical-align:' + (-t.pbo) + 'px');
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
