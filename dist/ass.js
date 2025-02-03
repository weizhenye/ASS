function parseEffect(text) {
  var param = text
    .toLowerCase()
    .trim()
    .split(/\s*;\s*/);
  if (param[0] === 'banner') {
    return {
      name: param[0],
      delay: param[1] * 1 || 0,
      leftToRight: param[2] * 1 || 0,
      fadeAwayWidth: param[3] * 1 || 0,
    };
  }
  if (/^scroll\s/.test(param[0])) {
    return {
      name: param[0],
      y1: Math.min(param[1] * 1, param[2] * 1),
      y2: Math.max(param[1] * 1, param[2] * 1),
      delay: param[3] * 1 || 0,
      fadeAwayHeight: param[4] * 1 || 0,
    };
  }
  if (text !== '') {
    return { name: text };
  }
  return null;
}

function parseDrawing(text) {
  if (!text) { return []; }
  return text
    .toLowerCase()
    // numbers
    .replace(/([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)/g, ' $1 ')
    // commands
    .replace(/([mnlbspc])/g, ' $1 ')
    .trim()
    .replace(/\s+/g, ' ')
    .split(/\s(?=[mnlbspc])/)
    .map(function (cmd) { return (
      cmd.split(' ')
        .filter(function (x, i) { return !(i && isNaN(x * 1)); })
    ); });
}

var numTags = [
  'b', 'i', 'u', 's', 'fsp',
  'k', 'K', 'kf', 'ko', 'kt',
  'fe', 'q', 'p', 'pbo', 'a', 'an',
  'fscx', 'fscy', 'fax', 'fay', 'frx', 'fry', 'frz', 'fr',
  'be', 'blur', 'bord', 'xbord', 'ybord', 'shad', 'xshad', 'yshad' ];

var numRegexs = numTags.map(function (nt) { return ({ name: nt, regex: new RegExp(("^" + nt + "-?\\d")) }); });

function parseTag(text) {
  var assign;

  var tag = {};
  for (var i = 0; i < numRegexs.length; i++) {
    var ref = numRegexs[i];
    var name = ref.name;
    var regex = ref.regex;
    if (regex.test(text)) {
      tag[name] = text.slice(name.length) * 1;
      return tag;
    }
  }
  if (/^fn/.test(text)) {
    tag.fn = text.slice(2);
  } else if (/^r/.test(text)) {
    tag.r = text.slice(1);
  } else if (/^fs[\d+-]/.test(text)) {
    tag.fs = text.slice(2);
  } else if (/^\d?c&?H?[0-9a-fA-F]+|^\d?c$/.test(text)) {
    var ref$1 = text.match(/^(\d?)c&?H?(\w*)/);
    var num = ref$1[1];
    var color = ref$1[2];
    tag[("c" + (num || 1))] = color && ("000000" + color).slice(-6);
  } else if (/^\da&?H?[0-9a-fA-F]+/.test(text)) {
    var ref$2 = text.match(/^(\d)a&?H?([0-9a-f]+)/i);
    var num$1 = ref$2[1];
    var alpha = ref$2[2];
    tag[("a" + num$1)] = ("00" + alpha).slice(-2);
  } else if (/^alpha&?H?[0-9a-fA-F]+/.test(text)) {
    (assign = text.match(/^alpha&?H?([0-9a-f]+)/i), tag.alpha = assign[1]);
    tag.alpha = ("00" + (tag.alpha)).slice(-2);
  } else if (/^(?:pos|org|move|fad|fade)\([^)]+/.test(text)) {
    var ref$3 = text.match(/^(\w+)\((.*?)\)?$/);
    var key = ref$3[1];
    var value = ref$3[2];
    tag[key] = value
      .trim()
      .split(/\s*,\s*/)
      .map(Number);
  } else if (/^i?clip\([^)]+/.test(text)) {
    var p = text
      .match(/^i?clip\((.*?)\)?$/)[1]
      .trim()
      .split(/\s*,\s*/);
    tag.clip = {
      inverse: /iclip/.test(text),
      scale: 1,
      drawing: null,
      dots: null,
    };
    if (p.length === 1) {
      tag.clip.drawing = parseDrawing(p[0]);
    }
    if (p.length === 2) {
      tag.clip.scale = p[0] * 1;
      tag.clip.drawing = parseDrawing(p[1]);
    }
    if (p.length === 4) {
      tag.clip.dots = p.map(Number);
    }
  } else if (/^t\(/.test(text)) {
    var p$1 = text
      .match(/^t\((.*?)\)?$/)[1]
      .trim()
      .replace(/\\.*/, function (x) { return x.replace(/,/g, '\n'); })
      .split(/\s*,\s*/);
    if (!p$1[0]) { return tag; }
    tag.t = {
      t1: 0,
      t2: 0,
      accel: 1,
      tags: p$1[p$1.length - 1]
        .replace(/\n/g, ',')
        .split('\\')
        .slice(1)
        .map(parseTag),
    };
    if (p$1.length === 2) {
      tag.t.accel = p$1[0] * 1;
    }
    if (p$1.length === 3) {
      tag.t.t1 = p$1[0] * 1;
      tag.t.t2 = p$1[1] * 1;
    }
    if (p$1.length === 4) {
      tag.t.t1 = p$1[0] * 1;
      tag.t.t2 = p$1[1] * 1;
      tag.t.accel = p$1[2] * 1;
    }
  }

  return tag;
}

function parseTags(text) {
  var tags = [];
  var depth = 0;
  var str = '';
  // `\b\c` -> `b\c\`
  // `a\b\c` -> `b\c\`
  var transText = text.split('\\').slice(1).concat('').join('\\');
  for (var i = 0; i < transText.length; i++) {
    var x = transText[i];
    if (x === '(') { depth++; }
    if (x === ')') { depth--; }
    if (depth < 0) { depth = 0; }
    if (!depth && x === '\\') {
      if (str) {
        tags.push(str);
      }
      str = '';
    } else {
      str += x;
    }
  }
  return tags.map(parseTag);
}

function parseText(text) {
  var pairs = text.split(/{(.*?)}/);
  var parsed = [];
  if (pairs[0].length) {
    parsed.push({ tags: [], text: pairs[0], drawing: [] });
  }
  for (var i = 1; i < pairs.length; i += 2) {
    var tags = parseTags(pairs[i]);
    var isDrawing = tags.reduce(function (v, tag) { return (tag.p === undefined ? v : !!tag.p); }, false);
    parsed.push({
      tags: tags,
      text: isDrawing ? '' : pairs[i + 1],
      drawing: isDrawing ? parseDrawing(pairs[i + 1]) : [],
    });
  }
  return {
    raw: text,
    combined: parsed.map(function (frag) { return frag.text; }).join(''),
    parsed: parsed,
  };
}

function parseTime(time) {
  var t = time.split(':');
  return t[0] * 3600 + t[1] * 60 + t[2] * 1;
}

function parseDialogue(text, format) {
  var fields = text.split(',');
  if (fields.length > format.length) {
    var textField = fields.slice(format.length - 1).join();
    fields = fields.slice(0, format.length - 1);
    fields.push(textField);
  }

  var dia = {};
  for (var i = 0; i < fields.length; i++) {
    var fmt = format[i];
    var fld = fields[i].trim();
    switch (fmt) {
      case 'Layer':
      case 'MarginL':
      case 'MarginR':
      case 'MarginV':
        dia[fmt] = fld * 1;
        break;
      case 'Start':
      case 'End':
        dia[fmt] = parseTime(fld);
        break;
      case 'Effect':
        dia[fmt] = parseEffect(fld);
        break;
      case 'Text':
        dia[fmt] = parseText(fld);
        break;
      default:
        dia[fmt] = fld;
    }
  }

  return dia;
}

var stylesFormat = ['Name', 'Fontname', 'Fontsize', 'PrimaryColour', 'SecondaryColour', 'OutlineColour', 'BackColour', 'Bold', 'Italic', 'Underline', 'StrikeOut', 'ScaleX', 'ScaleY', 'Spacing', 'Angle', 'BorderStyle', 'Outline', 'Shadow', 'Alignment', 'MarginL', 'MarginR', 'MarginV', 'Encoding'];
var eventsFormat = ['Layer', 'Start', 'End', 'Style', 'Name', 'MarginL', 'MarginR', 'MarginV', 'Effect', 'Text'];

function parseFormat(text) {
  var fields = stylesFormat.concat(eventsFormat);
  return text.match(/Format\s*:\s*(.*)/i)[1]
    .split(/\s*,\s*/)
    .map(function (field) {
      var caseField = fields.find(function (f) { return f.toLowerCase() === field.toLowerCase(); });
      return caseField || field;
    });
}

function parseStyle(text, format) {
  var values = text.match(/Style\s*:\s*(.*)/i)[1].split(/\s*,\s*/);
  return Object.assign.apply(Object, [ {} ].concat( format.map(function (fmt, idx) {
    var obj;

    return (( obj = {}, obj[fmt] = values[idx], obj ));
  }) ));
}

function parse(text) {
  var tree = {
    info: {},
    styles: { format: [], style: [] },
    events: { format: [], comment: [], dialogue: [] },
  };
  var lines = text.split(/\r?\n/);
  var state = 0;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (/^;/.test(line)) { continue; }

    if (/^\[Script Info\]/i.test(line)) { state = 1; }
    else if (/^\[V4\+? Styles\]/i.test(line)) { state = 2; }
    else if (/^\[Events\]/i.test(line)) { state = 3; }
    else if (/^\[.*\]/.test(line)) { state = 0; }

    if (state === 0) { continue; }
    if (state === 1) {
      if (/:/.test(line)) {
        var ref = line.match(/(.*?)\s*:\s*(.*)/);
        var key = ref[1];
        var value = ref[2];
        tree.info[key] = value;
      }
    }
    if (state === 2) {
      if (/^Format\s*:/i.test(line)) {
        tree.styles.format = parseFormat(line);
      }
      if (/^Style\s*:/i.test(line)) {
        tree.styles.style.push(parseStyle(line, tree.styles.format));
      }
    }
    if (state === 3) {
      if (/^Format\s*:/i.test(line)) {
        tree.events.format = parseFormat(line);
      }
      if (/^(?:Comment|Dialogue)\s*:/i.test(line)) {
        var ref$1 = line.match(/^(\w+?)\s*:\s*(.*)/i);
        var key$1 = ref$1[1];
        var value$1 = ref$1[2];
        tree.events[key$1.toLowerCase()].push(parseDialogue(value$1, tree.events.format));
      }
    }
  }

  return tree;
}

function createCommand(arr) {
  var cmd = {
    type: null,
    prev: null,
    next: null,
    points: [],
  };
  if (/[mnlbs]/.test(arr[0])) {
    cmd.type = arr[0]
      .toUpperCase()
      .replace('N', 'L')
      .replace('B', 'C');
  }
  for (var len = arr.length - !(arr.length & 1), i = 1; i < len; i += 2) {
    cmd.points.push({ x: arr[i] * 1, y: arr[i + 1] * 1 });
  }
  return cmd;
}

function isValid(cmd) {
  if (!cmd.points.length || !cmd.type) {
    return false;
  }
  if (/C|S/.test(cmd.type) && cmd.points.length < 3) {
    return false;
  }
  return true;
}

function getViewBox(commands) {
  var ref;

  var minX = Infinity;
  var minY = Infinity;
  var maxX = -Infinity;
  var maxY = -Infinity;
  (ref = []).concat.apply(ref, commands.map(function (ref) {
    var points = ref.points;

    return points;
  })).forEach(function (ref) {
    var x = ref.x;
    var y = ref.y;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  return {
    minX: minX,
    minY: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Convert S command to B command
 * Reference from https://github.com/d3/d3/blob/v3.5.17/src/svg/line.js#L259
 * @param  {Array}  points points
 * @param  {String} prev   type of previous command
 * @param  {String} next   type of next command
 * @return {Array}         converted commands
 */
function s2b(points, prev, next) {
  var results = [];
  var bb1 = [0, 2 / 3, 1 / 3, 0];
  var bb2 = [0, 1 / 3, 2 / 3, 0];
  var bb3 = [0, 1 / 6, 2 / 3, 1 / 6];
  var dot4 = function (a, b) { return (a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]); };
  var px = [points[points.length - 1].x, points[0].x, points[1].x, points[2].x];
  var py = [points[points.length - 1].y, points[0].y, points[1].y, points[2].y];
  results.push({
    type: prev === 'M' ? 'M' : 'L',
    points: [{ x: dot4(bb3, px), y: dot4(bb3, py) }],
  });
  for (var i = 3; i < points.length; i++) {
    px = [points[i - 3].x, points[i - 2].x, points[i - 1].x, points[i].x];
    py = [points[i - 3].y, points[i - 2].y, points[i - 1].y, points[i].y];
    results.push({
      type: 'C',
      points: [
        { x: dot4(bb1, px), y: dot4(bb1, py) },
        { x: dot4(bb2, px), y: dot4(bb2, py) },
        { x: dot4(bb3, px), y: dot4(bb3, py) } ],
    });
  }
  if (next === 'L' || next === 'C') {
    var last = points[points.length - 1];
    results.push({ type: 'L', points: [{ x: last.x, y: last.y }] });
  }
  return results;
}

function toSVGPath(instructions) {
  return instructions.map(function (ref) {
    var type = ref.type;
    var points = ref.points;

    return (
    type + points.map(function (ref) {
      var x = ref.x;
      var y = ref.y;

      return (x + "," + y);
    }).join(',')
  );
  }).join('');
}

function compileDrawing(rawCommands) {
  var ref$1;

  var commands = [];
  var i = 0;
  while (i < rawCommands.length) {
    var arr = rawCommands[i];
    var cmd = createCommand(arr);
    if (isValid(cmd)) {
      if (cmd.type === 'S') {
        var ref = (commands[i - 1] || { points: [{ x: 0, y: 0 }] }).points.slice(-1)[0];
        var x = ref.x;
        var y = ref.y;
        cmd.points.unshift({ x: x, y: y });
      }
      if (i) {
        cmd.prev = commands[i - 1].type;
        commands[i - 1].next = cmd.type;
      }
      commands.push(cmd);
      i++;
    } else {
      if (i && commands[i - 1].type === 'S') {
        var additionPoints = {
          p: cmd.points,
          c: commands[i - 1].points.slice(0, 3),
        };
        commands[i - 1].points = commands[i - 1].points.concat(
          (additionPoints[arr[0]] || []).map(function (ref) {
            var x = ref.x;
            var y = ref.y;

            return ({ x: x, y: y });
        })
        );
      }
      rawCommands.splice(i, 1);
    }
  }
  var instructions = (ref$1 = []).concat.apply(
    ref$1, commands.map(function (ref) {
      var type = ref.type;
      var points = ref.points;
      var prev = ref.prev;
      var next = ref.next;

      return (
      type === 'S'
        ? s2b(points, prev, next)
        : { type: type, points: points }
    );
  })
  );

  return Object.assign({ instructions: instructions, d: toSVGPath(instructions) }, getViewBox(commands));
}

var tTags = [
  'fs', 'fsp', 'clip',
  'c1', 'c2', 'c3', 'c4', 'a1', 'a2', 'a3', 'a4', 'alpha',
  'fscx', 'fscy', 'fax', 'fay', 'frx', 'fry', 'frz', 'fr',
  'be', 'blur', 'bord', 'xbord', 'ybord', 'shad', 'xshad', 'yshad' ];

function compileTag(tag, key, presets) {
  var obj, obj$1, obj$2;

  if ( presets === undefined ) presets = {};
  var value = tag[key];
  if (value === undefined) {
    return null;
  }
  if (key === 'pos' || key === 'org') {
    return value.length === 2 ? ( obj = {}, obj[key] = { x: value[0], y: value[1] }, obj ) : null;
  }
  if (key === 'move') {
    var x1 = value[0];
    var y1 = value[1];
    var x2 = value[2];
    var y2 = value[3];
    var t1 = value[4]; if ( t1 === undefined ) t1 = 0;
    var t2 = value[5]; if ( t2 === undefined ) t2 = 0;
    return value.length === 4 || value.length === 6
      ? { move: { x1: x1, y1: y1, x2: x2, y2: y2, t1: t1, t2: t2 } }
      : null;
  }
  if (key === 'fad' || key === 'fade') {
    if (value.length === 2) {
      var t1$1 = value[0];
      var t2$1 = value[1];
      return { fade: { type: 'fad', t1: t1$1, t2: t2$1 } };
    }
    if (value.length === 7) {
      var a1 = value[0];
      var a2 = value[1];
      var a3 = value[2];
      var t1$2 = value[3];
      var t2$2 = value[4];
      var t3 = value[5];
      var t4 = value[6];
      return { fade: { type: 'fade', a1: a1, a2: a2, a3: a3, t1: t1$2, t2: t2$2, t3: t3, t4: t4 } };
    }
    return null;
  }
  if (key === 'clip') {
    var inverse = value.inverse;
    var scale = value.scale;
    var drawing = value.drawing;
    var dots = value.dots;
    if (drawing) {
      return { clip: { inverse: inverse, scale: scale, drawing: compileDrawing(drawing), dots: dots } };
    }
    if (dots) {
      var x1$1 = dots[0];
      var y1$1 = dots[1];
      var x2$1 = dots[2];
      var y2$1 = dots[3];
      return { clip: { inverse: inverse, scale: scale, drawing: drawing, dots: { x1: x1$1, y1: y1$1, x2: x2$1, y2: y2$1 } } };
    }
    return null;
  }
  if (/^[xy]?(bord|shad)$/.test(key)) {
    value = Math.max(value, 0);
  }
  if (key === 'bord') {
    return { xbord: value, ybord: value };
  }
  if (key === 'shad') {
    return { xshad: value, yshad: value };
  }
  if (/^c\d$/.test(key)) {
    return ( obj$1 = {}, obj$1[key] = value || presets[key], obj$1 );
  }
  if (key === 'alpha') {
    return { a1: value, a2: value, a3: value, a4: value };
  }
  if (key === 'fr') {
    return { frz: value };
  }
  if (key === 'fs') {
    return {
      fs: /^\+|-/.test(value)
        ? (value * 1 > -10 ? (1 + value / 10) : 1) * presets.fs
        : value * 1,
    };
  }
  if (key === 'K') {
    return { kf: value };
  }
  if (key === 't') {
    var t1$3 = value.t1;
    var accel = value.accel;
    var tags = value.tags;
    var t2$3 = value.t2 || (presets.end - presets.start) * 1e3;
    var compiledTag = {};
    tags.forEach(function (t) {
      var k = Object.keys(t)[0];
      if (~tTags.indexOf(k) && !(k === 'clip' && !t[k].dots)) {
        Object.assign(compiledTag, compileTag(t, k, presets));
      }
    });
    return { t: { t1: t1$3, t2: t2$3, accel: accel, tag: compiledTag } };
  }
  return ( obj$2 = {}, obj$2[key] = value, obj$2 );
}

var a2an = [
  null, 1, 2, 3,
  null, 7, 8, 9,
  null, 4, 5, 6 ];

var globalTags = ['r', 'a', 'an', 'pos', 'org', 'move', 'fade', 'fad', 'clip'];

function inheritTag(pTag) {
  return JSON.parse(JSON.stringify(Object.assign({}, pTag, {
    k: undefined,
    kf: undefined,
    ko: undefined,
    kt: undefined,
  })));
}

function compileText(ref) {
  var styles = ref.styles;
  var style = ref.style;
  var parsed = ref.parsed;
  var start = ref.start;
  var end = ref.end;

  var alignment;
  var q = { q: styles[style].tag.q };
  var pos;
  var org;
  var move;
  var fade;
  var clip;
  var slices = [];
  var slice = { style: style, fragments: [] };
  var prevTag = {};
  for (var i = 0; i < parsed.length; i++) {
    var ref$1 = parsed[i];
    var tags = ref$1.tags;
    var text = ref$1.text;
    var drawing = ref$1.drawing;
    var reset = (undefined);
    for (var j = 0; j < tags.length; j++) {
      var tag = tags[j];
      reset = tag.r === undefined ? reset : tag.r;
    }
    var fragment = {
      tag: reset === undefined ? inheritTag(prevTag) : {},
      text: text,
      drawing: drawing.length ? compileDrawing(drawing) : null,
    };
    for (var j$1 = 0; j$1 < tags.length; j$1++) {
      var tag$1 = tags[j$1];
      alignment = alignment || a2an[tag$1.a || 0] || tag$1.an;
      q = compileTag(tag$1, 'q') || q;
      if (!move) {
        pos = pos || compileTag(tag$1, 'pos');
      }
      org = org || compileTag(tag$1, 'org');
      if (!pos) {
        move = move || compileTag(tag$1, 'move');
      }
      fade = fade || compileTag(tag$1, 'fade') || compileTag(tag$1, 'fad');
      clip = compileTag(tag$1, 'clip') || clip;
      var key = Object.keys(tag$1)[0];
      if (key && !~globalTags.indexOf(key)) {
        var sliceTag = styles[style].tag;
        var c1 = sliceTag.c1;
        var c2 = sliceTag.c2;
        var c3 = sliceTag.c3;
        var c4 = sliceTag.c4;
        var fs = prevTag.fs || sliceTag.fs;
        var compiledTag = compileTag(tag$1, key, { start: start, end: end, c1: c1, c2: c2, c3: c3, c4: c4, fs: fs });
        if (key === 't') {
          fragment.tag.t = fragment.tag.t || [];
          fragment.tag.t.push(compiledTag.t);
        } else {
          Object.assign(fragment.tag, compiledTag);
        }
      }
    }
    prevTag = fragment.tag;
    if (reset !== undefined) {
      slices.push(slice);
      slice = { style: styles[reset] ? reset : style, fragments: [] };
    }
    if (fragment.text || fragment.drawing) {
      var prev = slice.fragments[slice.fragments.length - 1] || {};
      if (prev.text && fragment.text && !Object.keys(fragment.tag).length) {
        // merge fragment to previous if its tag is empty
        prev.text += fragment.text;
      } else {
        slice.fragments.push(fragment);
      }
    }
  }
  slices.push(slice);

  return Object.assign({ alignment: alignment, slices: slices }, q, pos, org, move, fade, clip);
}

function compileDialogues(ref) {
  var styles = ref.styles;
  var dialogues = ref.dialogues;

  var minLayer = Infinity;
  var results = [];
  for (var i = 0; i < dialogues.length; i++) {
    var dia = dialogues[i];
    if (dia.Start >= dia.End) {
      continue;
    }
    if (!styles[dia.Style]) {
      dia.Style = 'Default';
    }
    var stl = styles[dia.Style].style;
    var compiledText = compileText({
      styles: styles,
      style: dia.Style,
      parsed: dia.Text.parsed,
      start: dia.Start,
      end: dia.End,
    });
    var alignment = compiledText.alignment || stl.Alignment;
    minLayer = Math.min(minLayer, dia.Layer);
    results.push(Object.assign({
      layer: dia.Layer,
      start: dia.Start,
      end: dia.End,
      style: dia.Style,
      name: dia.Name,
      // reset style by `\r` will not effect margin and alignment
      margin: {
        left: dia.MarginL || stl.MarginL,
        right: dia.MarginR || stl.MarginR,
        vertical: dia.MarginV || stl.MarginV,
      },
      effect: dia.Effect,
    }, compiledText, { alignment: alignment }));
  }
  for (var i$1 = 0; i$1 < results.length; i$1++) {
    results[i$1].layer -= minLayer;
  }
  return results.sort(function (a, b) { return a.start - b.start || a.end - b.end; });
}

// same as Aegisub
// https://github.com/Aegisub/Aegisub/blob/master/src/ass_style.h
var DEFAULT_STYLE = {
  Name: 'Default',
  Fontname: 'Arial',
  Fontsize: '20',
  PrimaryColour: '&H00FFFFFF&',
  SecondaryColour: '&H000000FF&',
  OutlineColour: '&H00000000&',
  BackColour: '&H00000000&',
  Bold: '0',
  Italic: '0',
  Underline: '0',
  StrikeOut: '0',
  ScaleX: '100',
  ScaleY: '100',
  Spacing: '0',
  Angle: '0',
  BorderStyle: '1',
  Outline: '2',
  Shadow: '2',
  Alignment: '2',
  MarginL: '10',
  MarginR: '10',
  MarginV: '10',
  Encoding: '1',
};

/**
 * @param {String} color
 * @returns {Array} [AA, BBGGRR]
 */
function parseStyleColor(color) {
  if (/^(&|H|&H)[0-9a-f]{6,}/i.test(color)) {
    var ref = color.match(/&?H?([0-9a-f]{2})?([0-9a-f]{6})/i);
    var a = ref[1];
    var c = ref[2];
    return [a || '00', c];
  }
  var num = parseInt(color, 10);
  if (!isNaN(num)) {
    var min = -2147483648;
    var max = 2147483647;
    if (num < min) {
      return ['00', '000000'];
    }
    var aabbggrr = (min <= num && num <= max)
      ? ("00000000" + ((num < 0 ? num + 4294967296 : num).toString(16))).slice(-8)
      : String(num).slice(0, 8);
    return [aabbggrr.slice(0, 2), aabbggrr.slice(2)];
  }
  return ['00', '000000'];
}

function compileStyles(ref) {
  var info = ref.info;
  var style = ref.style;
  var defaultStyle = ref.defaultStyle;

  var result = {};
  var styles = [Object.assign({}, defaultStyle, { Name: 'Default' })].concat(style);
  var loop = function ( i ) {
    var s = Object.assign({}, DEFAULT_STYLE, styles[i]);
    // this behavior is same as Aegisub by black-box testing
    if (/^(\*+)Default$/.test(s.Name)) {
      s.Name = 'Default';
    }
    Object.keys(s).forEach(function (key) {
      if (key !== 'Name' && key !== 'Fontname' && !/Colour/.test(key)) {
        s[key] *= 1;
      }
    });
    var ref$1 = parseStyleColor(s.PrimaryColour);
    var a1 = ref$1[0];
    var c1 = ref$1[1];
    var ref$2 = parseStyleColor(s.SecondaryColour);
    var a2 = ref$2[0];
    var c2 = ref$2[1];
    var ref$3 = parseStyleColor(s.OutlineColour);
    var a3 = ref$3[0];
    var c3 = ref$3[1];
    var ref$4 = parseStyleColor(s.BackColour);
    var a4 = ref$4[0];
    var c4 = ref$4[1];
    var tag = {
      fn: s.Fontname,
      fs: s.Fontsize,
      c1: c1,
      a1: a1,
      c2: c2,
      a2: a2,
      c3: c3,
      a3: a3,
      c4: c4,
      a4: a4,
      b: Math.abs(s.Bold),
      i: Math.abs(s.Italic),
      u: Math.abs(s.Underline),
      s: Math.abs(s.StrikeOut),
      fscx: s.ScaleX,
      fscy: s.ScaleY,
      fsp: s.Spacing,
      frz: s.Angle,
      xbord: s.Outline,
      ybord: s.Outline,
      xshad: s.Shadow,
      yshad: s.Shadow,
      fe: s.Encoding,
      // TODO: [breaking change] remove `q` from style
      q: /^[0-3]$/.test(info.WrapStyle) ? info.WrapStyle * 1 : 2,
    };
    result[s.Name] = { style: s, tag: tag };
  };

  for (var i = 0; i < styles.length; i++) loop( i );
  return result;
}

function compile(text, options) {
  if ( options === undefined ) options = {};

  var tree = parse(text);
  var info = Object.assign(options.defaultInfo || {}, tree.info);
  var styles = compileStyles({
    info: info,
    style: tree.styles.style,
    defaultStyle: options.defaultStyle || {},
  });
  return {
    info: info,
    width: info.PlayResX * 1 || null,
    height: info.PlayResY * 1 || null,
    wrapStyle: /^[0-3]$/.test(info.WrapStyle) ? info.WrapStyle * 1 : 2,
    collisions: info.Collisions || 'Normal',
    styles: styles,
    dialogues: compileDialogues({
      styles: styles,
      dialogues: tree.events.dialogue,
    }),
  };
}

// https://github.com/weizhenye/ASS/wiki/Font-Size-in-ASS

const useTextMetrics = 'fontBoundingBoxAscent' in TextMetrics.prototype;

// It seems max line-height is 1200px in Firefox.
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
const unitsPerEm = !useTextMetrics && isFirefox ? 512 : 2048;
const lineSpacing = Object.create(null);

const ctx = document.createElement('canvas').getContext('2d');

const $div = document.createElement('div');
$div.className = 'ASS-fix-font-size';
$div.style.fontSize = `${unitsPerEm}px`;
const $span = document.createElement('span');
$span.textContent = '0';
$div.append($span);

const $fixFontSize = useTextMetrics ? null : $div;

function getRealFontSize(fn, fs) {
  if (!lineSpacing[fn]) {
    if (useTextMetrics) {
      ctx.font = `${unitsPerEm}px "${fn}"`;
      const tm = ctx.measureText('');
      lineSpacing[fn] = tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent;
    } else {
      $span.style.fontFamily = `"${fn}"`;
      lineSpacing[fn] = $span.clientHeight;
    }
  }
  return fs * unitsPerEm / lineSpacing[fn];
}

var GLOBAL_CSS = '.ASS-box{pointer-events:none;font-family:Arial;position:absolute;overflow:hidden}.ASS-dialogue{z-index:0;width:max-content;transform:translate(calc(var(--ass-align-h)*-1),calc(var(--ass-align-v)*-1));font-size:0;position:absolute}.ASS-dialogue span{display:inline-block}.ASS-dialogue [data-text]{color:var(--ass-fill-color);font-size:calc(var(--ass-scale)*var(--ass-real-fs)*1px);line-height:calc(var(--ass-scale)*var(--ass-tag-fs)*1px);letter-spacing:calc(var(--ass-scale)*var(--ass-tag-fsp)*1px);filter:blur(calc(var(--ass-scale-stroke)*var(--ass-tag-blur)*(1 - round(up,sin(var(--ass-tag-xbord))*sin(var(--ass-tag-xbord))))*(1 - round(up,sin(var(--ass-tag-ybord))*sin(var(--ass-tag-ybord))))*1px));display:inline-block}.ASS-dialogue [data-is=br]+[data-is=br]{height:calc(var(--ass-scale)*var(--ass-tag-fs)*1px/2)}.ASS-dialogue[data-wrap-style="0"],.ASS-dialogue[data-wrap-style="3"]{text-wrap:balance;white-space:pre-wrap}.ASS-dialogue[data-wrap-style="1"]{word-break:break-word;white-space:pre-wrap}.ASS-dialogue[data-wrap-style="2"]{word-break:normal;white-space:pre}.ASS-dialogue [data-border-style="1"]{position:relative}.ASS-dialogue [data-border-style="1"]:before,.ASS-dialogue [data-border-style="1"]:after{content:attr(data-text);z-index:-1;filter:blur(calc(var(--ass-scale-stroke)*var(--ass-tag-blur)*1px));position:absolute;top:0;left:0}.ASS-dialogue [data-border-style="1"]:before{color:var(--ass-shadow-color);-webkit-text-stroke:calc(var(--ass-scale-stroke)*var(--ass-border-width)*1px)var(--ass-shadow-color);transform:translate(calc(var(--ass-scale-stroke)*var(--ass-tag-xshad)*1px),calc(var(--ass-scale-stroke)*var(--ass-tag-yshad)*1px))}.ASS-dialogue [data-border-style="1"]:after{color:var(--ass-border-color);-webkit-text-stroke:calc(var(--ass-scale-stroke)*var(--ass-border-width)*1px)var(--ass-border-color)}.ASS-dialogue [data-border-style="1"][data-stroke=svg]{color:#000}.ASS-dialogue [data-border-style="1"][data-stroke=svg]:before,.ASS-dialogue [data-border-style="1"][data-stroke=svg]:after{opacity:0}@container style(--ass-tag-xbord:0) and style(--ass-tag-ybord:0){.ASS-dialogue [data-border-style="1"]:after{display:none}}@container style(--ass-tag-xshad:0) and style(--ass-tag-yshad:0){.ASS-dialogue [data-border-style="1"]:before{display:none}}.ASS-dialogue [data-border-style="3"]{padding:calc(var(--ass-scale-stroke)*var(--ass-tag-xbord)*1px)calc(var(--ass-scale-stroke)*var(--ass-tag-ybord)*1px);filter:blur(calc(var(--ass-scale-stroke)*var(--ass-tag-blur)*1px));position:relative}.ASS-dialogue [data-border-style="3"]:before,.ASS-dialogue [data-border-style="3"]:after{content:"";z-index:-1;width:100%;height:100%;position:absolute}.ASS-dialogue [data-border-style="3"]:before{background-color:var(--ass-shadow-color);left:calc(var(--ass-scale-stroke)*var(--ass-tag-xshad)*1px);top:calc(var(--ass-scale-stroke)*var(--ass-tag-yshad)*1px)}.ASS-dialogue [data-border-style="3"]:after{background-color:var(--ass-border-color);top:0;left:0}@container style(--ass-tag-xbord:0) and style(--ass-tag-ybord:0){.ASS-dialogue [data-border-style="3"]:after{background-color:#0000}}@container style(--ass-tag-xshad:0) and style(--ass-tag-yshad:0){.ASS-dialogue [data-border-style="3"]:before{background-color:#0000}}.ASS-dialogue [data-rotate]{transform:perspective(312.5px)rotateY(calc(var(--ass-tag-fry)*1deg))rotateX(calc(var(--ass-tag-frx)*1deg))rotateZ(calc(var(--ass-tag-frz)*-1deg))}.ASS-dialogue [data-rotate][data-text]{transform-style:preserve-3d;word-break:normal;white-space:nowrap}.ASS-dialogue [data-scale],.ASS-dialogue [data-skew]{transform:scale(var(--ass-tag-fscx),var(--ass-tag-fscy))skew(calc(var(--ass-tag-fax)*57.2958deg),calc(var(--ass-tag-fay)*57.2958deg));transform-origin:var(--ass-align-h)var(--ass-align-v);display:inline-block}.ASS-fix-font-size{visibility:hidden;width:0;height:0;font-family:Arial;line-height:normal;position:absolute;overflow:hidden}.ASS-fix-font-size span{position:absolute}.ASS-clip-area{width:100%;height:100%;position:absolute;top:0;left:0}.ASS-effect-area{width:100%;height:fit-content;display:flex;position:absolute;overflow:hidden;mask-composite:intersect}.ASS-effect-area[data-effect=banner]{flex-direction:column;height:100%}.ASS-effect-area .ASS-dialogue{position:static;transform:none}';

function alpha2opacity(a) {
  return 1 - `0x${a}` / 255;
}

function color2rgba(c) {
  const t = c.match(/(\w\w)(\w\w)(\w\w)(\w\w)/);
  const a = alpha2opacity(t[1]);
  const b = +`0x${t[2]}`;
  const g = +`0x${t[3]}`;
  const r = +`0x${t[4]}`;
  return `rgba(${r},${g},${b},${a})`;
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.trunc(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * @param {string} name SVG tag
 * @param {[string, string][]} attrs
 * @returns
 */
function createSVGEl(name, attrs = []) {
  const $el = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (let i = 0; i < attrs.length; i += 1) {
    const attr = attrs[i];
    $el.setAttributeNS(
      attr[0] === 'xlink:href' ? 'http://www.w3.org/1999/xlink' : null,
      attr[0],
      attr[1],
    );
  }
  return $el;
}

/**
 * @param {HTMLElement} container
 */
function addGlobalStyle(container) {
  const rootNode = container.getRootNode() || document;
  const styleRoot = rootNode === document ? document.head : rootNode;
  let $style = styleRoot.querySelector('#ASS-global-style');
  if (!$style) {
    $style = document.createElement('style');
    $style.type = 'text/css';
    $style.id = 'ASS-global-style';
    $style.append(document.createTextNode(GLOBAL_CSS));
    styleRoot.append($style);
  }
}

function initAnimation($el, keyframes, options) {
  const animation = $el.animate(keyframes, options);
  animation.pause();
  return animation;
}

function batchAnimate(dia, action) {
  (dia.animations || []).forEach((animation) => {
    animation[action]();
  });
}

const rotateTags = ['frx', 'fry', 'frz'];
const scaleTags = ['fscx', 'fscy'];
const skewTags = ['fax', 'fay'];

function createTransform(tag) {
  return [
    ...[...rotateTags, ...skewTags].map((x) => ([`--ass-tag-${x}`, `${tag[x] || 0}`])),
    ...scaleTags.map((x) => ([`--ass-tag-${x}`, tag.p ? 1 : (tag[x] || 100) / 100])),
  ];
}

function setTransformOrigin(dialogue, scale) {
  const { align, width, height, x, y, $div } = dialogue;
  const orgX = (dialogue.org ? dialogue.org.x * scale : x) + [0, width / 2, width][align.h];
  const orgY = (dialogue.org ? dialogue.org.y * scale : y) + [height, height / 2, 0][align.v];
  for (let i = $div.childNodes.length - 1; i >= 0; i -= 1) {
    const node = $div.childNodes[i];
    if (node.dataset.rotate === '') {
      // It's not extremely precise for offsets are round the value to an integer.
      const tox = orgX - x - node.offsetLeft;
      const toy = orgY - y - node.offsetTop;
      node.style.cssText += `transform-origin:${tox}px ${toy}px;`;
    }
  }
}

const strokeTags = ['blur', 'xbord', 'ybord', 'xshad', 'yshad'];
if (window.CSS.registerProperty) {
  [
    'real-fs', 'tag-fs', 'tag-fsp', 'border-width',
    ...[...strokeTags, ...rotateTags, ...skewTags].map((tag) => `tag-${tag}`),
  ].forEach((k) => {
    window.CSS.registerProperty({
      name: `--ass-${k}`,
      syntax: '<number>',
      inherits: true,
      initialValue: 0,
    });
  });
  [
    'border-opacity', 'shadow-opacity',
    ...scaleTags.map((tag) => `tag-${tag}`),
  ].forEach((k) => {
    window.CSS.registerProperty({
      name: `--ass-${k}`,
      syntax: '<number>',
      inherits: true,
      initialValue: 1,
    });
  });
  ['fill-color', 'border-color', 'shadow-color'].forEach((k) => {
    window.CSS.registerProperty({
      name: `--ass-${k}`,
      syntax: '<color>',
      inherits: true,
      initialValue: 'transparent',
    });
  });
}

function createEffect(effect, duration) {
  // TODO: when effect and move both exist, its behavior is weird, for now only move works.
  const { name, delay, leftToRight } = effect;
  const translate = name === 'banner' ? 'X' : 'Y';
  const dir = ({
    X: leftToRight ? 1 : -1,
    Y: /up/.test(name) ? -1 : 1,
  })[translate];
  const start = -100 * dir;
  // speed is 1000px/s when delay=1
  const distance = (duration / (delay || 1)) * dir;
  const keyframes = [
    { offset: 0, transform: `translate${translate}(${start}%)` },
    { offset: 1, transform: `translate${translate}(calc(${start}% + var(--ass-scale) * ${distance}px))` },
  ];
  return [keyframes, { duration, fill: 'forwards' }];
}

function multiplyScale(v) {
  return `calc(var(--ass-scale) * ${v}px)`;
}

function createMove(move, duration) {
  const { x1, y1, x2, y2, t1, t2 } = move;
  const start = `translate(${multiplyScale(x1)}, ${multiplyScale(y1)})`;
  const end = `translate(${multiplyScale(x2)}, ${multiplyScale(y2)})`;
  const moveDuration = Math.max(t2, duration);
  const keyframes = [
    { offset: 0, transform: start },
    t1 > 0 ? { offset: t1 / moveDuration, transform: start } : null,
    (t2 > 0 && t2 < duration) ? { offset: t2 / moveDuration, transform: end } : null,
    { offset: 1, transform: end },
  ].filter(Boolean);
  const options = { duration: moveDuration, fill: 'forwards' };
  return [keyframes, options];
}

function createFadeList(fade, duration) {
  const { type, a1, a2, a3, t1, t2, t3, t4 } = fade;
  // \fad(<t1>, <t2>)
  if (type === 'fad') {
    // For example dialogue starts at 0 and ends at 5000 with \fad(4000, 4000)
    // * <t1> means opacity from 0 to 1 in (0, 4000)
    // * <t2> means opacity from 1 to 0 in (1000, 5000)
    // <t1> and <t2> are overlaped in (1000, 4000), <t1> will take affect
    // so the result is:
    // * opacity from 0 to 1 in (0, 4000)
    // * opacity from 0.25 to 0 in (4000, 5000)
    const t1Keyframes = [{ offset: 0, opacity: 0 }, { offset: 1, opacity: 1 }];
    const t2Keyframes = [{ offset: 0, opacity: 1 }, { offset: 1, opacity: 0 }];
    return [
      [t2Keyframes, { duration: t2, delay: duration - t2, fill: 'forwards' }],
      [t1Keyframes, { duration: t1, composite: 'replace' }],
    ];
  }
  // \fade(<a1>, <a2>, <a3>, <t1>, <t2>, <t3>, <t4>)
  const fadeDuration = Math.max(duration, t4);
  const opacities = [a1, a2, a3].map((a) => 1 - a / 255);
  const offsets = [0, t1, t2, t3, t4].map((t) => t / fadeDuration);
  const keyframes = offsets.map((t, i) => ({ offset: t, opacity: opacities[i >> 1] }));
  return [
    [keyframes, { duration: fadeDuration, fill: 'forwards' }],
  ];
}

function createAnimatableVars(tag) {
  return [
    ['real-fs', getRealFontSize(tag.fn, tag.fs)],
    ['tag-fs', tag.fs],
    ['tag-fsp', tag.fsp],
    ['fill-color', color2rgba(tag.a1 + tag.c1)],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => [`--ass-${k}`, v]);
}

// use linear() to simulate accel
function getEasing(duration, accel) {
  if (accel === 1) return 'linear';
  // 60fps
  const frames = Math.ceil(duration / 1000 * 60);
  const points = Array.from({ length: frames + 1 })
    .map((_, i) => (i / frames) ** accel);
  return `linear(${points.join(',')})`;
}

function createDialogueAnimations(el, dialogue) {
  const { start, end, effect, move, fade } = dialogue;
  const duration = (end - start) * 1000;
  return [
    effect && !move ? createEffect(effect, duration) : null,
    move ? createMove(move, duration) : null,
    ...(fade ? createFadeList(fade, duration) : []),
  ]
    .filter(Boolean)
    .map(([keyframes, options]) => initAnimation(el, keyframes, options));
}

function createTagKeyframes(fromTag, tag, key) {
  const value = tag[key];
  if (value === undefined) return [];
  if (key === 'clip') return [];
  if (key === 'a1' || key === 'c1') {
    return [['fill-color', color2rgba((tag.a1 || fromTag.a1) + (tag.c1 || fromTag.c1))]];
  }
  if (key === 'a3' || key === 'c3') {
    return [['border-color', color2rgba((tag.a3 || fromTag.a3) + (tag.c3 || fromTag.c3))]];
  }
  if (key === 'a4' || key === 'c4') {
    return [['shadow-color', color2rgba((tag.a4 || fromTag.a4) + (tag.c4 || fromTag.c4))]];
  }
  if (key === 'fs') {
    return [
      ['real-fs', getRealFontSize(tag.fn || fromTag.fn, tag.fs)],
      ['tag-fs', value],
    ];
  }
  if (key === 'fscx' || key === 'fscy') {
    return [[`tag-${key}`, (value || 100) / 100]];
  }
  if (key === 'xbord' || key === 'ybord') {
    return [['border-width', value * 2]];
  }
  return [[`tag-${key}`, value]];
}

function createTagAnimations(el, fragment, sliceTag) {
  const fromTag = { ...sliceTag, ...fragment.tag };
  return (fragment.tag.t || []).map(({ t1, t2, accel, tag }) => {
    const keyframe = Object.fromEntries(
      Object.keys(tag)
        .flatMap((key) => createTagKeyframes(fromTag, tag, key))
        .map(([k, v]) => [`--ass-${k}`, v])
        // .concat(tag.clip ? [['clipPath', ]] : [])
        .concat([['offset', 1]]),
    );
    const duration = Math.max(0, t2 - t1);
    return initAnimation(el, [keyframe], {
      duration,
      delay: t1,
      fill: 'forwards',
      easing: getEasing(duration, accel),
    });
  });
}

function createClipAnimations(el, dialogue, store) {
  return dialogue.slices
    .flatMap((slice) => slice.fragments)
    .flatMap((fragment) => fragment.tag.t || [])
    .filter(({ tag }) => tag.clip)
    .map(({ t1, t2, accel, tag }) => {
      const keyframe = {
        offset: 1,
        clipPath: createRectClip(tag.clip, store.scriptRes.width, store.scriptRes.height),
      };
      const duration = Math.max(0, t2 - t1);
      return initAnimation(el, [keyframe], {
        duration,
        delay: t1,
        fill: 'forwards',
        easing: getEasing(duration, accel),
      });
    });
}

// eslint-disable-next-line import/no-cycle

function createRectClip(clip, sw, sh) {
  if (!clip.dots) return '';
  const { x1, y1, x2, y2 } = clip.dots;
  const polygon = [[x1, y1], [x1, y2], [x2, y2], [x2, y1], [x1, y1]]
    .map(([x, y]) => [x / sw, y / sh])
    .concat(clip.inverse ? [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]] : [])
    .map((pair) => pair.map((n) => `${n * 100}%`).join(' '))
    .join(',');
  return `polygon(evenodd, ${polygon})`;
}

function createPathClip(clip, sw, sh, store) {
  if (!clip.drawing) return '';
  const scale = store.scale / (1 << (clip.scale - 1));
  let d = clip.drawing.instructions.map(({ type, points }) => (
    type + points.map(({ x, y }) => `${x * scale},${y * scale}`).join(',')
  )).join('');
  if (clip.inverse) {
    d += `M0,0L0,${sh},${sw},${sh},${sw},0,0,0Z`;
  }
  return `path(evenodd, "${d}")`;
}

function getClipPath(dialogue, store) {
  const { clip, animations } = dialogue;
  if (!clip) return {};
  const { width, height } = store.scriptRes;
  const $clipArea = document.createElement('div');
  store.box.insertBefore($clipArea, dialogue.$div);
  $clipArea.append(dialogue.$div);
  $clipArea.className = 'ASS-clip-area';
  $clipArea.style.zIndex = dialogue.$div.style.zIndex;
  $clipArea.style.clipPath = clip.dots
    ? createRectClip(clip, width, height)
    : createPathClip(clip, width, height, store);
  animations.push(...createClipAnimations($clipArea, dialogue, store));

  return { $div: $clipArea };
}

function createStrokeFilter(tag, scale) {
  const id = `ASS-${uuid()}`;
  const hasBorder = tag.xbord || tag.ybord;
  const hasShadow = tag.xshad || tag.yshad;
  const isOpaque = (tag.a1 || '00').toLowerCase() !== 'ff';
  const blur = (tag.blur || tag.be || 0) * scale;
  const $filter = createSVGEl('filter', [['id', id]]);
  $filter.append(createSVGEl('feGaussianBlur', [
    ['stdDeviation', hasBorder ? 0 : blur],
    ['in', 'SourceGraphic'],
    ['result', 'sg_b'],
  ]));
  $filter.append(createSVGEl('feFlood', [
    ['flood-color', 'var(--ass-fill-color)'],
    ['result', 'c1'],
  ]));
  $filter.append(createSVGEl('feComposite', [
    ['operator', 'in'],
    ['in', 'c1'],
    ['in2', 'sg_b'],
    ['result', 'main'],
  ]));
  if (hasBorder) {
    $filter.append(createSVGEl('feMorphology', [
      ['radius', `${tag.xbord * scale} ${tag.ybord * scale}`],
      ['operator', 'dilate'],
      ['in', 'SourceGraphic'],
      ['result', 'dil'],
    ]));
    $filter.append(createSVGEl('feGaussianBlur', [
      ['stdDeviation', blur],
      ['in', 'dil'],
      ['result', 'dil_b'],
    ]));
    $filter.append(createSVGEl('feComposite', [
      ['operator', 'out'],
      ['in', 'dil_b'],
      ['in2', 'SourceGraphic'],
      ['result', 'dil_b_o'],
    ]));
    $filter.append(createSVGEl('feFlood', [
      ['flood-color', 'var(--ass-border-color)'],
      ['result', 'c3'],
    ]));
    $filter.append(createSVGEl('feComposite', [
      ['operator', 'in'],
      ['in', 'c3'],
      ['in2', 'dil_b_o'],
      ['result', 'border'],
    ]));
  }
  if (hasShadow && (hasBorder || isOpaque)) {
    $filter.append(createSVGEl('feOffset', [
      ['dx', tag.xshad * scale],
      ['dy', tag.yshad * scale],
      ['in', hasBorder ? (isOpaque ? 'dil' : 'dil_b_o') : 'SourceGraphic'],
      ['result', 'off'],
    ]));
    $filter.append(createSVGEl('feGaussianBlur', [
      ['stdDeviation', blur],
      ['in', 'off'],
      ['result', 'off_b'],
    ]));
    if (!isOpaque) {
      $filter.append(createSVGEl('feOffset', [
        ['dx', tag.xshad * scale],
        ['dy', tag.yshad * scale],
        ['in', 'SourceGraphic'],
        ['result', 'sg_off'],
      ]));
      $filter.append(createSVGEl('feComposite', [
        ['operator', 'out'],
        ['in', 'off_b'],
        ['in2', 'sg_off'],
        ['result', 'off_b_o'],
      ]));
    }
    $filter.append(createSVGEl('feFlood', [
      ['flood-color', 'var(--ass-shadow-color)'],
      ['result', 'c4'],
    ]));
    $filter.append(createSVGEl('feComposite', [
      ['operator', 'in'],
      ['in', 'c4'],
      ['in2', isOpaque ? 'off_b' : 'off_b_o'],
      ['result', 'shadow'],
    ]));
  }
  const $merge = createSVGEl('feMerge', []);
  if (hasShadow && (hasBorder || isOpaque)) {
    $merge.append(createSVGEl('feMergeNode', [['in', 'shadow']]));
  }
  if (hasBorder) {
    $merge.append(createSVGEl('feMergeNode', [['in', 'border']]));
  }
  $merge.append(createSVGEl('feMergeNode', [['in', 'main']]));
  $filter.append($merge);
  return { id, el: $filter };
}

function createStrokeVars(tag) {
  return [
    ['border-width', tag.xbord * 2],
    ['border-color', color2rgba(`${tag.a3}${tag.c3}`)],
    ['shadow-color', color2rgba(`${tag.a4}${tag.c4}`)],
    ['tag-blur', tag.blur || tag.be || 0],
    ['tag-xbord', tag.xbord],
    ['tag-ybord', tag.ybord],
    ['tag-xshad', tag.xshad],
    ['tag-yshad', tag.yshad],
  ].map(([k, v]) => [`--ass-${k}`, v]);
}

function createDrawing(fragment, styleTag, store) {
  if (!fragment.drawing.d) return null;
  const tag = { ...styleTag, ...fragment.tag };
  const { minX, minY, width, height } = fragment.drawing;
  const baseScale = store.scale / (1 << (tag.p - 1));
  const scaleX = (tag.fscx ? tag.fscx / 100 : 1) * baseScale;
  const scaleY = (tag.fscy ? tag.fscy / 100 : 1) * baseScale;
  const blur = tag.blur || tag.be || 0;
  const vbx = tag.xbord + (tag.xshad < 0 ? -tag.xshad : 0) + blur;
  const vby = tag.ybord + (tag.yshad < 0 ? -tag.yshad : 0) + blur;
  const vbw = width * scaleX + 2 * tag.xbord + Math.abs(tag.xshad) + 2 * blur;
  const vbh = height * scaleY + 2 * tag.ybord + Math.abs(tag.yshad) + 2 * blur;
  const $svg = createSVGEl('svg', [
    ['width', vbw],
    ['height', vbh],
    ['viewBox', `${-vbx} ${-vby} ${vbw} ${vbh}`],
  ]);
  const strokeScale = store.sbas ? store.scale : 1;
  const $defs = createSVGEl('defs');
  const filter = createStrokeFilter(tag, strokeScale);
  $defs.append(filter.el);
  $svg.append($defs);
  const symbolId = `ASS-${uuid()}`;
  const $symbol = createSVGEl('symbol', [
    ['id', symbolId],
    ['viewBox', `${minX} ${minY} ${width} ${height}`],
  ]);
  $symbol.append(createSVGEl('path', [['d', fragment.drawing.d]]));
  $svg.append($symbol);
  $svg.append(createSVGEl('use', [
    ['width', width * scaleX],
    ['height', height * scaleY],
    ['xlink:href', `#${symbolId}`],
    ['filter', `url(#${filter.id})`],
  ]));
  $svg.style.cssText = (
    'position:absolute;'
    + `left:${minX * scaleX - vbx}px;`
    + `top:${minY * scaleY - vby}px;`
  );
  return {
    $svg,
    cssText: `position:relative;width:${width * scaleX}px;height:${height * scaleY}px;`,
  };
}

function encodeText(text, q) {
  return text
    .replace(/\\h/g, ' ')
    .replace(/\\N/g, '\n')
    .replace(/\\n/g, q === 2 ? '\n' : ' ');
}

function createDialogue(dialogue, store) {
  const { styles } = store;
  const $div = document.createElement('div');
  $div.className = 'ASS-dialogue';
  $div.dataset.wrapStyle = dialogue.q;
  const df = document.createDocumentFragment();
  const { align, slices } = dialogue;
  [
    ['--ass-align-h', ['0%', '50%', '100%'][align.h]],
    ['--ass-align-v', ['100%', '50%', '0%'][align.v]],
  ].forEach(([k, v]) => {
    $div.style.setProperty(k, v);
  });
  const animations = [];
  slices.forEach((slice) => {
    const sliceTag = styles[slice.style].tag;
    const borderStyle = styles[slice.style].style.BorderStyle;
    slice.fragments.forEach((fragment) => {
      const { text, drawing } = fragment;
      const tag = { ...sliceTag, ...fragment.tag };
      let cssText = '';
      const cssVars = [];

      cssVars.push(...createStrokeVars(tag));
      let stroke = null;
      const hasStroke = tag.xbord || tag.ybord || tag.xshad || tag.yshad;
      if (hasStroke && (drawing || tag.a1 !== '00' || tag.xbord !== tag.ybord)) {
        const filter = createStrokeFilter(tag, store.sbas ? store.scale : 1);
        const svg = createSVGEl('svg', [['width', 0], ['height', 0]]);
        svg.append(filter.el);
        stroke = { id: filter.id, el: svg };
      }

      cssVars.push(...createAnimatableVars(tag));
      if (!drawing) {
        cssText += `font-family:"${tag.fn}";`;
        cssText += tag.b ? `font-weight:${tag.b === 1 ? 'bold' : tag.b};` : '';
        cssText += tag.i ? 'font-style:italic;' : '';
        cssText += (tag.u || tag.s) ? `text-decoration:${tag.u ? 'underline' : ''} ${tag.s ? 'line-through' : ''};` : '';
      }
      if (drawing && tag.pbo) {
        const pbo = -tag.pbo * (tag.fscy || 100) / 100;
        cssText += `vertical-align:calc(var(--ass-scale) * ${pbo}px);`;
      }

      cssVars.push(...createTransform(tag));
      const tags = [tag, ...(tag.t || []).map((t) => t.tag)];
      const hasRotate = rotateTags.some((x) => tags.some((t) => t[x]));
      const hasScale = scaleTags.some((x) => tags.some((t) => t[x] !== undefined && t[x] !== 100));
      const hasSkew = skewTags.some((x) => tags.some((t) => t[x]));

      encodeText(text, dialogue.q).split('\n').forEach((content, idx) => {
        const $span = document.createElement('span');
        const $ssspan = document.createElement('span');
        if (hasScale || hasSkew) {
          if (hasScale) {
            $ssspan.dataset.scale = '';
          }
          if (hasSkew) {
            $ssspan.dataset.skew = '';
          }
          $ssspan.textContent = content;
        }
        if (hasRotate) {
          $span.dataset.rotate = '';
        }
        if (drawing) {
          $span.dataset.drawing = '';
          const obj = createDrawing(fragment, sliceTag, store);
          if (!obj) return;
          $span.style.cssText = obj.cssText;
          $span.append(obj.$svg);
        } else {
          if (idx) {
            const br = document.createElement('div');
            br.dataset.is = 'br';
            br.style.setProperty('--ass-tag-fs', tag.fs);
            df.append(br);
          }
          if (!content) return;
          if (hasScale || hasSkew) {
            $span.append($ssspan);
          } else {
            $span.textContent = content;
          }
          const el = hasScale || hasSkew ? $ssspan : $span;
          el.dataset.text = content;
          if (hasStroke) {
            el.dataset.borderStyle = borderStyle;
            el.dataset.stroke = 'css';
          }
          if (stroke) {
            el.dataset.stroke = 'svg';
            // TODO: it doesn't support animation
            el.style.filter = `url(#${stroke.id})`;
            el.append(stroke.el);
          }
        }
        $span.style.cssText += cssText;
        cssVars.forEach(([k, v]) => {
          $span.style.setProperty(k, v);
        });
        animations.push(...createTagAnimations($span, fragment, sliceTag));
        df.append($span);
      });
    });
  });
  animations.push(...createDialogueAnimations($div, dialogue));
  $div.append(df);
  return { $div, animations };
}

function allocate(dialogue, store) {
  const { video, space, scale } = store;
  const { layer, margin, width, height, alignment, end } = dialogue;
  const stageWidth = store.width - Math.trunc(scale * (margin.left + margin.right));
  const stageHeight = store.height;
  const vertical = Math.trunc(scale * margin.vertical);
  const vct = video.currentTime * 100;
  space[layer] = space[layer] || {
    left: { width: new Uint16Array(stageHeight + 1), end: new Uint32Array(stageHeight + 1) },
    center: { width: new Uint16Array(stageHeight + 1), end: new Uint32Array(stageHeight + 1) },
    right: { width: new Uint16Array(stageHeight + 1), end: new Uint32Array(stageHeight + 1) },
  };
  const channel = space[layer];
  const alignH = ['right', 'left', 'center'][alignment % 3];
  const willCollide = (y) => {
    const lw = channel.left.width[y];
    const cw = channel.center.width[y];
    const rw = channel.right.width[y];
    const le = channel.left.end[y];
    const ce = channel.center.end[y];
    const re = channel.right.end[y];
    return (
      (alignH === 'left' && (
        (le > vct && lw)
        || (ce > vct && cw && 2 * width + cw > stageWidth)
        || (re > vct && rw && width + rw > stageWidth)
      ))
      || (alignH === 'center' && (
        (le > vct && lw && 2 * lw + width > stageWidth)
        || (ce > vct && cw)
        || (re > vct && rw && 2 * rw + width > stageWidth)
      ))
      || (alignH === 'right' && (
        (le > vct && lw && lw + width > stageWidth)
        || (ce > vct && cw && 2 * width + cw > stageWidth)
        || (re > vct && rw)
      ))
    );
  };
  let count = 0;
  let result = 0;
  const find = (y) => {
    count = willCollide(y) ? 0 : count + 1;
    if (count >= height) {
      result = y;
      return true;
    }
    return false;
  };
  if (alignment <= 3) {
    result = stageHeight - vertical - 1;
    for (let i = result; i > vertical; i -= 1) {
      if (find(i)) break;
    }
  } else if (alignment >= 7) {
    result = vertical + 1;
    for (let i = result; i < stageHeight - vertical; i += 1) {
      if (find(i)) break;
    }
  } else {
    result = (stageHeight - height) >> 1;
    for (let i = result; i < stageHeight - vertical; i += 1) {
      if (find(i)) break;
    }
  }
  if (alignment > 3) {
    result -= height - 1;
  }
  for (let i = result; i < result + height; i += 1) {
    channel[alignH].width[i] = width;
    channel[alignH].end[i] = end * 100;
  }
  return result;
}

function getPosition(dialogue, store) {
  const { scale } = store;
  const { move, align, width, height, margin, slices } = dialogue;
  let x = 0;
  let y = 0;
  if (dialogue.pos || move) {
    const pos = dialogue.pos || { x: 0, y: 0 };
    const sx = scale * pos.x;
    const sy = scale * pos.y;
    x = [sx, sx - width / 2, sx - width][align.h];
    y = [sy - height, sy - height / 2, sy][align.v];
  } else {
    x = [
      0,
      (store.width - width) / 2,
      store.width - width - scale * margin.right,
    ][align.h];
    const hasT = slices.some((slice) => (
      slice.fragments.some(({ keyframes }) => keyframes?.length)
    ));
    y = hasT
      ? [
        store.height - height - margin.vertical,
        (store.height - height) / 2,
        margin.vertical,
      ][align.v]
      : allocate(dialogue, store);
  }
  return {
    x: x + [0, width / 2, width][align.h],
    y: y + [height, height / 2, 0][align.v],
  };
}

function createStyle(dialogue) {
  const { layer, align, effect, pos, margin, q } = dialogue;
  let cssText = '';
  if (layer) cssText += `z-index:${layer};`;
  cssText += `text-align:${['left', 'center', 'right'][align.h]};`;
  if (!effect) {
    if (q !== 2) {
      cssText += `max-width:calc(100% - var(--ass-scale) * ${margin.left + margin.right}px);`;
    }
    if (!pos) {
      if (align.h !== 0) {
        cssText += `padding-right:calc(var(--ass-scale) * ${margin.right}px);`;
      }
      if (align.h !== 2) {
        cssText += `padding-left:calc(var(--ass-scale) * ${margin.left}px);`;
      }
    }
  }
  return cssText;
}

function setEffect(dialogue, store) {
  const $area = document.createElement('div');
  $area.className = 'ASS-effect-area';
  store.box.insertBefore($area, dialogue.$div);
  $area.append(dialogue.$div);
  const { width, height } = store.scriptRes;
  const { name, y1, y2, leftToRight, fadeAwayWidth, fadeAwayHeight } = dialogue.effect;
  const min = Math.min(y1, y2);
  const max = Math.max(y1, y2);
  $area.dataset.effect = name;
  if (name === 'banner') {
    $area.style.alignItems = leftToRight ? 'flex-start' : 'flex-end';
    $area.style.justifyContent = ['flex-end', 'center', 'flex-start'][dialogue.align.v];
  }
  if (name.startsWith('scroll')) {
    const top = min / height * 100;
    const bottom = (height - max) / height * 100;
    $area.style.cssText = `top:${top}%;bottom:${bottom}%;`;
    $area.style.justifyContent = ['flex-start', 'center', 'flex-end'][dialogue.align.h];
  }
  if (fadeAwayHeight) {
    const p = fadeAwayHeight / (max - min) * 100;
    $area.style.maskImage = [
      `linear-gradient(#000 ${100 - p}%, transparent)`,
      `linear-gradient(transparent, #000 ${p}%)`,
    ].join(',');
  }
  if (fadeAwayWidth) {
    const p = fadeAwayWidth / width * 100;
    // only left side has fade away effect in VSFilter
    $area.style.maskImage = `linear-gradient(90deg, transparent, #000 ${p}%)`;
  }
  return $area;
}

function renderer(dialogue, store) {
  const { $div, animations } = createDialogue(dialogue, store);
  Object.assign(dialogue, { $div, animations });
  store.box.append($div);
  const { width } = $div.getBoundingClientRect();
  Object.assign(dialogue, { width });
  $div.style.cssText += createStyle(dialogue);
  // height may be changed after createStyle
  const { height } = $div.getBoundingClientRect();
  Object.assign(dialogue, { height });
  const { x, y } = getPosition(dialogue, store);
  Object.assign(dialogue, { x, y });
  $div.style.cssText += `left:${x}px;top:${y}px;`;
  setTransformOrigin(dialogue, store.scale);
  // TODO: refactor to create .clip-area or .effect-area wrappers in `createDialogue`
  Object.assign(dialogue, getClipPath(dialogue, store));
  if (dialogue.effect) {
    Object.assign(dialogue, { $div: setEffect(dialogue, store) });
  }
  return dialogue;
}

/* eslint-disable no-param-reassign */

function clear(store) {
  const { box } = store;
  while (box.lastChild) {
    box.lastChild.remove();
  }
  store.actives = [];
  store.space = [];
}

function framing(store, mediaTime) {
  const { dialogues, actives } = store;
  const vct = mediaTime - store.delay;
  for (let i = actives.length - 1; i >= 0; i -= 1) {
    const dia = actives[i];
    const { end } = dia;
    if (end < vct) {
      dia.$div.remove();
      actives.splice(i, 1);
    }
  }
  while (
    store.index < dialogues.length
    && vct >= dialogues[store.index].start
  ) {
    if (vct < dialogues[store.index].end) {
      const dia = renderer(dialogues[store.index], store);
      (dia.animations || []).forEach((animation) => {
        animation.currentTime = (vct - dia.start) * 1000;
      });
      actives.push(dia);
      if (!store.video.paused) {
        batchAnimate(dia, 'play');
      }
    }
    store.index += 1;
  }
}

function createSeek(store) {
  return function seek() {
    clear(store);
    const { video, dialogues } = store;
    const vct = video.currentTime - store.delay;
    store.index = (() => {
      for (let i = 0; i < dialogues.length; i += 1) {
        if (vct < dialogues[i].end) {
          return i;
        }
      }
      return (dialogues.length || 1) - 1;
    })();
    framing(store, video.currentTime);
  };
}

function createFrame(video) {
  const useVFC = video.requestVideoFrameCallback;
  return [
    useVFC ? video.requestVideoFrameCallback.bind(video) : requestAnimationFrame,
    useVFC ? video.cancelVideoFrameCallback.bind(video) : cancelAnimationFrame,
  ];
}

function createPlay(store) {
  const { video } = store;
  const [requestFrame, cancelFrame] = createFrame(video);
  return function play() {
    const frame = (now, metadata) => {
      framing(store, metadata?.mediaTime || video.currentTime);
      store.requestId = requestFrame(frame);
    };
    cancelFrame(store.requestId);
    store.requestId = requestFrame(frame);
    store.actives.forEach((dia) => {
      batchAnimate(dia, 'play');
    });
  };
}

function createPause(store) {
  const [, cancelFrame] = createFrame(store.video);
  return function pause() {
    cancelFrame(store.requestId);
    store.requestId = 0;
    store.actives.forEach((dia) => {
      batchAnimate(dia, 'pause');
    });
  };
}

function createResize(that, store) {
  const { video, box, layoutRes } = store;
  return function resize() {
    const cw = video.clientWidth;
    const ch = video.clientHeight;
    const vw = layoutRes.width || video.videoWidth || cw;
    const vh = layoutRes.height || video.videoHeight || ch;
    const sw = store.scriptRes.width;
    const sh = store.scriptRes.height;
    let rw = sw;
    let rh = sh;
    const videoScale = Math.min(cw / vw, ch / vh);
    if (that.resampling === 'video_width') {
      rh = sw / vw * vh;
    }
    if (that.resampling === 'video_height') {
      rw = sh / vh * vw;
    }
    store.scale = Math.min(cw / rw, ch / rh);
    if (that.resampling === 'script_width') {
      store.scale = videoScale * (vw / rw);
    }
    if (that.resampling === 'script_height') {
      store.scale = videoScale * (vh / rh);
    }
    const bw = store.scale * rw;
    const bh = store.scale * rh;
    store.width = bw;
    store.height = bh;
    store.resampledRes = { width: rw, height: rh };

    box.style.cssText = `width:${bw}px;height:${bh}px;top:${(ch - bh) / 2}px;left:${(cw - bw) / 2}px;`;
    box.style.setProperty('--ass-scale', store.scale);
    box.style.setProperty('--ass-scale-stroke', store.sbas ? store.scale : 1);

    createSeek(store)();
  };
}

/* eslint-disable max-len */

/**
 * @typedef {Object} ASSOption
 * @property {HTMLElement} [container] The container to display subtitles.
 * Its style should be set with `position: relative` for subtitles will absolute to it.
 * Defaults to `video.parentNode`
 * @property {`${"video" | "script"}_${"width" | "height"}`} [resampling="video_height"]
 * When script resolution(PlayResX and PlayResY) don't match the video resolution, this API defines how it behaves.
 * However, drawings and clips will be always depending on script origin resolution.
 * There are four valid values, we suppose video resolution is 1280x720 and script resolution is 640x480 in following situations:
 * + `video_width`: Script resolution will set to video resolution based on video width. Script resolution will set to 640x360, and scale = 1280 / 640 = 2.
 * + `video_height`(__default__): Script resolution will set to video resolution based on video height. Script resolution will set to 853.33x480, and scale = 720 / 480 = 1.5.
 * + `script_width`: Script resolution will not change but scale is based on script width. So scale = 1280 / 640 = 2. This may causes top and bottom subs disappear from video area.
 * + `script_height`: Script resolution will not change but scale is based on script height. So scale = 720 / 480 = 1.5. Script area will be centered in video area.
 */

class ASS {
  #store = {
    /** @type {HTMLVideoElement} */
    video: null,
    /** the box to display subtitles */
    box: document.createElement('div'),
    /**
     * video resize observer
     * @type {ResizeObserver}
     */
    observer: null,
    scale: 1,
    width: 0,
    height: 0,
    /** resolution from ASS file, it's PlayResX and PlayResY */
    scriptRes: {},
    /** resolution from ASS file, it's LayoutResX and LayoutResY */
    layoutRes: {},
    /** resolution after resampling */
    resampledRes: {},
    /** current index of dialogues to match currentTime */
    index: 0,
    /** @type {boolean} ScaledBorderAndShadow */
    sbas: true,
    /** @type {import('ass-compiler').CompiledASSStyle} */
    styles: {},
    /** @type {import('ass-compiler').Dialogue[]} */
    dialogues: [],
    /**
     * active dialogues
     * @type {import('ass-compiler').Dialogue[]}
     */
    actives: [],
    /** record dialogues' position */
    space: [],
    requestId: 0,
    delay: 0,
  };

  #play;

  #pause;

  #seek;

  #resize;

  /**
   * Initialize an ASS instance
   * @param {string} content ASS content
   * @param {HTMLVideoElement} video The video element to be associated with
   * @param {ASSOption} [option]
   * @returns {ASS}
   * @example
   *
   * HTML:
   * ```html
   * <div id="container" style="position: relative;">
   *   <video
   *     id="video"
   *     src="./example.mp4"
   *     style="position: absolute; width: 100%; height: 100%;"
   *   ></video>
   *   <!-- ASS will be added here -->
   * </div>
   * ```
   *
   * JavaScript:
   * ```js
   * import ASS from 'assjs';
   *
   * const content = await fetch('/path/to/example.ass').then((res) => res.text());
   * const ass = new ASS(content, document.querySelector('#video'), {
   *   container: document.querySelector('#container'),
   * });
   * ```
   */
  constructor(content, video, { container = video.parentNode, resampling } = {}) {
    this.#store.video = video;
    if (!container) throw new Error('Missing container.');

    const { info, width, height, styles, dialogues } = compile(content);
    this.#store.sbas = /yes/i.test(info.ScaledBorderAndShadow);
    this.#store.layoutRes = {
      width: info.LayoutResX * 1 || video.videoWidth || video.clientWidth,
      height: info.LayoutResY * 1 || video.videoHeight || video.clientHeight,
    };
    this.#store.scriptRes = {
      width: width || this.#store.layoutRes.width,
      height: height || this.#store.layoutRes.height,
    };
    this.#store.styles = styles;
    this.#store.dialogues = dialogues.map((dia) => Object.assign(dia, {
      effect: ['banner', 'scroll up', 'scroll down'].includes(dia.effect?.name) ? dia.effect : null,
      align: {
        // 0: left, 1: center, 2: right
        h: (dia.alignment + 2) % 3,
        // 0: bottom, 1: center, 2: top
        v: Math.trunc((dia.alignment - 1) / 3),
      },
    }));

    if ($fixFontSize) {
      container.append($fixFontSize);
    }

    const { box } = this.#store;
    box.className = 'ASS-box';
    container.append(box);

    addGlobalStyle(container);

    this.#play = createPlay(this.#store);
    this.#pause = createPause(this.#store);
    this.#seek = createSeek(this.#store);
    video.addEventListener('play', this.#play);
    video.addEventListener('pause', this.#pause);
    video.addEventListener('playing', this.#play);
    video.addEventListener('waiting', this.#pause);
    video.addEventListener('seeking', this.#seek);

    this.#resize = createResize(this, this.#store);
    this.#resize();
    this.resampling = resampling;

    const observer = new ResizeObserver(this.#resize);
    observer.observe(video);
    this.#store.observer = observer;

    return this;
  }

  /**
   * Desctroy the ASS instance
   * @returns {ASS}
   */
  destroy() {
    const { video, box, observer } = this.#store;
    this.#pause();
    clear(this.#store);
    video.removeEventListener('play', this.#play);
    video.removeEventListener('pause', this.#pause);
    video.removeEventListener('playing', this.#play);
    video.removeEventListener('waiting', this.#pause);
    video.removeEventListener('seeking', this.#seek);

    if ($fixFontSize) {
      $fixFontSize.remove();
    }
    box.remove();
    observer.unobserve(this.#store.video);

    this.#store.styles = {};
    this.#store.dialogues = [];

    return this;
  }

  /**
   * Show subtitles in the container
   * @returns {ASS}
   */
  show() {
    this.#store.box.style.visibility = 'visible';
    return this;
  }

  /**
   * Hide subtitles in the container
   * @returns {ASS}
   */
  hide() {
    this.#store.box.style.visibility = 'hidden';
    return this;
  }

  #resampling = 'video_height';

  /** @type {ASSOption['resampling']} */
  get resampling() {
    return this.#resampling;
  }

  set resampling(r) {
    if (r === this.#resampling) return;
    if (/^(video|script)_(width|height)$/.test(r)) {
      this.#resampling = r;
      this.#resize();
    }
  }

  /** @type {number} Subtitle delay in seconds. */
  get delay() {
    return this.#store.delay;
  }

  set delay(d) {
    if (typeof d !== 'number') return;
    this.#store.delay = d;
    this.#seek();
  }

  // addDialogue(dialogue) {
  // }
}

export { ASS as default };
