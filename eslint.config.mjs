// @ts-check
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

const noXpath = {
  selector: "CallExpression[callee.property.name='locator'] > Literal[value=/^(\\(?\\/\\/|xpath=)/]",
  message: 'XPath is a last resort. Use getByRole/getByLabel/getByTestId.',
};

export default defineConfig([
  globalIgnores([
    'node_modules/',
    'playwright-report/',
    'test-results/',
    'blob-report/',
    '.auth/',
    '.claude/',
  ]),

  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-syntax': ['error', noXpath],
    },
  },

  // Playwright rules for specs and page objects
  {
    files: ['tests/**/*.ts', 'src/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      'playwright/no-commented-out-tests': 'error',
      'playwright/prefer-native-locators': 'error',
      'playwright/require-to-throw-message': 'error',
      'playwright/valid-title': [
        'error',
        { mustMatch: { test: ['^should ', 'Test title must start with "should "'] } },
      ],
    },
  },

  // Specs: no raw locators, no direct @playwright/test import (use fixtures)
  {
    files: ['tests/**/*.ts'],
    rules: {
      'playwright/no-raw-locators': 'error',
      'playwright/no-nth-methods': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['test', 'expect'],
              message: "Import test/expect from 'src/fixtures' to get page objects and clients.",
            },
          ],
        },
      ],
    },
  },

  // Page objects / components / clients: no assertions
  {
    files: ['src/pages/**/*.ts', 'src/components/**/*.ts', 'src/api/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['expect', 'test'],
              message:
                'Page objects and clients do not assert. Return a locator/value and assert in the spec.',
            },
          ],
        },
      ],
    },
  },

  { files: ['**/*.mjs'], extends: [tseslint.configs.disableTypeChecked] },
  prettier,
]);
