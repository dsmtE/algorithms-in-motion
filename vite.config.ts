import {defineConfig} from 'vite';
import motionCanvas from '@motion-canvas/vite-plugin';
// import ffmpeg from '@motion-canvas/ffmpeg';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [
    motionCanvas({
      project: [
        './src/projects/bubbleSort.ts',
        './src/projects/selectionSort.ts',
        './src/projects/mergeSort.ts',
      ]
    }),
    // ffmpeg(),
  ],
  build: {
    rollupOptions: {
      output: {
        dir: './build',
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
});
