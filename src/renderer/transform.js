var createTransform = function(t) {
  // TODO: I don't know why perspective is 314, it just performances well.
  var arr = [];
  arr.push('perspective(314px)');
  arr.push('rotateY(' + (t.fry || 0) + 'deg)');
  arr.push('rotateX(' + (t.frx || 0) + 'deg)');
  arr.push('rotateZ(' + (-t.frz || 0) + 'deg)');
  arr.push('scale(' + (t.p ? 1 : (t.fscx || 100) / 100) + ',' +
                      (t.p ? 1 : (t.fscy || 100) / 100) + ')');
  arr.push('skew(' + (t.fax || 0) + 'rad,' + (t.fay || 0) + 'rad)');
  return arr.join(' ');
};
