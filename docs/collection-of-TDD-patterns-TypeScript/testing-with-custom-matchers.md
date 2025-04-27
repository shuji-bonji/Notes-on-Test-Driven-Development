# カスタムマッチャーを使ったテスト
テストコードを書く際、アサーションはテストの中で最も重要な部分の一つです。  
Vitestや他のテストフレームワークは多くの標準マッチャー（`toBe`、`toEqual`、`toContain`など）を提供していますが、特定のユースケースには標準マッチャーだけでは不十分な場合があります。

カスタムマッチャーを作成することで、テストをより読みやすく、表現力豊かにし、エラーメッセージをより具体的にすることができます。ここでは、TypeScriptでカスタムマッチャーを作成・使用する方法について記します。

## カスタムマッチャーとは

カスタムマッチャーは、標準のアサーションメソッドを拡張して、特定のユースケースに合わせたアサーションを作成するものです。  これにより以下のメリットがあります。

|メリット|内容|
|---|---|
|読みやすさの向上|意図を明確に表現するマッチャー名を使用できる|
|再利用性|同じチェックを複数のテストで再利用できる|
|エラーメッセージの改善|より具体的で役立つエラーメッセージを提供できる|
|抽象化|複雑なチェックロジックを抽象化してシンプルなインターフェースで提供できる|


## 環境のセットアップ

カスタムマッチャーを使用するためには、適切な環境設定が必要です。  
以下にVitestとTypeScriptを使った環境設定の手順を説明します。

### 1. プロジェクトのセットアップ

まず、Vite + TypeScript + Vitestのプロジェクトをセットアップします：

```bash
# プロジェクトの作成
npm create vite@latest my-tdd-project -- --template vanilla-ts

# プロジェクトディレクトリに移動
cd my-tdd-project

# Vitestのインストール
npm install -D vitest
```

### 2. `package.json`にテスト用のスクリプトを追加

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 3. `vite.config.ts`の作成

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts']
  }
});
```

### 4. カスタムマッチャーの型定義ファイルの作成

TypeScriptを使用する場合、カスタムマッチャーの型定義が必要です。以下のファイルを作成します。

#### `src/test/custom-matchers.d.ts`

```ts
/// <reference types="vitest" />

declare module 'vitest' {
  interface Assertion<T = any> {
    // 基本的なカスタムマッチャー
    toBeEvenNumber(): T;
    toBeOddNumber(): T;
    toBeWithinRange(floor: number, ceiling: number): T;
    
    // 追加のカスタムマッチャー
    toBeValidEmail(): T;
    toHaveProperty(property: string, value?: any): T;
    toBeEmptyObject(): T;
  }

  // 非対称マッチャー用の型定義（expect.extend()と一緒に使う場合）
  interface AsymmetricMatchersContaining {
    toBeEvenNumber(): any;
    toBeOddNumber(): any;
    toBeWithinRange(floor: number, ceiling: number): any;
    toBeValidEmail(): any;
    toHaveProperty(property: string, value?: any): any;
    toBeEmptyObject(): any;
  }
}
```

### 5. セットアップファイルの作成

カスタムマッチャーを登録するセットアップファイルを作成します。

#### `src/test/setup.ts`

```ts
import { expect } from 'vitest';
import './matchers';

// 他のグローバルセットアップコードがあればここに追加
```

### 6. カスタムマッチャーのフォルダとインデックスファイルの作成

#### `src/test/matchers/index.ts`

```ts
import './toBeEvenNumber';
import './toBeOddNumber';
import './toBeWithinRange';
// 追加のマッチャーがあれば、ここにインポートする
```

### 7. `tsconfig.json`の設定

TypeScriptがカスタムマッチャーの型定義を認識するように設定します。

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "node",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "noImplicitReturns": true,
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}

```

これで、カスタムマッチャーを使用するための環境が整いました。

## 基本的なカスタムマッチャーの作成

では、いくつかの基本的なカスタムマッチャーを作成していきましょう。各マッチャーは独自のファイルに配置します。

### 偶数チェックのカスタムマッチャー

