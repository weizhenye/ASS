var assert = require('assert');
var SE = assert.strictEqual;
var rewire = require('rewire');

describe('parser', function() {
  var parser = {
    ass: rewire('../src/parser/ass.js'),
    dialogue: rewire('../src/parser/dialogue.js'),
    drawing: rewire('../src/parser/drawing.js'),
    effect: rewire('../src/parser/effect.js'),
    format: rewire('../src/parser/format.js'),
    style: rewire('../src/parser/style.js'),
    tags: rewire('../src/parser/tags.js'),
    time: rewire('../src/parser/time.js'),
  };
  var parseASS = parser.ass.__get__('parseASS');
  var parseDialogue = parser.dialogue.__get__('parseDialogue');
  var parseDrawing = parser.drawing.__get__('parseDrawing');
  var parseEffect = parser.effect.__get__('parseEffect');
  var parseFormat = parser.format.__get__('parseFormat');
  var parseStyle = parser.style.__get__('parseStyle');
  var parseTags = parser.tags.__get__('parseTags');
  var parseTime = parser.time.__get__('parseTime');
  parser.tags.__set__({
    parseDrawing: parseDrawing,
  });
  parser.dialogue.__set__({
    parseEffect: parseEffect,
    parseTags: parseTags,
    parseTime: parseTime,
  });
  parser.ass.__set__({
    parseDialogue: parseDialogue,
    parseFormat: parseFormat,
    parseStyle: parseStyle,
  });

  describe('time', function() {
    it('should return time specified in seconds', function() {
      SE(parseTime('0:00:00.00'), 0);
      SE(parseTime('1:23:45.67'), 5025.67);
    });
  });
});
