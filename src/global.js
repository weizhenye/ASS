var RAF = window.requestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          function(cb) {return setTimeout(cb, 50 / 3);};
var CAF = window.cancelAnimationFrame ||
          window.mozCancelAnimationFrame ||
          window.webkitCancelAnimationFrame ||
          function(id) {clearTimeout(id);};
var RAFID = 0;
var baseTags = {};
var channel = [];
var xmlns = 'http://www.w3.org/2000/svg';
var ASS_CSS = '__ASS_MIN_CSS__';
