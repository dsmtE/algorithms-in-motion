import {defineConfig} from 'vite';
import motionCanvas from '@motion-canvas/vite-plugin';
// import ffmpeg from '@motion-canvas/ffmpeg';
import { fileURLToPath, URL } from 'url';
import fs from 'fs';

export default defineConfig(({ command, mode }) => {
  let projectPath = './src/projects';
  let projects = fs.readdirSync(projectPath);
  // filter keep only file with .ts extension
  projects = projects.filter(file => file.endsWith('.ts'));
  // get absolute path
  projects = projects.map(file => `${projectPath}/${file}`);

  if(mode === 'development') {
    console.log('projects:', projects);
  }

  return {
    plugins: [
      motionCanvas({
        project: projects,
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
  };
});
