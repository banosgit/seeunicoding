import { useEffect, useRef, useState } from 'react';
import { imageList } from '@seeuni/renderer';

export default function ImagePicker({ onPick, onClose }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    inputRef.current?.focus();
    const on = (e) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  const needle = q.trim().toLowerCase();
  const list = imageList.filter((im) => !needle || [im.id, im.alt, im.file, ...im.tags].join(' ').toLowerCase().includes(needle));

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="이미지 선택" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>이미지 선택</strong>
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색 (ID, 설명, 태그, 파일명)" />
          <button onClick={onClose}>닫기</button>
        </div>
        {imageList.length === 0 ? (
          <p className="modal-empty">라이브러리가 비어 있어요. content/images 폴더에 이미지를 넣고 터미널에서 npm run images 를 실행해 주세요.</p>
        ) : list.length === 0 ? (
          <p className="modal-empty">검색 결과가 없어요.</p>
        ) : (
          <ul className="img-grid">
            {list.map((im) => (
              <li key={im.id}>
                <button onClick={() => onPick(im.id)} disabled={!im.url} title={im.file}>
                  {im.url ? <img src={im.url} alt={im.alt} /> : <span className="noimg">파일 없음</span>}
                  <span className="cap">{im.id}</span>
                  <span className="cap2">{im.alt || im.file}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
