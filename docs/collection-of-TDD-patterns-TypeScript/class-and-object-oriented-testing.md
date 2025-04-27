# クラスとオブジェクト指向のテスト
オブジェクト指向プログラミングの中心であるクラスは、状態（プロパティ）と振る舞い（メソッド）をカプセル化します。  
TypeScriptでTDDを実践する際、クラスのテストは関数のテストとは異なるアプローチが必要になります。  
ここでは、VitestとTypeScriptを使用してクラスをテストするパターンについて記します。

## セットアップ
基本的なセットアップは「基本的な関数のテスト」と同様です。  
Vite + TypeScript + Vitestの環境を準備してください。

```bash
# プロジェクトの作成
npm create vite@latest my-oop-tdd-project -- --template vanilla-ts
# プロジェクトディレクトリに移動
cd my-oop-tdd-project
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
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "allowImportingTsExtensions": false,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"],
}
```

> [!WARNING]
> `"include": ["src/**/*.ts", "tests/**/*.ts"],` の設定は、実装ファイルは `src` に、テストファイルは `tersts` ディレクトリにそれぞれ格納する設定しています。
> ```sh
> /src
>   └─ math.ts
> /tests
>   └─ math.test.ts
> ```

### `vite.config.ts`　を作成する
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
  }
});
```


## シンプルなクラスのテスト
まずは、最も基本的なクラスのテスト例から始めましょう。

### Red🔴: 失敗するテストを書く

#### `counter.test.ts`
```ts
import { Counter } from '../src/counter';

describe('Counter クラス', () => {
  it('初期値が0であること', () => {
    const counter = new Counter();
    expect(counter.getValue()).toBe(0);
  });

  it('increment()で値が1増加すること', () => {
    const counter = new Counter();
    counter.increment();
    expect(counter.getValue()).toBe(1);
  });

  it('decrement()で値が1減少すること', () => {
    const counter = new Counter();
    counter.increment();
    counter.increment();
    counter.decrement();
    expect(counter.getValue()).toBe(1);
  });

  it('reset()で値が0にリセットされること', () => {
    const counter = new Counter();
    counter.increment();
    counter.reset();
    expect(counter.getValue()).toBe(0);
  });

  it('初期値を指定できること', () => {
    const counter = new Counter(10);
    expect(counter.getValue()).toBe(10);
  });
});
```

### Green🟢: テストを通すコードを書く

#### `counter.ts`:

```ts
export class Counter {
  constructor(private value: number = 0) {}

  getValue() {
    return this.value;
  }

  increment() {
    this.value++;
  }

  decrement() {
    this.value--;
  }

  reset() {
    this.value = 0;
  }
}
```

### Refactor🔵: リファクタリングする
この単純なクラスの場合、リファクタリングの必要はありませんが、実際のコードでは以下のようなリファクタリングを検討することがあります。

- 共通のテストセットアップをbeforeEachに移動
- マジックナンバーを定数に置き換え
- カウンターの最小値や最大値の制約を追加


## 値オブジェクトのテスト
**値オブジェクト**は、等価性によって定義される不変のオブジェクトです。例としてEmailやMoneyなどの単純な値をラップして、ドメインに特化した検証やロジックをカプセル化します。

### Red🔴: 失敗するテストを書く

#### `email.test.ts`
```ts
import { Email } from '../src/email';

