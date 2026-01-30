import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    // Polyfill process.env.API_KEY so the existing code works without modification
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});