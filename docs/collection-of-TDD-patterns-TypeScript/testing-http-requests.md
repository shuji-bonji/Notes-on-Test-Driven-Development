# HTTPリクエストのテスト
Webアプリケーションでは、外部APIとの通信は欠かせない部分です。  
HTTPリクエストのテストは、APIとの連携が正しく機能することを保証する重要なステップです。  
ここでは、TypeScriptとVitestを使用してHTTPリクエストをテストするための様々なアプローチを記します。


## HTTPリクエストテストの課題

HTTPリクエストのテストには、以下のような課題があります。

|課題|説明|
|---|---|
|外部依存|実際のAPIエンドポイントに依存すると、テストが不安定になる|
|ネットワーク遅延|実際のネットワーク通信は時間がかかり、テストが遅くなる|
|環境依存|テスト環境によって結果が変わる可能性がある|
|状態管理|APIの状態によってテスト結果が変わる可能性がある|
|認証・認可|認証が必要なAPIのテストは複雑になりがち|

これらの課題を解決するために、主に以下のアプローチがあります。

|解決策|説明|
|---|---|
|モックライブラリ|`axios-mock-adapter`や`msw`などのライブラリを使用|
|依存性注入|HTTPクライアントをモック可能な形で注入|
|モックサーバー|テスト用のローカルサーバーを立てる|
|テスト用APIエンドポイント|テスト専用のAPIエンドポイントを用意|

それぞれのアプローチについて、具体的な例を見ていきます。

## モックライブラリを使用したテスト
### axios-mock-adapter を使用した例
`axios-mock-adapter`は、axiosのリクエストをインターセプトしてモックレスポンスを返すライブラリです。

以下のように、`axios`の導入と同じく`axios-mock-adapter`をインストールします。
```sh
npm install axios axios-mock-adapter --save-dev
```

### Red🔴： 失敗するテストを書く
#### `userApi.test.ts`

```ts
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { fetchUsers, createUser, updateUser, deleteUser } from '../src/userApi';

describe('User API', () => {
  let mock: InstanceType<typeof MockAdapter>;

  beforeEach(() => {
    // axiosのモックを作成
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    // テスト後にモックをリセット
    mock.reset();
  });

  it('ユーザー一覧を取得できる', async () => {
    const users = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ];

    // GETリクエストのモック
    mock.onGet('https://api.example.com/users').reply(200, users);

    const result = await fetchUsers();

    expect(result).toEqual(users);
  });

  it('新しいユーザーを作成できる', async () => {
    const newUser = { name: 'New User', email: 'new@example.com' };
    const createdUser = { id: 3, ...newUser };

    // POSTリクエストのモック
    mock.onPost('https://api.example.com/users').reply(201, createdUser);

    const result = await createUser(newUser);

    expect(result).toEqual(createdUser);
  });

  it('ユーザー情報を更新できる', async () => {
    const userId = '1';
    const userData = { name: 'Updated Name', email: 'updated@example.com' };
    const updatedUser = { id: userId, ...userData };

    // PUTリクエストのモック
    mock
      .onPut(`https://api.example.com/users/${userId}`)
      .reply(200, updatedUser);

    const result = await updateUser(userId, userData);

    expect(result).toEqual(updatedUser);
  });

  it('ユーザーを削除できる', async () => {
    const userId = '1';

    // DELETEリクエストのモック
    mock.onDelete(`https://api.example.com/users/${userId}`).reply(204);

    const result = await deleteUser(userId);

    expect(result).toBe(true);
  });

  it('エラーレスポンスを適切に処理する', async () => {
    // 404エラーのモック
    mock.onGet('https://api.example.com/users/999').reply(404, {
      error: 'User not found',
    });

    await expect(fetchUsers('999')).rejects.toThrow(
      'Request failed with status code 404'
    );
  });
});
```

### Green🟢: テストを通すコードを書く
#### `userApi.ts`

```ts
import axios from 'axios';

