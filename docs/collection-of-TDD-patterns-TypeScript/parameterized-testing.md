# パラメータ化テスト（Parameterized Testing）

パラメータ化テストは、同じテストロジックを異なる入力値で繰り返し実行するためのテクニックです。  
これにより、コードの重複を減らし、テストの網羅性を向上させることができます。  
特に類似した入力で同じロジックをテストする場合に非常に有効です。

## パラメータ化テストの利点

- テストコードの重複を削減
- テストケースの追加が容易
- 入力値とテスト結果の関連が明確
- データ駆動型テストの実現
- 境界値テストの効率化

## TDDサイクルでの使いどころ
- Red🔴: 最初のテストケースを記述したあと、同様のケースを追加するときに有効
- Green🟢: 最小限の実装で通る範囲を広げるときに有効
- Refactor🔵: テストの重複を排除する際に、パラメータ化へと移行

## Vitestでのパラメータ化テスト実装

Vitestでは、`it.each`や`test.each`を使用してパラメータ化テストを実現できます。

### 基本的なパラメータ化テストの例

まず、単純な例として偶数判定関数のテストを作成してみましょう。

### Red🔴： 失敗するテストを書く
#### `isEven.test.ts`

```ts
import { isEven } from '../src/utils/isEven';

type TestParam = {
  input: number;
  expected: boolean;
};

describe('isEven関数のテスト', () => {
  // パラメータ化テスト
  it.each([
    { input: 2, expected: true },
    { input: 3, expected: false },
    { input: 0, expected: true },
    { input: -4, expected: true },
    { input: -7, expected: false },
  ])('isEven($input) は $expected を返す', ({ input, expected }: TestParam) => {
    expect(isEven(input)).toBe(expected);
  });
});
```

### Green🟢: テストを通すコードを書く
#### `isEven.ts`

```ts
export const isEven = (num: number): boolean => num % 2 === 0;
```


### 複数のパラメータを使用する例

割り算関数のテストで、分子・分母・結果の3つのパラメータを使用する例です。


### Red🔴： 失敗するテストを書く
#### `divide.test.ts`

```ts
import { divide } from '../src/utils/math';

describe('divide関数のテスト', () => {
  it.each([
    { a: 10, b: 2, expected: 5 },
    { a: 7, b: 2, expected: 3.5 },
    { a: 0, b: 5, expected: 0 },
    { a: -6, b: 3, expected: -2 },
    { a: -8, b: -4, expected: 2 },
  ])(
    'divide($a, $b) は $expected を返す',
    ({ a, b, expected }: { a: number; b: number; expected: number }) => {
      expect(divide(a, b)).toBe(expected);
    }
  );

  it('0で割ると例外をスローする', () => {
    expect(() => divide(10, 0)).toThrow('ゼロ除算はできません');
  });
});
```
### Green🟢: テストを通すコードを書く
#### `math.ts`

```ts
export const divide = (a: number, b: number): number => {
  if (b === 0) throw new Error('ゼロ除算はできません');
  return a / b;
};
```

### テーブル形式のデータ

より複雑なテストデータは、テーブル形式で記述するとわかりやすくなります。


### Red🔴： 失敗するテストを書く
#### `calculateShipping.test.ts`

```ts
import { calculateShipping } from '../src/utils/shipping';

describe('送料計算関数のテスト', () => {
  it.each`
    weight | destination | expectedCost
    ${0.5} | ${'国内'}   | ${500}
    ${1.0} | ${'国内'}   | ${600}
    ${2.5} | ${'国内'}   | ${800}
    ${0.5} | ${'国際'}   | ${1500}
    ${1.0} | ${'国際'}   | ${2000}
    ${2.5} | ${'国際'}   | ${3500}
  `(
    '$weight kgの荷物を$destinationに送る場合、送料は$expectedCost円',
    ({
      weight,
      destination,
      expectedCost,
    }: {
      weight: number;
      destination: string;
      expectedCost: number;
    }) => {
      expect(calculateShipping(weight, destination)).toBe(expectedCost);
    }
  );
});
```

### Green🟢: テストを通すコードを書く
#### `shipping.ts`

```ts
export const calculateShipping = (
  weight: number,
  destination: string
): number => {
  const isInternational = destination === '国際';

  if (isInternational) {
    if (weight <= 0.5) return 1500;
    if (weight <= 1.0) return 2000;
    return 3500;
  } else {
    if (weight <= 0.5) return 500;
    if (weight <= 1.0) return 600;
    return 800;
  }
};
```


### 非同期関数のパラメータ化テスト

非同期関数もパラメータ化テストで効率的にテストできます。

### Red🔴： 失敗するテストを書く
#### `fetchUserData.test.ts`

```ts
import { fetchUserData } from '../src/services/userService';

describe('ユーザーデータ取得関数のテスト', () => {
  it.each([
    { id: 1, expectedName: 'ユーザー1' },
    { id: 2, expectedName: 'ユーザー2' },
    { id: 3, expectedName: 'ユーザー3' },
  ])(
    'ID:$idのユーザーデータを取得すると名前は$expectedNameである',
    async ({ id, expectedName }: { id: number; expectedName: string }) => {
      const userData = await fetchUserData(id);
      expect(userData.name).toBe(expectedName);
    }
  );

  it.each([-1, 0, 999])(
    '無効なID:%sの場合はエラーをスローする',
    async (invalidId: number) => {
      await expect(fetchUserData(invalidId)).rejects.toThrow(
        'ユーザーが見つかりません'
      );
    }
  );
});
```

