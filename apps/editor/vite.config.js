import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 내 PC: npm run editor (주소 /) / 배포: 사이트 주소 아래 /seeunicoding/editor/ 로 올라갑니다.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/seeunicoding/editor/' : '/',
  plugins: [react()],
  server: { port: 5174, strictPort: true },
}));
