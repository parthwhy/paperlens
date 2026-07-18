import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  // Base path for GitHub Pages (repo-name subpath).
  //   - PUBLIC_BASE env overrides everything (e.g. PUBLIC_BASE=/paper-len/)
  //   - GITHUB_REPOSITORY (owner/repo) used in CI so the base matches the repo slug
  //   - fallback '/paper-len/' for local preview of the GH Pages build
  let base = process.env.PUBLIC_BASE;
  if (!base && process.env.GITHUB_REPOSITORY) {
    const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
    base = `/${repo}/`;
  }
  if (!base) base = '/paper-len/';
  return {
    base,
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
