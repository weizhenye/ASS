ASS.js
======

ASS.js parses ASS subtitle file format, and then renders subtitles on HTML5 video.

[Demo](https://ass.js.org/)

[ASS specs](https://github.com/weizhenye/ASS/blob/master/ass-specs.md)(zh-Hans)

[TODO list](https://github.com/weizhenye/ASS#todo)

## Usage
	<video id="video" src="example.mp4"></video>

	<script src="ass.js"></script>
	<script>
	  var x = new XMLHttpRequest();
	  x.open('GET', 'example.ass', 1);
	  x.onreadystatechange = function() {
	    if (x.readyState === 4 && x.status === 200) {
	      var ass = new ASS();
	      ass.init(x.responseText, document.getElementById('video'));
	    }
	  }
	  x.send(null);
	</script>


## API

#### Initialization
	var ass = new ASS();
	ass.init(content, video);
#### Resize
	// If you change video's width or height, you should do
	ass.resize();
#### Show
	ass.show();
#### Hide
	ass.hide();


## TODO

Items with <del>strikethrough</del> means they won't be supported.

#### [Script Info]

* ~~Synch Point~~
* ~~PlayDepth~~
* __WrapStyle__: 0, 3
* __Collisions__: Reverse


#### [V4+ Styles]

There is no outline for text in CSS, `text-stroke` is webkit only and has poor performance, so I use `text-shadow` to replace outline.

#### [Events]

* ~~Picture~~
* ~~Sound~~
* ~~Movie~~
* ~~Command~~
* __Dialogue__
	+ __Effect__
		- ~~Karaoke~~: as an effect type is obsolete
		- __Scroll up__: fadeawayheight
		- __Scroll down__: fadeawayheight
		- __Banner__: fadeawaywidth
	+ __Text__ (override codes)
		- __\k, \kf, \ko, \kt, \K__: Karaoke
		- __\q__ WrapStyle: 0, 3
		- __\t([&lt;t1&gt;, &lt;t2&gt;, ][&lt;accel&gt;, ]&lt;style modifiers&gt;)__: &lt;accel&gt;, \2c, \2a, \\[i]clip

#### ~~[Fonts]~~
#### ~~[Graphics]~~

## Known issues

* `\N` in Aegisub has less height than `<br>` in browsers, subbers should avoid to use multiple `\N` to position a dialogue, use `\pos` instead.
* A dialogue with multiple `\t` is not rendered correctly, for transforms in browsers are order-sensitive.
* When a dialogue has Effect (Banner, Scroll up, Scroll down) and `\move` at the same time, only `\move` works.
* For I'm using the `clip-path` CSS property to implement `\clip`, [IE and Edge are not supported yet](http://caniuse.com/#feat=css-clip-path).
* For I'm using the `filter` CSS property to create border and shadow for shapes, [IE and Edge are not supported yet](http://caniuse.com/#feat=css-filters).

## License

[MIT](https://github.com/weizhenye/ASS/blob/master/LICENSE)
