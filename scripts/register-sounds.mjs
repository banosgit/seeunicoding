// content/sounds 폴더의 새 소리 파일을 sounds.json 에 등록합니다. (기존 항목은 지우거나 바꾸지 않아요)
// 사용: npm run sounds
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../content/sounds');
const jsonPath = path.join(dir, 'sounds.json');
const EXT = /\.(mp3|ogg|wav|m4a|aac|flac|webm)$/i;

fs.mkdirSync(dir, { recursive: true });
let data = { formatVersion: 1, sounds: [] };
if (fs.existsSync(jsonPath)) {
  try { data = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); }
  catch (e) { console.error(`sounds.json 형식 오류: ${e.message}\n고친 뒤 다시 실행해 주세요.`); process.exit(1); }
}
if (!Array.isArray(data.sounds)) data.sounds = [];

const files = fs.readdirSync(dir, { recursive: true }).map((f) => String(f).split(path.sep).join('/')).filter((f) => EXT.test(f)).sort();
const known = new Set(data.sounds.map((i) => i.file));
let max = Math.max(0, ...data.sounds.map((i) => Number(/^snd-(\d+)$/.exec(i.id)?.[1] ?? 0)));
const added = [];
for (const f of files) {
  if (known.has(f)) continue;
  const id = `snd-${String(++max).padStart(4, '0')}`;
  data.sounds.push({ id, file: f, title: '', tags: [], source: '' });
  added.push(`${id}  ←  ${f}`);
}
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');

console.log(added.length ? `새로 등록한 소리 ${added.length}개:\n  ${added.join('\n  ')}` : '새로 등록할 소리가 없어요.');
const missing = data.sounds.filter((i) => !files.includes(i.file));
if (missing.length) console.log(`\n파일이 없는 항목 (sounds.json에서 직접 지우거나 파일을 다시 넣어 주세요):\n  ${missing.map((i) => `${i.id} (${i.file})`).join('\n  ')}`);
console.log('\n※ title(소리 제목)과 source(출처)는 content/sounds/sounds.json 에서 직접 적어 주세요. 사용 권한이 확인된 소리만 넣어 주세요.');
