import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import yaml from '@rollup/plugin-yaml';
import {terser} from 'rollup-plugin-terser';

// `npm run build` -> `production` is true
// `npm run watch` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/main.ts',
  output: {
    file: 'dist/main.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    yaml(),
    resolve(),
    commonjs(),
    typescript(),
    production && terser() // minify, but only in production
  ]
};
