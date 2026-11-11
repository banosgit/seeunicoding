import { useRef } from 'react';
import { getImage } from './imageLibrary.js';
import { stageKey, stageMove, stageResize } from './imageGeometry.js';

const CORNERS = ['nw', 'ne', 'sw', 'se'];

// 이미지 블럭: 글 흐름 안에서 고정 비율 영역을 차지하므로 앞뒤 글이 자동으로 위아래로 비켜갑니다.
// 이미지는 이 영역 안에서 x·y·너비(%)로 놓이고, edit 가 있으면(에디터 미리보기) 끌어서 이동·크기 조절할 수 있어요.
export function ImageFrame({ block, edit }) {
  const stageRef = useRef(null);
  const boxRef = useRef(null);
  const drag = useRef(null);
  const lib = getImage(block.imageId);
  const editing = !!edit;
  const selected = editing && edit.selectedId === block.id;

  const measure = () => {
    const s = stageRef.current.getBoundingClientRect();
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
        ? stageMove(m.size, d.box, e.clientX - d.sx, e.clientY - d.sy)
        : stageResize(m.size, d.box, d.corner, e.clientX - m.s.left)
    );
  }
  const end = () => { drag.current = null; };
  function onKey(e) {
    const m = measure();
    if (!m.box.h) return;
    const cur = { x: (m.box.left / m.size.w) * 100, y: (m.box.top / m.size.h) * 100, w: block.w };
    const patch = stageKey(m.size, m.box, cur, e.key, e.shiftKey ? 5 : 1);
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
      ref={stageRef}
      className={'lv-frame' + (editing ? ' lv-frame--edit' : '')}
      data-bid={block.id}
      style={{ aspectRatio: String(block.ratio || '16:9').replace(':', ' / ') }}
    >
      <div
        ref={boxRef}
        className="lv-framebox"
        style={{ left: `${block.x}%`, top: `${block.y}%`, width: `${block.w}%` }}
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
    </div>
  );
}
