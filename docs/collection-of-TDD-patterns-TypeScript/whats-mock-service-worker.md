# Mock Service Worker (MSW) とは
MSW（Mock Service Worker）は、開発・テスト・ドキュメンテーションのすべてのフェーズで同じモック定義を再利用できるため、**一貫したモック戦略**を提供します。  
これにより、APIの完成前でもUIの実装を先行できる「APIファースト」な開発を実現できます。  

Mock Service Worker (MSW) は、サービスワーカーを利用してネットワークリクエストをインターセプトし、モックレスポンスを返ます。  
他のモックライブラリと異なり、MSWはネットワークレベルでリクエストをインターセプトするため、アプリケーションコードを変更することなく、実際のAPIと同じように振る舞うことができます。

> https://mswjs.io


## MSWの主な特徴

|特徴|説明|
|---|---|
|ネットワークレベルのインターセプト|<li>アプリケーションコードを修正せずにAPIリクエストをモック化</li><li>コードベースとモックの分離により、テストの堅牢性が向上</li>|
|ブラウザとNode.js環境の両方をサポート|<li>ブラウザ：Service Workerを使用</li><li>Node.js：リクエストインターセプションライブラリを使用</li>|
|宣言的なAPI|<li>REST API、GraphQLともにサポート</li><li>読みやすく、メンテナンスしやすいモック定義</li>|
|開発とテストの一貫性|<li>同じモック定義を開発環境とテスト環境で共有可能</li>|


## インストール方法

```bash
# npmの場合
npm install msw@latest --save-dev
```

## 基本的な使い方

### 1. RESTハンドラーの定義

#### `tests/mocks/handlers.ts`
```ts
import { http, HttpResponse } from 'msw';

type NewUser = {
  id?: string;
  name: string;
  email: string;
};

export const handlers = [
  // GETリクエストのモック
  http.get('https://api.example.com/users', () => {
    return HttpResponse.json(
      [
        { id: '1', name: '山田太郎', email: 'taro_yamada@example.com' },
        { id: '2', name: '鈴木花子', email: 'hanako_suzuki@example.com' },
      ],
      {
        status: 200,
      }
    );
  }),

  // POSTリクエストのモック
  http.post('https://api.example.com/users', async ({ request }) => {
    const newUser = (await request.json()) as NewUser;

    return HttpResponse.json(
      { id: '3', ...newUser },
      {
        status: 201,
      }
    );
  }),

  // URLパラメータの使用
  http.get('https://api.example.com/users/:userId', ({ params }) => {
    const { userId } = params;

    if (userId === '1') {
      return HttpResponse.json(
        {
          id: '1',
          name: '山田太郎',
          email: 'taro_yamada@example.com',
        },
        {
          status: 200,
        }
      );
    }

    return HttpResponse.json(
      { message: 'ユーザーが見つかりません' },
      { status: 404 }
    );
  }),
];
```


### 2. ブラウザ環境でのセットアップ
#### `tests/mocks/browser.ts`
```ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Service Workerの設定
export const worker = setupWorker(...handlers);
```

#### `src/index.ts`  (エントリーポイント)
```ts
import { worker } from '../tests/mock/browser';

// 開発環境でのみService Workerを起動
if (process.env.NODE_ENV === 'development') {
  worker.start({
    // モック化されたリクエストをコンソールに表示するオプション
    onUnhandledRequest: 'bypass',
  });
}

```

Service Workerのセットアップ（初回のみ必要）:

```bash
npx msw init public/ --save
```

### 3. Node.js環境（テスト）でのセットアップ
#### `tests/mocks/server.ts`
```ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// テスト用サーバーのセットアップ
export const server = setupServer(...handlers)
```
#### `tests/setupTests.ts`
```ts
import { server } from './mocks/server'

// テスト実行前にサーバーを起動
beforeAll(() => server.listen())

// 各テスト後にハンドラーをリセット
afterEach(() => server.resetHandlers())

// テスト終了後にサーバーをクローズ
afterAll(() => server.close())
```


