import fs from 'fs';
import csso from 'csso';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/ass.js',
      format: 'umd',
      name: 'ASS',
    },
    {
      file: 'dist/ass.min.js',
      format: 'umd',
      name: 'ASS',
      plugins: [terser()],
    },
    {
      file: 'dist/ass.esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    replace({
      __GLOBAL_CSS__: csso.minify(fs.readFileSync('./src/global.css')).css,
    }),
    nodeResolve(),
  ],
};
