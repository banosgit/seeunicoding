import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ClassroomPage, LessonPage } from './pages.jsx';
import './styles.css';
import './pages.css';

// GitHub Pages에서는 새로고침해도 404가 나지 않도록 # 주소 방식을 씁니다.
function useHash() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

function Root() {
  const hash = useHash();
  useEffect(() => { if (hash.startsWith('#/')) window.scrollTo(0, 0); }, [hash]);
  const m = hash.match(/^#\/lesson\/([^/?#]+)/);
  if (m) return <LessonPage id={decodeURIComponent(m[1])} />;
  const c = hash.match(/^#\/classroom(?:\/([^/?#]+))?/);
  if (c) return <ClassroomPage lang={c[1] ? decodeURIComponent(c[1]) : null} />;
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><Root /></React.StrictMode>
);