#### `src/test/matchers/toBeEvenNumber.ts`
```ts
expect.extend({
  toBeEvenNumber(received: unknown) {
    if (typeof received !== 'number') {
      return {
        pass: false,
        message: () => `期待値は数値ですが、 ${typeof received} のようです。`
      };
    }

    const pass = received % 2 === 0;    
    return {
      pass: received % 2 === 0,
      message: () => 
        `${received} は、偶数で${pass ? 'す' : 'はありません'}。`
    };
  }
});
```

### 奇数チェックのカスタムマッチャー

#### `src/test/matchers/toBeOddNumber.ts`
```ts
expect.extend({
  toBeOddNumber(received: unknown) {
    if (typeof received !== 'number') {
      return {
        pass: false,
        message: () => `期待値は数値ですが、 ${typeof received} のようです。`
      };
    }

    const pass = received % 2 !== 0;    
    return {
      pass,
      message: () => 
        `${received} は、奇数で${pass ? 'す' : 'はありません'}。`
    };
  }
});
```

### 範囲チェックのカスタムマッチャー

#### `src/test/matchers/toBeWithinRange.ts`
```ts
expect.extend({
  toBeWithinRange(received: unknown, floor: unknown, ceiling: unknown) {
    if (typeof received !== 'number' ||
        typeof floor !== 'number' ||
        typeof ceiling !== 'number') {
      return {
        pass: false,
        message: () =>
          `すべての引数は number である必要があります。`
      };
    }
  
    const pass = received >= floor && received <= ceiling;
  
    return {
      pass,
      message: () =>
        `${received} は、範囲(${floor} ~ ${ceiling})内で${pass ? 'す' : 'はありません'}。`
    };
  }
});
```

### カスタムマッチャーのテスト

環境とカスタムマッチャーが正しく設定されているかを確認するテストを作成します。

#### `src/test/custom-matchers.test.ts`

```ts
import { describe, it, expect } from 'vitest';

describe('カスタムマッチャー', () => {
  describe('toBeEvenNumber', () => {
    it('偶数の場合にパスする', () => {
      expect(2).toBeEvenNumber();
      expect(4).toBeEvenNumber();
      expect(0).toBeEvenNumber();
      expect(-2).toBeEvenNumber();
    });

    it('奇数の場合に失敗する', () => {
      expect(1).not.toBeEvenNumber();
      expect(3).not.toBeEvenNumber();
      expect(-1).not.toBeEvenNumber();
    });
  });

  describe('toBeOddNumber', () => {
    it('奇数の場合にパスする', () => {
      expect(1).toBeOddNumber();
      expect(3).toBeOddNumber();
      expect(-1).toBeOddNumber();
    });

    it('偶数の場合に失敗する', () => {
      expect(2).not.toBeOddNumber();
      expect(4).not.toBeOddNumber();
      expect(0).not.toBeOddNumber();
      expect(-2).not.toBeOddNumber();
    });
  });

  describe('toBeWithinRange', () => {
    it('範囲内の値の場合にパスする', () => {
      expect(5).toBeWithinRange(1, 10);
      expect(1).toBeWithinRange(1, 10);
      expect(10).toBeWithinRange(1, 10);
    });

    it('範囲外の値の場合に失敗する', () => {
      expect(0).not.toBeWithinRange(1, 10);
      expect(11).not.toBeWithinRange(1, 10);
      expect(-5).not.toBeWithinRange(1, 10);
    });
  });
});
```

## 実践的なカスタムマッチャーの例

より実践的なカスタムマッチャーをいくつか追加していきましょう。

### Eメールバリデーションマッチャー

#### `src/test/matchers/toBeValidEmail.ts`

```ts
expect.extend({
  toBeValidEmail(received: unknown) {
    if (typeof received !== 'string') {
      return {
        pass: false,
        message: () => `期待値は文字列ですが、 ${typeof received} のようです。`
      };
    }
    // 簡単なEメール検証正規表現（実際のプロジェクトではより堅牢な実装が必要）
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      pass,
      message: () =>
        `${received} は、有効なメールアドレスで${pass ? 'す' : 'ではありません'}。`
    };
  }
});
```

