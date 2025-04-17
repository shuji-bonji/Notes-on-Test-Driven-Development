---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "テスト駆動開発(TDD)"
  text: "Test-Driven Development with TypeScript"
  tagline: テスト駆動開発の実践的パターンガイド
  image:
    src: /images/tdd-cycle.png
    alt: TDD Cycle
  actions:
    - theme: brand
      text: TDDとは
      link: /what's-TDD
    - theme: alt
      text: パターン集
      link: /collection-of-TDD-patterns-TypeScript/

features:
  - title: テストリストの作成と管理
    details: TDDにおいて最初に行う重要なプラクティス
    link: test-list-management
  - title: Red 🔴 - 失敗するテストの書き方
    details: テストを書くことから開発を始め、仕様を明確にする手法について学びます。
    link: /testing-in-TDD
  - title: Green 🟢 - テストを通過させる効率的アプローチ
    details: テストを最短で通すためのコーディング戦略を理解します。
    link: /Implementation-in-TDD
  - title: Refactor 🔵 - 品質向上のための実践手法
    details: 動作を変えずにコードを改善する効果的なリファクタリング手法を学びます。
    link: /refactoring-in-TDD
  # - title: TypeScriptでのTDDパターン集
  #   details: TypeScriptでのテストパターン集目次
  #   link: /collection-of-TDD-patterns-TypeScript
  # - title: Web Components に TDD の適用は難しい
  #   details: なぜ Web Components に TDD をそのまま適用するのが難しいのか？
  #   link: /applying-TDD-to-WebComponents-is-difficult

---