type User = {
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

----

### MSW (Mock Service Worker) を使用した例
[MSW](https://mswjs.io)は、Service Workerベースのモックライブラリで、ブラウザとNode.js環境の両方でAPIリクエストをインターセプトできます。

> https://mswjs.io

以下にまとめているので、[こちら](./whats-mock-service-worker.md)を参照願います。
- [Mock Service Worker (MSW) とは](./whats-mock-service-worker.md)


### APIクライアントクラスの例
----

### Red🔴： 失敗するテストを書く
#### `UserApiClient.test.ts`

```ts
import axios from 'axios';
import { UserApiClient } from '../src/UserApiClient';

// axios モジュール全体をモック化
vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe('UserApiClient', () => {
  let apiClient: UserApiClient;

  beforeEach(() => {
    // テスト前にaxiosのモックをリセット
    vi.clearAllMocks();

    // APIクライアントのインスタンスを作成
    apiClient = new UserApiClient('https://api.example.com');
  });

  it('getUsers()は全ユーザーを取得する', async () => {
    const mockUsers = [
      { id: '1', name: 'User 1', email: 'user1@example.com' },
      { id: '2', name: 'User 2', email: 'user2@example.com' },
    ];

    // axiosのgetメソッドのモック実装
    mockedAxios.get.mockResolvedValue({ data: mockUsers });

    const users = await apiClient.getUsers();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.example.com/users'
    );
    expect(users).toEqual(mockUsers);
  });

  it('getUserById()は指定されたIDのユーザーを取得する', async () => {
    const mockUser = { id: 1, name: 'User 1', email: 'user1@example.com' };

    mockedAxios.get.mockResolvedValue({ data: mockUser });

    const user = await apiClient.getUserById('1');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.example.com/users/1'
    );
    expect(user).toEqual(mockUser);
  });

  it('createUser()は新しいユーザーを作成する', async () => {
    const newUser = { name: 'New User', email: 'newuser@example.com' };
    const createdUser = { id: 3, ...newUser };

    mockedAxios.post.mockResolvedValue({ data: createdUser });

    const result = await apiClient.createUser(newUser);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.example.com/users',
      newUser
    );
    expect(result).toEqual(createdUser);
  });

  it('updateUser()はユーザー情報を更新する', async () => {
    const userId = '1';
    const updateData = { name: 'Updated Name' };
    const updatedUser = {
      id: userId,
      name: 'Updated Name',
      email: 'user1@example.com',
    };

    mockedAxios.put.mockResolvedValue({ data: updatedUser });

    const result = await apiClient.updateUser(userId, updateData);

    expect(mockedAxios.put).toHaveBeenCalledWith(
      `https://api.example.com/users/${userId}`,
      updateData
    );
    expect(result).toEqual(updatedUser);
  });

  it('deleteUser()はユーザーを削除する', async () => {
    const userId = '1';

    mockedAxios.delete.mockResolvedValue({ status: 204 });

    const result = await apiClient.deleteUser(userId);

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      `https://api.example.com/users/${userId}`
    );
    expect(result).toBe(true);
  });

  it('リクエスト失敗時にエラーを投げる', async () => {
    const error = new Error('Network Error');
    (mockedAxios.get as any).mockRejectedValue(error);

    await expect(apiClient.getUsers()).rejects.toThrow('Network Error');
  });
});

```

### Green🟢: テストを通すコードを書く
#### `UserApiClient.ts`

```ts
import axios from 'axios';

interface User {
  id?: string;
  name: string;
  email: string;
}

export class UserApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getUsers(): Promise<User[]> {
    const response = await axios.get(`${this.baseUrl}/users`);
    return response.data;
  }

  async getUserById(userId: string): Promise<User> {
    const response = await axios.get(`${this.baseUrl}/users/${userId}`);
    return response.data;
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const response = await axios.post(`${this.baseUrl}/users`, userData);
    return response.data;
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const response = await axios.put(
      `${this.baseUrl}/users/${userId}`,
      userData
    );
    return response.data;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const response = await axios.delete(`${this.baseUrl}/users/${userId}`);
    return response.status === 204;
  }
}
```


### 依存性注入を使用したAPIクライアント
より柔軟なテストを行うために、HTTPクライアントを依存性として注入する方法もあります。

### Red🔴： 失敗するテストを書く
#### `HttpUserApiClient.test.ts`

```ts
import { HttpUserApiClient } from '../src/HttpUserApiClient';
// import { HttpClient } from '../src/_httpClient';

const API_BASE_URL = 'https://api.example.com';

