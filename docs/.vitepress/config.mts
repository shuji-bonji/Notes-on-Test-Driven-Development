import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'テスト駆動開発(TDD)',
  description: 'Test-Driven Development with TypeScript',
  lang: 'ja',
  // docs フォルダをルートとして扱う
  srcDir: './docs',
  // GitHub Pagesなどにデプロイする場合のベースパス
  base: '/Notes-on-Test-Driven-Development/',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      // { text: 'Examples', link: '/markdown-examples' },
    ],

    sidebar: [
      {
        text: 'TDD概要',
        items: [
          { text: 'TDDとは', link: "/what's-TDD" },
          { text: 'テストリストの作成と管理', link: '/test-list-management' },
          { text: 'Red 🔴 - 失敗するテストの書き方', link: '/testing-in-TDD' },
          {
            text: 'Green 🟢 - テストを通過させる効率的アプローチ',
            link: '/Implementation-in-TDD',
          },
          {
            text: 'Refactor 🔵 - 品質向上のための実践手法',
            link: '/refactoring-in-TDD',
          },
        ],
      },
      {
        text: 'TypeScriptでのTDDパターン集',
        items: [
          {
            text: 'パターン集目次',
            link: '/collection-of-TDD-patterns-TypeScript/',
          },
          {
            text: '基本的な関数のテスト',
            link: '/collection-of-TDD-patterns-TypeScript/basic-function-testing',
          },
          {
            text: 'クラスとオブジェクト指向のテスト',
            link: '/collection-of-TDD-patterns-TypeScript/class-and-object-oriented-testing',
          },
          {
            text: '非同期処理のテスト',
            link: '/collection-of-TDD-patterns-TypeScript/asynchronous-processing-testing',
          },
          {
            text: 'モックとスタブを使用したテスト',
            link: '/collection-of-TDD-patterns-TypeScript/testing-with-mocks-and-stubs',
          },
          {
            text: 'パラメータ化テスト',
            link: '/collection-of-TDD-patterns-TypeScript/parameterized-testing',
          },
          {
            text: '状態変化をテストする',
            link: '/collection-of-TDD-patterns-TypeScript/testing-state-changes',
          },
          {
            text: 'RxJSを使った状態変化をテストする',
            link: '/collection-of-TDD-patterns-TypeScript/testing-state-changes-with-rxjs',
          },
        ],
      },
    ],

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/shuji-bonji/Notes-on-Test-Driven-Development',
      },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present',
    },
  },
});