### Green🟢: テストを通すコードを書く
#### `userService.ts`

```ts
type UserData = {
  id: number;
  name: string;
};

export const fetchUserData = async (id: number): Promise<UserData> => {
  // 実際の実装ではAPIリクエストなどを行うことが多い
  if (id <= 0 || id > 3) {
    return Promise.reject(new Error('ユーザーが見つかりません'));
  }

  return Promise.resolve({
    id,
    name: `ユーザー${id}`,
  });
};
```


## 境界値テストへの応用

パラメータ化テストは境界値テストと組み合わせると非常に効果的です。

### Red🔴： 失敗するテストを書く
#### `ageRestriction.test.ts`

```ts
import { checkAgeRestriction } from '../src/utils/ageRestriction';

describe('年齢制限チェック関数のテスト', () => {
  // 境界値テスト
  it.each([
    { age: 17, expected: false, description: '境界値未満' },
    { age: 18, expected: true, description: '境界値ちょうど' },
    { age: 19, expected: true, description: '境界値超過' },
    { age: 0, expected: false, description: 'ゼロ' },
    { age: -1, expected: false, description: '負数' },
  ])(
    '年齢$age歳の場合（$description）、結果は$expected',
    ({ age, expected }: { age: number; expected: number }) => {
      expect(checkAgeRestriction(age)).toBe(expected);
    }
  );
});
```

### Green🟢: テストを通すコードを書く
#### `ageRestriction.ts`

```ts
export const checkAgeRestriction = (age: number): boolean => age >= 18;
```


## テスト名の動的生成

テストケースごとに意味のあるテスト名を動的に生成することも可能です。

### Red🔴： 失敗するテストを書く
#### `stringTransform.test.ts`

```ts
import { capitalizeWords } from '../src/utils/stringTransform';

describe('文字列変換関数のテスト', () => {
  const testCases = [
    { input: 'hello world', expected: 'Hello World', desc: '通常の文' },
    {
      input: 'ALREADY UPPERCASE',
      expected: 'Already Uppercase',
      desc: '大文字の文',
    },
    {
      input: 'mixed CASE text',
      expected: 'Mixed Case Text',
      desc: '混合ケース',
    },
    { input: '', expected: '', desc: '空文字列' },
    { input: 'one', expected: 'One', desc: '単語1つ' },
  ];

  testCases.forEach(({ input, expected, desc }) => {
    it(`文字列「${input}」の変換結果は「${expected}」(${desc})`, () => {
      expect(capitalizeWords(input)).toBe(expected);
    });
  });
});

```

### Green🟢: テストを通すコードを書く
#### `stringTransform.ts`

```ts
export const capitalizeWords = (str: string): string => {
  if (!str) return '';

  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
```


## 実践的なパターン：電子メールバリデーション

複数の条件を網羅したメールアドレスバリデーション関数のテスト例です。

### Red🔴： 失敗するテストを書く
#### `emailValidator.test.ts`

```ts
import { validateEmail } from '../src/utils/emailValidator

describe('メールアドレスバリデーション関数のテスト', () => {
  describe('有効なメールアドレス', () => {
    it.each([
      'test@example.com',
      'user.name@domain.co.jp',
      'user+tag@example.org',
      '123@domain.com',
      'email@domain-with-hyphen.com',
    ])('%s は有効なメールアドレスと判定される', (email: string) => {
      expect(validateEmail(email)).toBe(true);
    });
  });

  describe('無効なメールアドレス', () => {
    it.each([
      { email: '', reason: '空文字列' },
      { email: 'plaintext', reason: '@がない' },
      { email: '@domain.com', reason: 'ローカル部がない' },
      { email: 'user@', reason: 'ドメイン部がない' },
      { email: 'user@domain', reason: 'TLDがない' },
      { email: 'user@.com', reason: 'ドメイン名がない' },
      { email: 'user@domain..com', reason: '連続したドット' },
    ])(
      '%s は無効なメールアドレスと判定される（理由: $reason）',
      ({ email }: { email: string }) => {
        expect(validateEmail(email)).toBe(false);
      }
    );
  });
});
```

### Green🟢: テストを通すコードを書く
#### `emailValidator.ts`

```ts
export const validateEmail = (email: string): boolean => {
  if (!email) return false;

  // 簡易的なメール形式の正規表現
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return emailRegex.test(email);
};
```

## まとめ

パラメータ化テストは、TDDプロセスにおいて非常に強力なツールです。類似したテストケースを効率的に記述でき、境界値テストやエッジケースのカバレッジを向上させることができます。テストケースの追加も容易で、コードの保守性も高まります。

Vitestの`it.each`や`test.each`を活用して、効率的なテストコードを書いていきましょう。

### ヒント

1. テストデータが複雑になる場合は、テストファイル外部に分離することも検討する
2. テスト名には、何をテストしているかが明確になるようなパラメータを含める
3. 境界値、正常系、異常系をバランスよくカバーする
4. 実行時間が長いテストは、必要に応じて`it.concurrent.each`で並列実行を検討する