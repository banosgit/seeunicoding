export default function Layout({ children }) {
  return (
    <>
      <header className="top">
        <a className="brand" href="#/">SeeUNI Coding</a>
        <nav aria-label="주요 메뉴">
          <a href="#/">홈</a>
          <a href="#/classroom">강의실</a>
        </nav>
      </header>
      <main className="page">{children}</main>
      <footer className="foot">
        <span>SeeUNI Coding</span>{' '}
        <span>
          해당 사이트는 비공식 팬 사이트이며, 수익을 창출하지 않습니다.
          시유,유니 캐릭터는 SBS A&amp;T와 STmedia 소유입니다.
        </span>
      </footer>
    </>
  );
}
