import { readFileSync } from 'node:fs';
import { minify } from 'csso';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

/** @type {import('rollup').RollupOptions} */
export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/ass.js',
      format: 'esm',
    },
    {
      file: 'dist/ass.min.js',
      format: 'esm',
      plugins: [terser()],
    },
  ],
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        __GLOBAL_CSS__: minify(readFileSync('./src/global.css', 'utf8')).css,
      },
    }),
    nodeResolve(),
  ],
};
