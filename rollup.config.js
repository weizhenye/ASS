import fs from 'fs';
import csso from 'csso';
import buble from 'rollup-plugin-buble';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/ass.js',
      format: 'umd',
      name: 'ASS',
    },
    {
      file: 'dist/ass.esm.js',
      format: 'es',
    },
  ],
  plugins: [
    replace({
      __GLOBAL_CSS__: csso.minify(fs.readFileSync('./src/global.css')).css,
    }),
    resolve(),
    buble(),
  ],
};