describe('Email クラス', () => {
  describe('バリデーション', () => {
    it('有効なメールアドレスでインスタンス化できる', () => {
      const email = new Email('user@example.com');
      expect(email.value).toBe('user@example.com');
    });

    it('無効なメールアドレスでインスタンス化するとエラーになる', () => {
      expect(() => new Email('invalid-email')).toThrow(
        '無効なメールアドレス形式です。'
      );
      expect(() => new Email('')).toThrow('無効なメールアドレス形式です。');
    });
  });

  describe('等価性', () => {
    it('同じ値を持つEmailオブジェクトは等しいこと', () => {
      const email1 = new Email('user@example.com');
      const email2 = new Email('user@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('異なる値を持つEmailオブジェクトは等しくないこと', () => {
      const email1 = new Email('user1@example.com');
      const email2 = new Email('user2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('機能', () => {
    it('ドメイン部分を取得できること', () => {
      const email = new Email('user@example.com');
      expect(email.getDomain()).toBe('example.com');
    });

    it('ユーザー名部分を取得できること', () => {
      const email = new Email('user@example.com');
      expect(email.getUsername()).toBe('user');
    });
  });
});
```

### Green🟢: テストを通すコードを書く

#### `email.ts`
```ts
export class Email {
  readonly value: string;

  constructor(value: string) {
    if (!this.isValidEmail(value))
      throw new Error('無効なメールアドレス形式です。');
    this.value = value;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  equals(email: Email): boolean {
    return this.value === email.value;
  }

  getDomain() {
    return this.value.split('@')[1];
  }

  getUsername() {
    return this.value.split('@')[0];
  }
}
```

### Refactor🔵: リファクタリングする
値オブジェクトの例では、より精緻なメールアドレスのバリデーションを追加したり、不変性を確保するためのプライベートプロパティとgetterの使用などを検討できます。


## ドメインオブジェクトのテスト
ドメインオブジェクトは、ビジネスルールやドメインロジックをカプセル化したクラスです。より複雑な振る舞いを持ち、状態の変更を伴うことが多いです。

### Red🔴: 失敗するテストを書く

#### `shopping-cart.test.ts`
```ts
import { Product, ShoppingCart } from '../src/shopping-cart';

describe('ShoppingCart クラス', () => {
  let cart: ShoppingCart;
  const product1: Product = { id: 'p1', name: '商品A', price: 1000 };
  const product2: Product = { id: 'p2', name: '商品B', price: 2000 };

  beforeEach(() => {
    cart = new ShoppingCart();
  });

  it('初期状態は空であること', () => {
    expect(cart.getItems().length).toBe(0);
    expect(cart.getTotal()).toBe(0);
  });

  it('商品を追加できること', () => {
    cart.addItem(product1, 2);
    expect(cart.getItems().length).toBe(1);
    expect(cart.getItems()[0].product).toBe(product1);
    expect(cart.getItems()[0].quantity).toBe(2);
  });

  it('同じ商品を追加すると数量が増加すること', () => {
    cart.addItem(product1, 2);
    cart.addItem(product1, 3);
    expect(cart.getItems().length).toBe(1);
    expect(cart.getItems()[0].quantity).toBe(5);
  });

  it('商品を削除できること', () => {
    cart.addItem(product1, 2);
    cart.addItem(product2, 1);
    cart.removeItem(product1.id);
    expect(cart.getItems().length).toBe(1);
    expect(cart.getItems()[0].product).toBe(product2);
  });

  it('商品の数量を更新できること', () => {
    cart.addItem(product1, 2);
    cart.updateItemQuantity(product1.id, 5);
    expect(cart.getItems()[0].quantity).toBe(5);
  });

  it('数量が0以下なら自動的に削除されること', () => {
    cart.addItem(product1, 2);
    cart.updateItemQuantity(product1.id, 0);
    expect(cart.getItems().length).toBe(0);
  });

  it('合計金額を正しく計算すること', () => {
    cart.addItem(product1, 2); // 1000 * 2 = 2000
    cart.addItem(product2, 3); // 2000 * 3 = 6000
    expect(cart.getTotal()).toBe(8000); // 2000 + 6000 = 8000
  });

  it('カートをクリアできること', () => {
    cart.addItem(product1, 2);
    cart.addItem(product2, 3);
    cart.clear();
    expect(cart.getItems().length).toBe(0);
    expect(cart.getTotal()).toBe(0);
  });
});
```

### Green🟢: テストを通すコードを書く

#### `shopping-cart.ts`
```ts
export type Product = {
  id: string;
  name: string;
  price: number;
};
export type CartItem = {
  product: Product;
  quantity: number;
};
export class ShoppingCart {
  private items: CartItem[];

  constructor() {
    this.items = new Array<CartItem>();
  }

  getItems(): CartItem[] {
    return [...this.items]; //配列のコピーを返して不変性を保持
    // return this.items;
  }

  addItem(product: Product, quantity: number): void {
    const existingSameItem = this.items.find(
      (item) => item.product.id === product.id
    );
    if (existingSameItem) {
      existingSameItem.quantity += quantity;
    } else {
      this.items.push({ product, quantity });
    }
  }

  removeItem(id: string): void {
    this.items = this.items.filter((item) => item.product.id !== id);
  }

  updateItemQuantity(id: string, quantity: number): void {
    if (quantity === 0) {
      this.removeItem(id);
      return;
    }
    const existingSameItem = this.items.find((item) => item.product.id === id);
    if (existingSameItem) {
      existingSameItem.quantity = quantity;
    }
  }

  getTotal(): number {
    return this.items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  }

  clear(): void {
    this.items = new Array<CartItem>();
  }
}
```

### Refactor🔵: リファクタリングする

ShoppingCartクラスのテストでは、テスト用のFixtureを作成したり、特定のテストシナリオに対応するヘルパーメソッドを追加するなどのリファクタリングが考えられます。


## クラス継承のテスト
継承を使用する場合、親クラスの機能と子クラスで拡張または上書きされた機能の両方をテストする必要があります。

### Red🔴: 失敗するテストを書く

#### `shape.test.ts`
```ts
import { Shape, Circle, Rectangle } from '../src/shape';

describe('Shape クラス階層', () => {
  describe('Shape（基底クラス）', () => {
    it('getName()で名前を取得できること', () => {
      const shape = new Shape('基本図形');
      expect(shape.getName()).toBe('基本図形');
    });

    it('面積と周囲長の計算は子クラスで実装されること', () => {
      const shape = new Shape('基本図形');
      expect(() => shape.getArea()).toThrow('子クラスで実装してください');
      expect(() => shape.getPerimeter()).toThrow('子クラスで実装してください');
    });
  });

  describe('Circle（子クラス）', () => {
    it('半径から正しく面積を計算できること', () => {
      const circle = new Circle('円', 5);
      // 面積 = πr²
      const expectedArea = Math.PI * 5 * 5;
      expect(circle.getArea()).toBeCloseTo(expectedArea);
    });

    it('半径から正しく周囲長を計算できること', () => {
      const circle = new Circle('円', 5);
      // 周囲長 = 2πr
      const expectedPerimeter = 2 * Math.PI * 5;
      expect(circle.getPerimeter()).toBeCloseTo(expectedPerimeter);
    });

    it('親クラスのメソッドも継承していること', () => {
      const circle = new Circle('丸', 5);
      expect(circle.getName()).toBe('丸');
    });
  });

  describe('Rectangle（子クラス）', () => {
    it('幅と高さから正しく面積を計算できること', () => {
      const rectangle = new Rectangle('長方形', 4, 5);
      // 面積 = width * height
      expect(rectangle.getArea()).toBe(20);
    });

    it('幅と高さから正しく周囲長を計算できること', () => {
      const rectangle = new Rectangle('長方形', 4, 5);
      // 周囲長 = 2(width + height)
      expect(rectangle.getPerimeter()).toBe(18);
    });

    it('親クラスのメソッドも継承していること', () => {
      const rectangle = new Rectangle('四角形', 4, 5);
      expect(rectangle.getName()).toBe('四角形');
    });

    it('正方形かどうかを判定できること', () => {
      const square = new Rectangle('正方形', 5, 5);
      const rectangle = new Rectangle('長方形', 4, 5);
      expect(square.isSquare()).toBe(true);
      expect(rectangle.isSquare()).toBe(false);
    });
  });
});

```

### Green🟢: テストを通すコードを書く

#### `shape.ts`
```ts
export class Shape {
  constructor(private name: string) {}

  getName(): string {
    return this.name;
  }

  getArea(): number {
    throw new Error('子クラスで実装してください');
  }

  getPerimeter(): number {
    throw new Error('子クラスで実装してください');
  }
}

export class Circle extends Shape {
  constructor(name: string, private radius: number) {
    super(name);
  }
  getArea(): number {
    return Math.PI * this.radius * this.radius;
  }

  getPerimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}
export class Rectangle extends Shape {
  constructor(name: string, private width: number, private height: number) {
    super(name);
  }

  getArea(): number {
    return this.width * this.height;
  }

  getPerimeter(): number {
    return 2 * (this.width + this.height);
  }

  isSquare() {
    return this.width === this.height;
  }
}

```

### Refactor🔵: リファクタリングする
継承を扱うクラスのリファクタリングでは、共通のテスト関数を抽出して再利用したり、より明確な責任分離を検討することがあります。


## インターフェース実装のテスト
TypeScriptのインターフェースを実装するクラスをテストする場合、インターフェースの契約が正しく守られているかを検証します。

### Red🔴: 失敗するテストを書く

#### `logger.test.ts`
```ts
import { ConsoleLogger, FileLogger, ILogger } from '../src/logger';
import type { MockInstance } from 'vitest';
import { appendFileSync } from 'fs';

// モックの設定
vi.mock('fs', () => ({
  appendFileSync: vi.fn(),
}));

// 基本的なロガー機能のチェック関数（テスト内部で使用）
const checkLoggerBasics = (logger: ILogger) => {
  // 基本的な機能性のチェック（テストではない）
  expect(typeof logger.info).toBe('function');
  expect(typeof logger.warn).toBe('function');
  expect(typeof logger.error).toBe('function');

  // 例外をスローしないことの確認
  expect(() => logger.info('情報メッセージ')).not.toThrow();
  expect(() => logger.warn('警告メッセージ')).not.toThrow();
  expect(() => logger.error('エラーメッセージ')).not.toThrow();
};

describe('ConsoleLogger', () => {
  let consoleLogger: ConsoleLogger;
  let consoleInfoSpy: MockInstance;
  let consoleWarnSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleLogger = new ConsoleLogger();
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('基本的な機能を持つこと', () => {
    checkLoggerBasics(consoleLogger);
  });

  it('console.info を呼び出すこと', () => {
    consoleLogger.info('テストメッセージ');
    expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] テストメッセージ');
  });

  it('console.warn を呼び出すこと', () => {
    consoleLogger.warn('テストメッセージ');
    expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] テストメッセージ');
  });

  it('console.error を呼び出すこと', () => {
    consoleLogger.error('テストメッセージ');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] テストメッセージ');
  });
});

describe('FileLogger', () => {
  let fileLogger: FileLogger;

  beforeEach(() => {
    vi.clearAllMocks(); // 各テスト前にモックをクリア
    fileLogger = new FileLogger('test.log');
  });

  it('基本的な機能を持つこと', () => {
    checkLoggerBasics(fileLogger);
  });

  it('fs.appendFileSync を呼び出してログファイルに書き込むこと', () => {
    const testDate = new Date();
    vi.spyOn(global, 'Date').mockImplementation(() => testDate as any);

    fileLogger.info('テストメッセージ');
    expect(appendFileSync).toHaveBeenCalledWith(
      'test.log',
      `${testDate.toISOString()} [INFO] テストメッセージ\n`
    );
  });
});
```

### Green🟢: テストを通すコードを書く

#### `logger.ts`
```ts
import { appendFileSync } from 'fs';
export interface ILogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export class ConsoleLogger implements ILogger {
  info(message: string): void {
    console.info(`[INFO] ${message}`);
  }
  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }
  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}

export class FileLogger implements ILogger {
  constructor(private filepath: string) {}
  info(message: string): void {
    this.appendFileSync('INFO', message);
  }
  warn(message: string): void {
    this.appendFileSync('WARM', message);
  }
  error(message: string): void {
    this.appendFileSync('ERROR', message);
  }
  appendFileSync(level: string, message: string) {
    const logContents = `${new Date().toISOString()} [${level}] ${message}\n`;
    appendFileSync(this.filepath, logContents);
  }
}

```

### Refactor🔵: リファクタリングする
インターフェース実装のテスト例では、共通のテスト関数を使ってDRY原則を守りながら、各実装の特有の振る舞いを検証しています。


## 依存性注入を活用したテスト
クラスが他のクラスやサービスに依存している場合、依存性注入（DI）パターンを使用すると、テスト時にその依存をモックや代替実装に置き換えることができます。

### Red🔴: 失敗するテストを書く

#### `user-service.test.ts`
```ts
import { UserService } from '../src/user-service';
import { IUserRepository, User } from '../src/user-repository';

describe('UserService', () => {
  // モックリポジトリの作成
  let mockRepository: IUserRepository;
  let userService: UserService;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn()
    };
    
    userService = new UserService(mockRepository);
  });

  it('ユーザーを取得できる', async () => {
    const mockUser: User = { id: '1', name: 'テストユーザー', email: 'test@example.com' };
    mockRepository.findById.mockResolvedValue(mockUser);

    const user = await userService.getUserById('1');
    expect(user).toEqual(mockUser);
    expect(mockRepository.findById).toHaveBeenCalledWith('1');
  });

  it('ユーザーが存在しない場合はnullを返す', async () => {
    mockRepository.findById.mockResolvedValue(null);

    const user = await userService.getUserById('999');
    expect(user).toBeNull();
  });

  it('ユーザーを作成できる', async () => {
    const newUser: Omit<User, 'id'> = { name: '新規ユーザー', email: 'new@example.com' };
    const savedUser: User = { id: '2', ...newUser };
    
    mockRepository.save.mockResolvedValue(savedUser);

    const result = await userService.createUser(newUser);
    expect(result).toEqual(savedUser);
    expect(mockRepository.save).toHaveBeenCalledWith(newUser);
  });

  it('存在しないユーザーを更新しようとするとエラーになる', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      userService.updateUser('999', { name: '更新名' })
    ).rejects.toThrow('ユーザーが見つかりません');
  });

  it('ユーザーを更新できる', async () => {
    const existingUser: User = { id: '3', name: '既存ユーザー', email: 'existing@example.com' };
    const updatedUser: User = { ...existingUser, name: '更新後ユーザー' };
    
    mockRepository.findById.mockResolvedValue(existingUser);
    mockRepository.save.mockResolvedValue(updatedUser);

    const result = await userService.updateUser('3', { name: '更新後ユーザー' });
    expect(result).toEqual(updatedUser);
  });

  it('ユーザーを削除できる', async () => {
    mockRepository.delete.mockResolvedValue(true);

    const result = await userService.deleteUser('4');
    expect(result).toBe(true);
    expect(mockRepository.delete).toHaveBeenCalledWith('4');
  });

  it('全ユーザーを取得できる', async () => {
    const mockUsers: User[] = [
      { id: '1', name: 'ユーザー1', email: 'user1@example.com' },
      { id: '2', name: 'ユーザー2', email: 'user2@example.com' },
    ];
    
    mockRepository.findAll.mockResolvedValue(mockUsers);

    const users = await userService.getAllUsers();
    expect(users).toEqual(mockUsers);
    expect(mockRepository.findAll).toHaveBeenCalled();
  });
});
```

### Green🟢: テストを通すコードを書く

#### `user-repository.ts`
```ts
export type User = {
  id: string;
  name: string;
  email: string;
};

