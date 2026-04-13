import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import AutoImport from 'unplugin-auto-import/vite'
import path from 'path'

/**
 * Config dedicado do Vitest. Separado do vite.config.js porque:
 *
 *  - O config principal usa `laravel-vite-plugin`, que injeta
 *    configurações de servidor incompatíveis com o modo test.
 *  - Queremos replicar apenas o plugin de React + o auto-import
 *    (pro mesmo conjunto de globals que o runtime usa).
 *  - Usa jsdom para testes de componente e aliases compatíveis
 *    com os imports `@/...` do runtime.
 */
export default defineConfig({
  plugins: [
    react(),
    AutoImport({
      imports: ['react'],
      dirs: [
        'resources/js/components/ui/**',
        'resources/js/components/magicui/**',
      ],
      dts: false,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'resources/js'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['resources/js/__tests__/**/*.test.{js,jsx}'],
    setupFiles: ['./resources/js/__tests__/setup.js'],
  },
})
