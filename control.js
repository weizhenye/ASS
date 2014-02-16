function control(ass){
	var	$ = function(id){ return document.getElementById(id); }
	var	container = $('ASS-container'),
		video = ass.video,
		stage = ass.stage;

	container.position = container.style.position;
	var	control = document.createElement('div');
	control.id = 'ASS-control';
	control.innerHTML = '<div id="ASS-progress-bar"><div id="ASS-progress"></div></div><div id="ASS-plause" class="icon-play" title="Play"></div><div id="ASS-volume"><div id="ASS-volume-button" class="icon-volume-high" title="100%"></div><div id="ASS-volume-bar"><div id="ASS-volume-progress"></div></div></div><div id="ASS-fullscreen" class="icon-expand2" title="Full Screen"></div><div id="ASS-widescreen" class="icon-expand" title="Wide Screen"></div><div id="ASS-comment" class="icon-bubble" title="Subtitle: ON"></div><div id="ASS-time-display">00:00/00:00</div>'
	container.appendChild(control);

	var	demo = $('demo'),
		bar = $('ASS-progress-bar'),
		progress = $('ASS-progress'),
		timeDisplay = $('ASS-time-display'),
		plause = $('ASS-plause'),
		comment = $('ASS-comment'),
		widescreen = $('ASS-widescreen'),
		fullscreen = $('ASS-fullscreen'),
		volumeButton = $('ASS-volume-button'),
		volumeBar = $('ASS-volume-bar'),
		volumeProgress = $('ASS-volume-progress');

	var	commentON = 1,
		isWide = 0;

	document.onkeypress = function(e){
		var	keyCode = e.which ? e.which : e.keyCode;
		if(keyCode == 32){
			e.preventDefault();
			var	video = $('video');
			video.paused ? video.play() : video.pause();
		}
	}
	bar.onclick = function(e){
		progress.style.width = e.layerX + 'px';
		video.currentTime = video.duration * e.layerX / video.offsetWidth;
		ass.setCurrentTime(video.currentTime);
	}
	bar.onmousemove = function(e){
		bar.title = formatTime(video.duration * e.layerX / video.offsetWidth);
	}

	plause.onclick = function(){
		video.paused ? video.play() : video.pause();
	}
	stage.onclick = function(){
		video.paused ? video.play() : video.pause();
	}
	video.addEventListener('play', function(){
		ass.play();
		plause.setAttribute('class','icon-pause');
		plause.title = 'Pause';
	});
	video.addEventListener('pause', function(){
		ass.pause();
		plause.setAttribute('class','icon-play');
		plause.title = 'Play';
	});
	video.addEventListener('timeupdate', function(){
		progress.style.width = video.currentTime / video.duration * video.offsetWidth + 'px';
		timeDisplay.innerHTML = formatTime(video.currentTime) + '/' + formatTime(video.duration);
	}, false);

	volumeButton.onclick = function(){
		video.volume = !video.volume;
	}
	volumeBar.onclick = function(e){
		volumeProgress.style.width = (e.layerX - 67) + 'px';
		video.volume = (e.layerX - 67) / 80;
	}
	video.onvolumechange = function(){
		volumeButton.title = Math.floor(this.volume * 100) + '%';
		volumeProgress.style.width = this.volume * 80 + 'px';
		if(this.volume > 0.66)
			volumeButton.setAttribute('class','icon-volume-high');
		else if(this.volume > 0.33)
			volumeButton.setAttribute('class','icon-volume-medium');
		else volumeButton.setAttribute('class','icon-volume-low');
		if(!this.volume)
			volumeButton.setAttribute('class','icon-volume-mute');
	}

	comment.onclick = function(){
		if(commentON){
			stage.style.visibility = 'hidden';
			comment.setAttribute('class','icon-bubble2');
			comment.title = 'Subtitle: OFF';
		}else{
			stage.style.visibility = 'visible';
			comment.setAttribute('class','icon-bubble');
			comment.title = 'Subtitle: ON';
		}
		commentON ^= 1;
	}

	widescreen.onclick = function(){
		if(isFullScreen()) cancelFullScreen();
		if(isWide){
			widescreen.setAttribute('class','icon-expand');
			video.style.width = '640px';
			video.style.height = '360px';
			control.style.width = '640px';
		}else{
			widescreen.setAttribute('class','icon-contract');
			video.style.width = '960px';
			video.style.height = '540px';
			control.style.width = '960px';
		}
		ass.updateScale();
		ass.setCurrentTime(ass.video.currentTime);
		isWide ^= 1;
		progress.style.width = video.currentTime / video.duration * video.offsetWidth + 'px';
	}

	fullscreen.onclick = function(){
		isFullScreen() ? cancelFullScreen() : requestFullScreen(container);
	}
	document.addEventListener(fullscreenchange(), function(){
		if(isFullScreen()){
			fullscreen.setAttribute('class','icon-contract2');
			container.style.top = 0;
			container.style.left = 0;
			container.style.position = 'absolute';
			video.style.width = window.screen.width + 'px';
			video.style.height = window.screen.height + 'px';
			control.style.width = window.screen.width + 'px';
		}else{
			fullscreen.setAttribute('class','icon-expand2');
			container.style.top = 'auto';
			container.style.left = 'auto';
			container.style.position = container.position;
			video.style.width = '640px';
			video.style.height = '360px';
			control.style.width = '640px';
			control.style.bottom = 'auto';
			control.style.position = 'relative';
		}
		ass.updateScale();
		ass.setCurrentTime(ass.video.currentTime);
		progress.style.width = video.currentTime / video.duration * video.offsetWidth + 'px';
	});

	stage.onmousemove = function(e){
		if(isFullScreen() && (this.offsetHeight - e.layerY < 44)){
			control.style.bottom = 0;
			control.style.position = 'absolute';
		}else{
			control.style.bottom = 'auto';
			control.style.position = 'static';
		}
	}

	function formatTime(time){
		var	min = Math.floor(time / 60),
			sec = Math.floor(time) % 60;
		if(min < 10) min = '0' + min;
		if(sec < 10) sec = '0' + sec;
		return min + ':' + sec;
	}

	var	msFullscreen = 0;
	function requestFullScreen(e){
		if('webkitRequestFullScreen' in e)
			e.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
		else if('mozRequestFullScreen' in e)
			e.mozRequestFullScreen();
		else if('msRequestFullscreen' in e){
			e.msRequestFullscreen();
			msFullscreen = 1;
		}
	}
	function cancelFullScreen(){
		if('webkitCancelFullScreen' in document)
			document.webkitCancelFullScreen();
		else if('mozCancelFullScreen' in document)
			document.mozCancelFullScreen();
		else if('msExitFullscreen' in document){
			document.msExitFullscreen();
			msFullscreen = 0;
		}
	}
	function isFullScreen(){
		if('webkitIsFullScreen' in document)
			return document.webkitIsFullScreen;
		else if('mozFullScreen' in document)
			return document.mozFullScreen;
		else if('msExitFullscreen' in document)
			return msFullscreen;
	}
	function fullscreenchange(){
		if('webkitCancelFullScreen' in document)
			return 'webkitfullscreenchange';
		else if('mozCancelFullScreen' in document)
			return 'mozfullscreenchange';
		else if('msExitFullscreen' in document)
			return 'MSFullscreenChange';
	}
}
