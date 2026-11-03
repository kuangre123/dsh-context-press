import { build } from 'esbuild'

await build({
  entryPoints: ['src/client.tsx'],
  outfile: 'dist/client.js',
  bundle: true,
  format: 'cjs',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
  banner: { js: 'window.__ModuleLoader__.load({id:"dsh-context-press",factory(require){const module={exports:{}}; const exports=module.exports;' },
  footer: { js: 'return module.exports;}});' },
})