describe('HttpUserApiClient', () => {
  const mockHttpClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  let apiClient: HttpUserApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    apiClient = new HttpUserApiClient(API_BASE_URL, mockHttpClient);
  });

  it('getUsers()は全ユーザーを取得する', async () => {
    const mockUsers = [
      { id: 1, name: 'User 1', email: 'user1@example.com' },
      { id: 2, name: 'User 2', email: 'user2@example.com' },
    ];

    mockHttpClient.get.mockResolvedValue({ data: mockUsers });

    const users = await apiClient.getUsers();

    expect(mockHttpClient.get).toHaveBeenCalledWith(`${API_BASE_URL}/users`);
    expect(users).toEqual(mockUsers);
  });

  it('getUserById()は指定されたIDのユーザーを取得する', async () => {
    const mockUser = { id: 1, name: 'User 1', email: 'user1@example.com' };

    mockHttpClient.get.mockResolvedValue({ data: mockUser });

    const user = await apiClient.getUserById('1');

    expect(mockHttpClient.get).toHaveBeenCalledWith(`${API_BASE_URL}/users/1`);
    expect(user).toEqual(mockUser);
  });

  // 他のメソッドのテストも同様...
});
```

### Green🟢: テストを通すコードを書く
#### `HttpClient.ts`

```ts
export interface HttpClient {
  get(url: string, config?: any): Promise<any>;
  post(url: string, data?: any, config?: any): Promise<any>;
  put(url: string, data?: any, config?: any): Promise<any>;
  delete(url: string, config?: any): Promise<any>;
}
```

#### `HttpUserApiClient.ts`

```ts
import { HttpClient } from './_httpClient';

interface User {
  id?: string;
  name: string;
  email: string;
}

export class HttpUserApiClient {
  constructor(private baseUrl: string, private httpClient: HttpClient) {}

  async getUsers(): Promise<User[]> {
    const url = `${this.baseUrl}/users`;
    const response = await this.httpClient.get(url);
    return response.data;
  }

  async getUserById(userId: string): Promise<User> {
    const url = `${this.baseUrl}/users/${userId}`;
    const response = await this.httpClient.get(url);
    return response.data;
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const url = `${this.baseUrl}/users`;
    const response = await this.httpClient.post(url, userData);
    return response.data;
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const url = `${this.baseUrl}/users/${userId}`;
    const response = await this.httpClient.put(url, userData);
    return response.data;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const url = `${this.baseUrl}/users/${userId}`;
    const response = await this.httpClient.delete();
    return response.status === 204;
  }
}

```


## モックサーバーを使用したテスト

実際のHTTPリクエストをテストするために、モックサーバーを使用する方法もあります。  
ここでは、`json-server`を使用した例を紹介します。

### json-serverを使用したテスト

#### セットアップ: `mockServer.js`

```javascript
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json'); // テスト用のJSONデータ
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(router);

const port = 3001;
server.listen(port, () => {
  console.log(`テスト用サーバーが http://localhost:${port} で起動しました`);
});

// db.json の例
// {
//   "users": [
//     { "id": 1, "name": "User 1", "email": "user1@example.com" },
//     { "id": 2, "name": "User 2", "email": "user2@example.com" }
//   ]
// }
```

### Red🔴： 失敗するテストを書く
#### `realApiClient.test.ts`

```ts
import axios from 'axios';
import { UserApiClient } from './UserApiClient';

// テスト用のAPIクライアント
const apiClient = new UserApiClient('http://localhost:3001');

// この種のテストは通常、統合テストとして扱われます
describe('UserApiClient (実際のHTTPリクエスト)', () => {
  it('getUsers()は全ユーザーを取得する', async () => {
    const users = await apiClient.getUsers();
    
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).toHaveProperty('id');
    expect(users[0]).toHaveProperty('name');
  });

  it('createUser()とdeleteUser()は正しく動作する', async () => {
    // 新しいユーザーを作成
    const newUser = { name: 'Test User', email: 'test@example.com' };
    const createdUser = await apiClient.createUser(newUser);
    
    expect(createdUser).toHaveProperty('id');
    expect(createdUser.name).toBe(newUser.name);
    
    // 作成したユーザーを削除
    const result = await apiClient.deleteUser(createdUser.id!);
    expect(result).toBe(true);
    
    // 削除されたことを確認
    await expect(apiClient.getUserById(createdUser.id!)).rejects.toThrow();
  });
});
```


## HTTPインターセプターの活用

特定のHTTPリクエストだけをインターセプトし、残りは実際のAPIに通すアプローチもあります。  
これは、統合テストと単体テストの良いバランスを提供します。

### インターセプターの例

```ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// インターセプターアダプター
export function createAxiosWithInterceptors(baseURL: string): AxiosInstance {
  const instance = axios.create({ baseURL });
  
  // リクエストインターセプター
  instance.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      // テスト中かどうかを判断
      if (process.env.NODE_ENV === 'test') {
        // テスト用の認証トークンを追加
        config.headers = {
          ...config.headers,
          'Authorization': 'Bearer test-token'
        };
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // レスポンスインターセプター
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error) => {
      // エラーハンドリングのカスタマイズ
      if (error.response) {
        // サーバーからのエラーレスポンス
        const { status, data } = error.response;
        const enhancedError = new Error(
          `API error: ${status} ${data.message || JSON.stringify(data)}`
        );
        return Promise.reject(enhancedError);
      }
      return Promise.reject(error);
    }
  );
  
  return instance;
}

