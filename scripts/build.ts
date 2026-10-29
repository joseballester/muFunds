// Bundles src/ into one Apps Script file at dist/muFunds.js.
import { readFile, rm } from 'node:fs/promises';

import { build } from 'esbuild';

const customFunctions = await readFile('src/custom-functions.js', 'utf8');

await rm('dist', { recursive: true, force: true });

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/muFunds.js',
  bundle: true,
  // Apps Script has no modules: expose the exports as a `MuFunds` global instead.
  format: 'iife',
  globalName: 'MuFunds',
  target: 'es2020',
  charset: 'utf8',
  footer: { js: customFunctions },
  logLevel: 'info',
});
