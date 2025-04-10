# Refactor 🔵 - 品質向上のための実践手法

テスト駆動開発（TDD）サイクルの最後のステップ「Refactor（リファクタリング）」は、テストが通っていることを保証としながら、動作するコードの品質（内部の設計や読みやすさ、保守性）を向上させる工程です。TDDにおけるリファクタリングは「テストがあるからこそ、安心して改善できる」強力な武器です。

以下、テストに守られた安全なリファクタリングの実践手法について記します。

## リファクタリングとは

リファクタリングとは、外部から見たプログラムの振る舞いを変えずに、内部構造を改善するプロセスです。Martin Fowlerは「リファクタリングとは、ソフトウェアの外部の振る舞いを保ちつつ、内部構造を改善する手法である」と定義しています。


## TDDサイクルにおけるリファクタリングの目的
以下は一般的なリファクタリングの目的です。
1. コードの可読性向上
2. 重複の排除
3. 拡張性の確保
4. メンテナンス性の向上
5. 実装の単純化

この目的から大きく変わりませんが、TDDサイクルにおけるリファクタリングの目的は、以下の観点から行います。

|観点|説明|
|---|---|
|Greenの実装はあくまで「間に合わせ」|仮実装や三角測量ではロジックが散らかっていることが多い|
|保守性の確保|他人や未来の自分が読みやすいように整理する|
|拡張性・再利用性の向上|次の開発フェーズや要件追加に備える|
|すでにテストがある|動作保証がされているため、気兼ねなく実装コードを修正することが可能|

## Refactorの具体的な流れ

以下のようにステップを踏んで、テストを落とさずに改善していきます。
```ts
// Greenステップの仮実装
function isLeapYear(year: number): boolean {
  if (year === 2024) return true;
  if (year === 2100) return false;
  if (year === 2400) return true;
  return false;
}

// Refactorでの一般化＋関数抽出
const isDivisibleBy = (year: number, divisor: number): boolean =>
  year % divisor === 0;

function isLeapYear(year: number): boolean {
  return year > 0 &&
    (isDivisibleBy(year, 400) ||
      (isDivisibleBy(year, 4) && !isDivisibleBy(year, 100)));
}
```

## リファクタリングの前提条件

### テストの存在

リファクタリングの大前提は、堅牢なテストの存在です。テストによって機能の正常性が保証されていれば、安全にコードを改善できます。

```typescript
// テストの例
test('ユーザー名が正しくフォーマットされる', () => {
  const formatter = new UserFormatter();
  const user = { firstName: 'taro', lastName: 'yamada' };
  
  const formattedName = formatter.format(user);
  
  expect(formattedName).toBe('Taro Yamada');
});
```

### 小さなステップ

リファクタリングは小さなステップで行うべきです。一度に大きな変更を行うと、問題が発生した際に原因の特定が難しくなります。

## コードスメルの発見

> [!NOTE]
> コードスメルとは
> コードスメルとは、より深刻な問題を示唆するコードの兆候や特徴のことです。

主なコードスメルには以下のようなものがあります.

### 1. 重複コード

同一またはよく似たコードが複数箇所に存在する状態です。

```typescript
// 重複コードの例
function calculateTotalPrice(items) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  return total;
}

function calculateDiscountedPrice(items, discountRate) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity; // 重複している計算ロジック
  }
  return total * (1 - discountRate);
}
```

### 2. 長すぎるメソッド

一つのメソッドが多くの責任を持ち、長くなっている状態です。

### 3. 大きすぎるクラス

一つのクラスが多くの責任を持ち、多数のフィールドやメソッドを持っている状態です。

### 4. 過度な引数

メソッドの引数が多すぎる状態です。

### 5. データの群れ

常に一緒に使われる複数のデータ項目がオブジェクトにまとめられていない状態です。

## 代表的なリファクタリング手法

|リファクタリング手法|内容|例|
|---|---|---|
|名前の変更|関数名・変数名をより意図が伝わる形に変更|fn1 → calculateTotalPrice|
|関数の抽出|処理の一部を別関数に切り出す|複雑な if文ブロックの切り出し|
|条件式の簡略化|重複した条件やネストを整理|if (a && a === b) → if (a === b)|
|重複コードの除去|同じ処理を関数化・共通化|複数箇所で使われているログ出力など|
|一時変数の削除|無駄な中間変数を排除|let tmp = a + b; return tmp; → return a + b;|


## リファクタリング手法

### 1. メソッド抽出 (Extract Method)

長いメソッドから一部のコードを別のメソッドとして抽出する手法です。

