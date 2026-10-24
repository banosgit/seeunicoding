import { Colored, LessonView } from '@seeuni/renderer';
import Layout from './Layout.jsx';
import { getLesson, lessonsInLang, tree } from './lessons.js';

export function ClassroomPage({ lang }) {
  // 언어 → 카테고리 → 강의 (강의 파일에서 자동으로 모읍니다. 새 언어 강의가 생기면 버튼이 자동으로 늘어나요)
  const current = lang ? tree.find((t) => t.id === lang) : null;

  return (
    <Layout>
      <h1 className="pg-title">강의실</h1>
      {tree.length === 0 ? (
        <p className="pg-empty">아직 등록된 강의가 없어요.</p>
      ) : (
        <>
          <nav className="lang-bar" aria-label="언어 선택">
            {tree.map((t) => (
              <a
                key={t.id}
                className="lang-btn"
                href={`#/classroom/${encodeURIComponent(t.id)}`}
                aria-current={t.id === lang ? 'page' : undefined}
              >{t.name}</a>
            ))}
          </nav>
          {!lang && <p className="pg-empty">유니와 같이 배워요!</p>}
          {lang && !current && <p className="pg-empty">이 언어의 강의는 아직 없어요.</p>}
          {current && current.categories.map((cat, ci) => (
            <details key={`${lang}/${cat.id}`} className="cat-block" open>
              <summary className="cat-head">
                <span className="n">{ci + 1}</span>
                <span className="t">{cat.name}</span>
              </summary>
              <ol className="cat-list">
                {cat.lessons.map((l, i) => (
                  <li key={l.id}>
                    <a href={`#/lesson/${l.id}`}>
                      <span className="n">{i + 1}</span>
                      <span className="t"><Colored text={l.title} /></span>
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </>
      )}
    </Layout>
  );
}

export function LessonPage({ id }) {
  const lesson = getLesson(id);
  if (!lesson) {
    return (
      <Layout>
        <h1 className="pg-title">강의를 찾을 수 없어요</h1>
        <p><a href="#/classroom">강의실로 돌아가기</a></p>
      </Layout>
    );
  }
  const sibs = lessonsInLang(lesson.lang);
  const i = sibs.findIndex((l) => l.id === lesson.id);
  const prev = sibs[i - 1];
  const next = sibs[i + 1];
  return (
    <Layout>
      <p className="pg-back"><a href={`#/classroom/${encodeURIComponent(lesson.lang)}`}>← 강의 목록</a></p>
      <LessonView lesson={lesson} />
      <nav className="pg-pn" aria-label="이전·다음 강의">
        {prev ? <a href={`#/lesson/${prev.id}`}>← <Colored text={prev.title} /></a> : <span />}
        {next ? <a href={`#/lesson/${next.id}`}><Colored text={next.title} /> →</a> : <span />}
      </nav>
    </Layout>
  );
}
