// 이미지 이동·크기 조절 계산 (순수 함수).
// s = 강의 화면(기준 영역) 크기(px), box = 그 안에서 이미지의 위치·크기(px)
// 저장 값: x·y·w 모두 "화면 가로폭에 대한 %" (y도 가로폭 기준이라 화면 크기가 바뀌어도 비율이 유지돼요)
// 이미지는 화면 안 어디든 둘 수 있고, 아래쪽으로 내려가면 화면이 이미지 끝까지 늘어납니다.
export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const r1 = (v) => Math.round(v * 10) / 10;
const MIN_VISIBLE = 24; // 이미지 윗부분이 화면 아래 끝에서 최소 이만큼은 안에 있어야 함

export function moveBox(s, box, dx, dy) {
  const left = clamp(box.left + dx, 0, Math.max(0, s.w - box.w));
  const top = clamp(box.top + dy, 0, Math.max(0, s.h - Math.min(box.h, MIN_VISIBLE)));
  return { x: r1((left / s.w) * 100), y: r1((top / s.w) * 100) };
}

// 모서리를 끌 때 반대쪽 모서리(anchor)는 고정하고, 가로세로 비율은 유지합니다.
export function anchorOf(box, corner) {
  const { left: l, top: t, w, h } = box;
  return { se: [l, t], nw: [l + w, t + h], ne: [l, t + h], sw: [l + w, t] }[corner];
}

export function resizeBox(s, box, corner, px) {
  const [ax, ay] = anchorOf(box, corner);
  const A = box.w / box.h;
  const east = corner.endsWith('e');
  const south = corner.startsWith('s');
  const availW = east ? s.w - ax : ax;
  const maxW = south ? availW : Math.min(availW, ay * A); // 위쪽으로 늘릴 땐 화면 위 끝까지만
  const w = clamp(Math.abs(px - ax), Math.min(s.w * 0.05, maxW), maxW);
  const h = w / A;
  return {
    x: r1(((east ? ax : ax - w) / s.w) * 100),
    y: r1(((south ? ay : ay - h) / s.w) * 100),
    w: r1((w / s.w) * 100),
  };
}

// 키보드: 방향키 이동, +/- 크기 (cur = 현재 x,y,w %)
export function keyBox(s, box, cur, key, step) {
  let { x, y, w } = cur;
  if (key === 'ArrowLeft') x -= step;
  else if (key === 'ArrowRight') x += step;
  else if (key === 'ArrowUp') y -= step;
  else if (key === 'ArrowDown') y += step;
  else if (key === '+' || key === '=') w += step;
  else if (key === '-') w -= step;
  else return null;
  w = clamp(w, 5, 100);
  const hPx = (w / 100) * s.w * (box.h / box.w);
  const yMax = Math.max(0, ((s.h - Math.min(hPx, MIN_VISIBLE)) / s.w) * 100);
  return { x: r1(clamp(x, 0, 100 - w)), y: r1(clamp(y, 0, yMax)), w: r1(w) };
}
