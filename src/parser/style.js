var parseStyle = function(data, tree) {
  var fields = data.match(/Style:(.*)/)[1].split(','),
      s = {};
  for (var i = fields.length - 1; i >= 0; --i) {
    var field = tree.V4Styles.Format[i];
    s[field] = fields[i].replace(/^\s*/, '');
    if (!isNaN(s[field] * 1)) s[field] *= 1;
  }
  s._tags = {
    fn: s.Fontname,
    fs: s.Fontsize,
    c1: s.PrimaryColour.match(/&H(\w\w)?(\w{6})&?/)[2],
    a1: s.PrimaryColour.match(/&H(\w\w)?(\w{6})&?/)[1] || '00',
    c2: s.SecondaryColour.match(/&H(\w\w)?(\w{6})&?/)[2],
    a2: s.SecondaryColour.match(/&H(\w\w)?(\w{6})&?/)[1] || '00',
    c3: s.OutlineColour.match(/&H(\w\w)?(\w{6})&?/)[2],
    a3: s.OutlineColour.match(/&H(\w\w)?(\w{6})&?/)[1] || '00',
    c4: s.BackColour.match(/&H(\w\w)?(\w{6})&?/)[2],
    a4: s.BackColour.match(/&H(\w\w)?(\w{6})&?/)[1] || '00',
    b: Math.abs(s.Bold),
    i: Math.abs(s.Italic),
    u: Math.abs(s.Underline),
    s: Math.abs(s.StrikeOut),
    q: tree.ScriptInfo.WrapStyle || 1,
    fscx: s.ScaleX,
    fscy: s.ScaleY,
    fsp: s.Spacing,
    frz: s.Angle,
    xbord: s.Outline,
    ybord: s.Outline,
    xshad: s.Shadow,
    yshad: s.Shadow,
  };
  return s;
};
