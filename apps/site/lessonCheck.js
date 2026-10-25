// 빌드할 때 content/lessons 와 content/categories.json 을 검사합니다.
// errors = 빌드를 멈춤(배포 차단) / warnings = 경고만 표시 (설정 파일에 없는 언어·카테고리 ID는 ID 그대로 표시됨)
import fs from 'node:fs';
import path from 'node:path';
import { validateCategories, validateLesson } from '@seeuni/schema';

export function checkLessons(dir, categoriesFile, imagesFile) {
  const problems = [];
  const warnings = [];

  // 카테고리 설정 (파일이 없으면 이름·순서 없이 ID 그대로 표시하며 참조 검사는 건너뜀)
  let langIds = null;
  let catKeys = null;
  if (categoriesFile && fs.existsSync(categoriesFile)) {
    let cfg = null;
    try {
      cfg = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
    } catch (e) {
      problems.push(`categories.json: JSON 형식 오류 - ${e.message}`);
    }
    if (cfg) {
      const errs = validateCategories(cfg);
      errs.forEach((e) => problems.push(`categories.json: ${e}`));
      if (!errs.length) {
        langIds = new Set(cfg.languages.map((l) => l.id));
        catKeys = new Set(cfg.categories.map((c) => `${c.lang}/${c.id}`));
      }
    }
  }

  // 이미지 라이브러리 (content/images/images.json)
  let imageFiles = null; // id -> file
  const imagesDir = imagesFile ? path.dirname(imagesFile) : null;
  if (imagesFile && fs.existsSync(imagesFile)) {
    try {
      const lib = JSON.parse(fs.readFileSync(imagesFile, 'utf8'));
      imageFiles = new Map();
      (Array.isArray(lib.images) ? lib.images : []).forEach((im, i) => {
        if (!im?.id || !im?.file) problems.push(`images.json: images[${i + 1}]: id와 file이 필요합니다.`);
        else if (imageFiles.has(im.id)) problems.push(`images.json: 이미지 ID ${im.id}가 중복입니다.`);
        else imageFiles.set(im.id, im.file);
      });
    } catch (e) {
      problems.push(`images.json: JSON 형식 오류 - ${e.message}`);
    }
  }

  if (!fs.existsSync(dir)) return { errors: problems, warnings };
  const ids = new Map();
  const files = fs.readdirSync(dir, { recursive: true }).map(String).filter((f) => f.endsWith('.json'));
  for (const rel of files) {
    const name = rel.split(path.sep).join('/');
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8'));
    } catch (e) {
      problems.push(`${name}: JSON 형식 오류 - ${e.message}`);
      continue;
    }
    const errs = validateLesson(data);
    errs.forEach((e) => problems.push(`${name}: ${e}`));
    if (data?.id) {
      if (ids.has(data.id)) problems.push(`${name}: 강의 ID ${data.id}가 ${ids.get(data.id)}와 중복입니다.`);
      else ids.set(data.id, name);
    }
    if (!errs.length) {
      data.blocks.forEach((b, i) => {
        if (b.type !== 'image') return;
        const file = imageFiles?.get(b.imageId);
        if (!file) problems.push(`${name}: 블록 ${i + 1}: 이미지 ID '${b.imageId}'가 content/images/images.json에 없습니다.`);
        else if (!fs.existsSync(path.join(imagesDir, file))) problems.push(`${name}: 블록 ${i + 1}: 이미지 ${b.imageId}의 파일(${file})이 content/images 폴더에 없습니다.`);
      });
    }
    if (!errs.length && langIds) {
      if (!langIds.has(data.lang)) warnings.push(`${name}: 언어 '${data.lang}'이(가) content/categories.json에 없습니다.`);
      else if (!catKeys.has(`${data.lang}/${data.category}`)) warnings.push(`${name}: 카테고리 '${data.category}'(${data.lang})가 content/categories.json에 없습니다. (ID 그대로 표시됩니다)`);
    }
  }
  return { errors: problems, warnings };
}