```typescript
// リファクタリング前
function processOrder(order) {
  // 注文の検証
  if (!order.customerId) throw new Error('顧客IDが必要です');
  if (!order.items || order.items.length === 0) throw new Error('商品が必要です');
  
  // 合計金額の計算
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
  }
  
  // 注文の保存
  const orderRecord = {
    id: generateId(),
    customerId: order.customerId,
    items: order.items,
    total: total,
    date: new Date()
  };
  database.save(orderRecord);
  
  return orderRecord;
}

// リファクタリング後
function processOrder(order) {
  validateOrder(order);
  const total = calculateTotal(order.items);
  return saveOrder(order, total);
}

function validateOrder(order) {
  if (!order.customerId) throw new Error('顧客IDが必要です');
  if (!order.items || order.items.length === 0) throw new Error('商品が必要です');
}

function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  return total;
}

function saveOrder(order, total) {
  const orderRecord = {
    id: generateId(),
    customerId: order.customerId,
    items: order.items,
    total: total,
    date: new Date()
  };
  database.save(orderRecord);
  return orderRecord;
}
```

### 2. クラス抽出 (Extract Class)

一つのクラスが複数の責任を持っている場合、それを分割する手法です。

```typescript
// リファクタリング前
class Customer {
  constructor(name, address, city, zipCode, phone, email) {
    this.name = name;
    this.address = address;
    this.city = city;
    this.zipCode = zipCode;
    this.phone = phone;
    this.email = email;
  }
  
  getFullAddress() {
    return `${this.address}, ${this.city}, ${this.zipCode}`;
  }
  
  getContactInfo() {
    return `${this.phone}, ${this.email}`;
  }
}

// リファクタリング後
class Address {
  constructor(address, city, zipCode) {
    this.address = address;
    this.city = city;
    this.zipCode = zipCode;
  }
  
  getFullAddress() {
    return `${this.address}, ${this.city}, ${this.zipCode}`;
  }
}

class Contact {
  constructor(phone, email) {
    this.phone = phone;
    this.email = email;
  }
  
  getContactInfo() {
    return `${this.phone}, ${this.email}`;
  }
}

class Customer {
  constructor(name, address, city, zipCode, phone, email) {
    this.name = name;
    this.address = new Address(address, city, zipCode);
    this.contact = new Contact(phone, email);
  }
  
  getFullAddress() {
    return this.address.getFullAddress();
  }
  
  getContactInfo() {
    return this.contact.getContactInfo();
  }
}
```

### 3. メソッド移動 (Move Method)

メソッドを別のクラスに移動する手法です。

### 4. パラメータオブジェクト (Introduce Parameter Object)

複数の関連する引数をオブジェクトにまとめる手法です。

```typescript
// リファクタリング前
function createReport(startDate, endDate, customerId, productId) {
  // レポート作成のロジック
}

// リファクタリング後
function createReport(reportCriteria) {
  // reportCriteria = { startDate, endDate, customerId, productId }
  // レポート作成のロジック
}
```

### 5. 条件式の簡素化 (Simplify Conditional)

複雑な条件式を簡素化する手法です。

```typescript
// リファクタリング前
if (date.before(SUMMER_START) || date.after(SUMMER_END)) {
  charge = quantity * winterRate + winterServiceCharge;
} else {
  charge = quantity * summerRate;
}

// リファクタリング後
if (isSummer(date)) {
  charge = summerCharge(quantity);
} else {
  charge = winterCharge(quantity);
}

function isSummer(date) {
  return !date.before(SUMMER_START) && !date.after(SUMMER_END);
}

function summerCharge(quantity) {
  return quantity * summerRate;
}

function winterCharge(quantity) {
  return quantity * winterRate + winterServiceCharge;
}
```

## リファクタリングの効果的な進め方

### 1. コードスメルの特定

リファクタリングを始める前に、まずコードスメルを特定します。

### 2. テストの確認

既存のテストが十分かどうかを確認し、必要に応じてテストを追加します。

### 3. 小さなステップでのリファクタリング

一度に一つの変更を行い、その都度テストを実行して機能の正常性を確認します。

### 4. バージョン管理システムの活用

各リファクタリングステップをコミットすることで、問題が発生した場合に戻れるようにします。

## コード品質の指標

### 1. `SOLID原則`

