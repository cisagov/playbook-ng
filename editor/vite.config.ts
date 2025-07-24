import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'
import { execSync } from 'child_process';

// https://vitejs.dev/config/
export default defineConfig(() => {

  // add extra app-accessible vars to env
  process.env = {
    VITE_GIT_TIME: execSync('git log -1 --format=%ci || echo "not in a git repo"').toString().trimEnd(),
    VITE_GIT_SHORT_HASH: execSync('git rev-parse --short HEAD || echo "not in a git repo"').toString().trimEnd(),
    VITE_BASENAME: '/',
    ...process.env
  };

  return {
    plugins: [react()],
    resolve: {
      alias: [
        { find: "@", replacement: path.resolve(__dirname, "src") }
      ],
    }
  };
});
