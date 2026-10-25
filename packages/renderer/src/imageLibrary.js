// 공유 이미지 라이브러리: content/images 폴더의 파일 + images.json(ID ↔ 파일 연결, 설명, 태그, 출처)
// 사이트와 에디터가 같은 코드로 읽습니다. 강의 파일에는 파일명이 아니라 이미지 ID만 기록해요.
const DIR = '../../../content/images/';
const files = import.meta.glob('../../../content/images/**/*.{png,jpg,jpeg,gif,webp,svg,avif}', {
  eager: true, query: '?url', import: 'default',
});
const metaModules = import.meta.glob('../../../content/images/images.json', { eager: true, import: 'default' });

const urlByFile = new Map(Object.entries(files).map(([p, url]) => [p.slice(DIR.length), url]));
const meta = Object.values(metaModules)[0];
const entries = Array.isArray(meta?.images) ? meta.images : [];

export const imageList = entries
  .filter((e) => e && typeof e.id === 'string' && typeof e.file === 'string')
  .map((e) => ({
    id: e.id,
    file: e.file,
    alt: e.alt ?? '',
    tags: Array.isArray(e.tags) ? e.tags : [],
    source: e.source ?? '',
    url: urlByFile.get(e.file) ?? null,
  }));

const byId = new Map(imageList.map((e) => [e.id, e]));
export const getImage = (id) => byId.get(id) ?? null;
