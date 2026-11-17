import { defineConfig } from 'vite'

export default defineConfig({
  // Relative addresses, so the build works wherever its folder sits in the pack.
  base: './',
  build: {
    // Straight into the pack folder. pack/ holds atelier-pack.json and this build,
    // so node_modules and the sources never end up in the pack.
    outDir: 'pack/dist',
    emptyOutDir: true,
  },
})
