import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    compilerOptions: {
      module: 'esnext',
      target: 'esnext',
      lib: ['esnext', 'dom'],
      skipLibCheck: true,
      moduleResolution: 'node'
    }
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
  external: [],
  noExternal: [],
  platform: 'node',
  target: 'node18',
  bundle: true,
  keepNames: true,
  cjsInterop: true,
  shims: false,
  skipNodeModulesBundle: true,
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    }
  },
  esbuildOptions(options) {
    options.mainFields = ['module', 'main']
  }
})