// 使用例
const api = createAxiosWithInterceptors('https://api.example.com');
```


## エラーハンドリングのテスト

HTTPリクエストでは、エラー処理が非常に重要です。  
様々なエラーシナリオをテストする例を見てみましょう。

### Red🔴： 失敗するテストを書く
#### `apiErrorHandling.test.ts`

```ts
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { getUserData, handleApiError } from '../src/apiErrorHandling';

describe('API Error Handling', () => {
  let mock: InstanceType<typeof MockAdapter>;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  it('ネットワークエラーを適切に処理する', async () => {
    // ネットワークエラーをシミュレート
    mock.onGet('/users/1').networkError();

    const result = await handleApiError(() => getUserData(1));

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/network error/i);
  });

  it('タイムアウトエラーを適切に処理する', async () => {
    // タイムアウトをシミュレート
    mock.onGet('/users/1').timeout();

    const result = await handleApiError(() => getUserData(1));

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/timeout/i);
  });

  it('404エラーを適切に処理する', async () => {
    mock.onGet('/users/999').reply(404, { message: 'User not found' });

    const result = await handleApiError(() => getUserData(999));

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
    expect(result.statusCode).toBe(404);
  });

  it('500エラーを適切に処理する', async () => {
    mock.onGet('/users/1').reply(500, { message: 'Internal server error' });

    const result = await handleApiError(() => getUserData(1));

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/server error/i);
    expect(result.statusCode).toBe(500);
  });

  it('正常なレスポンスを適切に処理する', async () => {
    const userData = { id: 1, name: 'Test User' };
    mock.onGet('/users/1').reply(200, userData);

    const result = await handleApiError(() => getUserData(1));

    expect(result.success).toBe(true);
    expect(result.data).toEqual(userData);
  });
});

```

### Green🟢: テストを通すコードを書く
#### `apiErrorHandling.ts`

```ts
import axios, { AxiosError } from 'axios';

export async function getUserData(userId: number) {
  const response = await axios.get(`/users/${userId}`);
  return response.data;
}

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export async function handleApiError<T>(
  apiCall: () => Promise<T>
): Promise<ApiResult<T>> {
  try {
    const data = await apiCall();
    return {
      success: true,
      data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        // サーバーからのエラーレスポンス (4xx, 5xx)
        return {
          success: false,
          error: axiosError.response.data?.message || axiosError.message,
          statusCode: axiosError.response.status,
        };
      } else if (axiosError.request) {
        // リクエストは作成されたがレスポンスが受信されなかった
        return {
          success: false,
          error: 'Network error: No response received',
        };
      } else {
        // リクエスト作成中にエラーが発生した
        return {
          success: false,
          error: `Request setup error: ${axiosError.message}`,
        };
      }
    } else {
      // その他のエラー
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

```


## まとめ

HTTPリクエストのテストでは、外部依存を適切に管理することが重要です。　
このチャプターで紹介した以下のアプローチを組み合わせることで、堅牢で信頼性の高いテストを実現できます。

|解決策|説明|
|---|---|
|モックライブラリの使用|axios-mock-adapter や MSW などを活用して、HTTPリクエストをインターセプトし、モックレスポンスを返す|
|依存性注入パターン|HTTPクライアントをインターフェースとして抽象化し、テスト時にモック実装を注入する|
|モックサーバーの活用|json-server などのツールを使用して、実際のHTTPリクエストをテスト可能な環境を構築する|
|エラーハンドリングのテスト|様々なエラーシナリオを考慮したテストでアプリケーションの堅牢性を向上させる|

APIとの連携は現代のWebアプリケーションにおいて重要な部分であり、適切なテスト戦略を立てることで、開発の効率と品質を大きく向上させることができます。TDDのサイクルに沿って、一歩ずつHTTPリクエストの処理を改善していきましょう。

次のセクションでは、[カスタムマッチャーを使ったテスト](./testing-with-custom-matchers.md)についてです。