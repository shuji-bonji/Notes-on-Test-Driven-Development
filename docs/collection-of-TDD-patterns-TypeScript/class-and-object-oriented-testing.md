# クラスとオブジェクト指向のテスト

## ユースケース
- バリデーション済の値として取り扱いたい（例：Email, Money, Quantity）

## 例: メールオブジェクト生成
### Red
#### `test/utils/email.test.ts`
```ts
describe('メールオブジェクト生成時のアドレス書式検証', () => {
  it('不正なメールアドレス形式なら、エラー', () => {
    expect(() => new Email('invalid')).toThrow();
  });
  it('正しい形式ならインスタンス化される', () => {
    const email = new Email('user@example.com');
    expect(email.value).toBe('user@example.com');
  });
});

```

### Green → Refactor
#### `src/utils/emai.ts`
```ts
export class Email {
  constructor(public readonly value: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error('Invalid email format');
    }
  }
}

```

## ユースケース
- ドメインロジックとアプリケーションサービスの分離

## 例: メールオブジェクト生成
### Red
#### `test/service/user-service.test.ts`
```ts
describe('メールオブジェクト生成時のアドレス書式検証', () => {
  it('不正なメールアドレス形式なら、エラー', () => {
    expect(() => new Email('invalid')).toThrow();
  });
  it('正しい形式ならインスタンス化される', () => {
    const email = new Email('user@example.com');
    expect(email.value).toBe('user@example.com');
  });
});

```

### Green
#### `src/utils/emai.ts`
```ts
export class Email {
  constructor(public readonly value: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error('Invalid email format');
    }
  }
}

```

## ショッピングカート

### Red
```ts
describe('ShoppingCart', () => {
  let cart: ShoppingCart;
  
  beforeEach(() => {
    cart = new ShoppingCart();
  });
  
  it('初期状態で空であること', () => {
    expect(cart.getItems().length).toBe(0);
    expect(cart.getTotal()).toBe(0);
  });
  
  it('商品を追加できること', () => {
    cart.addItem({ id: '1', name: '商品A', price: 100 });
    expect(cart.getItems().length).toBe(1);
  });
  
  it('合計金額が正しく計算されること', () => {
    cart.addItem({ id: '1', name: '商品A', price: 100 });
    cart.addItem({ id: '2', name: '商品B', price: 200 });
    expect(cart.getTotal()).toBe(300);
  });
  
  it('商品を削除できること', () => {
    cart.addItem({ id: '1', name: '商品A', price: 100 });
    cart.removeItem('1');
    expect(cart.getItems().length).toBe(0);
  });
});

```


### Green → Refactor
```ts
interface CartItem {
  id: string;
  name: string;
  price: number;
}

class ShoppingCart {
  private items: CartItem[] = [];
  
  addItem(item: CartItem): void {
    this.items.push(item);
  }
  
  removeItem(id: string): void {
    this.items = this.items.filter(item => item.id !== id);
  }
  
  getItems(): CartItem[] {
    return [...this.items];
  }
  
  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
}
```