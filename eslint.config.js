import antfu from '@antfu/eslint-config'

export default antfu({
  unocss: true,
  formatters: true,
  ignores: ['vite.config.ts', 'build/**', 'src/proto/**'],
})
