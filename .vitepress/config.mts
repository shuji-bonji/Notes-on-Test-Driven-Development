import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'TypeScript で学ぶ テスト駆動開発(TDD)',
  description: 'TypeScript で学ぶ テスト駆動開発',
  lang: 'ja',
  // docs フォルダをルートとして扱う
  srcDir: './docs',
  // GitHub Pagesなどにデプロイする場合のベースパス
  base: '/Notes-on-Test-Driven-Development/',
  head: [
    // OGP
    [
      'meta',
      { property: 'og:title', content: 'TypeScript で学ぶ テスト駆動開発' },
    ],
    [
      'meta',
      {
        property: 'og:description',
        content: 'TypeScript で学ぶ TDD パターン集',
      },
    ],
    [
      'meta',
      {
        property: 'og:image',
        content:
          'https://shuji-bonji.github.io/Notes-on-Test-Driven-Development/images/tdd-cycle.webp',
      },
    ],
    [
      'meta',
      {
        property: 'og:url',
        content:
          'https://shuji-bonji.github.io/Notes-on-Test-Driven-Development/',
      },
    ],

    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    [
      'meta',
      { name: 'twitter:title', content: 'TypeScript で学ぶ テスト駆動開発' },
    ],
    [
      'meta',
      {
        name: 'twitter:description',
        content: 'TypeScript で学ぶ TDD パターン集',
      },
    ],
    [
      'meta',
      {
        name: 'twitter:image',
        content:
          'https://shuji-bonji.github.io/Notes-on-Test-Driven-Development/images/tdd-cycle.png',
      },
    ],
    ['link', { rel: 'icon', href: 'favicon.ico' }],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'TDDとは', link: "/what's-TDD" },
      {
        text: 'TypeScriptでのTDDパターン集',
        link: '/collection-of-TDD-patterns-TypeScript/',
      },
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
      {
        text: 'その他',
        items: [
          {
            text: 'Web Components に TDD の適用は難しい',
            link: '/applying-TDD-to-WebComponents-is-difficult',
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
      message: 'Released under the CC-BY-4.0 license.',
      copyright: 'Copyright © 2025 shuji-bonji',
    },
  },
  sitemap: {
    hostname: 'https://shuji-bonji.github.io/Notes-on-Test-Driven-Development/',
  },
});
