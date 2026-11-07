import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/admin-api': {
            changeOrigin: true,
            target: 'http://localhost:9090',
            ws: true,
          },
          '/preview': {
            changeOrigin: true,
            target: 'http://localhost:9090',
          },
        },
      },
    },
  };
});
