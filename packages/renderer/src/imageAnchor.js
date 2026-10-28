// 이미지를 "글 블록에 붙여서" 기억합니다.
// 화면 폭이 달라지면(휴대폰) 글이 다시 줄바꿈돼서 높이가 달라지는데, 이미지 위치를 화면 맨 위에서 잰 거리로 저장하면
// 이미지만 제자리에 남아 글과 어긋납니다. 그래서 "어느 글 블록의 몇 % 지점"으로 저장해서 글을 따라가게 해요.
const r4 = (v) => Math.round(v * 10000) / 10000;

// 강의 화면(article) 안의 글 블록(data-bid) 위치와 높이를 읽습니다. (top은 화면 맨 위 기준 px)
export function readLayout(article) {
  const a = article.getBoundingClientRect();
  const blocks = new Map();
  article.querySelectorAll('[data-bid]').forEach((el) => {
    const r = el.getBoundingClientRect();
    blocks.set(el.dataset.bid, { top: r.top - a.top, h: r.height });
  });
  return { width: a.width, blocks };
}

// 이미지 윗변의 위치(px)에서, 그 바로 위(또는 겹친) 글 블록과 그 블록 높이에 대한 비율 t 를 구합니다.
export function anchorFor(layout, topPx) {
  let best = null;
  for (const [id, b] of layout.blocks) {
    if (b.top <= topPx + 0.5 && (!best || b.top > best.b.top)) best = { id, b };
  }
  if (!best) return null;
  return { anchor: best.id, t: best.b.h > 0 ? Math.max(0, r4((topPx - best.b.top) / best.b.h)) : 0 };
}

// 이미지 윗변의 위치(px). 붙어 있는 글이 없으면(옛 데이터) 예전 방식(화면 폭 기준 y%)으로 계산합니다.
export function topFor(layout, block) {
  const a = block.anchor ? layout.blocks.get(block.anchor) : null;
  if (a) return a.top + (block.t ?? 0) * a.h;
  return ((block.y ?? 0) / 100) * layout.width;
}
