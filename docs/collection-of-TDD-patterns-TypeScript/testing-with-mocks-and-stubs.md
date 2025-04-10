# モックとスタブを使用したテスト

## 例: メールアドレス書式検証
### Red

#### ``
```ts
// テスト
describe('NotificationService', () => {
  it('通知を送信できる', async () => {
    // 依存するサービスをモック
    const emailServiceMock = {
      sendEmail: vitest.fn().mockResolvedValue(true)
    };
    
    const notificationService = new NotificationService(emailServiceMock);
    const result = await notificationService.notify('test@example.com', 'テスト通知');
    
    expect(result).toBe(true);
    expect(emailServiceMock.sendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'テスト通知'
    );
  });
});
```

### Green → Refactor
#### ``

```ts
interface EmailService {
  sendEmail(to: string, content: string): Promise<boolean>;
}

class NotificationService {
  constructor(private emailService: EmailService) {}
  
  async notify(to: string, content: string): Promise<boolean> {
    return this.emailService.sendEmail(to, content);
  }
}