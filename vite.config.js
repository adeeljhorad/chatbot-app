import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During local dev (npm run dev), forward API calls to the Express server
      '/api': 'http://localhost:3000',
    },
  },
});
