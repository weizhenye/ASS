var toRGBA = function(c) {
  var t = c.match(/(\w\w)(\w\w)(\w\w)(\w\w)/),
      a = 1 - ('0x' + t[1]) / 255,
      b = +('0x' + t[2]),
      g = +('0x' + t[3]),
      r = +('0x' + t[4]);
  return 'rgba(' + [r, g, b, a].join() + ')';
};
