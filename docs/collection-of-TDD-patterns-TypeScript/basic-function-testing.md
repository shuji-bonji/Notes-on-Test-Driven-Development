# 基本的な関数のテスト

## ユースケース
- 単純なロジック、検証関数、変換処理、マッチングなど

## 例: メールアドレス書式検証
### Red
#### `test/utils/email.test.ts`
```ts
import { isValidEmail } from '../../src/utils/email';
describe('メールアドレス書式検証', () => {
  it('正しいメール形式なら true を返す', () => {
    expect(isValidEmail('test@example.com')).toBeTruthy();
  });
  it('不正なメールs形式なら false を返す', () => {
    expect(isValidEmail('hoge')).toBeFalsy();
  });
});

```

### Green → Refactor
#### `src/utils/emai.ts`
```ts
export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

```

## 例: 内税金額
### Red

```typescript
// テスト
describe('calculateTotal', () => {
  it('価格と税率から合計金額を計算できる', () => {
    expect(calculateTotal(1000, 0.1)).toBe(1100);
  });
  
  it('税率が0の場合は価格をそのまま返す', () => {
    expect(calculateTotal(1000, 0)).toBe(1000);
  });
  
  it('負の金額の場合はエラーをスローする', () => {
    expect(() => calculateTotal(-100, 0.1)).toThrow('金額は正の数である必要があります');
  });
});
```

### Green → Refactor

```typescript
function calculateTotal(price: number, taxRate: number): number {
  if (price < 0) {
    throw new Error('金額は正の数である必要があります');
  }
  return price * (1 + taxRate);
}
```
