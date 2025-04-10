# 非同期処理のテスト


### Red
#### ``
```ts
describe('UserService', () => {
  it('ユーザーを非同期で取得できる', async () => {
    const user = await fetchUser(1);
    expect(user.id).toBe(1);
    expect(user.name).toBe('ユーザー1');
  });
  
  it('存在しないユーザーIDの場合はエラーになる', async () => {
    await expect(fetchUser(-1)).rejects.toThrow('ユーザーが見つかりません');
  });
});
```


### Green → Refactor
#### ``
```ts
// 実装
interface User {
  id: number;
  name: string;
}

async function fetchUser(id: number): Promise<User> {
  if (id < 1) {
    return Promise.reject(new Error('ユーザーが見つかりません'));
  }
  
  // 実際はAPIリクエストなど
  return Promise.resolve({
    id,
    name: `ユーザー${id}`
  });
}
```