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