リファクタリングの目標として、SOLID原則を意識すると良いでしょう。
|原則|解説|
|---|---|
|`単一責任の原則`<br> (Single Responsibility Principle)|クラスは単一の責任を持つべき|
|`オープン・クローズドの原則`<br>  (Open-Closed Principle)|拡張には開いていて、修正には閉じている|
|`リスコフの置換原則`<br>  (Liskov Substitution Principle)|サブタイプはその基本型と置換可能であるべき|
|`インターフェース分離の原則`<br>  (Interface Segregation Principle)|クライアントは使用しないインターフェースに依存すべきでない|
|`依存性逆転の原則`<br>  (Dependency Inversion Principle)|上位レベルのモジュールは下位レベルのモジュールに依存すべきでない|

### 2. `DRY原則 (Don't Repeat Yourself)`

コード内の重複を排除し、一度だけ定義する原則です。

### 3. `KISS原則 (Keep It Simple, Stupid)`

シンプルなコードが最良のコードであるという原則です。

## TypeScriptを活用したリファクタリング

TypeScriptの型システムを使うことで、より安全なリファクタリングが可能になります。

```typescript
// リファクタリング前
function processUser(user) {
  if (user.type === 'admin') {
    // 管理者用の処理
  } else if (user.type === 'customer') {
    // 顧客用の処理
  }
}

// リファクタリング後
type Admin = {
  type: 'admin';
  adminId: string;
  permissions: string[];
};

type Customer = {
  type: 'customer';
  customerId: string;
  purchases: number;
};

type User = Admin | Customer;

function processUser(user: User) {
  if (user.type === 'admin') {
    processAdmin(user); // TypeScriptは自動的にuserをAdmin型として認識
  } else {
    processCustomer(user); // TypeScriptは自動的にuserをCustomer型として認識
  }
}

function processAdmin(admin: Admin) {
  // 管理者用の処理
}

function processCustomer(customer: Customer) {
  // 顧客用の処理
}
```

## よくあるリファクタリングの失敗とその対策

|失敗|内容|対策|
|---|---|---|
|過度なリファクタリング|リファクタリングの目的を忘れ、過度に抽象化や一般化をしてしまう問題です|リファクタリングの目的（コードの明確化、重複の排除など）を常に意識し、YAGNI（You Aren't Gonna Need It）原則を守る|
|テストなしのリファクタリング|十分なテストがない状態でリファクタリングを行い、機能の破壊に気づかない問題です|リファクタリング前にテストカバレッジを確認し、必要なテストを追加する|
|大きすぎるリファクタリングステップ|一度に多くの変更を行い、問題が発生した場合に原因特定が難しくなる問題です。|小さなステップでリファクタリングを行い、各ステップでテストを実行する|
|目的が曖昧な変更|なんとなくリファクタし続けてしまう|目的を持って、変更の意図を明確にする|


## リファクタリングとパフォーマンス最適化

リファクタリングとパフォーマンス最適化は異なる目的を持ちます。

- `リファクタリング`: コードの可読性と保守性の向上
- `パフォーマンス最適化`: 実行速度やメモリ使用量の改善

ただし、良い設計はしばしばパフォーマンスも向上させます。  
リファクタリングを行った後、必要に応じてパフォーマンス最適化を行いましょう。

## チェックリスト：Refactorの自己評価

|チェック項目|Yes/No|
|---|---|
|テストをすべてパスしているか？|✅|
|読み手が意図を理解しやすいか？|✅|
|同じコードが重複していないか？|✅|
|名前が責務やドメインを反映しているか？|✅|
|変更後も振る舞いに変化がないか？（リグレッションなし）|✅|

## TODOリストとTDDサイクルの統合

リファクタリングが完了したら、テストリスト（TODOリスト）から次のテストケースを選んで、再びRed-Green-Refactorサイクルを開始します。このようにして、TODOリストの項目を1つずつ実装していくことで、全体的な機能を段階的に構築していきます。

### テストリストの管理のコツ
- リファクタリング中に気づいた新しいテストケースや改善点をリストに追加する
- リストの項目は十分に小さく、1つのサイクルで実装できるサイズに保つ
- 複雑な機能は複数のテストケースに分割する


## まとめ

TDDサイクルの最後のステップであるリファクタリングは、コードの品質を継続的に向上させるための重要なプロセスです。テストに守られた安全な環境で、以下の点を意識してリファクタリングを行いましょう.

1. コードスメルを特定する
2. 適切なリファクタリング手法を選択する
3. 小さなステップで進める
4. 各ステップでテストを実行する
5. SOLID原則やDRY原則などの設計原則を意識する

リファクタリングは一時的なタスクではなく、継続的に行うべきプラクティスです。TDDのサイクルを通じて、常に高品質なコードを維持することを目指しましょう。