export interface IUserRepository {
  findById(userId: string): Promise<User | null>;
  save(user: Omit<User, 'id'> | User): Promise<User>;
  delete(userId: string): Promise<boolean>;
  findAll(): Promise<User[]>;
}

```

#### `user-service.ts`
```ts
import { IUserRepository, User } from './user-repository';

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    return this.userRepository.save(user);
  }
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('ユーザーが見つかりません');
    }
    const updateUser: User = { ...existingUser, ...userData, id };
    return this.userRepository.save(updateUser);
  }
  async deleteUser(userId: string): Promise<boolean> {
    return this.userRepository.delete(userId);
  }
  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}

```

### Refactor🔵: リファクタリングする
依存性注入を使ったテストでは、モックの設定をさらに抽象化したり、テスト間の重複を減らすことでコードをさらに改善できます。


## プライベートメソッドのテスト戦略

プライベートメソッドの直接テストは難しいため、一般的には以下の戦略が取られます：

1. パブリックメソッドを通じて間接的にテストする
2. TypeScriptの特性を活用して、テスト時だけアクセス可能にする
3. テスト用のヘルパーメソッドをクラスに追加する
4. テスト用のサブクラスを作成する

### Red🔴: 失敗するテストを書く

#### `calculator.test.ts`
```ts
import { PriceCalculator } from '../src/calculator';

