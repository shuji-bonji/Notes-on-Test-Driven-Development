# 非同期処理のテスト
モダンなJavaScript/TypeScriptアプリケーションでは、APIリクエスト、ファイル操作、タイマー処理など、多くの操作が非同期で行われ、非同期処理は避けて通れない重要な要素です。  
ここでは、非同期処理をTDDで開発する際の基本的なパターンと実践的なアプローチについて記します。

非同期処理のTDDでは、関数のインターフェースと副作用の分離が重要です。  
外部とのやりとり（API、ファイル、タイマー等）を抽象化し、テスト可能な純粋関数に分離することで、テストの信頼性と保守性が向上します。

## 目次

1. [非同期処理とテストの課題](#非同期処理とテストの課題)
2. [Promiseベースの非同期処理テスト](#promiseベースの非同期処理テスト)
3. [async/awaitを使用したテスト](#asyncawaitを使用したテスト)
4. [タイマー関数のテスト](#タイマー関数のテスト)
5. [エラーハンドリングのテスト](#エラーハンドリングのテスト)
6. [並列非同期処理のテスト](#並列非同期処理のテスト)
7. [レースコンディションのテスト](#レースコンディションのテスト)
8. [実践的なヒント](#実践的なヒント)

## 非同期処理とテストの課題
非同期処理のテストでは、以下のような課題があります。

|課題|内容|
|---|---|
|テストの完了タイミング|非同期処理が完了する前にテストが終了してしまう|
|エラーハンドリング|非同期処理で発生したエラーをテストでキャッチする|
|タイミング依存|処理の順序やタイミングに依存するテスト|
|モック化の複雑さ|外部APIなど非同期依存関係のモック|

これらの課題に対処するため、テストフレームワークは非同期テストをサポートする機能を提供しています。  
以下では、Vitestを使用した非同期テストの基本的なパターンを見ていきます。

## Promiseベースの非同期処理テスト
Promiseを返す関数のテストは、テスト関数からPromiseを返すことで行います。

### Red🔴： 失敗するテストを書く
#### `tests/api.test.ts`

```ts
import { fetchUserData } from '../src/api';

describe('fetchUserData 関数', () => {
  it('ユーザーIDが有効な場合、ユーザーデータを返す', () => {
    return fetchUserData(1).then((userData) => {
      expect(userData).toEqual({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      });
    });
  });

  it('ユーザーIDが無効な場合、エラーをスローする', () => {
    return expect(fetchUserData(-1)).rejects.toThrow('無効なユーザーID');
  });
});

```

### Green🟢: テストを通すコードを書く
#### `src/api.ts`

```ts
interface UserData {
  id: number;
  name: string;
  email: string;
}

export async function fetchUserData(userId: number): Promise<UserData> {
  if (userId <= 0) {
    return Promise.reject(new Error('無効なユーザーID'));
  }
  
  // 実際のアプリケーションでは、ここでAPIリクエストを行う
  // ここではモックデータを返す
  return Promise.resolve({
    id: userId,
    name: 'Test User',
    email: 'test@example.com'
  });
}
```

### Promiseチェーンの例
複数の非同期操作を連鎖させる場合のテスト：

```ts
describe('複合API操作', () => {
  it('ユーザー情報を取得して権限チェックを行う', () => {
    return fetchUserData(1)
      .then(user => checkPermissions(user))
      .then(hasPermission => {
        expect(hasPermission).toBe(true);
      });
  });
});
```


## async/awaitを使用したテスト
async/awaitを使用すると、非同期コードをより読みやすく、同期コードのように書くことができます。

### Red🔴： 失敗するテストを書く
#### `tests/authentication.test.ts`

```ts
import { loginUser } from '../src/authentication';

describe('loginUser 関数', () => {
  it('正しい認証情報でログインに成功する', async () => {
    const result = await loginUser('testuser', 'password123');
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.user?.name).toBe('testuser');
  });

  it('間違った認証情報でログインに失敗する', async () => {
    const result = await loginUser('testuser', 'wrongpassword');
    expect(result.success).toBe(false);
    expect(result.error).toBe('認証情報が無効です');
  });
});
```

### Green🟢: テストを通すコードを書く
#### `src/authentication.ts`
```ts
type User = {
  id: string;
  name: string;
  email: string;
};

type LoginResult = {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
};

export const loginUser = (userName: string, password: string): LoginResult => {
  if (password !== 'password123')
    return {
      success: false,
      error: '認証情報が無効です',
    };

  return {
    success: true,
    token: '1234-5678-91011',
    user: {
      id: '1',
      name: 'testuser',
      email: 'testuser@example.com',
    },
  };
};
```

### エラーハンドリングの例
async/awaitを使用したエラーハンドリングのテスト。


#### `tests/api.test.ts`
>  it('ユーザーIDが無効な場合、エラーをスローする', () => {

の部分を書き換えてみる。
```ts
describe('asyncエラーハンドリング', () => {
  it('存在しないユーザーIDの場合、エラーをスローする', async () => {
    await expect(async () => {
      await fetchUserData(0);
    }).rejects.toThrow('無効なユーザーID');
  });
});
```


## タイマー関数のテスト
`setTimeout`や`setInterval`などのタイマー関数のテストには、モックタイマーを使用します。

async/await とタイマー処理を組み合わせると、非同期処理のタイミング制御をより厳密にテストできます。  
`vi.useFakeTimers()` によるモック化と `vi.advanceTimersByTime()` による時間の進行は、こうした制御を可能にする強力なツールです。

### Red🔴： 失敗するテストを書く
#### `tests/timer.test.ts`

```ts
import { delayedGreeting, pollData } from '../src/timer';

describe('タイマー関数', () => {
  beforeEach(() => {
    // タイマーをモックに置き換え
    vi.useFakeTimers();
  });

  afterEach(() => {
    // テスト後にモックをリセット
    vi.restoreAllMocks();
  });

  it('delayedGreeting関数が指定時間後にメッセージを返す', async () => {
    const greetingPromise = delayedGreeting('こんにちは', 1000);

    // タイマーを進める
    vi.advanceTimersByTime(1000);

    const result = await greetingPromise;
    expect(result).toBe('こんにちは');
  });

  it('pollData関数が指定間隔でデータを取得する', () => {
    const mockCallback = vi.fn();
    pollData(mockCallback, 1000);

    // まだコールバックは呼ばれていない
    expect(mockCallback).not.toHaveBeenCalled();

    // 1秒進める
    vi.advanceTimersByTime(1000);
    expect(mockCallback).toHaveBeenCalledTimes(1);

    // さらに1秒進める
    vi.advanceTimersByTime(1000);
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });
});
```

### Green🟢: テストを通すコードを書く
#### `src/timer.ts`

```ts
export const delayedGreeting = (
  message: string,
  delay: number
): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(message);
    }, delay);
  });
};

export const pollData = (callback: Function, interval: number): void => {
  const intervalId = setInterval(() => {
    callback();
  }, interval);
  // 実際のアプリケーションでは、この関数からintervalIdを返すか、
  // 停止するための関数を返すことが多い
};
```


## エラーハンドリングのテスト
非同期処理におけるエラー処理のテストは重要です。特に、非同期操作が失敗した場合の挙動を確認する必要があります。

### Red🔴： 失敗するテストを書く
#### `tests/errorHandling.test.ts`

```ts
import { fetchWithRetry } from './errorHandling';

describe('fetchWithRetry 関数', () => {
  it('最初の試行で成功した場合、結果を返す', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce('成功');
    
    const result = await fetchWithRetry(mockFetch, 3);
    expect(result).toBe('成功');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('失敗した場合、指定回数まで再試行する', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('ネットワークエラー'))
      .mockRejectedValueOnce(new Error('ネットワークエラー'))
      .mockResolvedValueOnce('3回目で成功');
    
    const result = await fetchWithRetry(mockFetch, 3);
    expect(result).toBe('3回目で成功');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('すべての試行が失敗した場合、エラーをスローする', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValue(new Error('ネットワークエラー'));
    
    await expect(fetchWithRetry(mockFetch, 3))
      .rejects.toThrow('すべての再試行が失敗しました');
    
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
```

### Green🟢: テストを通すコードを書く
#### `src/errorHandling.ts`

```ts
export const fetchWithRetry = async <T>(
  fetchFunc: () => Promise<T>,
  retry: number
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retry; attempt++) {
    try {
      return await fetchFunc();
    } catch (error) {
      lastError = error as Error;
      if (attempt < retry) {
        continue;
      }
    }
  }

  throw new Error('すべての再試行が失敗しました: ' + lastError?.message);
};
```

## 並列非同期処理のテスト

### Red🔴： 失敗するテストを書く
#### `tests/parallel.test.ts`
```ts
import { loadAll } from '../src/parallel';

describe('loadAll 関数', () => {
  it('すべてのIDを並列にロードする', async () => {
    const result = await loadAll(['a', 'b', 'c']);
    expect(result).toEqual(['Loaded-a', 'Loaded-b', 'Loaded-c']);
  });
});
```

### Green🟢: テストを通すコードを書く
#### `src/parallel.ts`
```ts
export const loadAll = async (ids: string[]): Promise<string[]> => {
  return Promise.all(ids.map(async (id) => `Loaded-${id}`));
};
```


## レースコンディションのテスト
非同期処理では、複数の処理が競合状態（レースコンディション）になることがあります。  
これをテストするには、非同期処理の完了順序を制御する必要があります。

### Red🔴： 失敗するテストを書く
#### `tests/race.test.ts`

```ts
import { fetchFirstData, fetchLatestData } from '../src/race';

describe('fetchLatestData 関数', () => {
  it('最初に完了したリクエストの結果を返すこと', async () => {
    const asyncFunctions: Promise<string>[] = [
      new Promise((res) => setTimeout(() => res('A'), 100)),
      new Promise((res) => setTimeout(() => res('B'), 200)),
    ];

    const result = await fetchFirstData(asyncFunctions);
    expect(result).toBe('A');
  });
});

describe('fetchLatestData 関数', () => {
  it('最後に完了したリクエストの結果を返すこと', async () => {
    const asyncFunctions: Promise<string>[] = [
      new Promise((res) => setTimeout(() => res('A'), 100)),
      new Promise((res) => setTimeout(() => res('B'), 200)),
      new Promise((res) => setTimeout(() => res('C'), 300)),
    ];

    const result = await fetchLatestData(asyncFunctions);
    expect(result).toBe('C');
  });
});

```

### Green🟢: テストを通すコードを書く
#### `src/race.ts`

```ts
export const fetchFirstData = (
  dataSource: Promise<string>[]
): Promise<string> => {
  return Promise.race(dataSource);
};

export const fetchLatestData = (
  dataSource: Promise<string>[]
): Promise<string | undefined> => {
  return Promise.all(dataSource).then((values) => values.pop());
};
```

## 実践的なヒント

非同期処理のテストをより現実的かつ堅牢に行うには、いくつかのベストプラクティスが存在します。  
以下に、実際のアプリケーション開発で役立つヒントをまとめます。

### 1. テストのタイムアウトを設定する
非同期テストが永遠に終わらないことを防ぐため、タイムアウトを設定します。

```ts
it('長時間実行される処理のテスト', async () => {
  // タイムアウトを10秒に設定
}, 10000);
```

### 2. モックを適切に使用する
外部への依存を持つ非同期処理は、テスト時にモックに置き換えることで、制御可能にします。

```ts
// APIクライアントをモック化
const apiClientMock = {
  fetchData: vi.fn().mockResolvedValue({ success: true, data: [...] })
};

// テスト対象の関数にモックを注入
const result = await myFunction(apiClientMock);
```

### 3. 並行実行に注意する
テストを並行実行すると、予期しない相互作用が発生する可能性があります。特にグローバルな状態を使用する場合は注意します。

```ts
// このテストは並列実行に対応
it.concurrent('並列実行可能なテスト', async () => {
  // ローカルな状態のみを使用するテスト
});
```

### 4. 適切なアサーションを使用する
非同期処理の結果を適切に検証するために、適切なアサーションを使用します。

```ts
// Promiseが解決されることをテスト
await expect(someAsyncFunction()).resolves.toBe(expectedValue);

// Promiseが拒否されることをテスト
await expect(someAsyncFunction()).rejects.toThrow(expectedError);
```

### 5. 非同期リソースのクリーンアップ
テスト後に非同期リソース（開いているコネクションなど）を確実にクリーンアップします。

```ts
let server;

beforeEach(async () => {
  server = await createTestServer();
});

afterEach(async () => {
  await server.close(); // 非同期のクリーンアップ
});
```

## まとめ

非同期処理のテストは、適切なテクニックを使用することで、確実かつ効率的に行うことができます。  
Promise、async/await、モックタイマーなどのツールを活用し、非同期処理特有の課題に対処しましょう。  
TDDのRed-Green-Refactorサイクルは非同期コードにも適用でき、堅牢で信頼性の高い非同期処理を開発するための強力なアプローチとなります。

非同期処理はバグの温床になりやすい一方で、テストによってその信頼性を大きく高めることができます。  
TDDを通じて、非同期ロジックを予測可能かつ安全な形で設計・実装していきましょう。

次のセクションでは、[モックとスタブを使用したテスト](./testing-with-mocks-and-stubs.md)についてです。