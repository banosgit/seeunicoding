import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 에디터는 내 PC에서만 실행합니다. (배포하지 않음)
export default defineConfig({ plugins: [react()], server: { port: 5174, strictPort: true } });