describe('PriceCalculator', () => {
  let calculator: PriceCalculator;

  beforeEach(() => {
    calculator = new PriceCalculator();
  });

  it('消費税が適用される', () => {
    const price = calculator.calculatePrice(100, 1);
    expect(price).toBe(110); // 100 * 1.1(消費税)
  });

  it('基本金額を計算できる', () => {
    const price = calculator.calculatePrice(100, 2);
    expect(price).toBe(220); // 100 * 2 * 1.1(消費税)
  });

  it('割引が適用される', () => {
    // 10,000円以上で10%割引
    const price = calculator.calculatePrice(6000, 2);
    expect(price).toBe(11880); // 6000 * 2 * 0.9 * 1.1(消費税)
  });

  it('大量注文では特別割引が適用される', () => {
    // 10個以上で追加5%割引
    const price = calculator.calculatePrice(1000, 10);
    expect(price).toBe(9405); // 1000 * 10 * 0.9 * 0.95 * 1.1(消費税)
  });

  // テスト用のサブクラスを使ったプライベートメソッドのテスト
  describe('プライベートメソッドのテスト', () => {
    // テスト用ヘルパークラス
    class TestableCalculator extends PriceCalculator {
      public exposedCalculateDiscount(
        amount: number,
        quantity: number
      ): number {
        return this.calculateDiscount(amount, quantity);
      }
    }

    let testableCalculator: TestableCalculator;

    beforeEach(() => {
      testableCalculator = new TestableCalculator();
    });

    it('割引率が正しく計算される', () => {
      // 通常の注文（割引なし）
      expect(testableCalculator.exposedCalculateDiscount(5000, 1)).toBe(1);

      // 10,000円以上で10%割引
      expect(testableCalculator.exposedCalculateDiscount(10000, 1)).toBe(0.9);

      // 10個以上で追加5%割引
      expect(testableCalculator.exposedCalculateDiscount(1000, 10)).toBe(0.95);
    });
  });
});
```

### Green🟢: テストを通すコードを書く

#### `calculator.ts`
```ts
export class PriceCalculator {
  constructor() {}
  calculatePrice(price: number, quantity: number): number {
    let totalAmount = price * quantity;
    const discount = this.calculateDiscount(totalAmount, quantity);
    totalAmount *= discount;
    totalAmount *= 1.1;
    return Math.round(totalAmount);
  }
  protected calculateDiscount(totalAmount: number, quantity: number): number {
    let discount = 1;
    // 10,000円以上で10%割引
    if (totalAmount >= 10000) discount *= 0.9;

    // 10個以上で追加5%割引
    if (quantity >= 10) discount *= 0.95;

    return discount;
  }
}
```

### Refactor🔵: リファクタリングする

プライベートメソッドのテストでは、以下のようなリファクタリングが考えられます：

1. テスト用のクラス拡張をテストファイル内に閉じ込める
2. テスト対象のプライベートメソッドの責任を明確にする
3. プライベートメソッドの抽出（テストが複雑になる場合）


## 状態変化のテスト
状態を持つクラスでは、メソッドの呼び出しによって状態がどのように変化するかをテストすることが重要です。

### Red🔴: 失敗するテストを書く

#### `bank-account.test.ts`
```ts
import {
  BankAccount,
  InsufficientFundsError,
  AccountStatus,
} from '../src/bank-account';