## Vitestでの使用例
### Red🔴： 失敗するテストを書く
#### `tests/userService.test.ts`
```ts
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';
import { fetchUsers, createUser, User } from '../src/userApi';
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UserService', () => {
  it('ユーザー一覧を取得できる', async () => {
    const users = (await fetchUsers()) as User[];
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('山田太郎');
  });

  it('新しいユーザーを作成できる', async () => {
    const newUser = { name: '田中次郎', email: 'jiro@example.com' };
    const createdUser = await createUser(newUser);
    expect(createdUser.id).toBe('3');
    expect(createdUser.name).toBe('田中次郎');
  });

  it('テスト内でハンドラーを上書きできる', async () => {
    // 特定のテスト用に一時的にハンドラーを上書き
    server.use(
      http.get('https://api.example.com/users', () => {
        return HttpResponse.json(
          [
            {
              id: '99',
              name: 'テスト用ユーザー',
              email: 'testuser@example.com',
            },
          ],
          { status: 200 }
        );
      })
    );

    const users = (await fetchUsers()) as User[];
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('テスト用ユーザー');
  });

  it('エラーハンドリングをテストできる', async () => {
    // 一時的にエラーレスポンスを設定
    server.use(
      http.get('https://api.example.com/users', () => {
        return HttpResponse.json(
          { message: 'Internal Server Error' },
          { status: 500 }
        );
      })
    );

    await expect(fetchUsers()).rejects.toThrow();
  });
});

```


### Green🟢: テストを通すコードを書く
```ts
import axios from 'axios';

export type User = {
  id: string;
  name: string;
  email: string;
};

type UserData = Omit<User, 'id'>;

const API_URL = 'https://api.example.com/users';

export const fetchUsers = async (userId?: string): Promise<User | User[]> => {
  const endPointURL = userId ? `${API_URL}/${userId}` : `${API_URL}`;
  const response = await axios.get(endPointURL);
  return response.data;
};

export const createUser = async (userData: UserData): Promise<User> => {
  const response = await axios.post(API_URL, userData);
  return response.data;
};

export const updateUser = async (
  userId: string,
  userdata: UserData
): Promise<User> => {
  const endPointURL = `${API_URL}/${userId}`;
  const response = await axios.put(endPointURL, userdata);
  return response.data;
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  const endPointURL = `${API_URL}/${userId}`;
  const response = await axios.delete(endPointURL);
  return response.status === 204;
};

```


## Axios Mock AdapterとMSWの比較
Axios Mock Adapter との違い
|項目|Axios Mock Adapter|MSW|
|---|---|---|
|モックの仕組み|Axios に依存（Axios専用）|Service Worker（汎用）|
|モック対象|Axiosのコード|すべてのfetch / XHRリクエスト|
|本番コード変更|必要な場合がある|変更不要|
|フレームワーク依存|Axios限定|なし（fetchでもOK）|
|ユースケース|単体テスト中心|開発・E2E・Storybook連携など広範囲|


## MSWの利点

|利点|説明|
|---|---|
|現実的なAPIモック|実際のネットワークリクエストのように振る舞うため、より現実的なテスト環境を提供します。|
|分離されたモック定義|モック定義がアプリケーションコードから分離されているため、テストコードがクリーンになります。|
|開発・テスト環境の一貫性|同じモック定義を開発環境とテスト環境で共有できるため、一貫性のある動作が保証されます。|
|学習コストの低減|REST APIとGraphQLに統一されたインターフェースを提供するため、複数のモックライブラリを学ぶ必要がありません。|


## まとめ

MSW は、ネットワーク層全体を仮想的に再現できるため、以下のようなケースに最適です。
- フロントエンドの開発をAPIなしで先行したい
- APIエラーや遅延などのシナリオもテストしたい
- テストとStorybookで同じモックを使いたい
 
MSWは特にAngularやRxJSと組み合わせて使用する場合でも非常に有効です。  
HttpClientを使用したリクエストを透過的にモック化できるため、テストの実装が簡素化され、より堅牢なテストを作成できます。
