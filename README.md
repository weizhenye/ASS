ASS.js is a parser for ASS file and displays subtitle on HTML5 video.

[DEMO](https://weizhenye.github.com/ASS/)

[TODO list](https://github.com/weizhenye/ASS#todo)

# Usage
	<video id="video" src="example.mp4"></video>

	<script src="control.js"></script>
	<script src="ASS.js"></script>
	<script>
		var	x = new XMLHttpRequest();
		x.open('GET', 'example.ass', 1);
		x.onreadystatechange = function(){
			if(x.readyState == 4 && x.status == 200){
				var	ass = new ASS();
				ass.init(x.responseText, document.getElementById('video'));
				control(ass);
			}
		}
		x.send(null);
	</script>
You may write [control.js](https://github.com/weizhenye/ASS/blob/master/control.js) yourself.


# API

### Initialization
	ass.init(content, video);
### Play
	ass.play();
### Pause
	ass.pause();
### Set current time
	ass.setCurrentTime(video.currentTime);
### Stage
	ass.stage

	// Example
	ass.stage.style.visibility = 'hidden';
### Update Scale
	// If you change video's width or height, you should do
	ass.updateScale();


# TODO

Items with <del>strikethrough</del> means they won't be supported.

#### [Script Info]

* <del>Synch Point</del>
* __WrapStyle__


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
		- <del>Karaoke</del> as an effect type is obsolete.
		- __Scroll up__
		- __Scroll down__
		- __Banner__
	+ __Text__(Style override codes)
		- __\be__
		- __\k__ Karaoke
		- __\q__ WrapStyle
		- __\t__
		- __\fr[x/y/z]__ bad performance in browsers
		- __\org(x,y)__
		- __\move(x1,y1,x2,y2[,time1,time2])__
		- __\fad(inTime,outTime)__
		- __\fade(a1,a2,a3,time1,time2,time3,time4)__
		- __\clip(x1,y1,x2,y2)__
		- __\p__

#### <del>[Fonts]</del>
#### <del>[Graphics]</del>