describe('BankAccount クラス', () => {
  let account: BankAccount;

  beforeEach(() => {
    account = new BankAccount('123456', '山田太郎', 1000);
  });

  it('口座情報を取得できること', () => {
    expect(account.getAccountNumber()).toBe('123456');
    expect(account.getOwnerName()).toBe('山田太郎');
    expect(account.getBalance()).toBe(1000);
    expect(account.getStatus()).toBe(AccountStatus.ACTIVE);
  });

  describe('入金処理', () => {
    it('入金すると残高が増加すること', () => {
      account.deposit(500);
      expect(account.getBalance()).toBe(1500);
    });

    it('負の金額は入金できないこと', () => {
      expect(() => account.deposit(-100)).toThrow(
        '入金額は0より大きい必要があります'
      );
    });

    it('凍結口座には入金できないこと', () => {
      account.freeze();
      expect(() => account.deposit(500)).toThrow(
        '凍結中の口座には操作できません'
      );
    });

    it('閉鎖口座には入金できないこと', () => {
      account.close();
      expect(() => account.deposit(500)).toThrow(
        '閉鎖された口座には操作できません'
      );
    });
  });

  describe('出金処理', () => {
    it('出金すると残高が減少すること', () => {
      account.withdraw(300);
      expect(account.getBalance()).toBe(700);
    });

    it('残高不足の場合は出金できないこと', () => {
      expect(() => account.withdraw(2000)).toThrow(InsufficientFundsError);
      expect(account.getBalance()).toBe(1000); // 残高は変わらない
    });

    it('負の金額は出金できないこと', () => {
      expect(() => account.withdraw(-100)).toThrow(
        '出金額は0より大きい必要があります'
      );
    });

    it('凍結口座からは出金できないこと', () => {
      account.freeze();
      expect(() => account.withdraw(500)).toThrow(
        '凍結中の口座には操作できません'
      );
    });

    it('閉鎖口座からは出金できないこと', () => {
      account.close();
      expect(() => account.withdraw(500)).toThrow(
        '閉鎖された口座には操作できません'
      );
    });
  });

  describe('口座状態管理', () => {
    it('口座を凍結できること', () => {
      account.freeze();
      expect(account.getStatus()).toBe(AccountStatus.FROZEN);
    });

    it('凍結を解除できること', () => {
      account.freeze();
      account.unfreeze();
      expect(account.getStatus()).toBe(AccountStatus.ACTIVE);
    });

    it('閉鎖された口座は凍結解除できないこと', () => {
      account.close();
      expect(() => account.unfreeze()).toThrow(
        '閉鎖された口座には操作できません'
      );
    });

    it('口座を閉鎖できること', () => {
      account.close();
      expect(account.getStatus()).toBe(AccountStatus.CLOSED);
    });

    it('閉鎖された口座は再開できないこと', () => {
      account.close();
      expect(() => account.unfreeze()).toThrow(
        '閉鎖された口座には操作できません'
      );
    });
  });

  describe('取引履歴', () => {
    it('入金が履歴に記録されること', () => {
      account.deposit(500);
      const history = account.getTransactionHistory();
      expect(history.length).toBe(1);
      expect(history[0].type).toBe('deposit');
      expect(history[0].amount).toBe(500);
    });

    it('出金が履歴に記録されること', () => {
      account.withdraw(200);
      const history = account.getTransactionHistory();
      expect(history.length).toBe(1);
      expect(history[0].type).toBe('withdraw');
      expect(history[0].amount).toBe(200);
    });
  });
});

