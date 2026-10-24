// 색 문법: {#hex}(텍스트)  /  \{#hex}(텍스트) = 문법 그대로 출력  /  \\{#hex}(텍스트) = 역슬래시 1개 + 문법 그대로 출력
// hex는 3자리 또는 6자리. 색 안의 글에서 \( \) 는 괄호 글자 그대로 출력되고, 짝 맞추기에서도 제외됩니다.
const OPEN = /(\\*)\{#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\}\(/y;

function matchClose(src, from) {
  let depth = 0;
  for (let k = from; k < src.length; k++) {
    if (src[k] === '\\' && (src[k + 1] === '(' || src[k + 1] === ')')) { k++; continue; }
    if (src[k] === '(') depth++;
    else if (src[k] === ')') {
      if (depth === 0) return k;
      depth--;
    }
  }
  return -1;
}

// 노드: { t: 'text', v } | { t: 'lit', v } (그대로 출력할 글) | { t: 'color', hex, children }
export function parseColor(src = '', inColor = false) {
  const nodes = [];
  let buf = '';
  let i = 0;
  const flush = () => { if (buf) { nodes.push({ t: 'text', v: buf }); buf = ''; } };
  while (i < src.length) {
    const ch = src[i];
    if (inColor && ch === '\\' && (src[i + 1] === '(' || src[i + 1] === ')')) {
      buf += src[i + 1];
      i += 2;
      continue;
    }
    if (ch === '\\' || ch === '{') {
      OPEN.lastIndex = i;
      const m = OPEN.exec(src);
      if (m) {
        const bs = m[1].length;
        const afterOpen = i + m[0].length;
        const close = matchClose(src, afterOpen);
        if (close !== -1) {
          flush();
          if (bs > 0) {
            nodes.push({ t: 'lit', v: '\\'.repeat(bs - 1) + src.slice(i + bs, close + 1) });
          } else {
            nodes.push({ t: 'color', hex: '#' + m[2], children: parseColor(src.slice(afterOpen, close), true) });
          }
          i = close + 1;
          continue;
        }
      }
    }
    buf += ch;
    i++;
  }
  flush();
  return nodes;
}

// 마크다운용: 색 구간을 [글](seeuni-color:hex) 링크로 바꿉니다. (중첩 색은 안쪽 색 기준으로 펼침)
const escLit = (s) => s.replace(/[!-/:-@[-`{-~]/g, '\\$&');
const balanced = (s) => {
  let d = 0;
  for (const c of s) {
    if (c === '[') d++;
    else if (c === ']' && --d < 0) return false;
  }
  return d === 0;
};

function flatten(nodes, color, out) {
  for (const n of nodes) {
    if (n.t === 'color') flatten(n.children, n.hex, out);
    else out.push({ color, v: n.t === 'lit' ? escLit(n.v) : n.v });
  }
  return out;
}

export function toMarkdownSource(src) {
  const segs = flatten(parseColor(markPass(src)), null, []);
  let result = '';
  for (let i = 0; i < segs.length; ) {
    const { color } = segs[i];
    let inner = '';
    while (i < segs.length && segs[i].color === color) inner += segs[i++].v;
    if (!color) { result += inner; continue; }
    if (!balanced(inner)) inner = inner.replace(/[[\]]/g, '\\$&');
    result += `[${inner}](seeuni-color:${color.slice(1)})`;
  }
  return result.replace(/\uE000([mh]):([0-9a-fA-F]+)\uE001/g, (_, k, hex) => `[](seeuni-${k === 'm' ? 'mark' : 'hr'}:${hex})`);
}

// 마크다운 기호 색: 줄 맨 앞의 {#hex}(>)  {#hex}(-)  {#hex}(1.)  {#hex}(---) 를 기호 색 지정으로 해석합니다.
const HEX = '(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})';
const MARK_LINE = new RegExp(`^([ \\t]*)\\{#(${HEX})\\}\\((>|[-*+]|\\d{1,9}[.)])\\)[ \\t]?`);
const HR_LINE = new RegExp(`^[ \\t]*\\{#(${HEX})\\}\\(([-*_]{3,})\\)[ \\t]*$`);

function markPass(src) {
  return src.split('\n').map((line) => {
    let m = HR_LINE.exec(line);
    if (m) return `\n\n\uE000h:${m[1]}\uE001\n\n${m[2]}\n`;
    m = MARK_LINE.exec(line);
    if (m) return `${m[1]}${m[3]} \uE000m:${m[2]}\uE001${line.slice(m[0].length)}`;
    return line;
  }).join('\n');
}

// react-markdown용 플러그인: 표시용 빈 링크를 찾아 인용/목록/구분선에 색(--mark)을 붙이고 링크는 지웁니다.
const MARK = 'seeuni-mark:';
const HR = 'seeuni-hr:';
const paint = (node, hex) => {
  node.data = node.data || {};
  node.data.hProperties = { ...(node.data.hProperties || {}), style: `--mark:${hex}` };
};
export function remarkMarks() {
  return (tree) => {
    const walk = (node, anc) => {
      if (!node.children) return;
      for (let i = 0; i < node.children.length; i++) {
        const c = node.children[i];
        const only = c.type === 'paragraph' && c.children.length === 1 ? c.children[0] : null;
        if (only && only.type === 'link' && only.url?.startsWith(HR)) {
          const next = node.children[i + 1];
          if (next && next.type === 'thematicBreak') paint(next, '#' + only.url.slice(HR.length));
          node.children.splice(i, 1);
          i--;
        } else if (c.type === 'link' && c.url?.startsWith(MARK)) {
          const chain = anc.concat(node);
          for (let k = chain.length - 1; k >= 0; k--) {
            if (chain[k].type === 'blockquote' || chain[k].type === 'listItem') { paint(chain[k], '#' + c.url.slice(MARK.length)); break; }
          }
          node.children.splice(i, 1);
          i--;
        } else walk(c, anc.concat(node));
      }
    };
    walk(tree, []);
  };
}
