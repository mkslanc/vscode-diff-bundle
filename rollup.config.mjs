// rollup.config.js
import typescript from '@rollup/plugin-typescript';

console.log("----------------------------")

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  plugins: [typescript()]
};