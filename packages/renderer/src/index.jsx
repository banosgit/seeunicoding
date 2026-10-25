import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseColor, remarkMarks, toMarkdownSource } from './colorSyntax.js';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ImageBox } from './ImageStage.jsx';
import './renderer.css';

export { getImage, imageList } from './imageLibrary.js';

function renderNodes(nodes) {
  return nodes.map((n, i) =>
    n.t === 'color'
      ? <span key={i} style={{ color: n.hex }}>{renderNodes(n.children)}</span>
      : n.v
  );
}

// 일반 텍스트에 색 문법 적용 (제목, 문단, 코드, 출력 등 모든 텍스트에 사용)
export function Colored({ text }) {
  return <>{renderNodes(parseColor(text ?? ''))}</>;
}

const COLOR_PREFIX = 'seeuni-color:';
const mdComponents = {
  a: ({ href, children }) =>
    href?.startsWith(COLOR_PREFIX)
      ? <span style={{ color: '#' + href.slice(COLOR_PREFIX.length) }}>{children}</span>
      : <a href={href}>{children}</a>,
};
const mdUrl = (url) => (/^seeuni-(color|mark|hr):/.test(url) ? url : defaultUrlTransform(url));

function Markdown({ text }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMarks]} components={mdComponents} urlTransform={mdUrl}>
      {toMarkdownSource(text ?? '')}
    </ReactMarkdown>
  );
}

function Block({ block }) {
  switch (block.type) {
    case 'heading': {
      const Tag = block.level === 3 ? 'h3' : 'h2';
      return <Tag className="lv-h"><Colored text={block.text} /></Tag>;
    }
    case 'paragraph':
      return block.markdown ? (
        <div className="lv-md"><Markdown text={block.text} /></div>
      ) : (
        <p className="lv-p"><Colored text={block.text} /></p>
      );
    case 'code':
      return (
        <figure className="lv-code">
          <figcaption>{block.language || 'code'}</figcaption>
          <pre><code><Colored text={block.code} /></code></pre>
        </figure>
      );
    case 'output':
      return (
        <div className="lv-out">
          <span>출력</span>
          <pre><code><Colored text={block.text} /></code></pre>
        </div>
      );
    default:
      return <p className="lv-err">지원하지 않는 블록: {String(block.type)}</p>;
  }
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// 이미지가 글보다 아래로 내려가도 화면이 이미지 끝까지 늘어나도록, 이미지의 맨 아래 위치를 재서 최소 높이로 씁니다.
function useImageExtent(ref, blocks) {
  const [minH, setMinH] = useState(0);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => {
      const top = el.getBoundingClientRect().top;
      let bottom = 0;
      el.querySelectorAll('.lv-imgbox').forEach((n) => {
        bottom = Math.max(bottom, n.getBoundingClientRect().bottom - top);
      });
      setMinH(Math.ceil(bottom));
    };
    measure();
    let raf = 0;
    const later = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(later) : null;
    ro?.observe(el);
    const imgs = [...el.querySelectorAll('.lv-imgbox img')];
    imgs.forEach((i) => i.addEventListener('load', later));
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      imgs.forEach((i) => i.removeEventListener('load', later));
    };
  }, [ref, blocks]);
  return minH;
}

// edit(선택사항): 에디터 미리보기에서 이미지를 직접 조작할 때 { selectedId, onSelect(id|null), onChange(id, patch) }
export function LessonView({ lesson, edit }) {
  const articleRef = useRef(null);
  const minH = useImageExtent(articleRef, lesson.blocks);
  const images = lesson.blocks.filter((b) => b.type === 'image');
  const rest = lesson.blocks.filter((b) => b.type !== 'image');
  return (
    <article
      ref={articleRef}
      className={'lv' + (edit ? ' lv--edit' : '')}
      style={minH ? { minHeight: minH } : undefined}
      onPointerDown={edit ? () => edit.onSelect(null) : undefined}
    >
      <div className="lv-imglayer">
        {images.map((b) => <ImageBox key={b.id} block={b} edit={edit} articleRef={articleRef} />)}
      </div>
      <h1 className="lv-title">{lesson.title ? <Colored text={lesson.title} /> : '(제목 없음)'}</h1>
      {rest.map((b) => <Block key={b.id} block={b} />)}
    </article>
  );
}
