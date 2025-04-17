# RxJSを使った状態変化をテストする

## ステートフルなカウンターサービスのTDD開発ストーリー

###  要件の定義
ステートフルなカウンターサービスの要件を明確にします。

- カウンター値を保持するサービス
- 値の増加・減少・リセット機能
- 現在の値を購読できるObservable
- 特定の値に達したときのイベント通知

### Red🔴： 失敗するテストを書く
#### `counter.test.ts`

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestScheduler } from 'rxjs/testing';
import { CounterService } from '../../src/service/counter';

describe('CounterService', () => {
  let service: CounterService;
  let testScheduler: TestScheduler;

  beforeEach(() => {
    service = new CounterService();
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('初期値は0であること', () => {
    return new Promise<void>((resolve) => {
      service.counter$.subscribe((value) => {
        expect(value).toBe(0);
        resolve();
      });
    });
  });

  it('increment()を呼ぶとカウンターが1増加すること', () => {
    return new Promise<void>((resolve) => {
      service.increment();

      service.counter$.subscribe((value) => {
        expect(value).toBe(1);
        resolve();
      });
    });
  });

  it('decrement()を呼ぶとカウンターが1減少すること', () => {
    return new Promise<void>((resolve) => {
      service.increment(); // 1にする
      service.decrement(); // 0に戻す

      service.counter$.subscribe((value) => {
        expect(value).toBe(0);
        resolve();
      });
    });
  });

  it('reset()を呼ぶとカウンターが0にリセットされること', () => {
    return new Promise<void>((resolve) => {
      service.increment();
      service.increment();
      service.reset();

      service.counter$.subscribe((value) => {
        expect(value).toBe(0);
        resolve();
      });
    });
  });

  it('setValue()で特定の値に設定できること', () => {
    return new Promise<void>((resolve) => {
      service.setValue(10);

      service.counter$.subscribe((value) => {
        expect(value).toBe(10);
        resolve();
      });
    });
  });

  it('counterMaxイベントは、カウンターが最大値に達したときに発火すること', () => {
    return new Promise<void>((resolve) => {
      const maxReached = vi.fn();
      service.counterMax$.subscribe(maxReached);

      service.setMaxValue(5);
      service.setValue(4);
      expect(maxReached).not.toHaveBeenCalled();

      service.increment(); // 5に達する
      expect(maxReached).toHaveBeenCalledWith(5);
      resolve();
    });
  });

  it('マルチスレッドな環境でも値が正しく更新されること', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const input = cold('a-b-c-d|', {
        a: 'increment',
        b: 'increment',
        c: 'decrement',
        d: 'reset',
      });

      const expected = '  a-b-c-d|';
      const expectedValues = {
        a: 1,
        b: 2,
        c: 1,
        d: 0,
      };

      input.subscribe((action) => {
        switch (action) {
          case 'increment':
            service.increment();
            break;
          case 'decrement':
            service.decrement();
            break;
          case 'reset':
            service.reset();
            break;
        }
      });

      expectObservable(service.counter$).toBe(expected, expectedValues);
    });
  });
});

```
### Green🟢: テストを通すコードを書く
#### `counter.ts`
```ts
import { BehaviorSubject, Subject } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

export class CounterService {
  // 内部ステート管理用のSubject
  private counterSubject = new BehaviorSubject<number>(0);
  private maxValueSubject = new BehaviorSubject<number>(Number.MAX_SAFE_INTEGER);
  private counterMaxSubject = new Subject<number>();

  // 公開するObservable
  public counter$ = this.counterSubject.asObservable();
  public counterMax$ = this.counterMaxSubject.asObservable();

  constructor() {
    // 値が最大値に達したときの処理
    this.counterSubject
      .pipe(
        distinctUntilChanged(),
        filter(value => value === this.maxValueSubject.value)
      )
      .subscribe(value => {
        this.counterMaxSubject.next(value);
      });
  }

  /**
   * カウンターを1増加させる
   */
  increment(): void {
    const currentValue = this.counterSubject.value;
    const newValue = Math.min(currentValue + 1, this.maxValueSubject.value);
    this.counterSubject.next(newValue);
  }

  /**
   * カウンターを1減少させる
   */
  decrement(): void {
    const currentValue = this.counterSubject.value;
    const newValue = Math.max(currentValue - 1, 0);
    this.counterSubject.next(newValue);
  }

  /**
   * カウンターを0にリセットする
   */
  reset(): void {
    this.counterSubject.next(0);
  }

  /**
   * カウンターに特定の値を設定する
   */
  setValue(value: number): void {
    // 0未満にはならないように、最大値以上にはならないように
    const newValue = Math.max(0, Math.min(value, this.maxValueSubject.value));
    this.counterSubject.next(newValue);
  }

  /**
   * 最大値を設定する
   */
  setMaxValue(maxValue: number): void {
    this.maxValueSubject.next(maxValue);
    
    // もし現在の値が新しい最大値より大きければ調整
    if (this.counterSubject.value > maxValue) {
      this.counterSubject.next(maxValue);
    }
  }
}
```