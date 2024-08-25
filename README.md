# ASS.js

[![GitHub Action](https://img.shields.io/github/actions/workflow/status/weizhenye/ASS/ci.yml?logo=github)](https://github.com/weizhenye/ASS/actions)
[![Codecov](https://img.shields.io/codecov/c/gh/weizhenye/ASS?logo=codecov)](https://codecov.io/gh/weizhenye/ASS)
[![License](https://img.shields.io/npm/l/assjs)](https://github.com/weizhenye/assjs/blob/master/LICENSE)
[![File size](https://img.shields.io/bundlephobia/minzip/assjs)](https://bundlephobia.com/result?p=assjs)

<span>・</span>
<a href="https://ass.js.org/">Online Demo</a>
<span>・</span>
<a href="https://github.com/weizhenye/ASS/wiki/ASS-%E5%AD%97%E5%B9%95%E6%A0%BC%E5%BC%8F%E8%A7%84%E8%8C%83">ASS specs (zh-Hans)</a>
<span>・</span>
<a href="https://github.com/weizhenye/ass-compiler">ass-compiler</a>
<span>・</span>

ASS.js renders ASS subtitles on HTML5 video, with almost full ASS features.

(Karaoke tags `\k`, `\kf`, `\ko`, `\kt`, `\K` are still WIP.)

It's lightweight and suitable for web, **60x** smaller than WebAssembly solutions:
| | Solution | Size |
| - | - | - |
| ASS.js | DOM | ![](https://img.shields.io/github/size/weizhenye/ASS/dist%2Fass.min.js?label=main)
| [JavascriptSubtitlesOctopus](https://github.com/libass/JavascriptSubtitlesOctopus) | WebAssembly | ![](https://img.shields.io/github/size/libass/JavascriptSubtitlesOctopus/assets%2Fjs%2Fsubtitles-octopus.js?branch=gh-pages&label=main) ![](https://img.shields.io/github/size/libass/JavascriptSubtitlesOctopus/assets%2Fjs%2Fsubtitles-octopus-worker.js?branch=gh-pages&label=worker) ![](https://img.shields.io/github/size/libass/JavascriptSubtitlesOctopus/assets%2Fjs%2Fsubtitles-octopus-worker.wasm?branch=gh-pages&label=wasm) |
| [JASSUB](https://github.com/ThaUnknown/jassub) | WebAssembly | ![](https://img.shields.io/github/size/ThaUnknown/jassub/dist%2Fjassub.umd.js?label=main) ![](https://img.shields.io/github/size/ThaUnknown/jassub/dist%2Fjassub-worker.js?label=worker) ![](https://img.shields.io/github/size/ThaUnknown/jassub/dist%2Fjassub-worker.wasm?label=wasm) |

WebAssembly solutions also requires to set fallback font to avoid CJK characters turning into tofu, it's a huge cost for web. In ASS.js font fallback is handled by browser, it just works.

However compared to WebAssembly solutions, it's almost impossible for DOM to render exactly same result in every pixels as VSFilter or libass, ASS.js will provide best efforts to accurate rendering.

## Installation

[![NPM Version](https://img.shields.io/npm/v/assjs?logo=npm)](https://www.npmjs.com/package/assjs)
[![jsDelivr](https://img.shields.io/jsdelivr/npm/hm/assjs?logo=jsdelivr)](https://www.jsdelivr.com/package/npm/assjs)
[![](https://img.shields.io/badge/unpkg-555?logo=unpkg)](https://unpkg.com/assjs/)

```bash
npm install assjs
```

ASS.js can be used as a JavaScript module:

```html
<script type="module">
import ASS from '/path/to/assjs/dist/ass.min.js';
</script>
```

or a classic script:

```html
<script src="/path/to/assjs/dist/ass.global.min.js"></script>
<script>
console.log(window.ASS);
</script>
```

## Usage

```html
<div id="player">
  <video id="video" src="./example.mp4"></video>
  <div id="ass-container"></div>
</div>
```

```js
import ASS from 'assjs';

const content = await fetch('/path/to/example.ass').then((res) => res.text());
const ass = new ASS(content, document.querySelector('#video'), {
  container: document.querySelector('#ass-container'),
});
```

`new ASS()` will append several elements to the container, and sync the render area's size with the video element. **You should set styles yourself to make sure the container is overlap on the video and match the position.** For example:

```html
<div id="player" style="position: relative;">
  <video id="video" src="./example.mp4" style="position: absolute; top: 0; left: 0;"></video>
  <div id="ass-container" style="position: absolute; top: 0; left: 0;"></div>
</div>
```

If you click the native fullscreen button in video element, only `<video>` will be fullscreened, so ASS will not show. You should use a custom button and call `document.querySelector('#player').requestFullscreen()` to ensure ASS is contained.

## API

#### Initialization

```js
const ass = new ASS(content, video, {
  // Subtitles will display in the container.
  container: document.getElementById('my-container'),

  // see resampling API below
  resampling: 'video_width',
});
```

#### Show

```js
ass.show();
```

#### Hide

```js
ass.hide();
```

#### Destroy

```js
ass.destroy();
```

#### Delay

```js
// Subtitles will be 5s later
ass.delay = 5;
// Subtitles will be 3s earlier
ass.delay = -3;
```

#### Resampling

When script resolution(PlayResX and PlayResY) don't match the video resolution, this API defines how it behaves. However, drawings and clips will be always depending on script origin resolution.

There are four valid values, we suppose video resolution is 1280x720 and script resolution is 640x480 in following situations:
* `video_width`: Script resolution will set to video resolution based on video width. Script resolution will set to 640x360, and scale = 1280 / 640 = 2.
* `video_height`(__default__): Script resolution will set to video resolution based on video height. Script resolution will set to 853.33x480, and scale = 720 / 480 = 1.5.
* `script_width`: Script resolution will not change but scale is based on script width. So scale = 1280 / 640 = 2. This may causes top and bottom subs disappear from video area.
* `script_height`: Script resolution will not change but scale is based on script height. So scale = 720 / 480 = 1.5. Script area will be centered in video area.

```js
ass.resampling = 'video_width';
```

## Browser Compatibility

ASS.js uses many Web APIs to render subtitles, some features will be disabled if you use a old browser.

| Feature | Web API | Chrome | Firefox | Safari |
| - | - | - | - | - |
| Auto resize | [ResizeObserver](https://caniuse.com/resizeobserver) | 64 | 69 | 13.1 |
| `\[i]clip` | [clip-path](https://caniuse.com/css-clip-path) and [path()](https://caniuse.com/mdn-css_types_basic-shape_path) | 88 | 97 | 13.1 |
| Animations (`\t`) | [registerProperty()](https://caniuse.com/mdn-api_css_registerproperty_static) | 78 | 128 | 16.4 |
| `\q0` | [text-wrap: balance](https://caniuse.com/css-text-wrap-balance) | 114 | 121 | 17.5 |
| BorderStyle=3 with `\bord0` | [@container](https://caniuse.com/mdn-css_at-rules_container_style_queries_for_custom_properties) | 111 | - | 18.0 |
| `\blur` with `\bord0` | [sign()](https://caniuse.com/mdn-css_types_sign) | - | 118 | 15.4 |

## Known issues

* `\N` in Aegisub has less height than `<br>` in browsers, subbers should avoid to use multiple `\N` to position a dialogue, use `\pos` instead.
* A dialogue with multiple `\t` is not rendered correctly, for transforms in browsers are order-sensitive.
* When a dialogue has Effect (Banner, Scroll up, Scroll down) and `\move` at the same time, only `\move` works.
* `\be` is just treated as `\blur`.
* `\q3` is just treated as `\q1`.
