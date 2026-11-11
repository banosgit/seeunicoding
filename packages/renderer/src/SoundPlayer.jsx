import { useEffect, useRef, useState } from 'react';
import { getSound } from './soundLibrary.js';

let current = null; // 지금 재생 중인 플레이어 { owner, stop } — 한 번에 하나만 재생해요

// 재생 버튼을 누르면 소리가 나고, 다시 누르면 멈춥니다. (브라우저 규칙상 소리는 버튼을 눌러야만 재생돼요)
export function SoundPlayer({ block, bid, children }) {
  const snd = getSound(block.soundId);
  const url = snd?.url ?? null;
  const owner = useRef({});
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const halt = () => {
    const a = audioRef.current;
    if (a) { a.pause(); a.currentTime = 0; }
    setPlaying(false);
  };
  const release = () => { if (current?.owner === owner.current) current = null; };

  // 소리를 다른 것으로 바꾸거나 화면에서 사라지면 정리
  useEffect(() => {
    audioRef.current = null;
    setPlaying(false);
    return () => { audioRef.current?.pause(); release(); };
  }, [url]);

  const toggle = () => {
    if (!url) return;
    if (playing) { halt(); release(); return; }
    if (current && current.owner !== owner.current) current.stop();
    if (!audioRef.current) {
      const a = new Audio(url);
      a.addEventListener('ended', () => { setPlaying(false); release(); });
      a.addEventListener('error', () => { setPlaying(false); release(); });
      audioRef.current = a;
    }
    current = { owner: owner.current, stop: halt };
    audioRef.current.play().then(() => setPlaying(true)).catch(() => { setPlaying(false); release(); });
  };

  return (
    <div className="lv-sound" data-bid={bid}>
      <button type="button" className="lv-play" onClick={toggle} disabled={!url} aria-pressed={playing} aria-label={playing ? '정지' : '재생'}>
        {playing ? '■' : '▶'}
      </button>
      <span className="lv-sound-label">
        {url ? children : <span className="lv-err">소리를 찾을 수 없어요 ({block.soundId})</span>}
      </span>
    </div>
  );
}
