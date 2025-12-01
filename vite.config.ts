import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// We read the Vite env variables for the current mode using `loadEnv`.
// This ensures the `VITE_API_BASE` value is available when building the config, and
// that we use the correct protocol when configuring the dev proxy.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Normalize API_BASE: ensure a protocol is present (use https if not specified)
  const rawApiBase = env.VITE_API_BASE ?? '';
  const apiBase = rawApiBase
    ? rawApiBase.match(/^https?:\/\//)
      ? rawApiBase
      : `https://${rawApiBase}`
    : 'http://localhost:3001';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      },
    },
  };
});
