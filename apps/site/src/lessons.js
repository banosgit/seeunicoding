import { validateLesson } from '@seeuni/schema';

// content/lessons 폴더 안의 모든 .json 강의 파일을 빌드 때 자동으로 읽어옵니다.
const lessonModules = import.meta.glob('../../../content/lessons/**/*.json', { eager: true, import: 'default' });
// 언어·카테고리의 표시 이름과 순서 (content/categories.json, 없으면 ID 그대로)
const configModules = import.meta.glob('../../../content/categories.json', { eager: true, import: 'default' });
const raw = Object.values(configModules)[0] ?? {};
const config = {
  languages: Array.isArray(raw.languages) ? raw.languages : [],
  categories: Array.isArray(raw.categories) ? raw.categories : [],
};

export const lessons = Object.entries(lessonModules)
  .filter(([path, data]) => {
    const errs = validateLesson(data);
    if (errs.length) console.warn(`[강의 오류] ${path}`, errs);
    return errs.length === 0;
  })
  .map(([, data]) => data)
  .sort((a, b) => a.id.localeCompare(b.id));

export const getLesson = (id) => lessons.find((l) => l.id === id);

// 설정 파일의 order 순서대로, 설정에 없는 것은 뒤에 ID순으로 정렬
function ordered(ids, defs) {
  const rank = new Map(
    [...defs].sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9)).map((d, i) => [d.id, i])
  );
  return [...ids].sort((a, b) => (rank.get(a) ?? 1e9) - (rank.get(b) ?? 1e9) || a.localeCompare(b));
}

// 화면용 구조: [{ id, name, categories: [{ id, name, lessons: [...] }] }] (강의가 있는 것만)
export const tree = (() => {
  const langName = new Map(config.languages.map((l) => [l.id, l.name]));
  const catName = new Map(config.categories.map((c) => [`${c.lang}/${c.id}`, c.name]));
  const byLang = {};
  for (const l of lessons) ((byLang[l.lang] ??= {})[l.category] ??= []).push(l);
  return ordered(Object.keys(byLang), config.languages).map((lang) => ({
    id: lang,
    name: langName.get(lang) ?? lang,
    categories: ordered(
      Object.keys(byLang[lang]),
      config.categories.filter((c) => c.lang === lang)
    ).map((cat) => ({ id: cat, name: catName.get(`${lang}/${cat}`) ?? cat, lessons: byLang[lang][cat] })),
  }));
})();

// 한 언어의 강의를 화면 순서(카테고리 순서 → ID순)대로 펼친 목록 (이전/다음 강의용)
export const lessonsInLang = (lang) =>
  (tree.find((t) => t.id === lang)?.categories ?? []).flatMap((c) => c.lessons);