### オブジェクトプロパティチェックマッチャー

#### `src/test/matchers/toHaveProperty.ts`

```ts
expect.extend({
  toHaveProperty(received: unknown, property: string, value?: unknown): { pass: boolean; message: () => string } {
    const isObject = typeof received === 'object' && received !== null;

    if (!isObject) {
      return {
        pass: false,
        message: () => `${this.utils.printReceived(received)} はオブジェクトではありません。`
      };
    }

    const obj = received as Record<string, unknown>;
    const hasProperty = property in obj;

    const valueMatches =
      value === undefined ? true : hasProperty && this.equals(obj[property], value);

    const pass = hasProperty && valueMatches;

    if (pass) {
      return {
        pass: true,
        message: () => {
          if (value === undefined) {
            return `${this.utils.printReceived(obj)} にプロパティ ${this.utils.printExpected(property)} が存在します。`;
          }
          return `${this.utils.printReceived(obj)} に、値 ${this.utils.printExpected(value)} を持つプロパティ ${this.utils.printExpected(property)} が存在します。`;
        }
      };
    }

    if (!hasProperty) {
      return {
        pass: false,
        message: () =>
          `${this.utils.printReceived(obj)} にプロパティ ${this.utils.printExpected(property)} は存在しません。`
      };
    }

    return {
      pass: false,
      message: () =>
        `${this.utils.printReceived(obj)} に、値 ${this.utils.printExpected(value)} を持つプロパティ ${this.utils.printExpected(property)} が存在することを期待しましたが、実際の値は ${this.utils.printReceived(obj[property])} でした。`
    };
  }
});
```

### 空オブジェクトチェックマッチャー

#### `src/test/matchers/toBeEmptyObject.ts`

```ts
expect.extend({
  toBeEmptyObject(received: unknown) {
    const isObject = typeof received === 'object' && received !== null;

    if (!isObject) {
      return {
        pass: false,
        message: () => `${this.utils.printReceived(received)} はオブジェクトではありません。`
      };
    }

    const pass = !Array.isArray(received) && 
                 Object.keys(received).length === 0;
    
    return {
      pass,
      message: () =>
        `${this.utils.printReceived(received)} は、空のオブジェクトで${pass ? 'す ' : 'はありません'}。`
    };
  }
});
```


### 追加したカスタムマッチャーをインデックスファイルに追加

#### `src/test/matchers/index.ts`

```ts
import './toBeEvenNumber';
import './toBeOddNumber';
import './toBeWithinRange';
import './toBeValidEmail'; // 追加
import './toHaveProperty'; // 追加
import './toBeEmptyObject'; // 追加
// 追加のマッチャーがあれば、ここにインポートする
```

### 追加マッチャーのテスト

#### `src/test/additional-matchers.test.ts`

```ts
describe('追加のカスタムマッチャー', () => {
  describe('toBeValidEmail', () => {
    it('有効なメールアドレスの場合にパスする', () => {
      expect('user@example.com').toBeValidEmail();
      expect('user.name@example.co.jp').toBeValidEmail();
      expect('user+tag@example.com').toBeValidEmail();
    });

    it('無効なメールアドレスの場合に失敗する', () => {
      expect('userexample.com').not.toBeValidEmail();
      expect('user@').not.toBeValidEmail();
      expect('@example.com').not.toBeValidEmail();
      expect('').not.toBeValidEmail();
    });
  });

  describe('toHaveProperty', () => {
    it('オブジェクトがプロパティを持つ場合にパスする', () => {
      const obj = { name: 'John', age: 30 };
      expect(obj).toHaveProperty('name');
      expect(obj).toHaveProperty('age');
      expect(obj).toHaveProperty('name', 'John');
      expect(obj).toHaveProperty('age', 30);
    });

    it('オブジェクトがプロパティを持たない場合に失敗する', () => {
      const obj = { name: 'John', age: 30 };
      expect(obj).not.toHaveProperty('email');
      expect(obj).not.toHaveProperty('name', 'Jane');
      expect(obj).not.toHaveProperty('age', 25);
    });
  });

  describe('toBeEmptyObject', () => {
    it('空のオブジェクトの場合にパスする', () => {
      expect({}).toBeEmptyObject();
    });

    it('空でないオブジェクトの場合に失敗する', () => {
      expect({ name: 'John' }).not.toBeEmptyObject();
      expect([]).not.toBeEmptyObject(); // 配列は空オブジェクトとみなさない
      expect(null).not.toBeEmptyObject();
    });
  });
});
```


