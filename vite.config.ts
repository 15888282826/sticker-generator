import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [
    react(),
    svgr({
      svgrOptions: {
        icon: true, exportType: 'named', namedExport: 'ReactComponent',
      },
    })
  ];

  // Only use miaoda dev plugin in development mode
  if (mode === 'development') {
    try {
      const { miaodaDevPlugin } = require("miaoda-sc-plugin");
      plugins.push(miaodaDevPlugin());
    } catch (error) {
      console.warn('Miaoda dev plugin not available, continuing without it');
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
