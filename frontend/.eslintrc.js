module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  ignorePatterns: ['**/*.cjs'],
  extends: [
    'plugin:react/jsx-runtime',
    'plugin:react/recommended',
    'plugin:@next/next/recommended',
    'next',
    'prettier',
    'plugin:@typescript-eslint/recommended', // 添加 TypeScript 推荐规则
    'plugin:@typescript-eslint/recommended-requiring-type-checking' // 添加需要类型检查的规则
  ],
  parser: '@typescript-eslint/parser', // 使用 TypeScript 解析器
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module',
    project: './tsconfig.eslint.json' // 指向新的 ESLint 配置文件
  },
  plugins: [
    'react',
    'react-hooks',
    'prettier',
    '@typescript-eslint' // 添加 TypeScript 插件
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    semi: 0,
    'react/no-unknown-property': 'off', // <style jsx>
    'react/prop-types': 'off',
    'space-before-function-paren': 0,
    'react-hooks/rules-of-hooks': 'error', // Checks rules of Hooks
    '@typescript-eslint/no-unused-vars': 'off', // 关闭未使用的变量报错
    '@typescript-eslint/explicit-function-return-type': 'off' // 关闭强制函数返回类型声明
  },
  overrides: [
    {
      files: ['.eslintrc.js'],
      parser: null // Avoid TypeScript parser on the ESLint config itself
    },
    {
      // Legacy modules (still JS, or mechanical JS→TS migrations) keep the
      // previous JS lint bar. Strict type-aware rules apply to typed-first
      // modules such as navyink.
      files: ['**/*.{js,jsx,ts,tsx}'],
      excludedFiles: [
        'src/shared/themes/navyink/**/*.{ts,tsx}',
        'src/shared/lib/cn.ts',
        'src/shared/lib/utils/clean.util.ts',
        'src/shared/lib/utils/time.util.ts',
        'src/shared/hooks/useWindowSize.ts',
        'src/entities/**/*.{ts,tsx}'
      ],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off'
      }
    }
  ],
  globals: {
    React: true
  }
}
