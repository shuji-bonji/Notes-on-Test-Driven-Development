# 基本的な関数のテスト

TypeScriptでTDDを実践する際、最も基本となるのは純粋な関数のテストです。  
ここでは、Vitestを使用してTypeScriptの関数をテストする基本的なパターンについて記します。

## 目次

1. [セットアップ](#セットアップ)
2. [VitestをWatchモードで実行する](#vitestをwatchモードで実行する)
3. [シンプルな関数のテスト](#シンプルな関数のテスト)
4. [数値演算関数のテスト](#数値演算関数のテスト)
5. [文字列操作関数のテスト](#文字列操作関数のテスト)
6. [配列操作関数のテスト](#配列操作関数のテスト)
7. [条件分岐を含む関数のテスト](#条件分岐を含む関数のテスト)
8. [エラーハンドリングのテスト](#エラーハンドリングのテスト)
9. [境界値のテスト](#境界値のテスト)
10. [実践的なヒント](#実践的なヒント)


## セットアップ
Vite + TypeScript + Vitestの環境を準備するための基本的な手順は以下の通りです。

### Vite + TypeScript + Vitestの導入

```bash
# プロジェクトの作成
npm create vite@latest my-tdd-project -- --template vanilla-ts
# プロジェクトディレクトリに移動
cd my-tdd-project
# Vitestのインストール
npm install -D vitest
```

### `package.json`にテスト用のスクリプトを追加
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### `tsconfig.json` に、`vitest/globals` を追加
tsconfig.jsonにて、以下のようにTypeScriptの補完や型チェック を有効にするための設定を行います。

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "allowImportingTsExtensions": false,
    "types": ["vitest/globals"]
  }
}
```
`vitest`の型定義をグローバルスコープに読み込むことで、以下のようなテスト関数群を 明示的に `import` しなくても利用できるようになります。

```ts
import { describe, it, expect, beforeEach ,afterEach  } from 'vitest';
```

### `vite.config.ts`　を作成する
また、折角の型チェックの定義を指定しても、実行時にはエラーになるので、テスト関数群`describe`, `it`, `expect...` を使うには、`vite.config.ts` に、`globals: true` の設定が必須です。

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
  }
});
```


## VitestをWatchモードで実行する
全てのテストを実行し、実行後はテストファイルの監視を行います。  
テストファイルの変更を検知すると、そのテストだけが再実行されます。  

```sh
npm run test:watch
```
何もテストコードや対象の実装を行なっていないので、「テストファイルが見当たらない」（`No test files found. You can change the file name pattern by pressing "p"`）というエラーが出るはずです。

テストツールを常実行しておくことで、以下のサイクルを繰り返し行なう時に、テスト結果が `FAIL` から `PASS` へ変わる様実装し、また`PASS`を維持するよう意識してリファクタリングします。

1. `Red🔴: テストを通すコードを書く` => 当然テスト結果は `FAIL` 
2. `Green🟢: テストを通すコードを書く` => テスト結果を `PASS` にする
3. `Refactor🔵: リファクタリングを行う` => テスト結果の `PASS` を維持する


## シンプルな関数のテスト
最も基本的な例として、2つの数値を足し合わせる関数のテストから始めましょう。

### Red🔴： 失敗するテストを書く
まず、テストファイルを作成します。

#### `math.test.ts`
```ts
import { add } from "./math";

describe('add 関数', () => {
  it('2つの数を正しく加算されていること', () => {
    expect(add(1, 2)).toBe(3);
  });
});
```

このテストを実行すると、`add`関数がまだ実装されていないため失敗します。

### Green🟢: テストを通すコードを書く

次に、テストを通すための最小限のコードを実装します。

#### `math.ts`
```ts
export const add = (a: number, b: number): number => a + b;
```

テストを再実行すると、今度は通過するはずです。

### Refactor🔵: リファクタリングを行う
この単純な関数の場合、リファクタリングの必要はありませんが、より複雑な関数ではこの段階でコードを改善します。


## 数値演算関数のテスト
数値を扱う関数のテストでは、通常の計算だけでなく、特殊なケース（ゼロ除算、オーバーフローなど）も考慮する必要があります。

### Red🔴： 失敗するテストを書く
#### `math.test.ts`
```ts
import { add, divide } from "./math";

// describe('add 関数', () => {
// ...

describe('divide 関数', () => {
  it('2つの数を正しく除算されていること', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('0で割ると、`Infinity`を返す', () => {
    expect(divide(10, 0)).toBe(Infinity);
  });

  it('負の数でも正しく除算されていること', () => {
    expect(divide(-10, 2)).toBe(-5);
    expect(divide(10, -2)).toBe(-5);
    expect(divide(-10, -2)).toBe(5);
  });
});
```

### Green🟢: テストを通すコードを書く
#### `math.ts`
```ts
export const divide = (a: number, b: number): number =>  a / b;
```

## 文字列操作関数のテスト
文字列操作関数のテストでは、さまざまな入力パターンを考慮することが重要です。

### Red🔴： 失敗するテストを書く
#### `string.test.ts`
```ts
import { reverseString } from './string';

describe('文字操作関数', () => {
  it('文字列が正しく反転されていること', () => {
    expect(reverseString('hello')).toBe('olleh');
  });

  it('入力が空の場合は空文字列を返すこと', () => {
    expect(reverseString('')).toBe('');
  });

  it('スペースを含む文字列を処理すること', () => {
    expect(reverseString('hello world')).toBe('dlrow olleh');
  });

  it('回文を処理すること', () => {
    expect(reverseString('radar')).toBe('radar');
  });

  it('特殊文字を含む文字列を処理すること', () => {
    expect(reverseString('hello!')).toBe('!olleh');
  });
});
```

### Green🟢: テストを通すコードを書く
#### `string.ts`
```ts
export const reverseString = (str: string): string => 
  str.split('').reverse().join('');
```


## 配列操作関数のテスト
配列操作関数のテストでは、空の配列、大きな配列、異なる型の要素を含む配列など、さまざまなケースを考慮します。


### Red🔴： 失敗するテストを書く
#### `array.test.ts`
```ts
import { filterEvenNumbers } from "./array";

describe('filterEvenNumbers 関数', () => {
  it('配列から偶数をフィルタリングすること', () => {
    expect(filterEvenNumbers([1, 2, 3, 4, 5])).toEqual([2, 4]);
  });

  it('偶数が存在しない場合は空の配列を返すこと', () => {
    expect(filterEvenNumbers([1, 3, 5])).toEqual([]);
  });

  it('入力が空の場合は空の配列を返すこと', () => {
    expect(filterEvenNumbers([])).toEqual([]);
  });

  it('負の偶数を処理すること', () => {
    expect(filterEvenNumbers([-2, -1, 0, 1, 2])).toEqual([-2, 0, 2]);
  });
});
```

### Green🟢: テストを通すコードを書く
#### `array.ts`
```ts
export const filterEvenNumbers = (nums: number[]): Array<number> =>
  nums.filter((num) => num % 2 === 0);

```


## 条件分岐を含む関数のテスト
条件分岐を含む関数のテストでは、各分岐パスを確実にテストすることが重要です。

### Red🔴： 失敗するテストを書く
#### `grade.test.ts`
```ts
import { getGrade } from './grade';

describe('スコア判定 関数', () => {
  it('90 以上のスコアの場合は "A" と評価すること', () => {
    expect(getGrade(90)).toBe('A');
    expect(getGrade(95)).toBe('A');
    expect(getGrade(100)).toBe('A');
  });

  it('80～89 のスコアの場合は "B" と評価すること', () => {
    expect(getGrade(80)).toBe('B');
    expect(getGrade(85)).toBe('B');
    expect(getGrade(89)).toBe('B');
  });

  it('70～79 のスコアの場合は "C" と評価すること', () => {
    expect(getGrade(70)).toBe('C');
    expect(getGrade(75)).toBe('C');
    expect(getGrade(79)).toBe('C');
  });

  it('60～69のスコアの場合は "D" と評価すること', () => {
    expect(getGrade(60)).toBe('D');
    expect(getGrade(65)).toBe('D');
    expect(getGrade(69)).toBe('D');
  });

  it('60未満のスコアの場合は "F" と評価すること', () => {
    expect(getGrade(59)).toBe('F');
    expect(getGrade(30)).toBe('F');
    expect(getGrade(0)).toBe('F');
  });
});

```

### Green🟢: テストを通すコードを書く
#### `grade.ts`
```ts
export const getGrade = (score: number): string => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};
```


## エラーハンドリングのテスト
関数が例外をスローする場合、そのエラーハンドリングロジックもテストする必要があります。

### Red🔴： 失敗するテストを書く

#### `validation.test.ts`
```ts
import { validateUsername } from './validation';

describe('validateUsername 関数', () => {
  it('有効なユーザー名の場合は true を返すこと', () => {
    expect(validateUsername('johndoe')).toBe(true);
    expect(validateUsername('john_doe')).toBe(true);
    expect(validateUsername('john123')).toBe(true);
  });

  it('ユーザー名が 3 文字未満の場合はエラーを返すこと', () => {
    expect(() => validateUsername('jo')).toThrow(
      'ユーザー名は 3 文字以上である必要があります。'
    );
  });

  it('ユーザー名が 20 文字を超える場合はエラーを返すこと', () => {
    expect(() => validateUsername('johndoejohndoejohndoe123')).toThrow(
      'ユーザー名は 20 文字以下でである必要があります。'
    );
  });

  it('ユーザー名に無効な文字が含まれている場合はエラーをスローする', () => {
    expect(() => validateUsername('john@doe')).toThrow(
      'ユーザー名には文字、数字、アンダースコアのみを使用できます。'
    );
  });
});
```

### Green🟢: テストを通すコードを書く

#### `validation.ts`
```ts
export const validateUsername = (username: string): boolean => {
  if (username.length <= 3)
    throw new Error('ユーザー名は 3 文字以上である必要があります。');
  
  if (username.length > 20)
    throw new Error('ユーザー名は 20 文字以下でである必要があります。');

  if (!/^[a-zA-Z0-9_]+$/.test(username))
    throw new Error(
      'ユーザー名には文字、数字、アンダースコアのみを使用できます。'
    );
  return true;
};
```


## 境界値のテスト
境界値テストは、関数の入力範囲の境界に特に注意を払います。

### Red🔴： 失敗するテストを書く

#### `age.test.ts`
```ts
import { isAdult } from './age';

describe('isAdult 関数', () => {
  // 境界値テスト
  it('17 歳の場合は false を返すこと', () => {
    expect(isAdult(17)).toBe(false);
  });

  it('18 歳の場合は true を返すこと', () => {
    expect(isAdult(18)).toBe(true);
  });

  it('19 歳の場合は true を返すこと', () => {
    expect(isAdult(19)).toBe(true);
  });

  // エッジケース（極端な条件下で発生するケース）
  it('マイナスの年齢の場合は false を返すこと', () => {
    expect(isAdult(-1)).toBe(false);
  });

  it('年齢 0 の場合は false を返すこと', () => {
    expect(isAdult(0)).toBe(false);
  });

  // 一般的なケース
  it('典型的な成人年齢の場合、true を返すこと', () => {
    expect(isAdult(30)).toBe(true);
  });
});
```

### Green🟢: テストを通すコードを書く

#### `age.ts`
```ts
export const isAdult = (age: number): boolean => age >= 18;
```

## 実践的なヒント

### 1. 一度に一つのテストケースから始める

TDDでは、一度に一つのテストケースを書いて、それを通過させてから次のテストケースに進むことが重要です。  
これにより、コードの複雑さが徐々に増していき、常に制御可能な状態を保つことができます。

### 2. テストの命名規則に注意する

テストの名前は、何がテストされているのかを明確に示すべきです。  
よく使われるパターンとしては。

- 〜の場合は、〜を返すこと
- 〜の場合は、〜をすること
- 〜の場合は、〜がされること

### 3. AAA（Arrange-Act-Assert）パターンを使用する

テストを構造化するために、AAA（Arrange-Act-Assert）パターンを使用すると良いでしょう。

```ts
describe('add 関数のテスト', () => {

  it('2つの数値を正しく加算すること', () => {
    // Arrange（準備）
    const a = 1;
    const b = 2;

    // Act（実行）
    const result = add(a, b);

    // Assert（検証）
    expect(result).toBe(3);
  });
});
```

> [!NOTE]
> ### AAA（Arrange - Act - Assert）とは？
> AAAパターンは、テストを3つのステップで整理して書くための「構造化されたテンプレート」です。
> |ステップ|意味|目的|
> |---|---|---|
> |Arrange（準備）|テスト対象の関数やオブジェクトに必要な前提条件（入力や環境）を準備する|「状況を整える」|
> |Act（実行）|実際に関数やメソッドを呼び出す|「行動を起こす」|
> |Assert（検証）|結果が期待どおりであるかを検証する|「確認・主張する」|
> 
> 💡 なぜAAAパターンを使うのか？
> - 読みやすく、理解しやすい
> - 他の人がテストの意図をすぐに把握できる
> - テストが複雑になっても構造を崩さず書ける
> - Arrange/Act/Assertの各セクションごとにトラブルシュートしやすい

### 4. テストの独立性を保つ
各テストは他のテストに依存せず、順序に関係なく実行できるようにします。テスト間で状態を共有しないようにしましょう。

### 5. リファクタリングを恐れない
テストがあることで、リファクタリングを安全に行うことができます。コードの振る舞いを変えずに、内部構造を改善するチャンスを逃さないようにしましょう。

## まとめ
基本的な関数のテストは、TDDの基礎を身につけるための最適な出発点です。シンプルな関数からスタートし、徐々により複雑な関数のテストに進むことで、テスト駆動開発のスキルを着実に向上させることができます。

次のセクションでは、[クラスとオブジェクト指向のテスト](./class-and-object-oriented-testing.md)についてです。

## 参考資料
- [Vitest公式ドキュメント](https://vitest.dev/)
- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/)
- Kent Beck著「テスト駆動開発」
