import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseColor, remarkMarks, toMarkdownSource } from './colorSyntax.js';
import './renderer.css';

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

export function LessonView({ lesson }) {
  return (
    <article className="lv">
      <h1 className="lv-title">{lesson.title ? <Colored text={lesson.title} /> : '(제목 없음)'}</h1>
      {lesson.blocks.map((b) => <Block key={b.id} block={b} />)}
    </article>
  );
}
