// 공유 소리 라이브러리: content/sounds 폴더의 파일 + sounds.json(ID ↔ 파일 연결, 제목, 태그, 출처)
// 이미지 라이브러리와 같은 방식이에요. 강의 파일에는 파일명이 아니라 소리 ID만 기록합니다.
const DIR = '../../../content/sounds/';
const files = import.meta.glob('../../../content/sounds/**/*.{mp3,ogg,wav,m4a,aac,flac,webm}', {
  eager: true, query: '?url', import: 'default',
});
const metaModules = import.meta.glob('../../../content/sounds/sounds.json', { eager: true, import: 'default' });

const urlByFile = new Map(Object.entries(files).map(([p, url]) => [p.slice(DIR.length), url]));
const meta = Object.values(metaModules)[0];
const entries = Array.isArray(meta?.sounds) ? meta.sounds : [];

export const soundList = entries
  .filter((e) => e && typeof e.id === 'string' && typeof e.file === 'string')
  .map((e) => ({
    id: e.id,
    file: e.file,
    title: e.title ?? '',
    tags: Array.isArray(e.tags) ? e.tags : [],
    source: e.source ?? '',
    url: urlByFile.get(e.file) ?? null,
  }));

const byId = new Map(soundList.map((e) => [e.id, e]));
export const getSound = (id) => byId.get(id) ?? null;
