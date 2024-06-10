function parseEffect(text) {
  const param = text
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
  if (!text) return [];
  return text
    .toLowerCase()
    // numbers
    .replace(/([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)/g, ' $1 ')
    // commands
    .replace(/([mnlbspc])/g, ' $1 ')
    .trim()
    .replace(/\s+/g, ' ')
    .split(/\s(?=[mnlbspc])/)
    .map((cmd) => (
      cmd.split(' ')
        .filter((x, i) => !(i && Number.isNaN(x * 1)))
    ));
}

const numTags = [
  'b', 'i', 'u', 's', 'fsp',
  'k', 'K', 'kf', 'ko', 'kt',
  'fe', 'q', 'p', 'pbo', 'a', 'an',
  'fscx', 'fscy', 'fax', 'fay', 'frx', 'fry', 'frz', 'fr',
  'be', 'blur', 'bord', 'xbord', 'ybord', 'shad', 'xshad', 'yshad',
];

const numRegexs = numTags.map((nt) => ({ name: nt, regex: new RegExp(`^${nt}-?\\d`) }));

function parseTag(text) {
  const tag = {};
  for (let i = 0; i < numRegexs.length; i++) {
    const { name, regex } = numRegexs[i];
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
    const [, num, color] = text.match(/^(\d?)c&?H?(\w*)/);
    tag[`c${num || 1}`] = color && `000000${color}`.slice(-6);
  } else if (/^\da&?H?[0-9a-fA-F]+/.test(text)) {
    const [, num, alpha] = text.match(/^(\d)a&?H?([0-9a-f]+)/i);
    tag[`a${num}`] = `00${alpha}`.slice(-2);
  } else if (/^alpha&?H?[0-9a-fA-F]+/.test(text)) {
    [, tag.alpha] = text.match(/^alpha&?H?([0-9a-f]+)/i);
    tag.alpha = `00${tag.alpha}`.slice(-2);
  } else if (/^(?:pos|org|move|fad|fade)\([^)]+/.test(text)) {
    const [, key, value] = text.match(/^(\w+)\((.*?)\)?$/);
    tag[key] = value
      .trim()
      .split(/\s*,\s*/)
      .map(Number);
  } else if (/^i?clip\([^)]+/.test(text)) {
    const p = text
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
    const p = text
      .match(/^t\((.*?)\)?$/)[1]
      .trim()
      .replace(/\\.*/, (x) => x.replace(/,/g, '\n'))
      .split(/\s*,\s*/);
    if (!p[0]) return tag;
    tag.t = {
      t1: 0,
      t2: 0,
      accel: 1,
      tags: p[p.length - 1]
        .replace(/\n/g, ',')
        .split('\\')
        .slice(1)
        .map(parseTag),
    };
    if (p.length === 2) {
      tag.t.accel = p[0] * 1;
    }
    if (p.length === 3) {
      tag.t.t1 = p[0] * 1;
      tag.t.t2 = p[1] * 1;
    }
    if (p.length === 4) {
      tag.t.t1 = p[0] * 1;
      tag.t.t2 = p[1] * 1;
      tag.t.accel = p[2] * 1;
    }
  }

  return tag;
}

function parseTags(text) {
  const tags = [];
  let depth = 0;
  let str = '';
  // `\b\c` -> `b\c\`
  // `a\b\c` -> `b\c\`
  const transText = text.split('\\').slice(1).concat('').join('\\');
  for (let i = 0; i < transText.length; i++) {
    const x = transText[i];
    if (x === '(') depth++;
    if (x === ')') depth--;
    if (depth < 0) depth = 0;
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
  const pairs = text.split(/{([^{}]*?)}/);
  const parsed = [];
  if (pairs[0].length) {
    parsed.push({ tags: [], text: pairs[0], drawing: [] });
  }
  for (let i = 1; i < pairs.length; i += 2) {
    const tags = parseTags(pairs[i]);
    const isDrawing = tags.reduce((v, tag) => (tag.p === undefined ? v : !!tag.p), false);
    parsed.push({
      tags,
      text: isDrawing ? '' : pairs[i + 1],
      drawing: isDrawing ? parseDrawing(pairs[i + 1]) : [],
    });
  }
  return {
    raw: text,
    combined: parsed.map((frag) => frag.text).join(''),
    parsed,
  };
}

function parseTime(time) {
  const t = time.split(':');
  return t[0] * 3600 + t[1] * 60 + t[2] * 1;
}

function parseDialogue(text, format) {
  let fields = text.split(',');
  if (fields.length > format.length) {
    const textField = fields.slice(format.length - 1).join();
    fields = fields.slice(0, format.length - 1);
    fields.push(textField);
  }

  const dia = {};
  for (let i = 0; i < fields.length; i++) {
    const fmt = format[i];
    const fld = fields[i].trim();
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

const assign = Object.assign || (
  /* istanbul ignore next */
  function assign(target, ...sources) {
    for (let i = 0; i < sources.length; i++) {
      if (!sources[i]) continue;
      const keys = Object.keys(sources[i]);
      for (let j = 0; j < keys.length; j++) {
        // eslint-disable-next-line no-param-reassign
        target[keys[j]] = sources[i][keys[j]];
      }
    }
    return target;
  }
);

const stylesFormat = ['Name', 'Fontname', 'Fontsize', 'PrimaryColour', 'SecondaryColour', 'OutlineColour', 'BackColour', 'Bold', 'Italic', 'Underline', 'StrikeOut', 'ScaleX', 'ScaleY', 'Spacing', 'Angle', 'BorderStyle', 'Outline', 'Shadow', 'Alignment', 'MarginL', 'MarginR', 'MarginV', 'Encoding'];
const eventsFormat = ['Layer', 'Start', 'End', 'Style', 'Name', 'MarginL', 'MarginR', 'MarginV', 'Effect', 'Text'];

function parseFormat(text) {
  const fields = stylesFormat.concat(eventsFormat);
  return text.match(/Format\s*:\s*(.*)/i)[1]
    .split(/\s*,\s*/)
    .map((field) => {
      const caseField = fields.find((f) => f.toLowerCase() === field.toLowerCase());
      return caseField || field;
    });
}

function parseStyle(text, format) {
  const values = text.match(/Style\s*:\s*(.*)/i)[1].split(/\s*,\s*/);
  return assign({}, ...format.map((fmt, idx) => ({ [fmt]: values[idx] })));
}

function parse(text) {
  const tree = {
    info: {},
    styles: { format: [], style: [] },
    events: { format: [], comment: [], dialogue: [] },
  };
  const lines = text.split(/\r?\n/);
  let state = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^;/.test(line)) continue;

    if (/^\[Script Info\]/i.test(line)) state = 1;
    else if (/^\[V4\+? Styles\]/i.test(line)) state = 2;
    else if (/^\[Events\]/i.test(line)) state = 3;
    else if (/^\[.*\]/.test(line)) state = 0;

    if (state === 0) continue;
    if (state === 1) {
      if (/:/.test(line)) {
        const [, key, value] = line.match(/(.*?)\s*:\s*(.*)/);
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
        const [, key, value] = line.match(/^(\w+?)\s*:\s*(.*)/i);
        tree.events[key.toLowerCase()].push(parseDialogue(value, tree.events.format));
      }
    }
  }

  return tree;
}

function createCommand(arr) {
  const cmd = {
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
  for (let len = arr.length - !(arr.length & 1), i = 1; i < len; i += 2) {
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
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  [].concat(...commands.map(({ points }) => points)).forEach(({ x, y }) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  return {
    minX,
    minY,
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
  const results = [];
  const bb1 = [0, 2 / 3, 1 / 3, 0];
  const bb2 = [0, 1 / 3, 2 / 3, 0];
  const bb3 = [0, 1 / 6, 2 / 3, 1 / 6];
  const dot4 = (a, b) => (a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]);
  let px = [points[points.length - 1].x, points[0].x, points[1].x, points[2].x];
  let py = [points[points.length - 1].y, points[0].y, points[1].y, points[2].y];
  results.push({
    type: prev === 'M' ? 'M' : 'L',
    points: [{ x: dot4(bb3, px), y: dot4(bb3, py) }],
  });
  for (let i = 3; i < points.length; i++) {
    px = [points[i - 3].x, points[i - 2].x, points[i - 1].x, points[i].x];
    py = [points[i - 3].y, points[i - 2].y, points[i - 1].y, points[i].y];
    results.push({
      type: 'C',
      points: [
        { x: dot4(bb1, px), y: dot4(bb1, py) },
        { x: dot4(bb2, px), y: dot4(bb2, py) },
        { x: dot4(bb3, px), y: dot4(bb3, py) },
      ],
    });
  }
  if (next === 'L' || next === 'C') {
    const last = points[points.length - 1];
    results.push({ type: 'L', points: [{ x: last.x, y: last.y }] });
  }
  return results;
}

function toSVGPath(instructions) {
  return instructions.map(({ type, points }) => (
    type + points.map(({ x, y }) => `${x},${y}`).join(',')
  )).join('');
}

function compileDrawing(rawCommands) {
  const commands = [];
  let i = 0;
  while (i < rawCommands.length) {
    const arr = rawCommands[i];
    const cmd = createCommand(arr);
    if (isValid(cmd)) {
      if (cmd.type === 'S') {
        const { x, y } = (commands[i - 1] || { points: [{ x: 0, y: 0 }] }).points.slice(-1)[0];
        cmd.points.unshift({ x, y });
      }
      if (i) {
        cmd.prev = commands[i - 1].type;
        commands[i - 1].next = cmd.type;
      }
      commands.push(cmd);
      i++;
    } else {
      if (i && commands[i - 1].type === 'S') {
        const additionPoints = {
          p: cmd.points,
          c: commands[i - 1].points.slice(0, 3),
        };
        commands[i - 1].points = commands[i - 1].points.concat(
          (additionPoints[arr[0]] || []).map(({ x, y }) => ({ x, y })),
        );
      }
      rawCommands.splice(i, 1);
    }
  }
  const instructions = [].concat(
    ...commands.map(({ type, points, prev, next }) => (
      type === 'S'
        ? s2b(points, prev, next)
        : { type, points }
    )),
  );

  return assign({ instructions, d: toSVGPath(instructions) }, getViewBox(commands));
}

const tTags = [
  'fs', 'clip',
  'c1', 'c2', 'c3', 'c4', 'a1', 'a2', 'a3', 'a4', 'alpha',
  'fscx', 'fscy', 'fax', 'fay', 'frx', 'fry', 'frz', 'fr',
  'be', 'blur', 'bord', 'xbord', 'ybord', 'shad', 'xshad', 'yshad',
];

function compileTag(tag, key, presets = {}) {
  let value = tag[key];
  if (value === undefined) {
    return null;
  }
  if (key === 'pos' || key === 'org') {
    return value.length === 2 ? { [key]: { x: value[0], y: value[1] } } : null;
  }
  if (key === 'move') {
    const [x1, y1, x2, y2, t1 = 0, t2 = 0] = value;
    return value.length === 4 || value.length === 6
      ? { move: { x1, y1, x2, y2, t1, t2 } }
      : null;
  }
  if (key === 'fad' || key === 'fade') {
    if (value.length === 2) {
      const [t1, t2] = value;
      return { fade: { type: 'fad', t1, t2 } };
    }
    if (value.length === 7) {
      const [a1, a2, a3, t1, t2, t3, t4] = value;
      return { fade: { type: 'fade', a1, a2, a3, t1, t2, t3, t4 } };
    }
    return null;
  }
  if (key === 'clip') {
    const { inverse, scale, drawing, dots } = value;
    if (drawing) {
      return { clip: { inverse, scale, drawing: compileDrawing(drawing), dots } };
    }
    if (dots) {
      const [x1, y1, x2, y2] = dots;
      return { clip: { inverse, scale, drawing, dots: { x1, y1, x2, y2 } } };
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
    return { [key]: value || presets[key] };
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
    const { t1, accel, tags } = value;
    const t2 = value.t2 || (presets.end - presets.start) * 1e3;
    const compiledTag = {};
    tags.forEach((t) => {
      const k = Object.keys(t)[0];
      if (~tTags.indexOf(k) && !(k === 'clip' && !t[k].dots)) {
        assign(compiledTag, compileTag(t, k, presets));
      }
    });
    return { t: { t1, t2, accel, tag: compiledTag } };
  }
  return { [key]: value };
}

const a2an = [
  null, 1, 2, 3,
  null, 7, 8, 9,
  null, 4, 5, 6,
];

const globalTags = ['r', 'a', 'an', 'pos', 'org', 'move', 'fade', 'fad', 'clip'];

function inheritTag(pTag) {
  return JSON.parse(JSON.stringify(assign({}, pTag, {
    k: undefined,
    kf: undefined,
    ko: undefined,
    kt: undefined,
  })));
}

function compileText({ styles, style, parsed, start, end }) {
  let alignment;
  let pos;
  let org;
  let move;
  let fade;
  let clip;
  const slices = [];
  let slice = { style, fragments: [] };
  let prevTag = {};
  for (let i = 0; i < parsed.length; i++) {
    const { tags, text, drawing } = parsed[i];
    let reset;
    for (let j = 0; j < tags.length; j++) {
      const tag = tags[j];
      reset = tag.r === undefined ? reset : tag.r;
    }
    const fragment = {
      tag: reset === undefined ? inheritTag(prevTag) : {},
      text,
      drawing: drawing.length ? compileDrawing(drawing) : null,
    };
    for (let j = 0; j < tags.length; j++) {
      const tag = tags[j];
      alignment = alignment || a2an[tag.a || 0] || tag.an;
      pos = pos || compileTag(tag, 'pos');
      org = org || compileTag(tag, 'org');
      move = move || compileTag(tag, 'move');
      fade = fade || compileTag(tag, 'fade') || compileTag(tag, 'fad');
      clip = compileTag(tag, 'clip') || clip;
      const key = Object.keys(tag)[0];
      if (key && !~globalTags.indexOf(key)) {
        const sliceTag = styles[style].tag;
        const { c1, c2, c3, c4 } = sliceTag;
        const fs = prevTag.fs || sliceTag.fs;
        const compiledTag = compileTag(tag, key, { start, end, c1, c2, c3, c4, fs });
        if (key === 't') {
          fragment.tag.t = fragment.tag.t || [];
          fragment.tag.t.push(compiledTag.t);
        } else {
          assign(fragment.tag, compiledTag);
        }
      }
    }
    prevTag = fragment.tag;
    if (reset !== undefined) {
      slices.push(slice);
      slice = { style: styles[reset] ? reset : style, fragments: [] };
    }
    if (fragment.text || fragment.drawing) {
      const prev = slice.fragments[slice.fragments.length - 1] || {};
      if (prev.text && fragment.text && !Object.keys(fragment.tag).length) {
        // merge fragment to previous if its tag is empty
        prev.text += fragment.text;
      } else {
        slice.fragments.push(fragment);
      }
    }
  }
  slices.push(slice);

  return assign({ alignment, slices }, pos, org, move, fade, clip);
}

function compileDialogues({ styles, dialogues }) {
  let minLayer = Infinity;
  const results = [];
  for (let i = 0; i < dialogues.length; i++) {
    const dia = dialogues[i];
    if (dia.Start >= dia.End) {
      continue;
    }
    if (!styles[dia.Style]) {
      dia.Style = 'Default';
    }
    const stl = styles[dia.Style].style;
    const compiledText = compileText({
      styles,
      style: dia.Style,
      parsed: dia.Text.parsed,
      start: dia.Start,
      end: dia.End,
    });
    const alignment = compiledText.alignment || stl.Alignment;
    minLayer = Math.min(minLayer, dia.Layer);
    results.push(assign({
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
    }, compiledText, { alignment }));
  }
  for (let i = 0; i < results.length; i++) {
    results[i].layer -= minLayer;
  }
  return results.sort((a, b) => a.start - b.start || a.end - b.end);
}

// same as Aegisub
// https://github.com/Aegisub/Aegisub/blob/master/src/ass_style.h
const DEFAULT_STYLE = {
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
    const [, a, c] = color.match(/&?H?([0-9a-f]{2})?([0-9a-f]{6})/i);
    return [a || '00', c];
  }
  const num = parseInt(color, 10);
  if (!Number.isNaN(num)) {
    const min = -2147483648;
    const max = 2147483647;
    if (num < min) {
      return ['00', '000000'];
    }
    const aabbggrr = (min <= num && num <= max)
      ? `00000000${(num < 0 ? num + 4294967296 : num).toString(16)}`.slice(-8)
      : String(num).slice(0, 8);
    return [aabbggrr.slice(0, 2), aabbggrr.slice(2)];
  }
  return ['00', '000000'];
}

function compileStyles({ info, style, defaultStyle }) {
  const result = {};
  const styles = [assign({}, defaultStyle, { Name: 'Default' })].concat(style);
  for (let i = 0; i < styles.length; i++) {
    const s = assign({}, DEFAULT_STYLE, styles[i]);
    // this behavior is same as Aegisub by black-box testing
    if (/^(\*+)Default$/.test(s.Name)) {
      s.Name = 'Default';
    }
    Object.keys(s).forEach((key) => {
      if (key !== 'Name' && key !== 'Fontname' && !/Colour/.test(key)) {
        s[key] *= 1;
      }
    });
    const [a1, c1] = parseStyleColor(s.PrimaryColour);
    const [a2, c2] = parseStyleColor(s.SecondaryColour);
    const [a3, c3] = parseStyleColor(s.OutlineColour);
    const [a4, c4] = parseStyleColor(s.BackColour);
    const tag = {
      fn: s.Fontname,
      fs: s.Fontsize,
      c1,
      a1,
      c2,
      a2,
      c3,
      a3,
      c4,
      a4,
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
      q: /^[0-3]$/.test(info.WrapStyle) ? info.WrapStyle * 1 : 2,
    };
    result[s.Name] = { style: s, tag };
  }
  return result;
}

function compile(text, options = {}) {
  const tree = parse(text);
  const styles = compileStyles({
    info: tree.info,
    style: tree.styles.style,
    defaultStyle: options.defaultStyle || {},
  });
  return {
    info: tree.info,
    width: tree.info.PlayResX * 1 || null,
    height: tree.info.PlayResY * 1 || null,
    collisions: tree.info.Collisions || 'Normal',
    styles,
    dialogues: compileDialogues({
      styles,
      dialogues: tree.events.dialogue,
    }),
  };
}

const $fixFontSize = document.createElement('div');
$fixFontSize.className = 'ASS-fix-font-size';
$fixFontSize.textContent = 'M';

const cache = Object.create(null);

function getRealFontSize(fn, fs) {
  const key = `${fn}-${fs}`;
  if (!cache[key]) {
    $fixFontSize.style.cssText = `line-height:normal;font-size:${fs}px;font-family:"${fn}",Arial;`;
    cache[key] = fs * fs / $fixFontSize.clientHeight;
  }
  return cache[key];
}

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

function getVendor(prop) {
  const { style } = document.body;
  const Prop = prop.replace(/^\w/, (x) => x.toUpperCase());
  if (prop in style) return '';
  if (`webkit${Prop}` in style) return '-webkit-';
  if (`moz${Prop}` in style) return '-moz-';
  return '';
}

const vendor = {
  clipPath: getVendor('clipPath'),
};

const GLOBAL_CSS = '.ASS-box{overflow:hidden;pointer-events:none;position:absolute}.ASS-dialogue{font-size:0;position:absolute;z-index:0}.ASS-dialogue [data-stroke]{position:relative}.ASS-dialogue [data-stroke]::after,.ASS-dialogue [data-stroke]::before{content:attr(data-stroke);position:absolute;top:0;left:0;z-index:-1;filter:var(--ass-blur)}.ASS-dialogue [data-stroke]::before{color:var(--ass-shadow-color);transform:translate(var(--ass-shadow-offset));-webkit-text-stroke:var(--ass-border-width) var(--ass-shadow-color);text-shadow:var(--ass-shadow-delta);opacity:var(--ass-shadow-opacity)}.ASS-dialogue [data-stroke]::after{color:transparent;-webkit-text-stroke:var(--ass-border-width) var(--ass-border-color);text-shadow:var(--ass-border-delta);opacity:var(--ass-border-opacity)}.ASS-fix-font-size{position:absolute;visibility:hidden}.ASS-fix-objectBoundingBox{width:100%;height:100%;position:absolute;top:0;left:0}';
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
const transformTags = ['fscx', 'fscy', 'frx', 'fry', 'frz', 'fax', 'fay'];

function initAnimation($el, keyframes, options) {
  const animation = $el.animate(keyframes, options);
  animation.pause();
  return animation;
}

function batchAnimate($el, action) {
  ($el.animations || []).forEach((animation) => {
    animation[action]();
  });
}

function createClipPath(clip, store) {
  const sw = store.scriptRes.width;
  const sh = store.scriptRes.height;
  let d = '';
  if (clip.dots !== null) {
    let { x1, y1, x2, y2 } = clip.dots;
    x1 /= sw;
    y1 /= sh;
    x2 /= sw;
    y2 /= sh;
    d = `M${x1},${y1}L${x1},${y2},${x2},${y2},${x2},${y1}Z`;
  }
  if (clip.drawing !== null) {
    d = clip.drawing.instructions.map(({ type, points }) => (
      type + points.map(({ x, y }) => `${x / sw},${y / sh}`).join(',')
    )).join('');
  }
  const scale = 1 / (1 << (clip.scale - 1));
  if (clip.inverse) {
    d += `M0,0L0,${scale},${scale},${scale},${scale},0,0,0Z`;
  }
  const id = `ASS-${uuid()}`;
  const $clipPath = createSVGEl('clipPath', [
    ['id', id],
    ['clipPathUnits', 'objectBoundingBox'],
  ]);
  $clipPath.append(createSVGEl('path', [
    ['d', d],
    ['transform', `scale(${scale})`],
    ['clip-rule', 'evenodd'],
  ]));
  store.defs.append($clipPath);
  return {
    $clipPath,
    cssText: `${vendor.clipPath}clip-path:url(#${id});`,
  };
}

function getClipPath(dialogue, store) {
  if (!dialogue.clip) return {};
  const $fobb = document.createElement('div');
  store.box.insertBefore($fobb, dialogue.$div);
  $fobb.append(dialogue.$div);
  $fobb.className = 'ASS-fix-objectBoundingBox';
  const { cssText, $clipPath } = createClipPath(dialogue.clip, store);
  store.defs.append($clipPath);
  $fobb.style.cssText = cssText;
  return { $div: $fobb, $clipPath };
}

function createSVGStroke(tag, id, scale) {
  const hasBorder = tag.xbord || tag.ybord;
  const hasShadow = tag.xshad || tag.yshad;
  const isOpaque = tag.a1 !== 'FF';
  const blur = tag.blur || tag.be || 0;
  const $filter = createSVGEl('filter', [['id', id]]);
  $filter.append(createSVGEl('feGaussianBlur', [
    ['stdDeviation', hasBorder ? 0 : blur],
    ['in', 'SourceGraphic'],
    ['result', 'sg_b'],
  ]));
  $filter.append(createSVGEl('feFlood', [
    ['flood-color', color2rgba(tag.a1 + tag.c1)],
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
      ['flood-color', color2rgba(tag.a3 + tag.c3)],
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
      ['in', hasBorder ? 'dil' : 'SourceGraphic'],
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
      ['flood-color', color2rgba(tag.a4 + tag.c4)],
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
  return $filter;
}

function get4QuadrantPoints([x, y]) {
  return [[0, 0], [0, 1], [1, 0], [1, 1]]
    .filter(([i, j]) => (i || x) && (j || y))
    .map(([i, j]) => [(i || -1) * x, (j || -1) * y]);
}

function getOffsets(x, y) {
  if (x === y) return [];
  const nx = Math.min(x, y);
  const ny = Math.max(x, y);
  // const offsets = [[nx, ny]];
  // for (let i = 0; i < nx; i++) {
  //   for (let j = Math.round(nx + 0.5); j < ny; j++) {
  //     offsets.push([i, j]);
  //   }
  // }
  // return [].concat(...offsets.map(get4QuadrantPoints));
  return Array.from({ length: Math.ceil(ny) - 1 }, (_, i) => i + 1).concat(ny)
    .map((n) => [(ny - n) / ny * nx, n])
    .map(([i, j]) => (x > y ? [j, i] : [i, j]))
    .flatMap(get4QuadrantPoints);
}

// TODO: a1 === 'ff'
function createCSSStroke(tag, scale) {
  const bc = color2rgba(`00${tag.c3}`);
  const bx = tag.xbord * scale;
  const by = tag.ybord * scale;
  const sc = color2rgba(`00${tag.c4}`);
  const sx = tag.xshad * scale;
  const sy = tag.yshad * scale;
  const blur = tag.blur || tag.be || 0;
  const deltaOffsets = getOffsets(bx, by);
  return [
    { key: 'border-width', value: `${Math.min(bx, by) * 2}px` },
    { key: 'border-color', value: bc },
    { key: 'border-opacity', value: alpha2opacity(tag.a3) },
    { key: 'border-delta', value: deltaOffsets.map(([x, y]) => `${x}px ${y}px ${bc}`).join(',') },
    { key: 'shadow-offset', value: `${sx}px, ${sy}px` },
    { key: 'shadow-color', value: sc },
    { key: 'shadow-opacity', value: alpha2opacity(tag.a4) },
    { key: 'shadow-delta', value: deltaOffsets.map(([x, y]) => `${x}px ${y}px ${sc}`).join(',') },
    { key: 'blur', value: `blur(${blur}px)` },
  ].map((kv) => Object.assign(kv, { key: `--ass-${kv.key}` }));
}

function createDrawing(fragment, styleTag, store) {
  if (!fragment.drawing.d) return null;
  const { scale, info } = store;
  const tag = { ...styleTag, ...fragment.tag };
  const { minX, minY, width, height } = fragment.drawing;
  const baseScale = scale / (1 << (tag.p - 1));
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
  const strokeScale = /yes/i.test(info.ScaledBorderAndShadow) ? scale : 1;
  const filterId = `ASS-${uuid()}`;
  const $defs = createSVGEl('defs');
  $defs.append(createSVGStroke(tag, filterId, strokeScale));
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
    ['filter', `url(#${filterId})`],
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

function createTransform(tag) {
  return [
    // TODO: I don't know why perspective is 314, it just performances well.
    'perspective(314px)',
    `rotateY(${tag.fry || 0}deg)`,
    `rotateX(${tag.frx || 0}deg)`,
    `rotateZ(${-tag.frz || 0}deg)`,
    `scale(${tag.p ? 1 : (tag.fscx || 100) / 100},${tag.p ? 1 : (tag.fscy || 100) / 100})`,
    `skew(${tag.fax || 0}rad,${tag.fay || 0}rad)`,
  ].join(' ');
}

function setTransformOrigin(dialogue, scale) {
  const { align, width, height, x, y, $div } = dialogue;
  const org = {};
  if (dialogue.org) {
    org.x = dialogue.org.x * scale;
    org.y = dialogue.org.y * scale;
  } else {
    org.x = [x, x + width / 2, x + width][align.h];
    org.y = [y + height, y + height / 2, y][align.v];
  }
  for (let i = $div.childNodes.length - 1; i >= 0; i -= 1) {
    const node = $div.childNodes[i];
    if (node.dataset.hasRotate === '') {
      // It's not extremely precise for offsets are round the value to an integer.
      const tox = org.x - x - node.offsetLeft;
      const toy = org.y - y - node.offsetTop;
      node.style.cssText += `transform-origin:${tox}px ${toy}px;`;
    }
  }
}

function encodeText(text, q) {
  return text
    .replace(/\\h/g, ' ')
    .replace(/\\N/g, '\n')
    .replace(/\\n/g, q === 2 ? '\n' : ' ');
}

function createDialogue(dialogue, store) {
  const { video, styles, info } = store;
  const $div = document.createElement('div');
  $div.className = 'ASS-dialogue';
  const df = document.createDocumentFragment();
  const { slices, start, end } = dialogue;
  const animationOptions = {
    duration: (end - start) * 1000,
    delay: Math.min(0, start - (video.currentTime - store.delay)) * 1000,
    fill: 'forwards',
  };
  $div.animations = [];
  slices.forEach((slice) => {
    const sliceTag = styles[slice.style].tag;
    const borderStyle = styles[slice.style].style.BorderStyle;
    slice.fragments.forEach((fragment) => {
      const { text, drawing } = fragment;
      const tag = { ...sliceTag, ...fragment.tag };
      let cssText = 'display:inline-block;';
      const cssVars = [];
      if (!drawing) {
        cssText += `line-height:normal;font-family:"${tag.fn}",Arial;`;
        cssText += `font-size:${store.scale * getRealFontSize(tag.fn, tag.fs)}px;`;
        cssText += `color:${color2rgba(tag.a1 + tag.c1)};`;
        const scale = /yes/i.test(info.ScaledBorderAndShadow) ? store.scale : 1;
        if (borderStyle === 1) {
          cssVars.push(...createCSSStroke(tag, scale));
        }
        if (borderStyle === 3) {
          // TODO: \bord0\shad16
          const bc = color2rgba(tag.a3 + tag.c3);
          const bx = tag.xbord * scale;
          const by = tag.ybord * scale;
          const sc = color2rgba(tag.a4 + tag.c4);
          const sx = tag.xshad * scale;
          const sy = tag.yshad * scale;
          cssText += (
            `${bx || by ? `background-color:${bc};` : ''}`
            + `border:0 solid ${bc};`
            + `border-width:${bx}px ${by}px;`
            + `margin:${-bx}px ${-by}px;`
            + `box-shadow:${sx}px ${sy}px ${sc};`
          );
        }
        cssText += tag.b ? `font-weight:${tag.b === 1 ? 'bold' : tag.b};` : '';
        cssText += tag.i ? 'font-style:italic;' : '';
        cssText += (tag.u || tag.s) ? `text-decoration:${tag.u ? 'underline' : ''} ${tag.s ? 'line-through' : ''};` : '';
        cssText += tag.fsp ? `letter-spacing:${store.scale * tag.fsp}px;` : '';
        // TODO: q0 and q3 is same for now, at least better than nothing.
        if (tag.q === 0 || tag.q === 3) {
          cssText += 'text-wrap:balance;';
        }
        if (tag.q === 1) {
          cssText += 'word-break:break-all;white-space:normal;';
        }
        if (tag.q === 2) {
          cssText += 'word-break:normal;white-space:nowrap;';
        }
      }
      const hasTransfrom = transformTags.some((x) => (
        /^fsc[xy]$/.test(x) ? tag[x] !== 100 : !!tag[x]
      ));
      if (hasTransfrom) {
        cssText += `transform:${createTransform(tag)};`;
        if (!drawing) {
          cssText += 'transform-style:preserve-3d;word-break:normal;white-space:nowrap;';
        }
      }
      if (drawing && tag.pbo) {
        const pbo = store.scale * -tag.pbo * (tag.fscy || 100) / 100;
        cssText += `vertical-align:${pbo}px;`;
      }

      const hasRotate = /"fr[x-z]":[^0]/.test(JSON.stringify(tag));
      encodeText(text, tag.q).split('\n').forEach((content, idx) => {
        const $span = document.createElement('span');
        if (hasRotate) {
          $span.dataset.hasRotate = '';
        }
        if (drawing) {
          const obj = createDrawing(fragment, sliceTag, store);
          if (!obj) return;
          $span.style.cssText = obj.cssText;
          $span.append(obj.$svg);
        } else {
          if (idx) {
            df.append(document.createElement('br'));
          }
          if (!content) return;
          $span.textContent = content;
          if (tag.xbord || tag.ybord || tag.xshad || tag.yshad) {
            $span.dataset.stroke = content;
          }
        }
        // TODO: maybe it can be optimized
        $span.style.cssText += cssText;
        cssVars.forEach(({ key, value }) => {
          $span.style.setProperty(key, value);
        });
        if (fragment.keyframes) {
          const animation = initAnimation(
            $span,
            fragment.keyframes,
            { ...animationOptions, duration: fragment.duration },
          );
          $div.animations.push(animation);
        }
        df.append($span);
      });
    });
  });
  if (dialogue.keyframes) {
    $div.animations.push(initAnimation($div, dialogue.keyframes, animationOptions));
  }
  $div.append(df);
  return $div;
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
  const { effect, move, align, width, height, margin, slices } = dialogue;
  let x = 0;
  let y = 0;
  if (effect) {
    if (effect.name === 'banner') {
      x = effect.lefttoright ? -width : store.width;
      y = [
        store.height - height - margin.vertical,
        (store.height - height) / 2,
        margin.vertical,
      ][align.v];
    }
  } else if (dialogue.pos || move) {
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
      slice.fragments.some(({ animationName }) => animationName)
    ));
    y = hasT
      ? [
        store.height - height - margin.vertical,
        (store.height - height) / 2,
        margin.vertical,
      ][align.v]
      : allocate(dialogue, store);
  }
  return { x, y };
}

function createStyle(dialogue, store) {
  const { layer, align, effect, pos, margin, width } = dialogue;
  let cssText = '';
  if (layer) cssText += `z-index:${layer};`;
  cssText += `text-align:${['left', 'center', 'right'][align.h]};`;
  if (!effect) {
    const mw = store.width - store.scale * (margin.left + margin.right);
    cssText += `max-width:${mw}px;`;
    if (!pos) {
      if (align.h === 0) {
        cssText += `margin-left:${store.scale * margin.left}px;`;
      }
      if (align.h === 2) {
        cssText += `margin-right:${store.scale * margin.right}px;`;
      }
      if (width > store.width - store.scale * (margin.left + margin.right)) {
        cssText += `margin-left:${store.scale * margin.left}px;`;
        cssText += `margin-right:${store.scale * margin.right}px;`;
      }
    }
  }
  return cssText;
}

function renderer(dialogue, store) {
  const $div = createDialogue(dialogue, store);
  Object.assign(dialogue, { $div });
  store.box.append($div);
  const { width } = $div.getBoundingClientRect();
  Object.assign(dialogue, { width });
  $div.style.cssText += createStyle(dialogue, store);
  // height may be changed after createStyle
  const { height } = $div.getBoundingClientRect();
  Object.assign(dialogue, { height });
  const { x, y } = getPosition(dialogue, store);
  Object.assign(dialogue, { x, y });
  $div.style.cssText += `width:${width}px;height:${height}px;left:${x}px;top:${y}px;`;
  setTransformOrigin(dialogue, store.scale);
  Object.assign(dialogue, getClipPath(dialogue, store));
  return dialogue;
}

// TODO: multi \t can't be merged directly
function mergeT(ts) {
  return ts.reduceRight((results, t) => {
    let merged = false;
    return results
      .map((r) => {
        merged = t.t1 === r.t1 && t.t2 === r.t2 && t.accel === r.accel;
        return { ...r, ...(merged ? { tag: { ...r.tag, ...t.tag } } : {}) };
      })
      .concat(merged ? [] : t);
  }, []);
}

function createEffectKeyframes({ effect, duration }, store) {
  // TODO: when effect and move both exist, its behavior is weird, for now only move works.
  const { name, delay, lefttoright, y1 } = effect;
  const y2 = effect.y2 || store.resampledRes.height;
  if (name === 'banner') {
    const tx = store.scale * (duration / delay) * (lefttoright ? 1 : -1);
    return [0, `${tx}px`].map((x, i) => ({
      offset: i,
      transform: `translateX(${x})`,
    }));
  }
  if (name.startsWith('scroll')) {
    const updown = /up/.test(name) ? -1 : 1;
    const dp = (y2 - y1) / (duration / delay);
    return [y1, y2]
      .map((y) => store.scale * y * updown)
      .map((y, i) => ({
        offset: Math.min(i, dp),
        transform: `translateY${y}`,
      }));
  }
  return [];
}

function createMoveKeyframes({ move, duration, dialogue }, store) {
  const { x1, y1, x2, y2, t1, t2 } = move;
  const t = [t1, t2 || duration];
  const pos = dialogue.pos || { x: 0, y: 0 };
  return [[x1, y1], [x2, y2]]
    .map(([x, y]) => [store.scale * (x - pos.x), store.scale * (y - pos.y)])
    .map(([x, y], index) => ({
      offset: Math.min(t[index] / duration, 1),
      transform: `translate(${x}px, ${y}px)`,
    }));
}

function createFadeKeyframes(fade, duration) {
  if (fade.type === 'fad') {
    const { t1, t2 } = fade;
    const kfs = [];
    if (t1) {
      kfs.push([0, 0]);
    }
    if (t1 < duration) {
      if (t2 <= duration) {
        kfs.push([t1 / duration, 1]);
      }
      if (t1 + t2 < duration) {
        kfs.push([(duration - t2) / duration, 1]);
      }
      if (t2 > duration) {
        kfs.push([0, (t2 - duration) / t2]);
      } else if (t1 + t2 > duration) {
        kfs.push([(t1 + 0.5) / duration, 1 - (t1 + t2 - duration) / t2]);
      }
      if (t2) {
        kfs.push([1, 0]);
      }
    } else {
      kfs.push([1, duration / t1]);
    }
    return kfs.map(([offset, opacity]) => ({ offset, opacity }));
  }
  const { a1, a2, a3, t1, t2, t3, t4 } = fade;
  const opacities = [a1, a2, a3].map((a) => 1 - a / 255);
  return [0, t1, t2, t3, t4, duration]
    .map((t) => t / duration)
    .map((t, i) => ({ offset: t, opacity: opacities[i >> 1] }))
    .filter(({ offset }) => offset <= 1);
}

function createTransformKeyframes({ fromTag, tag, fragment }) {
  const toTag = { ...fromTag, ...tag };
  if (fragment.drawing) {
    // scales will be handled inside svg
    Object.assign(toTag, {
      p: 0,
      fscx: ((tag.fscx || fromTag.fscx) / fromTag.fscx) * 100,
      fscy: ((tag.fscy || fromTag.fscy) / fromTag.fscy) * 100,
    });
    Object.assign(fromTag, { fscx: 100, fscy: 100 });
  }
  return { transform: createTransform(toTag) };
}

// TODO: accel is not implemented yet, maybe it can be simulated by cubic-bezier?
function setKeyframes(dialogue, store) {
  const { start, end, effect, move, fade, slices } = dialogue;
  const duration = (end - start) * 1000;
  const keyframes = [
    ...(effect && !move ? createEffectKeyframes({ effect, duration }, store) : []),
    ...(move ? createMoveKeyframes({ move, duration, dialogue }, store) : []),
    ...(fade ? createFadeKeyframes(fade, duration) : []),
  ].sort((a, b) => a.offset - b.offset);
  if (keyframes.length > 0) {
    Object.assign(dialogue, { keyframes });
  }
  slices.forEach((slice) => {
    const sliceTag = store.styles[slice.style].tag;
    slice.fragments.forEach((fragment) => {
      if (!fragment.tag.t || fragment.tag.t.length === 0) {
        return;
      }
      const fromTag = { ...sliceTag, ...fragment.tag };
      const tTags = mergeT(fragment.tag.t).sort((a, b) => a.t2 - b.t2 || a.t1 - b.t1);
      if (tTags[0].t1 > 0) {
        tTags.unshift({ t1: 0, t2: tTags[0].t1, tag: fromTag });
      }
      tTags.reduce((prevTag, curr) => {
        const tag = { ...prevTag, ...curr.tag };
        Object.assign(curr.tag, tag);
        return tag;
      }, {});
      const fDuration = Math.max(duration, ...tTags.map(({ t2 }) => t2));
      const kfs = tTags.map(({ t2, tag }) => {
        const hasAlpha = (
          tag.a1 !== undefined
          && tag.a1 === tag.a2
          && tag.a2 === tag.a3
          && tag.a3 === tag.a4
        );
        // TODO: border and shadow, should animate CSS vars
        return {
          offset: t2 / fDuration,
          ...(tag.fs && { 'font-size': `${store.scale * getRealFontSize(tag.fn, tag.fs)}px` }),
          ...(tag.fsp && { 'letter-spacing': `${store.scale * tag.fsp}px` }),
          ...((tag.c1 || (tag.a1 && !hasAlpha)) && {
            color: color2rgba((tag.a1 || fromTag.a1) + (tag.c1 || fromTag.c1)),
          }),
          ...(hasAlpha && { opacity: 1 - Number.parseInt(tag.a1, 16) / 255 }),
          ...createTransformKeyframes({ fromTag, tag, fragment }),
        };
      }).sort((a, b) => a.offset - b.offset);
      if (kfs.length > 0) {
        Object.assign(fragment, { keyframes: kfs, duration: fDuration });
      }
    });
  });
}

/* eslint-disable no-param-reassign */

function clear(store) {
  const { box, defs } = store;
  while (box.lastChild) {
    box.lastChild.remove();
  }
  while (defs.lastChild) {
    defs.lastChild.remove();
  }
  store.actives = [];
  store.space = [];
}

function framing(store) {
  const { video, dialogues, actives, resampledRes } = store;
  const vct = video.currentTime - store.delay;
  for (let i = actives.length - 1; i >= 0; i -= 1) {
    const dia = actives[i];
    let { end } = dia;
    if (dia.effect && /scroll/.test(dia.effect.name)) {
      const { y1, y2, delay } = dia.effect;
      const duration = ((y2 || resampledRes.height) - y1) / (1000 / delay);
      end = Math.min(end, dia.start + duration);
    }
    if (end < vct) {
      dia.$div.remove();
      dia.$clipPath?.remove();
      actives.splice(i, 1);
    }
  }
  while (
    store.index < dialogues.length
    && vct >= dialogues[store.index].start
  ) {
    if (vct < dialogues[store.index].end) {
      const dia = renderer(dialogues[store.index], store);
      if (!video.paused) {
        batchAnimate(dia.$div, 'play');
      }
      actives.push(dia);
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
      let from = 0;
      const to = dialogues.length - 1;
      while (from + 1 < to && vct > dialogues[(to + from) >> 1].end) {
        from = (to + from) >> 1;
      }
      if (!from) return 0;
      for (let i = from; i < to; i += 1) {
        if (
          dialogues[i].end > vct && vct >= dialogues[i].start
          || (i && dialogues[i - 1].end < vct && vct < dialogues[i].start)
        ) {
          return i;
        }
      }
      return to;
    })();
    framing(store);
  };
}

function createPlay(store) {
  return function play() {
    const frame = () => {
      framing(store);
      store.requestId = requestAnimationFrame(frame);
    };
    cancelAnimationFrame(store.requestId);
    store.requestId = requestAnimationFrame(frame);
    store.actives.forEach(({ $div }) => {
      batchAnimate($div, 'play');
    });
  };
}

function createPause(store) {
  return function pause() {
    cancelAnimationFrame(store.requestId);
    store.requestId = 0;
    store.actives.forEach(({ $div }) => {
      batchAnimate($div, 'pause');
    });
  };
}

function createResize(that, store) {
  const { video, box, svg, dialogues } = store;
  return function resize() {
    const cw = video.clientWidth;
    const ch = video.clientHeight;
    const vw = video.videoWidth || cw;
    const vh = video.videoHeight || ch;
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

    const cssText = (
      `width:${bw}px;`
      + `height:${bh}px;`
      + `top:${(ch - bh) / 2}px;`
      + `left:${(cw - bw) / 2}px;`
    );
    box.style.cssText = cssText;
    svg.style.cssText = cssText;
    svg.setAttributeNS(null, 'viewBox', `0 0 ${sw} ${sh}`);

    dialogues.forEach((dialogue) => {
      setKeyframes(dialogue, store);
    });

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
    // TODO: 是否可以动态添加
    /** use for \clip */
    svg: createSVGEl('svg'),
    /** use for \clip */
    defs: createSVGEl('defs'),
    /**
     * video resize observer
     * @type {ResizeObserver}
     */
    observer: null,
    scale: 1,
    width: 0,
    height: 0,
    /** resolution from ASS file, it's PlayResX and PlayResY  */
    scriptRes: {},
    /** resolution after resampling */
    resampledRes: {},
    /** current index of dialogues to match currentTime */
    index: 0,
    /** @type {import('ass-compiler').ScriptInfo} */
    info: {},
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
    this.#store.info = info;
    this.#store.scriptRes = {
      width: width || video.videoWidth || video.clientWidth,
      height: height || video.videoHeight || video.clientHeight,
    };
    this.#store.styles = styles;
    this.#store.dialogues = dialogues.map((dia) => Object.assign(dia, {
      align: {
        // 0: left, 1: center, 2: right
        h: (dia.alignment + 2) % 3,
        // 0: top, 1: center, 2: bottom
        v: Math.trunc((dia.alignment - 1) / 3),
      },
    }));

    container.append($fixFontSize);

    const { svg, defs, box } = this.#store;

    svg.append(defs);
    container.append(svg);

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
    const { video, box, svg, observer } = this.#store;
    this.#pause();
    clear(this.#store);
    video.removeEventListener('play', this.#play);
    video.removeEventListener('pause', this.#pause);
    video.removeEventListener('playing', this.#play);
    video.removeEventListener('waiting', this.#pause);
    video.removeEventListener('seeking', this.#seek);

    $fixFontSize.remove();
    svg.remove();
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
