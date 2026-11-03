import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' prefix loads every variable (including Render's process.env values)
  const env = loadEnv(mode, process.cwd(), '')

  // Remove trailing slashes so `${VITE_API}/me` never becomes `//me`
  const api = (env.VITE_API || '').trim().replace(/\/+$/, '')

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API': JSON.stringify(api),
    },
  }
})