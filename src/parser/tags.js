var parseTags = function(dialogue, styles) {
  var text = dialogue.Text.replace(/\\N/g, '<br>').replace(/\\h/g, '&nbsp;'),
      prevTags = JSON.parse(JSON.stringify(styles[dialogue.Style]._tags)),
      kv = text.split(/{([^{}]*?)}/),
      dia = {content: []};
  if (kv[0].length) {
    dia.content.push({
      text: kv[0],
      tags: prevTags
    });
  }
  for (var i = 1; i < kv.length; i += 2) {
    var ct = {
      text: kv[i + 1],
      tags: JSON.parse(JSON.stringify(prevTags))
    };

    /* JavaScript doesn't support split(/(?<!\(.*?)\\(?!.*?\))/) */
    var cmds = kv[i].split('\\');
    for (var j = 0; j < cmds.length; ++j) {
      if (/^t\(/.test(cmds[j]) && !/\)$/.test(cmds[j])) {
        while (!/\)$/.test(cmds[j + 1])) {
          cmds[j] += '\\' + cmds[j + 1];
          cmds.splice(j + 1, 1);
        }
        cmds[j] += '\\' + cmds[j + 1];
        cmds.splice(j + 1, 1);
      }
    }

    for (var j = 0; j < cmds.length; ++j) {
      var cmd = cmds[j];
      parseAnimatableTags.call(ct, cmd);
      if (ct.tags.clip) dia.clip = ct.tags.clip;
      if (/^b\d/.test(cmd)) ct.tags.b = cmd.match(/^b(\d+)/)[1] * 1;
      if (/^i\d/.test(cmd)) ct.tags.i = cmd[1] * 1;
      if (/^u\d/.test(cmd)) ct.tags.u = cmd[1] * 1;
      if (/^s\d/.test(cmd)) ct.tags.s = cmd[1] * 1;
      if (/^fn/.test(cmd)) ct.tags.fn = cmd.match(/^fn(.*)/)[1];
      if (/^fe/.test(cmd)) ct.tags.fe = cmd.match(/^fe(.*)/)[1] * 1;
      if (/^k\d/.test(cmd)) ct.tags.k = cmd.match(/^k(\d+)/)[1] * 1;
      if (/^K\d/.test(cmd)) ct.tags.kf = cmd.match(/^K(\d+)/)[1] * 1;
      if (/^kf\d/.test(cmd)) ct.tags.kf = cmd.match(/^kf(\d+)/)[1] * 1;
      if (/^ko\d/.test(cmd)) ct.tags.ko = cmd.match(/^ko(\d+)/)[1] * 1;
      if (/^kt\d/.test(cmd)) ct.tags.kt = cmd.match(/^kt(\d+)/)[1] * 1;
      if (/^q\d/.test(cmd)) ct.tags.q = cmd[1] * 1;
      if (/^p\d/.test(cmd)) ct.tags.p = cmd.match(/^p(\d+)/)[1] * 1;
      if (/^pbo/.test(cmd)) ct.tags.pbo = cmd.match(/^pbo(.*)/)[1] * 1;
      if (/^an\d/.test(cmd) && !dia.alignment) dia.alignment = cmd[2] * 1;
      if (/^a\d/.test(cmd) && !dia.alignment) {
        var val = cmd.match(/^a(\d+)/)[1] * 1;
        if (val < 4) dia.alignment = val;
        else if (val > 8) dia.alignment = val - 5;
        else dia.alignment = val + 2;
      }
      if (/^pos/.test(cmd) && !dia.pos && !dia.move) {
        var p = cmd.replace(/\s/g, '').match(/^pos\((.*?)\)?$/)[1].split(',');
        dia.pos = {x: p[0] * 1, y: p[1] * 1};
      }
      if (/^org/.test(cmd) && !dia.org) {
        var p = cmd.replace(/\s/g, '').match(/^org\((.*?)\)?$/)[1].split(',');
        dia.org = {x: p[0] * 1, y: p[1] * 1};
      }
      if (/^move/.test(cmd) && !dia.move && !dia.pos) {
        var p = cmd.replace(/\s/g, '')
                   .match(/^move\((.*?)\)?$/)[1]
                   .split(',')
                   .map(function(x) { return x * 1; });
        dia.pos = {x: p[0] * 1, y: p[1] * 1};
        if (p.length === 4) {
          p.push(0);
          p.push((dialogue.End - dialogue.Start) * 1000);
        }
        dia.move = p;
      }
      if (/^fad\s*\(/.test(cmd) && !dia.fad) {
        dia.fad = cmd.replace(/\s/g, '')
                     .match(/^fad\((.*?)\)?$/)[1]
                     .split(',')
                     .map(function(x) { return x * 1; });
      }
      if (/^fade/.test(cmd) && !dia.fade) {
        dia.fade = cmd.replace(/\s/g, '')
                      .match(/^fade\((.*?)\)?$/)[1]
                      .split(',')
                      .map(function(x) { return x * 1; });
      }
      if (/^r/.test(cmd)) {
        var name = cmd.match(/^r(.*)/)[1];
        var rStyle = styles[name] || styles[dialogue.Style];
        ct.tags = JSON.parse(JSON.stringify(rStyle._tags));
      }
      if (/^t\(/.test(cmd)) {
        var args = cmd.replace(/\s/g, '').match(/^t\((.*)\)/)[1].split(',');
        if (!args[0]) continue;
        var tcmds = args[args.length - 1].split('\\');
        var tct = {
          t1: 0,
          t2: (dialogue.End - dialogue.Start) * 1000,
          accel: 1,
          tags: {}
        };
        for (var k = tcmds.length - 1; k >= 0; k--) {
          parseAnimatableTags.call(tct, tcmds[k]);
        }
        if (args.length === 2) {
          tct.accel = args[0] * 1;
        }
        if (args.length === 3) {
          tct.t1 = args[0] * 1;
          tct.t2 = args[1] * 1;
        }
        if (args.length === 4) {
          tct.t1 = args[0] * 1;
          tct.t2 = args[1] * 1;
          tct.accel = args[2] * 1;
        }
        if (!ct.tags.t) ct.tags.t = [];
        ct.tags.t.push(tct);
      }
    }
    if (ct.tags.t) {
      for (var j = 0; j < ct.tags.t.length - 1; ++j) {
        for (var k = j + 1; k < ct.tags.t.length; ++k) {
          if (ct.tags.t[j].t1 === ct.tags.t[k].t1 &&
              ct.tags.t[j].t2 === ct.tags.t[k].t2) {
            for (var l in ct.tags.t[k].tags) {
              ct.tags.t[j].tags[l] = ct.tags.t[k].tags[l];
            }
            ct.tags.t.splice(k, 1);
          }
        }
      }
    }
    if (dialogue.Effect && dialogue.Effect.name === 'banner') ct.tags.q = 2;
    if (!ct.tags.p) ct.text = ct.text.replace(/\s/g, '&nbsp;');
    else ct.commands = parseDrawing(ct.text);
    ct.text = ct.text.replace(/\\n/g, (ct.tags.q === 2) ? '<br>' : '&nbsp;');
    prevTags = ct.tags;
    dia.content.push(ct);
  }
  return dia;
};
var parseAnimatableTags = function(cmd) {
  if (/^fs[\d\+\-]/.test(cmd)) {
    var val = cmd.match(/^fs(.*)/)[1];
    if (/^\d/.test(val)) this.tags.fs = val * 1;
    if (/^\+|-/.test(val)) {
      this.tags.fs *= (val * 1 > -10 ? (1 + val / 10) : 1);
    }
  }
  if (/^fsp/.test(cmd)) this.tags.fsp = cmd.match(/^fsp(.*)/)[1] * 1;
  if (/^fscx/.test(cmd)) this.tags.fscx = cmd.match(/^fscx(.*)/)[1] * 1;
  if (/^fscy/.test(cmd)) this.tags.fscy = cmd.match(/^fscy(.*)/)[1] * 1;
  if (/^fsp/.test(cmd)) this.tags.fsp = cmd.match(/^fsp(.*)/)[1] * 1;
  if (/^frx/.test(cmd)) this.tags.frx = cmd.match(/^frx(.*)/)[1] * 1;
  if (/^fry/.test(cmd)) this.tags.fry = cmd.match(/^fry(.*)/)[1] * 1;
  if (/^fr[z\d\-]/.test(cmd)) this.tags.frz = cmd.match(/^frz?(.*)/)[1] * 1;
  if (/^blur\d/.test(cmd)) this.tags.blur = cmd.match(/^blur(.*)/)[1] * 1;
  if (/^be\d/.test(cmd)) this.tags.blur = cmd.match(/^be(.*)/)[1] * 1;
  if (this.tags.blur < 0) this.tags.blur = 0;
  if (/^fax/.test(cmd)) this.tags.fax = cmd.match(/^fax(.*)/)[1] * 1;
  if (/^fay/.test(cmd)) this.tags.fay = cmd.match(/^fay(.*)/)[1] * 1;
  if (/^x*bord/.test(cmd)) this.tags.xbord = cmd.match(/^x*bord(.*)/)[1] * 1;
  if (/^y*bord/.test(cmd)) this.tags.ybord = cmd.match(/^y*bord(.*)/)[1] * 1;
  if (this.tags.xbord < 0) this.tags.xbord = 0;
  if (this.tags.ybord < 0) this.tags.ybord = 0;
  if (/^x*shad/.test(cmd)) this.tags.xshad = cmd.match(/^x*shad(.*)/)[1] * 1;
  if (/^y*shad/.test(cmd)) this.tags.yshad = cmd.match(/^y*shad(.*)/)[1] * 1;
  if (/^\d?c&?H?[0-9a-f]+/i.test(cmd)) {
    var args = cmd.match(/^(\d?)c&?H?(\w+)/);
    if (!args[1]) args[1] = '1';
    while (args[2].length < 6) args[2] = '0' + args[2];
    this.tags['c' + args[1]] = args[2];
  }
  if (/^\da&?H?[0-9a-f]+/i.test(cmd)) {
    var args = cmd.match(/^(\d)a&?H?(\w\w)/);
    this.tags['a' + args[1]] = args[2];
  }
  if (/^alpha&?H?[0-9a-f]+/i.test(cmd)) {
    for (var i = 1; i <= 4; i++) {
      this.tags['a' + i] = cmd.match(/^alpha&?H?(\w\w)/)[1];
    }
  }
  if (/^i?clip/.test(cmd)) {
    var p = cmd.match(/^i?clip\s*\((.*)\)/)[1].split(/\s*,\s*/);
    this.tags.clip = {
      inverse: /iclip/.test(cmd),
      scale: 1,
      commands: null,
      dots: null,
    };
    if (p.length === 1) {
      this.tags.clip.commands = parseDrawing(p[0]);
    }
    if (p.length === 2) {
      this.tags.clip.scale = p[0] * 1;
      this.tags.clip.commands = parseDrawing(p[1]);
    }
    if (p.length === 4) {
      this.tags.clip.dots = [p[0] * 1, p[1] * 1, p[2] * 1, p[3] * 1];
    }
  }
};
