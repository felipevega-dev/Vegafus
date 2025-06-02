import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  server: {
    port: 3001,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@assets': '/assets',
      '@components': '/src/components',
      '@scenes': '/src/scenes',
      '@classes': '/src/classes',
      '@systems': '/src/systems',
      '@utils': '/src/utils',
      '@styles': '/src/styles'
    }
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.mp3', '**/*.wav', '**/*.ogg']
});
