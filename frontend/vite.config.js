import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Validate required env vars at build and dev start
  const required = ['VITE_API_URL', 'VITE_SOCKET_URL'];
  const missing = required.filter((k) => !env[k]);
  if (missing.length > 0) {
    throw new Error(`[env] Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@services': path.resolve(__dirname, './src/services'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@store': path.resolve(__dirname, './src/store'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api/v1': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
