import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: ['dist', 'coverage', 'node_modules'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        process: 'readonly'
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Downgrade to warning to avoid blocking CI on non-critical unused vars
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // Test files configuration
  {
    files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', 'src/test-setup.js', 'src/test-utils/**/*.{js,jsx}', 'tests/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        global: 'writable'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      'no-undef': 'error'
    }
  },
  // Node.js scripts at repo root, scripts/, and src/lib/utils (exclude src/ and public/ except utils)
  {
    files: ['*.js', '*.mjs', '*.cjs', 'scripts/**/*.{js,mjs,cjs}', 'src/lib/utils/*.js', 'src/validate-data.js', 'batch-migrate-logs.cjs'],
    ignores: ['src/**/*', 'public/**/*', 'node_modules/**/*', 'dist/**/*', '!src/lib/utils/*.js', '!src/validate-data.js', '!scripts/**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: {
        sourceType: 'module'
      }
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  // Server-side Node.js files
  {
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: {
        sourceType: 'module'
      }
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
]
