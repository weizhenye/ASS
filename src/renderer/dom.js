import { assign } from 'ass-compiler/src/utils.js';
import { color2rgba, transformTags } from '../utils.js';
import { createAnimation } from './animation.js';
import { createDrawing } from './drawing.js';
import { getRealFontSize } from './font-size.js';
import { createCSSStroke } from './stroke.js';
import { createTransform } from './transform.js';

function encodeText(text, q) {
  return text
    .replace(/\\h/g, ' ')
    .replace(/\\N/g, '\n')
    .replace(/\\n/g, q === 2 ? '\n' : ' ');
}

export function createDialogue(dialogue) {
  const $div = document.createElement('div');
  $div.className = 'ASS-dialogue';
  const df = document.createDocumentFragment();
  const { slices, start, end } = dialogue;
  slices.forEach((slice) => {
    const sliceTag = this.styles[slice.style].tag;
    const borderStyle = this.styles[slice.style].style.BorderStyle;
    slice.fragments.forEach((fragment) => {
      const { text, drawing, animationName } = fragment;
      const tag = assign({}, sliceTag, fragment.tag);
      let cssText = 'display:inline-block;';
      const cssVars = [];
      const vct = this.video.currentTime;
      if (!drawing) {
        cssText += `line-height:normal;font-family:"${tag.fn}",Arial;`;
        cssText += `font-size:${this.scale * getRealFontSize(tag.fn, tag.fs)}px;`;
        cssText += `color:${color2rgba(tag.a1 + tag.c1)};`;
        const scale = /Yes/i.test(this.info.ScaledBorderAndShadow) ? this.scale : 1;
        if (borderStyle === 1) {
          cssVars.push(...createCSSStroke(tag, scale));
        }
        if (borderStyle === 3) {
          // TODO: \bord0\shad16
          const bc = color2rgba(tag.a3 + tag.c3);
          const bx = tag.xbord * scale;
          const by = tag.ybord * scale;
          const sc = color2rgba(tag.a4 + tag.c4);
          const sx = tag.xshad * scale;
          const sy = tag.yshad * scale;
          cssText += (
            `${bx || by ? `background-color:${bc};` : ''}`
            + `border:0 solid ${bc};`
            + `border-width:${bx}px ${by}px;`
            + `margin:${-bx}px ${-by}px;`
            + `box-shadow:${sx}px ${sy}px ${sc};`
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
      const hasTransfrom = transformTags.some((x) => (
        /^fsc[xy]$/.test(x) ? tag[x] !== 100 : !!tag[x]
      ));
      if (hasTransfrom) {
        cssText += `transform:${createTransform(tag)};`;
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
      encodeText(text, tag.q).split('\n').forEach((content, idx) => {
        const $span = document.createElement('span');
        $span.dataset.hasRotate = hasRotate;
        if (drawing) {
          const obj = createDrawing.call(this, fragment, sliceTag);
          $span.style.cssText = obj.cssText;
          $span.appendChild(obj.$svg);
        } else {
          if (idx) {
            df.appendChild(document.createElement('br'));
          }
          if (!content) {
            return;
          }
          $span.textContent = content;
          if (tag.xbord || tag.ybord || tag.xshad || tag.yshad) {
            $span.dataset.stroke = content;
          }
        }
        // TODO: maybe it can be optimized
        $span.style.cssText += cssText;
        cssVars.forEach(({ key, value }) => {
          $span.style.setProperty(key, value);
        });
        df.appendChild($span);
      });
    });
  });
  $div.appendChild(df);
  return $div;
}
