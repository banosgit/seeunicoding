// content/images 폴더의 새 이미지 파일을 images.json 에 등록합니다. (기존 항목은 지우거나 바꾸지 않아요)
// 사용: npm run images
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../content/images');
const jsonPath = path.join(dir, 'images.json');
const EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

fs.mkdirSync(dir, { recursive: true });
let data = { formatVersion: 1, images: [] };
if (fs.existsSync(jsonPath)) {
  try { data = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); }
  catch (e) { console.error(`images.json 형식 오류: ${e.message}\n고친 뒤 다시 실행해 주세요.`); process.exit(1); }
}
if (!Array.isArray(data.images)) data.images = [];

const files = fs.readdirSync(dir, { recursive: true }).map((f) => String(f).split(path.sep).join('/')).filter((f) => EXT.test(f)).sort();
const known = new Set(data.images.map((i) => i.file));
let max = Math.max(0, ...data.images.map((i) => Number(/^img-(\d+)$/.exec(i.id)?.[1] ?? 0)));
const added = [];
for (const f of files) {
  if (known.has(f)) continue;
  const id = `img-${String(++max).padStart(4, '0')}`;
  data.images.push({ id, file: f, alt: '', tags: [], source: '' });
  added.push(`${id}  ←  ${f}`);
}
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');

console.log(added.length ? `새로 등록한 이미지 ${added.length}개:\n  ${added.join('\n  ')}` : '새로 등록할 이미지가 없어요.');
const missing = data.images.filter((i) => !files.includes(i.file));
if (missing.length) console.log(`\n파일이 없는 항목 (images.json에서 직접 지우거나 파일을 다시 넣어 주세요):\n  ${missing.map((i) => `${i.id} (${i.file})`).join('\n  ')}`);
console.log('\n※ alt(이미지 설명)와 source(출처)는 content/images/images.json 에서 직접 적어 주세요.');
