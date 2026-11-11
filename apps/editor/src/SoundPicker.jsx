import { useEffect, useRef, useState } from 'react';
import { soundList } from '@seeuni/renderer';

export default function SoundPicker({ onPick, onClose }) {
  const [q, setQ] = useState('');
  const [playingId, setPlayingId] = useState(null);
  const inputRef = useRef(null);
  const closeRef = useRef(onClose);
  const audioRef = useRef(null);
  closeRef.current = onClose;

  useEffect(() => {
    inputRef.current?.focus();
    const on = (e) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', on);
    return () => { window.removeEventListener('keydown', on); audioRef.current?.pause(); };
  }, []);

  // 목록에서 미리 들어보기 (한 번에 하나만)
  const preview = (sn) => {
    audioRef.current?.pause();
    if (playingId === sn.id) { setPlayingId(null); return; }
    const a = new Audio(sn.url);
    a.addEventListener('ended', () => setPlayingId(null));
    audioRef.current = a;
    a.play().then(() => setPlayingId(sn.id)).catch(() => setPlayingId(null));
  };

  const needle = q.trim().toLowerCase();
  const list = soundList.filter((s) => !needle || [s.id, s.title, s.file, ...s.tags].join(' ').toLowerCase().includes(needle));

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="소리 선택" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>소리 선택</strong>
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색 (ID, 제목, 태그, 파일명)" />
          <button onClick={onClose}>닫기</button>
        </div>
        {soundList.length === 0 ? (
          <p className="modal-empty">소리 라이브러리가 비어 있어요. content/sounds 폴더에 소리 파일을 넣고 터미널에서 npm run sounds 를 실행해 주세요.</p>
        ) : list.length === 0 ? (
          <p className="modal-empty">검색 결과가 없어요.</p>
        ) : (
          <ul className="snd-list">
            {list.map((sn) => (
              <li key={sn.id}>
                <button className="pv" onClick={() => preview(sn)} disabled={!sn.url} aria-label={playingId === sn.id ? '미리듣기 정지' : '미리듣기'}>
                  {playingId === sn.id ? '■' : '▶'}
                </button>
                <span className="snd-info">
                  <strong>{sn.id}</strong>
                  <span>{sn.title || sn.file}{sn.url ? '' : ' (파일 없음)'}</span>
                </span>
                <button onClick={() => onPick(sn.id)} disabled={!sn.url}>선택</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
