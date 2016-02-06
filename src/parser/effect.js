var parseEffect = function(text) {
  var param = text.toLowerCase().split(';');
  if (param[0] === 'banner') {
    return {
      name: param[0],
      delay: param[1] * 1 || 1,
      lefttoright: param[2] * 1 || 0,
      fadeawaywidth: param[3] * 1 || 0,
    };
  }
  if (/^scroll\s/.test(param[0])) {
    return {
      name: param[0],
      y1: Math.min(param[1], param[2]),
      y2: Math.max(param[1], param[2]),
      delay: param[3] * 1 || 1,
      fadeawayheight: param[4] * 1 || 0,
    };
  }
  return null;
};