## カスタムマッチャーライブラリの活用

独自のカスタムマッチャーを作成する代わりに、既存のライブラリを活用することもできます。

### jest-extendedの使用

jest-extendedは、Vitestの互換モードでも使用できる多機能なカスタムマッチャーライブラリです。

#### インストール

```bash
npm install --save-dev jest-extended
```

#### セットアップ

`src/test/setup.ts`を修正して、jest-extendedをインポートします：

```ts
import { expect } from 'vitest';
import 'jest-extended';
import './matchers';

// 他のセットアップコード...
```

#### カスタム型定義の追加

jest-extendedが提供するマッチャーの型定義も必要です。以下のように`custom-matchers.d.ts`に追加します.

```ts
/// <reference types="vitest" />
/// <reference types="jest-extended" />

declare module 'vitest' {
  interface Assertion<T = any> {
    // 既存のカスタムマッチャー
    toBeEvenNumber(): T;
    toBeOddNumber(): T;
    // ... その他のカスタムマッチャー
  }

  interface AsymmetricMatchersContaining {
    // 既存のカスタムマッチャー
    toBeEvenNumber(): any;
    toBeOddNumber(): any;
    // ... その他のカスタムマッチャー
  }
}
```

### jest-extendedの使用例

```ts
import { describe, it, expect } from 'vitest';

describe('jest-extendedマッチャー', () => {
  it('配列に関するマッチャー', () => {
    expect([1, 2, 3]).toBeArrayOfSize(3);
    expect([1, 2, 3]).toIncludeAllMembers([2, 1]);
    expect([{ a: 1 }, { a: 2 }]).toSatisfyAll(item => item.a > 0);
  });

  it('数値に関するマッチャー', () => {
    expect(10).toBeWithin(5, 15);
    expect(10).toBePositive();
    expect(-5).toBeNegative();
  });

  it('文字列に関するマッチャー', () => {
    expect('hello world').toStartWith('hello');
    expect('hello world').toEndWith('world');
    expect('hello').toBeString();
  });

  it('真偽値に関するマッチャー', () => {
    expect(true).toBeBoolean();
    expect(false).toBeFalse();
    expect(null).toBeNil();
  });
});
```

## 実践的なヒント

### 1. カスタムマッチャーの分離と組織化

カスタムマッチャーが増えてきたら、ドメインやタイプごとにフォルダに分類すると管理しやすくなります。

```
src/
  test/
    matchers/
      basic/
        toBeEvenNumber.ts
        toBeOddNumber.ts
      date/
        toBeDate.ts
        toBeBefore.ts
        toBeAfter.ts
      api/
        toBeSuccessResponse.ts
        toHaveHeader.ts
      index.ts
```

`index.ts`では、すべてのマッチャーをまとめてインポートします。

```ts
// 基本マッチャー
import './basic/toBeEvenNumber';
import './basic/toBeOddNumber';

// 日付マッチャー
import './date/toBeDate';
import './date/toBeBefore';
import './date/toBeAfter';

// APIマッチャー
import './api/toBeSuccessResponse';
import './api/toHaveHeader';
```

### 2. エラーメッセージの改善

より詳細で分かりやすいエラーメッセージを提供することで、テスト失敗時のデバッグが容易になります。

