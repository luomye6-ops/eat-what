import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 的基础配置，当前只启用 React 插件。
export default defineConfig({
  plugins: [react()],
})
