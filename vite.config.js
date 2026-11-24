import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A relative asset base lets the same build work at either
// https://<user>.github.io/ or https://<user>.github.io/<repository>/.
export default defineConfig({
  plugins: [react()],
  base: '/memviz-simulator/',
})