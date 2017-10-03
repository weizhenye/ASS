import { assign } from 'ass-compiler/src/utils.js';
import { color2rgba, vendor, transformTags } from '../utils.js';
import { createAnimation } from './animation.js';
import { createDrawing } from './drawing.js';
import { getRealFontSize } from './font-size.js';
import { createCSSStroke } from './stroke.js';
import { createTransform } from './transform.js';

function encodeText(text, q) {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\s/g, '&nbsp;')
    .replace(/\\h/g, '&nbsp;')
    .replace(/\\N/g, '<br>')
    .replace(/\\n/g, q === 2 ? '<br>' : '&nbsp;');
}

export function createDialogue(dialogue) {
  const $div = document.createElement('div');
  $div.className = 'ASS-dialogue';
  const df = document.createDocumentFragment();
  const { slices, start, end } = dialogue;
  slices.forEach((slice) => {
    const { borderStyle } = slice;
    slice.fragments.forEach((fragment) => {
      const { text, drawing, animationName } = fragment;
      const tag = assign({}, slice.tag, fragment.tag);
      let cssText = 'display:inline-block;';
      const vct = this.video.currentTime;
      if (!drawing) {
        cssText += `font-family:"${tag.fn}",Arial;`;
        cssText += `font-size:${this.scale * getRealFontSize(tag.fn, tag.fs)}px;`;
        cssText += `color:${color2rgba(tag.a1 + tag.c1)};`;
        const scale = /Yes/i.test(this.info.ScaledBorderAndShadow) ? this.scale : 1;
        if (borderStyle === 1) {
          cssText += `text-shadow:${createCSSStroke(tag, scale)};`;
        }
        if (borderStyle === 3) {
          cssText += (
            `background-color:${color2rgba(tag.a3 + tag.c3)};` +
            `box-shadow:${createCSSStroke(tag, scale)};`
          );
        }
        cssText += tag.b ? `font-weight:${tag.b === 1 ? 'bold' : tag.b};` : '';
        cssText += tag.i ? 'font-style:italic;' : '';
        cssText += (tag.u || tag.s) ? `text-decoration:${tag.u ? 'underline' : ''} ${tag.s ? 'line-through' : ''};` : '';
        cssText += tag.fsp ? `letter-spacing:${tag.fsp}px;` : '';
        // TODO: (tag.q === 0) and (tag.q === 3) are not implemented yet,
        // for now just handle it as (tag.q === 1)
        if (tag.q === 1 || tag.q === 0 || tag.q === 3) {
          cssText += 'word-break:break-all;white-space:normal;';
        }
        if (tag.q === 2) {
          cssText += 'word-break:normal;white-space:nowrap;';
        }
      }
      const hasTransfrom = transformTags.some(x => (
        /^fsc[xy]$/.test(x) ? tag[x] !== 100 : !!tag[x]
      ));
      if (hasTransfrom) {
        cssText += `${vendor.transform}transform:${createTransform(tag)};`;
        if (!drawing) {
          cssText += 'transform-style:preserve-3d;word-break:normal;white-space:nowrap;';
        }
      }
      if (animationName) {
        cssText += createAnimation(animationName, end - start, Math.min(0, start - vct));
      }
      if (drawing && tag.pbo) {
        const pbo = this.scale * -tag.pbo * (tag.fscy || 100) / 100;
        cssText += `vertical-align:${pbo}px;`;
      }

      const hasRotate = /"fr[xyz]":[^0]/.test(JSON.stringify(tag));
      encodeText(text, tag.q).split('<br>').forEach((html, idx) => {
        const $span = document.createElement('span');
        $span.dataset.hasRotate = hasRotate;
        if (drawing) {
          const obj = createDrawing.call(this, fragment, slice.tag);
          $span.style.cssText = obj.cssText;
          $span.appendChild(obj.$svg);
        } else {
          if (idx) {
            df.appendChild(document.createElement('br'));
          }
          if (!html) {
            return;
          }
          $span.innerHTML = html;
        }
        // TODO: maybe it can be optimized
        $span.style.cssText += cssText;
        df.appendChild($span);
      });
    });
  });
  $div.appendChild(df);
  return $div;
}
