ASS.js is a parser for ASS file and renders subtitle on HTML5 video.

[DEMO](http://ass.woozy.im/)

[TODO list](https://github.com/weizhenye/ASS#todo)

# Usage
	<video id="video" src="example.mp4"></video>

	<script src="ASS.js"></script>
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
* __WrapStyle: 0, 3__
* __Collisions: Reverse__


#### [V4+ Styles]

There is no outline for text in CSS, text-stroke is webkit only and has poor performance, so I use text-shadow to replace outline.

* __SecondaryColour__ for karaoke

#### [Events]

* <del>Picture</del>
* <del>Sound</del>
* <del>Movie</del>
* <del>Command</del>
* __Dialogue__
  + __Effect__
    - <del>__Karaoke__</del> as an effect type is obsolete.
    - __Scroll up__
    - __Scroll down__
    - __Banner__
  + __Text__(Style override codes)
		- __\be__
		- __\k__ Karaoke
		- __\q__ WrapStyle
		- __\t__
		- __\fr[x/y/z]__ bad performance in browsers
		- __\org(x, y)__
		- __\move(x1, y1, x2, y2[, time1, time2])__
		- __\fad(inTime,outTime)__
		- __\fade(a1, a2, a3, time1, time2, time3, time4)__
		- __\clip(x1, y1, x2, y2)__
		- __\p__

#### <del>[Fonts]</del>
#### <del>[Graphics]</del>
