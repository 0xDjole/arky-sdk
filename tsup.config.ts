import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    admin: 'src/admin.ts',
    storefront: 'src/storefront.ts',
    utils: 'src/utils/index.ts',
    types: 'src/types/public.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: 'smallest',
  outDir: 'dist',
})