```

### Green🟢: テストを通すコードを書く

#### `bank-account.ts`
```ts
export class InsufficientFundsError implements Error {
  name: string = '残高不足';
  message: string = '残高不足です。';
  stack?: string | undefined;
}

export enum AccountStatus {
  ACTIVE,
  FROZEN,
  CLOSED,
}

export type Transaction = {
  type: 'deposit' | 'withdraw';
  amount: number;
  date: Date;
};

export class BankAccount {
  private status: AccountStatus;
  public history: Transaction[] = [];
  constructor(
    private accountNumber: string,
    private ownerName: string,
    private balance: number
  ) {
    this.status = AccountStatus.ACTIVE;
  }
  getAccountNumber(): string {
    return this.accountNumber;
  }
  getOwnerName(): string {
    return this.ownerName;
  }
  getBalance(): number {
    return this.balance;
  }
  getStatus(): AccountStatus {
    return this.status;
  }
  deposit(amount: number): void {
    if (amount <= 0) throw new Error('入金額は0より大きい必要があります');
    this.checkAccountActive();
    this.balance += amount;
    this.history.unshift({ type: 'deposit', amount, date: new Date() });
    console.log(this.history);
  }
  withdraw(amount: number): void {
    if (amount < 0) throw new Error('出金額は0より大きい必要があります');
    if (this.balance - amount < 0) throw new InsufficientFundsError();
    this.checkAccountActive();
    this.balance -= amount;
    this.history.unshift({ type: 'withdraw', amount, date: new Date() });
    console.log(this.history);
  }
  checkAccountActive() {
    if (this.status === AccountStatus.FROZEN)
      throw new Error('凍結中の口座には操作できません');
    if (this.status === AccountStatus.CLOSED)
      throw new Error('閉鎖された口座には操作できません');
  }
  freeze() {
    this.status = AccountStatus.FROZEN;
  }
  unfreeze() {
    if (this.status === AccountStatus.CLOSED)
      throw new Error('閉鎖された口座には操作できません');
    this.status = AccountStatus.ACTIVE;
  }
  close() {
    this.status = AccountStatus.CLOSED;
  }
  getTransactionHistory() {
    return this.history;
  }
}
```

### Refactor🔵: リファクタリングする
状態を持つクラスのリファクタリングでは、状態遷移をよりわかりやすく表現することを考慮します。たとえば、状態パターンを導入したり、不変条件をより明確にすることが考えられます。


## 実践的なヒント

### 1. AAA（Arrange-Act-Assert）パターンを使う
クラスのテストでも、各テストで「準備（Arrange）」「実行（Act）」「検証（Assert）」の流れを維持することで、テストの意図が明確になります。

```ts
it('入金するとバランスが増加する', () => {
  // Arrange
  const account = new BankAccount('123', 'テスト太郎', 1000);
  
  // Act
  account.deposit(500);
  
  // Assert
  expect(account.getBalance()).toBe(1500);
});
```

### 2. テスト用のファクトリ関数を作成する
複雑なオブジェクトをテストで何度も作成する場合は、ファクトリ関数を使うと便利です。

```ts
// テスト用のヘルパー関数
const createUser = (overrides = {}): User => {
  return {
    id: '1',
    name: 'テストユーザー',
    email: 'test@example.com',
    ...overrides
  };
}

