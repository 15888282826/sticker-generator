import { defineConfig, loadEnv } from 'vite';
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
    const { miaodaDevPlugin } = require("miaoda-sc-plugin");
    plugins.push(miaodaDevPlugin());
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
