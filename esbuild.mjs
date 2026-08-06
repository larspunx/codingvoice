import * as esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

// Dwa osobne bundle, bo biegają w różnych procesach:
//  - extension.js  → host rozszerzeń Cursora, `vscode` jest tam dostarczane z zewnątrz
//  - hook.js       → osobny proces odpalany przez Cursora po turze agenta; nie ma dostępu do `vscode`
const targets = [
  { entry: 'src/extension.ts', out: 'dist/extension.js', external: ['vscode'] },
  { entry: 'src/hook/main.ts', out: 'dist/hook.js', external: [] },
]

for (const { entry, out, external } of targets) {
  const options = {
    entryPoints: [entry],
    outfile: out,
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    external,
    minify: !watch,
    sourcemap: watch,
    logLevel: 'info',
  }
  if (watch) {
    const ctx = await esbuild.context(options)
    await ctx.watch()
  } else {
    await esbuild.build(options)
  }
}
