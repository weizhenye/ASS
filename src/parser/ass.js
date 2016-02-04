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
  var lines = data.split(/\r?\n/),
      state = 0;
  for (var len = lines.length, i = 0; i < len; ++i) {
    var line = lines[i].replace(/^\s+|\s+$/g, '');
    if (/^;/.test(line)) continue;

    if (/^\[Script Info\]/i.test(line)) state = 1;
    else if (/^\[V4\+ Styles\]/i.test(line)) state = 2;
    else if (/^\[Events\]/i.test(line)) state = 3;
    else if (/^\[.*\]/.test(line)) state = 0;

    if (state === 0) continue;
    if (state === 1) {
      if (/:/.test(line)) {
        var kv = line.match(/(.*?)\s*:\s*(.*)/);
        if (!isNaN(kv[2] * 1)) kv[2] *= 1;
        tree.ScriptInfo[kv[1]] = kv[2];
      }
    }
    if (state === 2) {
      if (/^Format:/.test(line)) {
        tree.V4Styles.Format = parseFormat(line);
      }
      if (/^Style:/.test(line)) {
        var s = parseStyle(line, tree);
        tree.V4Styles.Style[s.Name] = s;
      }
    }
    if (state === 3) {
      if (/^Format:/.test(line)) {
        tree.Events.Format = parseFormat(line);
      }
      if (/^Dialogue:/.test(line)) {
        var dia = parseDialogue(line, tree);
        if (dia.Start < dia.End) {
          dia._index = tree.Events.Dialogue.length;
          tree.Events.Dialogue.push(dia);
        }
      }
    }
  }
  tree.Events.Dialogue.sort(function(a, b) {
    return (a.Start - b.Start) || (a.End - b.End) || (a._index - b._index);
  });

  return tree;
};
