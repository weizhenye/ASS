var createDrawing = function(cn, ct, dia) {
  var t = ct.tags,
      s = this.scale / (1 << (t.p - 1)),
      sx = (t.fscx ? t.fscx / 100 : 1) * s,
      sy = (t.fscy ? t.fscy / 100 : 1) * s,
      pdc = parseDrawingCommands(ct.text),
      vb = [pdc.minX, pdc.minY, pdc.width, pdc.height].join(' '),
      filterID = 'ASS-' + generateUUID(),
      symbolID = 'ASS-' + generateUUID(),
      sisbas = this.tree.ScriptInfo['ScaledBorderAndShadow'],
      sbas = /Yes/i.test(sisbas) ? this.scale : 1,
      xlink = 'http://www.w3.org/1999/xlink';
  var blur = t.blur || 0,
      vbx = t.xbord + (t.xshad < 0 ? -t.xshad : 0) + blur,
      vby = t.ybord + (t.yshad < 0 ? -t.yshad : 0) + blur,
      vbw = pdc.width * sx + 2 * t.xbord + Math.abs(t.xshad) + 2 * blur,
      vbh = pdc.height * sx + 2 * t.ybord + Math.abs(t.yshad) + 2 * blur;
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
  path.setAttributeNS(null, 'd', pdc.d);
  symbol.appendChild(path);
  var use = document.createElementNS(xmlns, 'use');
  use.setAttributeNS(null, 'width', pdc.width * sx);
  use.setAttributeNS(null, 'height', pdc.height * sy);
  use.setAttributeNS(xlink, 'xlink:href', '#' + symbolID);
  use.setAttributeNS(null, 'filter', 'url(#' + filterID + ')');
  svg.appendChild(use);
  cn.style.cssText += 'position:relative;' +
                      'width:' + pdc.width * sx + 'px;' +
                      'height:' + pdc.height * sy + 'px;';
  svg.style.cssText = 'position:absolute;' +
                      'left:' + (pdc.minX * sx - vbx) + 'px;' +
                      'top:' + (pdc.minY * sy - vby) + 'px;';
  return svg;
};
