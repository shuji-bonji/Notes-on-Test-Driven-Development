# モックとスタブを使用したテスト
実際のアプリケーション開発では、テスト対象のコードが外部システムやサービスに依存していることが多くあります。  
データベースへのアクセス、APIコール、ファイルシステムの操作など、これらの外部依存はテストを複雑にし、実行速度を低下させる原因となります。

ここでは、モックとスタブを使用して外部依存を分離し、効率的かつ信頼性の高いテストを実現する方法について記します。

## 目次

1. [モックとスタブの概念](#モックとスタブの概念)
2. [Vitestでのモック作成](#vitestでのモック作成)
3. [外部サービスのモック化](#外部サービスのモック化)
4. [依存性注入を活用したテスト](#依存性注入を活用したテスト)
5. [モジュールのモック化](#モジュールのモック化)
6. [自作モジュールのモック化](#自作モジュールのモック化)
6. [高度なモックテクニック](#高度なモックテクニック)
7. [実践的なヒント](#実践的なヒント)

## モックとスタブの概念
テストダブル（Test Double）とはテスト中に本物のオブジェクトの代わりに使用する代替オブジェクトの総称です。  
その中でも特によく使われるのが「モック」と「スタブ」です。

|テストダブル|説明|
|---|---|
|スタブ（Stub）|固定の値を返す、シンプルな代替関数。振る舞いの切り替えに便利|
|モック（Mock）|呼び出し履歴を検証可能なテスト用ダミー。副作用なしで振る舞いを再現|

### スタブ (Stub)
スタブは、テスト対象のコードが依存するコンポーネントの簡易的な代替です。  
定義された入力に対して決まった出力を返すだけの単純なオブジェクトで、「状態検証」に使用されます。

#### 特徴:
- 決まった応答を返す
- 呼び出されたことの検証機能を持たない
- 単純なシナリオのテストに適している

### モック (Mock)

モックはスタブより高度で、呼び出された回数や渡された引数などの検証機能を持つオブジェクトです。  
「振る舞い検証」に使用されます。

#### 特徴:
- 決まった応答を返す
- 呼び出された回数や引数などを記録し検証できる
- 複雑な相互作用のテストに適している

### その他のテストダブル
|テストダブル|説明|
|---|---|
|スパイ (Spy)|実際のオブジェクトをラップし、メソッド呼び出しを記録するオブジェクト|
|フェイク (Fake)|実際のオブジェクトより簡略化された実装を持つオブジェクト|
|ダミー (Dummy)|値を返さないパラメータとして使用されるオブジェクト|

> [!NOTE]
> テストダブル とは:  
> ソフトウェアテストにおいて、テスト対象が依存しているコンポーネントを置き換える代用品のこと。  
> ダブルは代役、影武者を意味する。
> ```
> テストダブル
> ├─ スタブ：固定応答のみ
> ├─ モック：履歴検証＋固定応答
> ├─ スパイ：実体をラップして検証
> ├─ フェイク：簡易な実装
> └─ ダミー：使われない引数のプレースホルダ
> ```

## なぜモックを使うのか
実際の依存関係（API・DBなど）をそのまま使うと、テストの実行速度が低下し、不安定になります。  
モックとスタブを使うことで、こうした依存を制御し、再現性・高速性・局所性の高いテストを実現できます。

メール送信、ログ記録、外部API呼び出し、セッション操作などはすべて副作用を伴うため、モックの適用対象になります。
 
## Vitestでのモック作成
Vitestでは、`vi.fn()`、`vi.mock()`などの関数を使用してモックを作成できます。

### 基本的なモック関数
```ts
// 基本的なモック関数の作成
const mockFunction = vi.fn();

// 戻り値の設定
mockFunction.mockReturnValue('デフォルト値');

// 特定の呼び出しに対する戻り値の設定
mockFunction.mockReturnValueOnce('1回目の呼び出し')
            .mockReturnValueOnce('2回目の呼び出し');

// モック関数の呼び出し
const result1 = mockFunction(); // '1回目の呼び出し'
const result2 = mockFunction(); // '2回目の呼び出し'
const result3 = mockFunction(); // 'デフォルト値'

// 検証
expect(mockFunction).toHaveBeenCalledTimes(3);
expect(mockFunction.mock.calls.length).toBe(3);
```

### 非同期モック関数
```ts
// 非同期モック関数の作成
const asyncMock = vi.fn().mockResolvedValue('成功');

// 特定の呼び出しに対する戻り値の設定
asyncMock.mockResolvedValueOnce('1回目の成功')
         .mockRejectedValueOnce(new Error('エラー発生'));

// 非同期モック関数の呼び出し
const result1 = await asyncMock(); // '1回目の成功'
await expect(asyncMock()).rejects.toThrow('エラー発生');
const result3 = await asyncMock(); // '成功'
```


## 外部サービスのモック化
外部サービス（API、データベースなど）への依存をモック化することで、テストを高速かつ信頼性の高いものにすることができます。

### Red🔴: 失敗するテストを書く
#### `apiService.test.ts`

```ts
import { UserService } from '../src/userService';
import { HttpClient } from '../src/httpClient';

describe('UserService', () => {
  it('ユーザー情報を取得できる', async () => {
    // HttpClientのモック
    const mockHttpClient: HttpClient = {
      get: vi.fn().mockResolvedValue({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      })
    };

    // モックを注入してUserServiceのインスタンスを作成
    const userService = new UserService(mockHttpClient);

    // メソッドを実行
    const user = await userService.getUser(1);

    // 結果を検証
    expect(user).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com'
    });

    // HttpClientのメソッドが正しく呼ばれたか検証
    expect(mockHttpClient.get).toHaveBeenCalledWith('/users/1');
    expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
  });

  it('ユーザーが見つからない場合、エラーを返す', async () => {
    // エラーをスローするモック
    const mockHttpClient: HttpClient = {
      get: vi.fn().mockRejectedValue(new Error('User not found'))
    };

    const userService = new UserService(mockHttpClient);

    // エラーが発生することを確認
    await expect(userService.getUser(999)).rejects.toThrow('User not found');
  });
});
```

### Green🟢: テストを通すコードを書く
#### `userService.ts`
```ts
import { HttpClient } from './httpClient';

type User = {
  id: string;
  name: string;
  email: string;
};

export class UserService {
  constructor(private httpClient: HttpClient) {}
  async getUser(userId: string): Promise<User> {
    return this.httpClient.get(`/users/${userId}`);
  }
}
```
#### `httpClient.ts`
```ts
export interface HttpClient {
  get(url: string): Promise<any>;
  post?(url: string, data: any): Promise<any>;
  put?(url: string, data: any): Promise<any>;
  delete?(url: string): Promise<any>;
}
```


### データベースアクセスのモック例

### Red🔴: 失敗するテストを書く
#### `userRepository.test.ts`

```ts
import { UserRepository } from '../src/userRepository';
import { DatabaseConnection } from '../src/database';

describe('UserRepository', () => {
  it('ユーザーをデータベースから取得できる', async () => {
    // データベース接続のモック
    const mockDbConnection: DatabaseConnection = {
      query: vi.fn().mockResolvedValue([
        {
          id: '1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          createdAt: new Date('2025-04-01T00:00:00Z'),
        },
      ]),
    };

    // モックを注入してUserRepositoryのインスタンスを作成
    const userRepo = new UserRepository(mockDbConnection);

    // メソッドを実行
    const user = await userRepo.findById('1');

    // 結果を検証
    expect(user).toEqual({
      id: '1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      createdAt: new Date('2025-04-01T00:00:00Z'),
    });

    // クエリが正しく呼ばれたか検証
    expect(mockDbConnection.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE id = ?',
      ['1']
    );
  });

  it('ユーザーが存在しない場合、nullを返す', async () => {
    // 空の結果を返すモック
    const mockDbConnection: DatabaseConnection = {
      query: vi.fn().mockResolvedValue([]),
    };

    const userRepo = new UserRepository(mockDbConnection);
    const user = await userRepo.findById('999');

    expect(user).toBeNull();
  });
});
```

### Green🟢: テストを通すコードを書く
#### `database.ts`

```ts
import { DatabaseConnection } from './database';

export type UserDate = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

export class UserRepository {
  constructor(private dbConnection: DatabaseConnection) {}
  async findById(userId: string): Promise<UserDate | null> {
    const result = await this.dbConnection.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    if (result.length === 0) return null;
    return result[0];
  }
}
```
#### `database.ts`
```ts
import { UserDate } from './userRepository';

export interface DatabaseConnection {
  query(sql: string, param?: any[]): Promise<Array<any>>;
}
```

## 依存性注入を活用したテスト
依存性注入（Dependency Injection）パターンを使用すると、モックオブジェクトをテスト対象クラスに簡単に注入できます。  
これにより、テストの柔軟性と保守性が向上します。

### 通知サービスの例

### Red🔴: 失敗するテストを書く
#### `notificationService.test.ts`

```ts
import { NotificationService } from '../src/notificationService';
import { EmailSender, SmsSender, User } from '../src/interfaces';

describe('NotificationService', () => {
  // モックオブジェクトの作成
  const mockEmailSender: EmailSender = {
    sendEmail: vi.fn().mockResolvedValue(true),
  };

  const mockSmsSender: SmsSender = {
    sendSms: vi.fn().mockResolvedValue(true),
  };

  // テスト用ユーザーデータ
  const testUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
  };

  let notificationService: NotificationService;

  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks();

    // 依存性を注入してサービスを作成
    notificationService = new NotificationService(
      mockEmailSender,
      mockSmsSender
    );
  });

  it('メール通知を送信できる', async () => {
    const result = await notificationService.notifyByEmail(
      testUser,
      'テスト通知',
      'これはテスト通知です。'
    );

    expect(result).toBe(true);
    expect(mockEmailSender.sendEmail).toHaveBeenCalledWith(
      testUser.email,
      'テスト通知',
      'これはテスト通知です。'
    );
  });

  it('SMS通知を送信できる', async () => {
    const result = await notificationService.notifyBySms(
      testUser,
      'これはテストSMSです。'
    );

    expect(result).toBe(true);
    expect(mockSmsSender.sendSms).toHaveBeenCalledWith(
      testUser.phone,
      'これはテストSMSです。'
    );
  });

  it('全チャネルで通知を送信できる', async () => {
    const result = await notificationService.notifyAll(
      testUser,
      'マルチチャネル通知',
      'これは全チャネルへの通知です。'
    );

    expect(result).toBe(true);
    expect(mockEmailSender.sendEmail).toHaveBeenCalled();
    expect(mockSmsSender.sendSms).toHaveBeenCalled();
  });

  it('メール送信が失敗しても処理を継続する', async () => {
    // 一時的にエラーをスローするようにモックを設定
    mockEmailSender.sendEmail.mockRejectedValueOnce(new Error('送信失敗'));

    const result = await notificationService.notifyAll(
      testUser,
      'エラーテスト',
      'これはエラーテストです。'
    );

    // SMSは成功するのでtrueを返す
    expect(result).toBe(true);
    expect(mockEmailSender.sendEmail).toHaveBeenCalled();
    expect(mockSmsSender.sendSms).toHaveBeenCalled();
  });
});

```

### Green🟢: テストを通すコードを書く
#### `interfaces.ts`
```ts
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface EmailSender {
  sendEmail(email: string, subject: string, body: string): Promise<boolean>;
}
export interface SmsSender {
  sendSms(phone: string, message: string): Promise<boolean>;
}
```

#### `notificationService.ts`
```ts
import { EmailSender, SmsSender, User } from './interfaces';

export class NotificationService {
  constructor(private emailSender: EmailSender, private smsSender: SmsSender) {}
  async notifyByEmail(
    user: User,
    title: string,
    body: string
  ): Promise<boolean> {
    return this.emailSender.sendEmail(user.email, title, body);
  }
  async notifyBySms(user: User, message: string): Promise<boolean> {
    return this.smsSender.sendSms(user.phone, message);
  }
  async notifyAll(user: User, title: string, body: string): Promise<boolean> {
    try {
      this.emailSender.sendEmail(user.email, title, body);
    } catch (error) {
      console.error('メール送信エラー:', error);
    }
    this.smsSender.sendSms(user.phone, body);
    return true;
  }
}
```


## モジュールのモック化
時には、特定のモジュール全体をモック化したい場合があります。  
Vitestの`vi.mock()`を使用して、モジュールのすべてのエクスポートをモック化できます。


### Red🔴: 失敗するテストを書く
#### `userImporter.test.ts`

```ts
import { importUsersFromApi } from '../src/userImporter';

// axios モジュール全体をモック化
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

// モック化したaxiosをインポート
import axios from 'axios';

describe('importUsersFromApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('APIからユーザーリストを取得してフォーマットする', async () => {
    // モックの実装を設定
    (axios.get as any).mockResolvedValue({
      data: [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
        {
          id: '2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
        },
      ],
    });

    const users = await importUsersFromApi();

    expect(users).toEqual([
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ]);

    expect(axios.get).toHaveBeenCalledWith('https://api.example.com/users');
  });

  it('エラー発生時は空配列を返す', async () => {
    // エラーをスローするモック
    (axios.get as any).mockRejectedValue(new Error('Network Error'));

    const users = await importUsersFromApi();

    expect(users).toEqual([]);
    expect(axios.get).toHaveBeenCalled();
  });
});
```

### Green🟢: テストを通すコードを書く
#### `userImporter.ts`

```ts
import axios from 'axios';

type ApiUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type User = {
  id: string;
  name: string;
  email: string;
};

export const importUsersFromApi = async () => {
  try {
    const response = await axios.get('https://api.example.com/users');
    const apiUsers: ApiUser[] = response.data;
    return apiUsers.map((apiUser) => ({
      id: apiUser.id,
      name: `${apiUser.first_name} ${apiUser.last_name}`,
      email: apiUser.email,
    }));
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    return [];
  }
};
```


## 自作モジュールのモック化

### Red🔴: 失敗するテストを書く
#### `userController.test.ts`

```ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserController } from './userController';

// userServiceモジュールをモック化
vi.mock('./userService', () => ({
  UserService: vi.fn(() => ({
    getUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn()
  }))
}));

// モックされたモジュールをインポート
import { UserService } from './userService';

describe('UserController', () => {
  let userController: UserController;
  let mockUserService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // モックサービスのインスタンスを取得
    mockUserService = new UserService();
    userController = new UserController(mockUserService);
  });

  it('ユーザーの取得をサービスに委譲する', async () => {
    // モックの振る舞いを設定
    mockUserService.getUser.mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    });

    const req = { params: { id: '1' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await userController.getUser(req as any, res as any);

    expect(mockUserService.getUser).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    });
  });

  it('ユーザー作成をサービスに委譲する', async () => {
    mockUserService.createUser.mockResolvedValue({
      id: 1,
      name: 'New User',
      email: 'new@example.com'
    });

    const req = {
      body: {
        name: 'New User',
        email: 'new@example.com'
      }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await userController.createUser(req as any, res as any);

    expect(mockUserService.createUser).toHaveBeenCalledWith({
      name: 'New User',
      email: 'new@example.com'
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });

  it('エラー発生時は500エラーレスポンスを返す', async () => {
    mockUserService.getUser.mockRejectedValue(new Error('サービスエラー'));

    const req = { params: { id: '1' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await userController.getUser(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'サービスエラー'
    });
  });
});
```

### Green🟢: テストを通すコードを書く
#### `userController.ts`

```ts
import { Request, Response } from 'express';
import { UserService } from './userService';

export class UserController {
  constructor(private userService: UserService) {}

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await this.userService.getUser(userId);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const newUser = await this.userService.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      const userData = req.body;
      const updatedUser = await this.userService.updateUser(userId, userData);
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      await this.userService.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
```


## 高度なモックテクニック

### スパイの使用
実際のオブジェクトをラップし、その呼び出しを記録するスパイを使用できます。

```ts
// 実際のオブジェクト
const calculator = {
  add(a: number, b: number): number {
    return a + b;
  }
};

// スパイを作成
const addSpy = vi.spyOn(calculator, 'add');

// メソッドを呼び出す
calculator.add(2, 3);

// 検証
expect(addSpy).toHaveBeenCalledWith(2, 3);
expect(addSpy).toHaveBeenCalledTimes(1);
```

### 部分的なモック
クラスやオブジェクトの一部のメソッドだけをモック化したい場合、部分的なモックが便利です。

```ts
class DataService {
  async fetchData(): Promise<any[]> {
    // 実際にAPIからデータを取得する処理
    return [];
  }

  processData(data: any[]): any[] {
    // データを処理する実際のロジック
    return data.map(item => ({ ...item, processed: true }));
  }
}

// processDataメソッドはそのままに、fetchDataだけをモック化
const service = new DataService();
vi.spyOn(service, 'fetchData').mockResolvedValue([
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' }
]);

// fetchDataはモック、processDataは実際の実装が使われる
const result = await service.fetchData().then(data => service.processData(data));

expect(result).toEqual([
  { id: 1, name: 'Item 1', processed: true },
  { id: 2, name: 'Item 2', processed: true }
]);
```

### モックのリセットと復元
テスト間でモックの状態をリセットしたり、元の実装に戻したりする方法：

```ts
const mockFn = vi.fn();

// モックの状態をリセット（呼び出し履歴を消去）
mockFn.mockReset();

// モックの実装をクリア（デフォルトの未定義を返す実装に戻す）
mockFn.mockImplementation(() => undefined);

// すべてのモックをリセット
vi.resetAllMocks();

// すべてのモックを復元（モック化前の状態に戻す）
vi.restoreAllMocks();
```

## 実践的なヒント
### 1. 適切なレベルでモック化する
複雑なシステムでは、適切な抽象化レベルでモック化することが重要です。低レベルの実装詳細をモック化すると、実装の変更に対してテストが脆くなります。

```ts
// ☓ 悪い例：低レベルの実装詳細をモック化
vi.spyOn(dbConnection, '_executeQuery').mockResolvedValue([...]);

// ◯ 良い例：公開APIをモック化
vi.spyOn(userRepository, 'findById').mockResolvedValue({...});
```

### 2. モックの過剰使用を避ける
すべてをモック化すると、テストが実際のシステムの動作を反映しなくなる可能性があります。時には、実際のオブジェクトを使用することも検討してください。

### 3. 統合テストと組み合わせる
モックを使用した単体テストは、統合テスト（実際のコンポーネントを使用）と組み合わせることで、より確実なテスト戦略となります。

### 4. モックファクトリを活用する
複数のテストで同じモックを使用する場合は、モックファクトリ関数を作成すると便利です。

```ts
// モックファクトリ関数
function createMockUserRepository() {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    save: vi.fn(),
    delete: vi.fn()
  };
}

// テストで使用
const mockUserRepo = createMockUserRepository();
mockUserRepo.findById.mockResolvedValue({ id: 1, name: 'Test User' });
```

### 5. テスト可能なコードを書く
最初からテスト可能なコードを設計することで、モックの使用が簡単になります。依存性注入、インターフェース、関心の分離などの原則を適用しましょう。

## まとめ
モックとスタブはテスト駆動開発において強力なツールですが、適切に使用することが重要です。外部依存を隔離し、テストの実行速度と信頼性を向上させながらも、テストが実際のシステムの動作を正確に反映するようにバランスを取りましょう。

次のセクションでは、[HTTPリクエストのテスト](docs/collection-of-TDD-patterns-TypeScript/testing-http-requests.md)方法についてです。
