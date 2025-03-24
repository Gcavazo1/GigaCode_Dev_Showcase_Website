import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  server: {
    open: true,
    host: true
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          visualizer: ['./js/particle-visualizer/visualizer.js'],
          main: ['./js/main.js'],
          audio: ['./js/audio-player.js'],
          models: ['./js/3d-model.js']
        }
      }
    }
  }
}); 