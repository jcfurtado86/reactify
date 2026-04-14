import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import i18next from 'eslint-plugin-i18next'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    files: ['resources/js/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks, i18next },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        route: 'readonly',
        useState: 'readonly',
        useEffect: 'readonly',
        useRef: 'readonly',
        useMemo: 'readonly',
        useCallback: 'readonly',
        useContext: 'readonly',
        Popover: 'readonly',
        PopoverTrigger: 'readonly',
        PopoverContent: 'readonly',
        PopoverArrow: 'readonly',
      },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Desligado: unplugin-auto-import injeta dezenas de símbolos
      // (axios, useState, hooks do shadcn) como globals. ESLint não
      // lê o auto-imports.d.ts, então o ruído seria constante.
      'no-undef': 'off',
      'no-useless-assignment': 'warn',
      'no-empty-pattern': 'warn',
      'no-constant-binary-expression': 'warn',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'i18next/no-literal-string': [
        'warn',
        {
          mode: 'jsx-text-only',
          'should-validate-template': false,
          callees: {
            exclude: ['cn', 'clsx', 'route', 'console\\..*', 'Error', 'require'],
          },
          words: {
            exclude: [
              '[0-9!-/:-@\\[-`{-~]+',
              '[A-Z_-]+',
            ],
          },
        },
      ],
    },
  },
  {
    files: ['resources/js/**/*.{js,jsx}'],
    ignores: ['resources/js/i18n/**', 'resources/js/__tests__/**'],
  },
  {
    ignores: [
      'public/build/**',
      'auto-imports.d.ts',
      'node_modules/**',
      'resources/js/components/magicui/**',
    ],
  },
]