it('ユーザー名を更新できる', () => {
  const user = createUser();
  const updatedUser = { ...user, name: '新しい名前' };
  // ...テストコード...
});
```

### 3. オブジェクトの等価性に注意する
オブジェクトを比較する場合は、`toBe`（厳密な等価性）ではなく`toEqual`（構造的等価性）を使います。
```ts
it('ユーザー情報が正しく取得される', () => {
  const expectedUser = { id: '1', name: 'テスト太郎' };
  const actualUser = userService.getUserById('1');
  
  // 正しい比較方法（構造的等価性）
  expect(actualUser).toEqual(expectedUser);
  
  // 間違った比較方法（参照の等価性）
  // expect(actualUser).toBe(expectedUser); // これは通常失敗する
});
```

### 4. テストダブルの選択

テスト対象のクラスが他のコンポーネントに依存している場合、適切なテストダブルを選択することが重要です。

- **スタブ（Stub）**: 単純なダミー実装で、特定の値を返すだけ
- **モック（Mock）**: 呼び出されたことを記録し、どのように呼び出されたかを検証できる
- **スパイ（Spy）**: 実際のオブジェクトをラップして呼び出しを記録する
- **フェイク（Fake）**: より複雑だが軽量な実装（例：インメモリDBなど）

```ts
// スタブの例
const userRepositoryStub = {
  findById: () => ({ id: '1', name: 'テストユーザー' })
};

