var fontSizeCache = {};
var $ffs = document.createElement('div');
$ffs.className = 'ASS-fix-font-size';
$ffs.textContent = 'M';
var getRealFontSize = function(fs, fn) {
  var key = fn + '-' + fs;
  if (!fontSizeCache[key]) {
    var cssText = 'font-size:' + fs + 'px;font-family:\'' + fn + '\',Arial;';
    $ffs.style.cssText = cssText;
    fontSizeCache[key] = fs * fs / $ffs.clientHeight;
  }
  return fontSizeCache[key];
};
