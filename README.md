ASS.js
======
[![Build Status](https://travis-ci.org/weizhenye/ASS.svg?branch=master)](https://travis-ci.org/weizhenye/ASS)

ASS.js parses ASS subtitle file format, and then renders subtitles on HTML5 video.

[Demo](https://ass.js.org/)

[ASS specs](https://github.com/weizhenye/ASS/blob/master/ass-specs.md)(zh-Hans)

[TODO list](https://github.com/weizhenye/ASS#todo)

## Usage

```
<video id="video" src="example.mp4"></video>

<script src="dist/ass.min.js"></script>
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
```

## API

#### Initialization

```
var ass = new ASS();
ass.init(content, video, {/* options */});
```

#### Resize
If you change video's width or height, you should do

```
ass.resize();
```

#### Show

```
ass.show();
```

#### Hide

```
ass.hide();
```

#### Resample

When script resolution(PlayResX and PlayResY) don't match the video resolution, this API defines how it behaves. However, drawings and clips will be always depending on script origin resolution.

There are four valid values, we suppose video resolution is 1280x720 and script resolution is 640x480 in following situations:
* `video_width`: Script resolution will set to video resolution based on video width. Script resolution will set to 640x360, and scale = 1280 / 640 = 2.
* `video_height`(__default__): Script resolution will set to video resolution based on video height. Script resolution will set to 853.33x480, and scale = 720 / 480 = 1.5.
* `script_width`: Script resolution will not change but scale is based on script width. So scale = 1280 / 640 = 2. This may causes top and bottom subs disappear from video area.
* `script_height`: Script resolution will not change but scale is based on script height. So scale = 720 / 480 = 1.5. Script area will be centered in video area.

```
ass.resample = 'video_width';

// You can also set it when initializing.
ass.init(content, video, {
  resample: 'video_width'
});
```

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
* `\be` is just treated as `\blur`.

## License

[MIT](https://github.com/weizhenye/ASS/blob/master/LICENSE)