// モックの例
const userRepositoryMock = {
  findById: vi.fn().mockReturnValue({ id: '1', name: 'テストユーザー' })
};

// テスト内で検証
expect(userRepositoryMock.findById).toHaveBeenCalledWith('1');
```

### 5. 非同期テストに注意する

クラスメソッドが非同期の場合、適切に`async/await`または`Promise`を使ってテストします。

```ts
it('ユーザーを非同期で取得できる', async () => {
  const userService = new UserService(mockRepository);
  const user = await userService.getUserById('1');
  expect(user).toEqual({ id: '1', name: 'テストユーザー' });
});
```


## まとめ
クラスとオブジェクト指向のテストは、関数のテストよりも複雑になることがありますが、適切なテスト戦略を選択することで効果的にテストできます。主なポイントは以下の通りです：

1. クラスの責任を明確にし、シングルレスポンシビリティ原則を守る
2. 依存性注入などのパターンを使って、テスタビリティを高める設計を心がける
3. 状態変化のテストでは、すべての状態遷移パスをカバーする
4. プライベートメソッドは公開インターフェースを通じてテストする
5. テストダブルを活用して、外部依存を制御する

適切なテストを書くことで、リファクタリングや機能追加時の安全性を確保し、コードの品質を維持することができます。

次のセクションでは、[非同期処理のテスト](./asynchronous-processing-testing.md)についてです。


## 参考資料
- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/)
- [Vitest公式ドキュメント](https://vitest.dev/)
- Kent Beck著「テスト駆動開発」
- Martin Fowler著「リファクタリング: 既存のコードを安全に改善する」
- Eric Evans著「ドメイン駆動設計」
