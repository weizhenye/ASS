ASS.js is a parser for ASS file and renders subtitle on HTML5 video.

[DEMO](http://ass.woozy.im/)

[TODO list](https://github.com/weizhenye/ASS#todo)

# Usage
	<video id="video" src="example.mp4"></video>

	<script src="ass.js"></script>
	<script>
	  var x = new XMLHttpRequest();
	  x.open('GET', 'example.ass', 1);
	  x.onreadystatechange = function() {
	    if (x.readyState == 4 && x.status == 200) {
	      var ass = new ASS();
	      ass.init(x.responseText, document.getElementById('video'));
	    }
	  }
	  x.send(null);
	</script>


# API

### Initialization
	ass.init(content, video);
### Resize
	// If you change video's width or height, you should do
	ass.resize();
### Show
	ass.show();
### Hide
	ass.hide();


# TODO

Items with <del>strikethrough</del> means they won't be supported.

#### [Script Info]

* <del>Synch Point</del>
* <del>PlayDepth</del>
* __WrapStyle__: 0, 3
* __Collisions__: Reverse


#### [V4+ Styles]

There is no outline for text in CSS, text-stroke is webkit only and has poor performance, so I use text-shadow to replace outline.

#### [Events]

* <del>Picture</del>
* <del>Sound</del>
* <del>Movie</del>
* <del>Command</del>
* __Dialogue__
	+ __Effect__
		- <del>Karaoke</del> as an effect type is obsolete.
		- __Scroll up__
		- __Scroll down__
		- __Banner__
	+ __Text__ (override codes)
		- __\p__ use SVG
		- __\t__
		- __\move(x1, y1, x2, y2[, t1, t2])__
		- __\fad(t1, t2)__
		- __\fade(a1, a2, a3, t1, t2, t3, t4)__
		- __\fsc[x/y], \fa[x/y], \fr[x/y/z]__ use matrix3d() in CSS
		- __\org(x, y)__
		- __\k, \kf, \ko, \kt, \K__ Karaoke
		- __\q__ WrapStyle: 0, 3
		- __\clip(x1, y1, x2, y2)__
		- __\iclip(x1, y1, x2, y2)__

#### <del>[Fonts]</del>
#### <del>[Graphics]</del>
