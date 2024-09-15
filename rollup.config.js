import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { transform, Features } from 'lightningcss';

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
    {
      file: 'dist/ass.global.js',
      format: 'iife',
      name: 'ASS',
    },
    {
      file: 'dist/ass.global.min.js',
      format: 'iife',
      name: 'ASS',
      plugins: [terser()],
    },
  ],
  plugins: [
    nodeResolve(),
    {
      transform(code, id) {
        if (id.endsWith('.css')) {
          const result = transform({
            filename: id,
            code: new TextEncoder().encode(code),
            minify: true,
            include: Features.Nesting,
          });
          return { code: `export default '${result.code.toString()}';` };
        }
        return null;
      },
    },
  ],
};
