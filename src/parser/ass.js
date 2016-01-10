var parseASS = function(data) {
  data = data.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var tree = {
    ScriptInfo: {
      'Title': '&lt;untitled&gt;',
      'Original Script': '&lt;unknown&gt;'
    },
    V4Styles: {Format: {}, Style: {}},
    Events: {Format: {}, Dialogue: []}
  };
  var lines = data.split('\n'),
      state = 0,
      _index = 0;
  for (var len = lines.length, i = 0; i < len; ++i) {
    lines[i] = lines[i].replace(/^\s+|\s+$/g, '');
    if (/^;/.test(lines[i])) continue;

    if (/^\[Script Info\]/i.test(lines[i])) state = 1;
    else if (/^\[V4\+ Styles\]/i.test(lines[i])) state = 2;
    else if (/^\[Events\]/i.test(lines[i])) state = 3;
    else if (/^\[.*\]/.test(lines[i])) state = 0;

    if (state === 0) continue;
    if (state === 1) {
      if (/:/.test(lines[i])) {
        var tmp = lines[i].match(/(.*?)\s*:\s*(.*)/);
        if (!isNaN(tmp[2] * 1)) tmp[2] *= 1;
        tree.ScriptInfo[tmp[1]] = tmp[2];
      }
    }
    if (state === 2) {
      if (/^Format:/.test(lines[i])) {
        var tmp = lines[i].match(/Format:(.*)/);
        tree.V4Styles.Format = tmp[1].replace(/\s/g, '').split(',');
      }
      if (/^Style:/.test(lines[i])) {
        var tmp1 = lines[i].match(/Style:(.*)/)[1].split(','),
            tmp2 = {};
        for (var j = tmp1.length - 1; j >= 0; --j) {
          var tmp3 = tree.V4Styles.Format[j];
          tmp2[tmp3] = tmp1[j].replace(/^\s*/, '');
          if (!isNaN(tmp2[tmp3] * 1)) tmp2[tmp3] *= 1;
        }
        tree.V4Styles.Style[tmp2.Name] = tmp2;
        baseTags[tmp2.Name] = createBaseTags(tmp2);
        baseTags[tmp2.Name].q = tree.ScriptInfo.WrapStyle || 1;
      }
    }
    if (state === 3) {
      if (/^Format:/.test(lines[i])) {
        var tmp = lines[i].match(/Format:(.*)/);
        tree.Events.Format = tmp[1].replace(/\s/g, '').split(',');
      }
      if (/^Dialogue:/.test(lines[i])) {
        var tmp1 = lines[i].match(/Dialogue:(.*)/)[1].split(','),
            tmp2 = {},
            efLen = tree.Events.Format.length;
        if (tmp1.length > efLen) {
          var tmp3 = tmp1.slice(efLen - 1).join();
          tmp1 = tmp1.slice(0, efLen - 1);
          tmp1.push(tmp3);
        }
        for (var j = efLen - 1; j >= 0; --j) {
          tmp2[tree.Events.Format[j]] = tmp1[j].replace(/^\s+/, '');
        }
        tmp2.Layer *= 1;
        tmp2.Start = parseTime(tmp2.Start, tree.ScriptInfo['Timer']);
        tmp2.End = parseTime(tmp2.End, tree.ScriptInfo['Timer']);
        tmp2.Style = tree.V4Styles.Style[tmp2.Style] ? tmp2.Style : 'Default';
        tmp2.MarginL *= 1;
        tmp2.MarginR *= 1;
        tmp2.MarginV *= 1;
        tmp2.Effect = parseEffect(tmp2.Effect, tree.ScriptInfo.PlayResY);
        tmp2._index = ++_index;
        tmp2.parsedText = parseTags(tmp2);
        if (tmp2.Start < tmp2.End) tree.Events.Dialogue.push(tmp2);
      }
    }
  }
  tree.Events.Dialogue.sort(function(a, b) {
    return (a.Start - b.Start) || (a.End - b.End) || (a._index - b._index);
  });
  return tree;
};
