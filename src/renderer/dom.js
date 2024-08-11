import { initAnimation } from '../utils.js';
import { createDrawing } from './drawing.js';
import { createAnimatableVars } from './animation.js';
import { createCSSStroke } from './stroke.js';
import { rotateTags, scaleTags, skewTags, createTransform } from './transform.js';

function encodeText(text, q) {
  return text
    .replace(/\\h/g, ' ')
    .replace(/\\N/g, '\n')
    .replace(/\\n/g, q === 2 ? '\n' : ' ');
}

export function createDialogue(dialogue, store) {
  const { video, styles } = store;
  const $div = document.createElement('div');
  $div.className = 'ASS-dialogue';
  const df = document.createDocumentFragment();
  const { align, slices, start, end } = dialogue;
  [
    ['--ass-align-h', ['0%', '50%', '100%'][align.h]],
    ['--ass-align-v', ['100%', '50%', '0%'][align.v]],
  ].forEach(([k, v]) => {
    $div.style.setProperty(k, v);
  });
  const animationOptions = {
    duration: (end - start) * 1000,
    delay: Math.min(0, start - (video.currentTime - store.delay)) * 1000,
    fill: 'forwards',
  };
  const animations = [];
  slices.forEach((slice) => {
    const sliceTag = styles[slice.style].tag;
    const borderStyle = styles[slice.style].style.BorderStyle;
    slice.fragments.forEach((fragment) => {
      const { text, drawing } = fragment;
      const tag = { ...sliceTag, ...fragment.tag };
      let cssText = '';
      const cssVars = [];
      if (!drawing) {
        cssVars.push(...createAnimatableVars(tag));
        const scale = store.sbas ? store.scale : 1;
        cssVars.push(...createCSSStroke(tag, scale));

        cssText += `font-family:"${tag.fn}";`;
        cssText += tag.b ? `font-weight:${tag.b === 1 ? 'bold' : tag.b};` : '';
        cssText += tag.i ? 'font-style:italic;' : '';
        cssText += (tag.u || tag.s) ? `text-decoration:${tag.u ? 'underline' : ''} ${tag.s ? 'line-through' : ''};` : '';
      }
      if (drawing && tag.pbo) {
        const pbo = -tag.pbo * (tag.fscy || 100) / 100;
        cssText += `vertical-align:calc(var(--ass-scale) * ${pbo}px);`;
      }

      cssVars.push(...createTransform(tag));
      const tags = [tag, ...(tag.t || []).map((t) => t.tag)];
      const hasRotate = rotateTags.some((x) => tags.some((t) => t[x]));
      const hasScale = scaleTags.some((x) => tags.some((t) => t[x] !== undefined && t[x] !== 100));
      const hasSkew = skewTags.some((x) => tags.some((t) => t[x]));

      encodeText(text, tag.q).split('\n').forEach((content, idx) => {
        const $span = document.createElement('span');
        const $ssspan = document.createElement('span');
        $span.dataset.wrapStyle = tag.q;
        if (hasScale || hasSkew) {
          if (hasScale) {
            $ssspan.dataset.scale = '';
          }
          if (hasSkew) {
            $ssspan.dataset.skew = '';
          }
          $ssspan.textContent = content;
        }
        if (hasRotate) {
          $span.dataset.rotate = '';
        }
        if (drawing) {
          $span.dataset.drawing = '';
          const obj = createDrawing(fragment, sliceTag, store);
          if (!obj) return;
          $span.style.cssText = obj.cssText;
          $span.append(obj.$svg);
        } else {
          if (idx) {
            df.append(document.createElement('br'));
          }
          if (!content) return;
          if (hasScale || hasSkew) {
            $span.append($ssspan);
          } else {
            $span.textContent = content;
          }
          const el = hasScale || hasSkew ? $ssspan : $span;
          if (tag.xbord || tag.ybord || tag.xshad || tag.yshad) {
            el.dataset.borderStyle = borderStyle;
            el.dataset.text = content;
          }
        }
        $span.style.cssText += cssText;
        cssVars.forEach(([k, v]) => {
          $span.style.setProperty(k, v);
        });
        if (fragment.keyframes) {
          const animation = initAnimation(
            $span,
            fragment.keyframes,
            { ...animationOptions, duration: fragment.duration },
          );
          animations.push(animation);
        }
        df.append($span);
      });
    });
  });
  if (dialogue.keyframes) {
    animations.push(initAnimation($div, dialogue.keyframes, animationOptions));
  }
  $div.append(df);
  return { $div, animations };
}
