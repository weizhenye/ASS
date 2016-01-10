var parseTags = function(dialogue) {
  var text = dialogue.Text.replace(/\\N/g, '<br>').replace(/\\h/g, '&nbsp;'),
      kv = text.split(/{([^{}]*?)}/),
      prevTags = JSON.parse(JSON.stringify(baseTags[dialogue.Style])),
      dia = {content: []};
  if (kv[0].length) dia.content.push({tags: prevTags, text: kv[0]});
  for (var i = 1; i < kv.length; i += 2) {
    var ct = {text: kv[i + 1], tags: {}},
        cmd = kv[i].split('\\'); // split(/(?<!\(.*?)\\(?!.*?\))/)
    for (var j = 0; j < cmd.length; ++j) {
      if (/^t\(/.test(cmd[j])) {
        while (!/\)$/.test(cmd[j + 1])) {
          cmd[j] += '\\' + cmd[j + 1];
          cmd.splice(j + 1, 1);
        }
        cmd[j] += '\\' + cmd[j + 1];
        cmd.splice(j + 1, 1);
      }
    }
    for (var j in prevTags) {
      if (j !== 't') ct.tags[j] = prevTags[j];
      else ct.tags[j] = JSON.parse(JSON.stringify(prevTags[j]));
    }
    for (var j = 0; j < cmd.length; ++j) {
      var tmp;
      parseAnimatableTags.call(ct, cmd[j]);
      if (ct.tags.clip) dia.clip = ct.tags.clip;
      if (/^b\d/.test(cmd[j])) ct.tags.b = cmd[j].match(/^b(\d+)/)[1] * 1;
      if (/^i\d/.test(cmd[j])) ct.tags.i = cmd[j][1] * 1;
      if (/^u\d/.test(cmd[j])) ct.tags.u = cmd[j][1] * 1;
      if (/^s\d/.test(cmd[j])) ct.tags.s = cmd[j][1] * 1;
      if (/^fn/.test(cmd[j])) ct.tags.fn = cmd[j].match(/^fn(.*)/)[1];
      if (/^fe/.test(cmd[j])) ct.tags.fe = cmd[j].match(/^fe(.*)/)[1] * 1;
      if (/^k\d/.test(cmd[j])) ct.tags.k = cmd[j].match(/^k(\d+)/)[1] * 1;
      if (/^K\d/.test(cmd[j])) ct.tags.kf = cmd[j].match(/^K(\d+)/)[1] * 1;
      if (/^kf\d/.test(cmd[j])) ct.tags.kf = cmd[j].match(/^kf(\d+)/)[1] * 1;
      if (/^ko\d/.test(cmd[j])) ct.tags.ko = cmd[j].match(/^ko(\d+)/)[1] * 1;
      if (/^kt\d/.test(cmd[j])) ct.tags.kt = cmd[j].match(/^kt(\d+)/)[1] * 1;
      if (/^q\d/.test(cmd[j])) ct.tags.q = cmd[j][1] * 1;
      if (/^p\d/.test(cmd[j])) ct.tags.p = cmd[j].match(/^p(\d+)/)[1] * 1;
      if (/^pbo/.test(cmd[j])) ct.tags.pbo = cmd[j].match(/^pbo(.*)/)[1] * 1;
      if (/^an\d/.test(cmd[j]) && !dia.alignment) dia.alignment = cmd[j][2] * 1;
      if (/^a\d/.test(cmd[j]) && !dia.alignment) {
        tmp = cmd[j].match(/^a(\d+)/)[1] * 1;
        if (tmp < 4) dia.alignment = tmp;
        else if (tmp > 8) dia.alignment = tmp - 5;
        else dia.alignment = tmp + 2;
      }
      if (/^pos/.test(cmd[j]) && !dia.pos && !dia.move) {
        tmp = cmd[j].match(/^pos\s*\(\s*(.*?)\s*,\s*(.*?)\s*\)*$/);
        dia.pos = {x: tmp[1] * 1, y: tmp[2] * 1};
      }
      if (/^org/.test(cmd[j]) && !dia.org) {
        tmp = cmd[j].match(/^org\s*\(\s*(.*?)\s*,\s*(.*?)\s*\)*$/);
        dia.org = {x: tmp[1] * 1, y: tmp[2] * 1};
      }
      if (/^move/.test(cmd[j]) && !dia.move && !dia.pos) {
        tmp = cmd[j].match(/^move\s*\((.*)\)/)[1].split(/\s*,\s*/);
        for (var k = tmp.length - 1; k >= 0; k--) tmp[k] *= 1;
        dia.pos = {x: tmp[0] * 1, y: tmp[1] * 1};
        if (tmp.length === 4) {
          tmp.push(0);
          tmp.push((dialogue.End - dialogue.Start) * 1000);
        }
        dia.move = tmp;
      }
      if (/^fad\s*\(/.test(cmd[j]) && !dia.fad) {
        tmp = cmd[j].match(/^fad\s*\((.*)\)/)[1].split(/\s*,\s*/);
        for (var k = tmp.length - 1; k >= 0; k--) tmp[k] *= 1;
        dia.fad = tmp;
      }
      if (/^fade/.test(cmd[j]) && !dia.fade) {
        tmp = cmd[j].match(/^fade\s*\((.*)\)/)[1].split(/\s*,\s*/);
        for (var k = tmp.length - 1; k >= 0; k--) tmp[k] *= 1;
        dia.fade = tmp;
      }
      if (/^r/.test(cmd[j])) {
        tmp = cmd[j].match(/^r(.*)/)[1];
        var bt = baseTags[tmp] || baseTags[dialogue.Style];
        ct.tags = JSON.parse(JSON.stringify(bt));
      }
      if (/^t\(/.test(cmd[j])) {
        if (!ct.tags.t) ct.tags.t = [];
        tmp = cmd[j].replace(/\s/g, '').match(/^t\((.*)\)/)[1].split(',');
        if (!tmp[0]) continue;
        var tcmd = tmp[tmp.length - 1].split('\\');
        var tct = {
          t1: 0,
          t2: (dialogue.End - dialogue.Start) * 1000,
          accel: 1,
          tags: {}
        };
        for (var k = tcmd.length - 1; k >= 0; k--) {
          parseAnimatableTags.call(tct, tcmd[k]);
        }
        if (tmp.length === 2) {
          tct.accel = tmp[0] * 1;
        }
        if (tmp.length === 3) {
          tct.t1 = tmp[0] * 1;
          tct.t2 = tmp[1] * 1;
        }
        if (tmp.length === 4) {
          tct.t1 = tmp[0] * 1;
          tct.t2 = tmp[1] * 1;
          tct.accel = tmp[2] * 1;
        }
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
    ct.text = ct.text.replace(/\\n/g, (ct.tags.q === 2) ? '<br>' : '&nbsp;');
    prevTags = ct.tags;
    dia.content.push(ct);
  }
  return dia;
};
var parseAnimatableTags = function(cmd) {
  var tmp;
  if (/^fs[\d\+\-]/.test(cmd)) {
    tmp = cmd.match(/^fs(.*)/)[1];
    if (/^\d/.test(tmp)) this.tags.fs = tmp * 1;
    if (/^\+|-/.test(tmp)) {
      this.tags.fs *= (tmp * 1 > -10 ? (10 + tmp * 1) / 10 : 1);
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
  if (/^fax/.test(cmd)) this.tags.fax = cmd.match(/^fax(.*)/)[1] * 1;
  if (/^fay/.test(cmd)) this.tags.fay = cmd.match(/^fay(.*)/)[1] * 1;
  if (/^x*bord/.test(cmd)) this.tags.xbord = cmd.match(/^x*bord(.*)/)[1] * 1;
  if (/^y*bord/.test(cmd)) this.tags.ybord = cmd.match(/^y*bord(.*)/)[1] * 1;
  if (this.tags.xbord < 0) this.tags.xbord = 0;
  if (this.tags.ybord < 0) this.tags.ybord = 0;
  if (/^x*shad/.test(cmd)) this.tags.xshad = cmd.match(/^x*shad(.*)/)[1] * 1;
  if (/^y*shad/.test(cmd)) this.tags.yshad = cmd.match(/^y*shad(.*)/)[1] * 1;
  if (/^\d?c&?H?[0-9a-f]+/i.test(cmd)) {
    tmp = cmd.match(/^(\d?)c&?H?(\w+)/);
    if (!tmp[1]) tmp[1] = '1';
    while (tmp[2].length < 6) tmp[2] = '0' + tmp[2];
    this.tags['c' + tmp[1]] = tmp[2];
  }
  if (/^\da&?H?[0-9a-f]+/i.test(cmd)) {
    tmp = cmd.match(/^(\d)a&?H?(\w\w)/);
    this.tags['a' + tmp[1]] = tmp[2];
  }
  if (/^alpha&?H?[0-9a-f]+/i.test(cmd)) {
    for (var i = 1; i <= 4; i++) {
      this.tags['a' + i] = cmd.match(/^alpha&?H?(\w\w)/)[1];
    }
  }
  if (/^i?clip/.test(cmd)) {
    tmp = cmd.match(/^i?clip\s*\((.*)\)/)[1].split(/\s*,\s*/);
    this.tags.clip = {
      inverse: /iclip/.test(cmd),
      scale: 1,
      commands: null,
      dots: null,
    };
    if (tmp.length === 1) {
      this.tags.clip.commands = tmp[0];
    }
    if (tmp.length === 2) {
      this.tags.clip.scale = tmp[0] * 1;
      this.tags.clip.commands = tmp[1];
    }
    if (tmp.length === 4) {
      this.tags.clip.dots = [tmp[0] * 1, tmp[1] * 1, tmp[2] * 1, tmp[3] * 1];
    }
  }
};
