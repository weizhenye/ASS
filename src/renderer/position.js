function allocate(dialogue) {
  const { layer, margin, width, height, alignment, end } = dialogue;
  const stageWidth = this.width - (this.scale * (margin.left + margin.right) | 0);
  const stageHeight = this.height;
  const vertical = this.scale * margin.vertical | 0;
  const vct = this.video.currentTime * 100;
  this._.space[layer] = this._.space[layer] || {
    left: { width: new Uint16Array(stageHeight + 1), end: new Uint16Array(stageHeight + 1) },
    center: { width: new Uint16Array(stageHeight + 1), end: new Uint16Array(stageHeight + 1) },
    right: { width: new Uint16Array(stageHeight + 1), end: new Uint16Array(stageHeight + 1) },
  };
  const channel = this._.space[layer];
  const align = ['right', 'left', 'center'][alignment % 3];
  const willCollide = (y) => {
    const lw = channel.left.width[y];
    const cw = channel.center.width[y];
    const rw = channel.right.width[y];
    const le = channel.left.end[y];
    const ce = channel.center.end[y];
    const re = channel.right.end[y];
    return (
      (align === 'left' && (
        (le > vct && lw)
        || (ce > vct && cw && 2 * width + cw > stageWidth)
        || (re > vct && rw && width + rw > stageWidth)
      ))
      || (align === 'center' && (
        (le > vct && lw && 2 * lw + width > stageWidth)
        || (ce > vct && cw)
        || (re > vct && rw && 2 * rw + width > stageWidth)
      ))
      || (align === 'right' && (
        (le > vct && lw && lw + width > stageWidth)
        || (ce > vct && cw && 2 * width + cw > stageWidth)
        || (re > vct && rw)
      ))
    );
  };
  let count = 0;
  let result = 0;
  const find = (y) => {
    count = willCollide(y) ? 0 : count + 1;
    if (count >= height) {
      result = y;
      return true;
    }
    return false;
  };
  if (alignment <= 3) {
    for (let i = stageHeight - vertical - 1; i > vertical; i--) {
      if (find(i)) break;
    }
  } else if (alignment >= 7) {
    for (let i = vertical + 1; i < stageHeight - vertical; i++) {
      if (find(i)) break;
    }
  } else {
    for (let i = (stageHeight - height) >> 1; i < stageHeight - vertical; i++) {
      if (find(i)) break;
    }
  }
  if (alignment > 3) {
    result -= height - 1;
  }
  for (let i = result; i < result + height; i++) {
    channel[align].width[i] = width;
    channel[align].end[i] = end * 100;
  }
  return result;
}

export function getPosition(dialogue) {
  const { effect, move, alignment, width, height, margin, slices } = dialogue;
  let x = 0;
  let y = 0;
  if (effect) {
    if (effect.name === 'banner') {
      if (alignment <= 3) y = this.height - height - margin.vertical;
      if (alignment >= 4 && alignment <= 6) y = (this.height - height) / 2;
      if (alignment >= 7) y = margin.vertical;
      x = effect.lefttoright ? -width : this.width;
    }
  } else if (dialogue.pos || move) {
    const pos = dialogue.pos || { x: 0, y: 0 };
    if (alignment % 3 === 1) x = this.scale * pos.x;
    if (alignment % 3 === 2) x = this.scale * pos.x - width / 2;
    if (alignment % 3 === 0) x = this.scale * pos.x - width;
    if (alignment <= 3) y = this.scale * pos.y - height;
    if (alignment >= 4 && alignment <= 6) y = this.scale * pos.y - height / 2;
    if (alignment >= 7) y = this.scale * pos.y;
  } else {
    if (alignment % 3 === 1) x = 0;
    if (alignment % 3 === 2) x = (this.width - width) / 2;
    if (alignment % 3 === 0) x = this.width - width - this.scale * margin.right;
    const hasT = slices.some((slice) => (
      slice.fragments.some(({ animationName }) => animationName)
    ));
    if (hasT) {
      if (alignment <= 3) y = this.height - height - margin.vertical;
      if (alignment >= 4 && alignment <= 6) y = (this.height - height) / 2;
      if (alignment >= 7) y = margin.vertical;
    } else {
      y = allocate.call(this, dialogue);
    }
  }
  return { x, y };
}