```ts
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = typeof received === 'number' && 
                 received >= floor && 
                 received <= ceiling;
    
    if (pass) {
      return {
        pass: true,
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`
      };
    } else {
      // より詳細なエラーメッセージ
      let detail = '';
      if (typeof received !== 'number') {
        detail = `received value is not a number (type: ${typeof received})`;
      } else if (received < floor) {
        detail = `it's ${floor - received} below the minimum`;
      } else if (received > ceiling) {
        detail = `it's ${received - ceiling} above the maximum`;
      }
      
      return {
        pass: false,
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling} (${detail})`
      };
    }
  }
});
```

### 3. ユーティリティ関数の活用

Vitestには、出力フォーマットに役立つユーティリティ関数が用意されています。

```ts
expect.extend({
  toHaveProperty(received, property, value) {
    // ...
    
    return {
      pass: false,
      message: () =>
        `expected ${this.utils.printReceived(received)} to have property ` +
        `${this.utils.printExpected(property)} with value ` +
        `${this.utils.printExpected(value)}, but got ` +
        `${this.utils.printReceived(received[property])}`
    };
  }
});
```

`this.utils`は以下のような便利なメソッドを提供しています。

- `printReceived`: 実際の値を整形して表示
- `printExpected`: 期待値を整形して表示
- `diff`: 値の差分を表示
- `matcherHint`: マッチャーのヒントメッセージを作成

### 4. 非同期マッチャーの作成

非同期処理を行うマッチャーも作成できます。

```ts
expect.extend({
  async toEventuallyEqual(received, expected, { timeout = 1000, interval = 50 } = {}) {
    const startTime = Date.now();
    let lastValue;
    
    // 関数または値をサポート
    const getValue = typeof received === 'function' ? received : () => received;
    
    try {
      while (Date.now() - startTime < timeout) {
        lastValue = await getValue();
        
        if (this.equals(lastValue, expected)) {
          return {
            pass: true,
            message: () =>
              `expected value to eventually not equal ${this.utils.printExpected(expected)}`
          };
        }
        
        // インターバルを待つ
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      
      // タイムアウト
      return {
        pass: false,
        message: () =>
          `expected value to eventually equal ${this.utils.printExpected(expected)} ` +
          `but it remained ${this.utils.printReceived(lastValue)} after ${timeout}ms`
      };
    } catch (error) {
      return {
        pass: false,
        message: () => 
          `error occurred while waiting: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
});
```

使用例：

```ts
test('値が最終的に期待値になること', async () => {
  let counter = 0;
  const increaseCounter = () => {
    counter++;
    return counter;
  };
  
  await expect(() => increaseCounter()).toEventuallyEqual(3, { timeout: 2000 });
});
```

### 5. カスタムマッチャー自体のテスト

カスタムマッチャー自体もテストすることで、品質を確保できます。

```ts
describe('toBeEvenNumber マッチャーのテスト', () => {
  it('正しく偶数を判定できる', () => {
    const result = expect.toBeEvenNumber.call(
      { utils: expect.getState().utils },
      2
    );
    
    expect(result.pass).toBe(true);
  });
  
  it('正しく奇数を判定できる', () => {
    const result = expect.toBeEvenNumber.call(
      { utils: expect.getState().utils },
      3
    );
    
    expect(result.pass).toBe(false);
  });
  
  it('適切なエラーメッセージを生成する', () => {
    const result = expect.toBeEvenNumber.call(
      { utils: expect.getState().utils },
      3
    );
    
    expect(result.message()).toContain('expected 3 to be an even number');
  });
});
```

## まとめ

カスタムマッチャーは、テストコードの可読性、保守性、および再利用性を向上させる強力なツールです。特に繰り返し使用するチェックパターンや、特定のドメインに関連する検証には、カスタムマッチャーを作成することで大きな効果を得られます。

Vitestやその他のテストフレームワークでは、カスタムマッチャーを簡単に作成・拡張できるAPIが提供されており、TypeScriptの型定義を適切に設定することで、型安全な状態でカスタムマッチャーを使用することができます。

プロジェクト特有の要件に合わせたカスタムマッチャーを作成し、テストコードの品質を向上させましょう。

次のセクションでは、[パラメータ化テスト](./parameterized-testing.md)についてです。