import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { checkLessons } from './lessonCheck.js';

const LESSON_DIR = fileURLToPath(new URL('../../content/lessons', import.meta.url));
const CATEGORIES_FILE = fileURLToPath(new URL('../../content/categories.json', import.meta.url));

function lessonCheck() {
  let isBuild = false;
  return {
    name: 'lesson-check',
    configResolved(c) { isBuild = c.command === 'build'; },
    buildStart() {
      const { errors, warnings } = checkLessons(LESSON_DIR, CATEGORIES_FILE);
      if (warnings.length) this.warn('강의 파일 경고:\n- ' + warnings.join('\n- '));
      if (!errors.length) return;
      const msg = '강의 파일 오류:\n- ' + errors.join('\n- ');
      if (isBuild) this.error(msg); // 빌드 실패 = 배포 차단
      else this.warn(msg);
    },
  };
}

export default defineConfig({
  plugins: [react(), lessonCheck()],
  base: '/seeunicoding/',
});
