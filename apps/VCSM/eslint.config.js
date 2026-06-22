import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const vcsmArchitecture = require('./eslint-plugin-vcsm-architecture/index.js')

export default [
  { ignores: ['dist', '__ignored/**', '.wrangler/**', '.wrangler - Copy/**'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'vcsm-architecture': vcsmArchitecture,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^[A-Z_]',
          argsIgnorePattern: '^[A-Z_]',
          caughtErrorsIgnorePattern: '^[A-Z_]',
        },
      ],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // VCSM Architecture rules — hard gates
      'vcsm-architecture/no-dal-auth-leak': 'error',
      'vcsm-architecture/adapter-boundary': 'error',
      'vcsm-architecture/single-source-actor': 'error',
      'vcsm-architecture/no-direct-layer-skip': 'error',
      'vcsm-architecture/no-select-star': 'error',
      'vcsm-architecture/no-ttl-cache': 'error',
      'vcsm-architecture/profiles-domain-boundary': 'error',

      // VCSM Architecture rules — advisory
      'vcsm-architecture/react-query-preferred': 'warn',

      // Contract-enforcement rules (AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT).
      // Start as 'warn'; flip each one to 'error' once `npx eslint .`
      // reports zero violations for that specific rule.
      'vcsm-architecture/no-supabase-outside-dal': 'error',
      'vcsm-architecture/dal-no-upward-import': 'warn',
      'vcsm-architecture/hook-no-dal-import': 'warn',
      'vcsm-architecture/no-nonadapter-barrel-export': 'warn',
      'vcsm-architecture/no-deep-relative-import': 'warn',
    },
  },
  {
    files: [
      'eslint.config.js',
      'vite.config.js',
      'find-unused.js',
      'find-unused.cjs',
      'server/**/*.js',
      'functions/**/*.js',
      'cloudflare-worker-upload/**/*.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['src/sw.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },
]