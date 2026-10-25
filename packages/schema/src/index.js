export const FORMAT_VERSION = 1;
export const BLOCK_TYPES = ['heading', 'paragraph', 'code', 'output', 'image'];
// 이미지 블록: x·y·w 는 강의 화면 가로폭에 대한 % 값 (x=왼쪽, y=위쪽, w=너비). 글 뒤(맨 아래 레이어)에 놓입니다.
const ID_RE = /^[a-z]+-\d{4}$/;

export function newBlock(type, extra = {}) {
  const id = 'b' + Math.random().toString(36).slice(2, 8);
  switch (type) {
    case 'heading': return { id, type, level: 2, text: '' };
    case 'paragraph': return { id, type, text: '', markdown: false };
    case 'code': return { id, type, language: 'python', code: '' };
    case 'output': return { id, type, text: '' };
    case 'image': return { id, type, imageId: '', x: 30, y: 12, w: 40, ...extra };
    default: throw new Error('unknown block type: ' + type);
  }
}

export function newLesson() {
  return { formatVersion: FORMAT_VERSION, id: 'py-0001', title: '', lang: 'python', category: 'basic-syntax', blocks: [] };
}

// 오류 문자열 배열을 반환합니다. 빈 배열이면 정상입니다.
export function validateLesson(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return ['강의 데이터가 객체가 아닙니다.'];
  if (data.formatVersion !== FORMAT_VERSION) errors.push(`formatVersion은 ${FORMAT_VERSION}이어야 합니다.`);
  if (!ID_RE.test(data.id ?? '')) errors.push('id 형식이 올바르지 않습니다. 예: py-0001');
  for (const k of ['title', 'lang', 'category']) {
    if (!String(data[k] ?? '').trim()) errors.push(`${k} 항목이 비어 있습니다.`);
  }
  if (!Array.isArray(data.blocks)) { errors.push('blocks가 배열이 아닙니다.'); return errors; }
  const seen = new Set();
  data.blocks.forEach((b, i) => {
    const at = `블록 ${i + 1}`;
    if (!b || !BLOCK_TYPES.includes(b.type)) { errors.push(`${at}: 지원하지 않는 블록 유형(${b?.type})`); return; }
    if (!b.id || seen.has(b.id)) errors.push(`${at}: id가 없거나 중복입니다.`);
    seen.add(b.id);
    if (b.type === 'paragraph' && b.markdown !== undefined && typeof b.markdown !== 'boolean') errors.push(`${at}: markdown 항목은 true/false여야 합니다.`);
    if (b.type === 'image') {
      if (typeof b.imageId !== 'string' || !b.imageId) errors.push(`${at}: imageId가 비어 있습니다.`);
      for (const k of ['x', 'y', 'w']) if (typeof b[k] !== 'number' || !Number.isFinite(b[k])) errors.push(`${at}: ${k}는 숫자여야 합니다.`);
      if (typeof b.w === 'number' && (b.w < 1 || b.w > 100)) errors.push(`${at}: w는 1~100 사이여야 합니다.`);
      return;
    }
    const field = b.type === 'code' ? 'code' : 'text';
    if (typeof b[field] !== 'string') errors.push(`${at}: ${field} 항목이 문자열이 아닙니다.`);
    else if ((b.type === 'heading' || b.type === 'code') && !b[field].trim()) errors.push(`${at}: ${field} 항목이 비어 있습니다.`);
  });
  return errors;
}

// 카테고리 설정 파일(content/categories.json) 검사. 오류 문자열 배열을 반환합니다.
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateCategories(cfg) {
  const errors = [];
  if (!cfg || typeof cfg !== 'object') return ['설정 파일이 객체가 아닙니다.'];
  if (!Array.isArray(cfg.languages)) errors.push('languages가 배열이 아닙니다.');
  if (!Array.isArray(cfg.categories)) errors.push('categories가 배열이 아닙니다.');
  if (errors.length) return errors;
  const checkCommon = (item, at) => {
    if (!item || typeof item !== 'object') { errors.push(`${at}: 객체가 아닙니다.`); return false; }
    if (!SLUG_RE.test(item.id ?? '')) errors.push(`${at}: id는 소문자·숫자·하이픈만 쓸 수 있어요. (예: basic-syntax)`);
    if (!String(item.name ?? '').trim()) errors.push(`${at}: name이 비어 있습니다.`);
    if (item.order !== undefined && typeof item.order !== 'number') errors.push(`${at}: order는 숫자여야 합니다.`);
    return true;
  };
  const langIds = new Set();
  cfg.languages.forEach((l, i) => {
    if (!checkCommon(l, `languages[${i + 1}]`)) return;
    if (langIds.has(l.id)) errors.push(`languages[${i + 1}]: 언어 id ${l.id}가 중복입니다.`);
    langIds.add(l.id);
  });
  const catKeys = new Set();
  cfg.categories.forEach((c, i) => {
    const at = `categories[${i + 1}]`;
    if (!checkCommon(c, at)) return;
    if (!langIds.has(c.lang)) errors.push(`${at}: lang '${c.lang}'이(가) languages에 없습니다.`);
    const key = `${c.lang}/${c.id}`;
    if (catKeys.has(key)) errors.push(`${at}: ${c.lang} 안에서 카테고리 id ${c.id}가 중복입니다.`);
    catKeys.add(key);
  });
  return errors;
}
