import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true
  },
  define: {
    'import.meta.env.VITE_GOOGLE_API_KEY': JSON.stringify(process.env.GOOGLE_API_KEY || '')
  }
});