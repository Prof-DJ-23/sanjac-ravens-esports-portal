import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base keeps the built site compatible with GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: './',
});
