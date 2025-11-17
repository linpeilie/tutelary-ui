import { defineConfig } from '@soybeanjs/eslint-config';

export default defineConfig(
  { vue: true, unocss: true },
  {
    rules: {
      'vue/multi-word-component-names': [
        'warn',
        {
          ignores: ['index', 'App', 'Register', '[id]', '[url]']
        }
      ],
      'vue/component-name-in-template-casing': [
        'warn',
        'PascalCase',
        {
          registeredComponentsOnly: false,
          ignores: ['/^icon-/']
        }
      ],
      'unocss/order-attributify': 'off',
      'vue/no-unused-properties': 'off',
      'no-console': 'off',
      'vue/no-static-inline-styles': 'off',
      'no-plusplus': 'off',
      'max-params': 'off',
      'no-underscore-dangle': 'off',
      '@typescript-eslint/no-use-before-define': 'off'
    }
  },
  {
    // 忽略 protobuf 自动生成的代码
    ignores: ['src/proto/**/*.ts']
  }
);
