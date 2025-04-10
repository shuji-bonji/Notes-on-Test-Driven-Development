# Web Components に TDD の適用は難しい
Web Componentsを使う場合、TDDを「UIコンポーネント」そのものに厳密に適用しようとすると難易度が高くなるため、TDDは「アプリケーションのロジック層（ドメイン／ビジネスルール）」に対して適用するのが現実的かつ効果的です。


Web ComponentsとTDDを無理に結びつけず、「UIとロジックの責務分離」をして、ロジック側にTDDを適用するのが現実的で効果的です。
UI層は「接続部分を検証する程度」にとどめ、ロジックの堅牢性をTDDで担保するのがベストプラクティスです。


## Web Components × TDD が難しい理由

|理由|詳細|
|---|---|
|DOM操作と密接で状態が外部依存|属性・イベント・スロットなど、外部のHTMLやDOMとの相互作用が多い|
|状態の変化が非同期|属性変更・イベントディスパッチ・描画の完了タイミングなどが async|
|テストに Shadow DOM 対応が必要|shadowRoot の中身まで確認しないと動作保証できない|
|初期化やライフサイクルが特殊|connectedCallback, attributeChangedCallback などを正確にテストするには環境が必要|

## よって、TDDに向いているのは「ドメインロジック層」

### 例：アプリケーション構造の分離
```
📁 /src
  ├── /components
  │     └── my-user-form.ts       ← Web Component（TDD困難な部分）
  ├── /domain
  │     └── user.ts               ← TDD対象（Userのバリデーション、登録条件など）
  ├── /services
  │     └── user-service.ts       ← TDD対象（登録処理、DB保存など）
  └── /utils
        └── email-validator.ts    ← TDD対象（関数単位）
```

### TDD対象例：

|層|テスト対象例|
|---|---|
|domain/user.ts|User の生成条件、isValid() のようなドメインロジック|
|services/user-service.ts|登録・重複チェック・通知など、ビジネスルール|
|utils/email-validator.ts|単一関数としてのユニットテスト|


## UI層（Web Components）は「テスト後」＋「最小限の振る舞いテスト」でOK

|テストスタイル|用途|
|---|---|
|単体ユニットテスト|属性・イベントの受け渡しなどシンプルな振る舞い確認|
|E2Eテスト（Playwrightなど）|ユーザー操作を通じた総合動作確認|
|Storybook + Jest|UI状態のスナップショットテスト（非推奨だが一部で使われる）|


## 責務を明確に分離する

- ビジネスロジック層: 純粋なJavaScriptで実装し、TDDで徹底的にテスト
- 状態管理層: データの流れと状態変化をTDDでテスト
- プレゼンテーション層: WebComponentsの見た目や振る舞いは、必要に応じて統合テストやビジュアルテストで補完

## 実際の開発フロー
1. ロジックやルールを TDD で先に設計・実装
2. その後 Web Component の UI に「ロジック層を注入」
3. UI 層では「最低限の振る舞い」だけをテスト（属性変化やイベント発火）
