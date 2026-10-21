const steps = [
  ['개념 설명', '유니와 함께 개념을 배워요!'],
  ['코드 예제', '시유가 만든 코드를 읽을 것시유'],
  ['출력 확인', '선배가 잘 만들었는지 같이 볼거에요!'],
  ['연습 문제', '풀어보시유! 이해했다면 쉬울것시유~'],
  ['힌트', '는 원하시면 디코에 보내주세요.'],
  ['정답과 해설', '시유니와 최종 결과 확인!'],
];

function ClassroomButton() {
  return (
    <button className="btn" type="button" disabled aria-describedby="soon">
      강의실 입장하기
    </button>
  );
}

export default function App() {
  return (
    <>
      <header className="top">
        <a className="brand" href="#top">SeeUNI Coding</a>
        <nav aria-label="주요 메뉴">
          <a href="#top" aria-current="page">홈</a>
          <span className="off" title="준비 중">강의실 (준비 중)</span>
          <a href="#about">소개</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-text">
            <h1>코드 한 줄이<br />화면에 나타나는 순간부터</h1>
            <p>
              시유니와 함께 프로그래밍을 해봐요! 코딩이 처음이라도, 어려워도,
              헷갈려도 끝까지 배워보아요!
            </p>
            <ClassroomButton />
            <p id="soon" className="note">강의실은 지금 준비하고 있어요.</p>
          </div>

          <figure className="demo" aria-label="Python 코드와 실행 결과 예시">
            <div className="demo-code">
              <span className="demo-label">코드</span>
              <pre><code>{`name="UNI"\nprint('Hello, Space!')\nprint(f"Hello, {name}verse")`}</code></pre>
            </div>
            <div className="demo-out">
              <span className="demo-label">출력</span>
              <pre><code>{`char I[8] = "fantasy"; \nprintf("SeeU is dream.")`}<i className="caret" aria-hidden="true" /></code></pre>
            </div>
          </figure>
        </section>

        <section className="flow" aria-labelledby="flow-title">
          <h2 id="flow-title">강의는 이런 순서로 진행돼요</h2>
          <ol>
            {steps.map(([title, desc], i) => (
              <li key={title}>
                <span className="n">{i + 1}</span>
                <strong>{title}</strong>
                <span>{desc}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="about" id="about" aria-labelledby="about-title">
          <h2 id="about-title">소개</h2>
          <p>
            SeeUNI Coding은 프로그래밍을 처음 배우거나 어려운 사람들을 위한 무료
            강의 사이트예요. 먼저 Python으로 시작하고, 앞으로 다른 언어도 하나씩
            추가할 예정임다!
          </p>
        </section>
      </main>

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
