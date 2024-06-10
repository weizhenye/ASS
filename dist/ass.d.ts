/**
 * @typedef {Object} ASSOption@typedef {Object} ASSOption
 * @property {HTMLElement} [container] The container to display subtitles.
 * Its style should be set with `position: relative` for subtitles will absolute to it.
 * Defaults to `video.parentNode`
 * @property {`${"video" | "script"}_${"width" | "height"}`} [resampling="video_height"]
 * When script resolution(PlayResX and PlayResY) don't match the video resolution, this API defines how it behaves.
 * However, drawings and clips will be always depending on script origin resolution.
 * There are four valid values, we suppose video resolution is 1280x720 and script resolution is 640x480 in following situations:
 * + `video_width`: Script resolution will set to video resolution based on video width. Script resolution will set to 640x360, and scale = 1280 / 640 = 2.
 * + `video_height`(__default__): Script resolution will set to video resolution based on video height. Script resolution will set to 853.33x480, and scale = 720 / 480 = 1.5.
 * + `script_width`: Script resolution will not change but scale is based on script width. So scale = 1280 / 640 = 2. This may causes top and bottom subs disappear from video area.
 * + `script_height`: Script resolution will not change but scale is based on script height. So scale = 720 / 480 = 1.5. Script area will be centered in video area.
 */
declare class ASS {
    /**
     * Initialize an ASS instance
     * @param {string} content ASS content
     * @param {HTMLVideoElement} video The video element to be associated with
     * @param {ASSOption} [option]
     * @returns {ASS}
     * @example
     *
     * HTML:
     * ```html
     * <div id="container" style="position: relative;">
     *   <video
     *     id="video"
     *     src="./example.mp4"
     *     style="position: absolute; width: 100%; height: 100%;"
     *   ></video>
     *   <!-- ASS will be added here -->
     * </div>
     * ```
     *
     * JavaScript:
     * ```js
     * import ASS from 'assjs';
     *
     * const content = await fetch('/path/to/example.ass').then((res) => res.text());
     * const ass = new ASS(content, document.querySelector('#video'), {
     *   container: document.querySelector('#container'),
     * });
     * ```
     */
    constructor(content: string, video: HTMLVideoElement, { container, resampling }?: ASSOption);
    set resampling(r: "video_width" | "video_height" | "script_width" | "script_height");
    /** @type {ASSOption['resampling']} */
    get resampling(): "video_width" | "video_height" | "script_width" | "script_height";
    /**
     * Desctroy the ASS instance
     * @returns {ASS}
     */
    destroy(): ASS;
    /**
     * Show subtitles in the container
     * @returns {ASS}
     */
    show(): ASS;
    /**
     * Hide subtitles in the container
     * @returns {ASS}
     */
    hide(): ASS;
    set delay(d: number);
    /** @type {number} Subtitle delay in seconds. */
    get delay(): number;
    #private;
}
export default ASS;

export declare type ASSOption = {
    /**
     * The container to display subtitles.
     * Its style should be set with `position: relative` for subtitles will absolute to it.
     * Defaults to `video.parentNode`
     */
    container?: HTMLElement;
    /**
     * When script resolution(PlayResX and PlayResY) don't match the video resolution, this API defines how it behaves.
     * However, drawings and clips will be always depending on script origin resolution.
     * There are four valid values, we suppose video resolution is 1280x720 and script resolution is 640x480 in following situations:
     * + `video_width`: Script resolution will set to video resolution based on video width. Script resolution will set to 640x360, and scale = 1280 / 640 = 2.
     * + `video_height`(__default__): Script resolution will set to video resolution based on video height. Script resolution will set to 853.33x480, and scale = 720 / 480 = 1.5.
     * + `script_width`: Script resolution will not change but scale is based on script width. So scale = 1280 / 640 = 2. This may causes top and bottom subs disappear from video area.
     * + `script_height`: Script resolution will not change but scale is based on script height. So scale = 720 / 480 = 1.5. Script area will be centered in video area.
     */
    resampling?: `${"video" | "script"}_${"width" | "height"}`;
};

export { }
