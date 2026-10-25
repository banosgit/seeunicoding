import { useRef } from 'react';
import { getImage } from './imageLibrary.js';
import { keyBox, moveBox, resizeBox } from './imageGeometry.js';

const CORNERS = ['nw', 'ne', 'sw', 'se'];

// 이미지 한 장. 강의 화면(article) 전체를 기준으로 x·y·너비(%)에 놓이고, 글 뒤(맨 아래 레이어)에 깔립니다.
// edit 가 있으면(에디터 미리보기) 끌어서 이동, 모서리를 끌어서 크기 조절이 가능합니다.
export function ImageBox({ block, edit, articleRef }) {
  const boxRef = useRef(null);
  const drag = useRef(null);
  const lib = getImage(block.imageId);
  const editing = !!edit;
  const selected = editing && edit.selectedId === block.id;

  const measure = () => {
    const s = articleRef.current.getBoundingClientRect();
    const i = boxRef.current.getBoundingClientRect();
    return {
      s,
      size: { w: s.width, h: s.height },
      box: { left: i.left - s.left, top: i.top - s.top, w: i.width, h: i.height },
    };
  };

  function startMove(e) {
    if (e.button !== 0) return;
    e.stopPropagation();
    edit.onSelect(block.id);
    const m = measure();
    if (!m.box.h) return;
    drag.current = { mode: 'move', sx: e.clientX, sy: e.clientY, box: m.box };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function startResize(e, corner) {
    e.stopPropagation();
    const m = measure();
    if (!m.box.h) return;
    drag.current = { mode: 'resize', corner, box: m.box };
    boxRef.current.setPointerCapture?.(e.pointerId);
  }
  function onMove(e) {
    const d = drag.current;
    if (!d) return;
    const m = measure();
    edit.onChange(
      block.id,
      d.mode === 'move'
        ? moveBox(m.size, d.box, e.clientX - d.sx, e.clientY - d.sy)
        : resizeBox(m.size, d.box, d.corner, e.clientX - m.s.left)
    );
  }
  const end = () => { drag.current = null; };
  function onKey(e) {
    const m = measure();
    if (!m.box.h) return;
    const patch = keyBox(m.size, m.box, block, e.key, e.shiftKey ? 5 : 1);
    if (!patch) return;
    e.preventDefault();
    edit.onChange(block.id, patch);
  }

  const editProps = editing
    ? {
        tabIndex: 0,
        onPointerDown: startMove,
        onPointerMove: onMove,
        onPointerUp: end,
        onPointerCancel: end,
        onKeyDown: onKey,
        onFocus: () => edit.onSelect(block.id),
      }
    : {};

  return (
    <div
      ref={boxRef}
      className={'lv-imgbox' + (selected ? ' is-selected' : '')}
      style={{ left: `${block.x}%`, marginTop: `${block.y}%`, width: `${block.w}%` }}
      {...editProps}
    >
      {lib?.url ? (
        <img src={lib.url} alt={lib.alt} draggable={false} />
      ) : (
        <div className="lv-miss">이미지를 찾을 수 없어요 ({block.imageId})</div>
      )}
      {selected && (
        <>
          <span className="lv-selframe" />
          {CORNERS.map((c) => (
            <span key={c} className={`lv-handle lv-handle--${c}`} onPointerDown={(e) => startResize(e, c)} />
          ))}
        </>
      )}
    </div>
  );
}
