function allocate(dialogue, store) {
  const { video, space, scale } = store;
  const { layer, margin, width, height, alignment, end } = dialogue;
  const stageWidth = store.width - Math.trunc(scale * (margin.left + margin.right));
  const stageHeight = store.height;
  const vertical = Math.trunc(scale * margin.vertical);
  const vct = video.currentTime * 100;
  space[layer] = space[layer] || {
    left: { width: new Uint16Array(stageHeight + 1), end: new Uint32Array(stageHeight + 1) },
    center: { width: new Uint16Array(stageHeight + 1), end: new Uint32Array(stageHeight + 1) },
    right: { width: new Uint16Array(stageHeight + 1), end: new Uint32Array(stageHeight + 1) },
  };
  const channel = space[layer];
  const alignH = ['right', 'left', 'center'][alignment % 3];
  const willCollide = (y) => {
    const lw = channel.left.width[y];
    const cw = channel.center.width[y];
    const rw = channel.right.width[y];
    const le = channel.left.end[y];
    const ce = channel.center.end[y];
    const re = channel.right.end[y];
    return (
      (alignH === 'left' && (
        (le > vct && lw)
        || (ce > vct && cw && 2 * width + cw > stageWidth)
        || (re > vct && rw && width + rw > stageWidth)
      ))
      || (alignH === 'center' && (
        (le > vct && lw && 2 * lw + width > stageWidth)
        || (ce > vct && cw)
        || (re > vct && rw && 2 * rw + width > stageWidth)
      ))
      || (alignH === 'right' && (
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
    result = stageHeight - vertical - 1;
    for (let i = result; i > vertical; i -= 1) {
      if (find(i)) break;
    }
  } else if (alignment >= 7) {
    result = vertical + 1;
    for (let i = result; i < stageHeight - vertical; i += 1) {
      if (find(i)) break;
    }
  } else {
    result = (stageHeight - height) >> 1;
    for (let i = result; i < stageHeight - vertical; i += 1) {
      if (find(i)) break;
    }
  }
  if (alignment > 3) {
    result -= height - 1;
  }
  for (let i = result; i < result + height; i += 1) {
    channel[alignH].width[i] = width;
    channel[alignH].end[i] = end * 100;
  }
  return result;
}

export function getPosition(dialogue, store) {
  const { scale } = store;
  const { effect, move, align, width, height, margin, slices } = dialogue;
  let x = 0;
  let y = 0;
  if (effect && effect.name === 'banner') {
    x = effect.lefttoright ? -width : store.width;
    y = [
      store.height - height - margin.vertical,
      (store.height - height) / 2,
      margin.vertical,
    ][align.v];
  } else if (dialogue.pos || move) {
    const pos = dialogue.pos || { x: 0, y: 0 };
    const sx = scale * pos.x;
    const sy = scale * pos.y;
    x = [sx, sx - width / 2, sx - width][align.h];
    y = [sy - height, sy - height / 2, sy][align.v];
  } else {
    x = [
      0,
      (store.width - width) / 2,
      store.width - width - scale * margin.right,
    ][align.h];
    const hasT = slices.some((slice) => (
      slice.fragments.some(({ keyframes }) => keyframes?.length)
    ));
    y = hasT
      ? [
        store.height - height - margin.vertical,
        (store.height - height) / 2,
        margin.vertical,
      ][align.v]
      : allocate(dialogue, store);
  }
  return {
    x: x + [0, width / 2, width][align.h],
    y: y + [height, height / 2, 0][align.v],
  };
}
