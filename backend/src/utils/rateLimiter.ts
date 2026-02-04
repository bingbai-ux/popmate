// backend/src/utils/rateLimiter.ts
// レート制限対策ユーティリティ

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * リトライ設定
 */
export interface RetryConfig {
  maxRetries: number;          // 最大リトライ回数
  initialDelayMs: number;      // 初回待機時間（ミリ秒）
  maxDelayMs: number;          // 最大待機時間（ミリ秒）
  backoffMultiplier: number;   // 待機時間の乗数
  retryableStatuses: number[]; // リトライ対象のHTTPステータス
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000,        // 1秒
  maxDelayMs: 60000,           // 60秒
  backoffMultiplier: 2,
  retryableStatuses: [429, 500, 502, 503, 504],
};

/**
 * 指定時間待機
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential Backoff with Jitter
 * ジッターを加えることで、複数リクエストが同時にリトライするのを防ぐ
 */
function calculateDelay(
  attempt: number,
  config: RetryConfig,
  retryAfterHeader?: string
): number {
  // Retry-After ヘッダーがあればそれを優先
  if (retryAfterHeader) {
    const retryAfter = parseInt(retryAfterHeader, 10);
    if (!isNaN(retryAfter)) {
      return retryAfter * 1000;
    }
  }

  // Exponential backoff with jitter
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const jitter = Math.random() * config.initialDelayMs;
  const delay = Math.min(exponentialDelay + jitter, config.maxDelayMs);

  return Math.floor(delay);
}

/**
 * リトライ可能かどうかを判定
 */
function isRetryable(error: AxiosError, config: RetryConfig): boolean {
  if (!error.response) {
    // ネットワークエラー（タイムアウト等）はリトライ対象
    return true;
  }
  return config.retryableStatuses.includes(error.response.status);
}

/**
 * リトライ付きHTTPリクエスト
 */
export async function requestWithRetry<T = any>(
  requestFn: () => Promise<AxiosResponse<T>>,
  config: Partial<RetryConfig> = {}
): Promise<AxiosResponse<T>> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: AxiosError | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const response = await requestFn();
      return response;
    } catch (error) {
      const axiosError = error as AxiosError;
      lastError = axiosError;

      // リトライ不可なエラーは即座にスロー
      if (!isRetryable(axiosError, finalConfig)) {
        throw error;
      }

      // 最終試行の場合はスロー
      if (attempt === finalConfig.maxRetries) {
        console.error(`[RateLimiter] 最大リトライ回数(${finalConfig.maxRetries})に達しました`);
        throw error;
      }

      // 待機時間を計算
      const retryAfter = axiosError.response?.headers?.['retry-after'];
      const delayMs = calculateDelay(attempt, finalConfig, retryAfter);

      console.warn(
        `[RateLimiter] リトライ ${attempt + 1}/${finalConfig.maxRetries}`,
        `ステータス: ${axiosError.response?.status || 'NETWORK_ERROR'}`,
        `待機: ${delayMs}ms`
      );

      await sleep(delayMs);
    }
  }

  throw lastError;
}

/**
 * リクエストキュー管理（同時リクエスト数制限）
 */
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private maxConcurrent: number;
  private minIntervalMs: number;
  private lastRequestTime = 0;

  constructor(maxConcurrent: number = 5, minIntervalMs: number = 100) {
    this.maxConcurrent = maxConcurrent;
    this.minIntervalMs = minIntervalMs;
  }

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        // 最小間隔を確保
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minIntervalMs) {
          await sleep(this.minIntervalMs - timeSinceLastRequest);
        }

        this.activeRequests++;
        this.lastRequestTime = Date.now();

        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      };

      if (this.activeRequests < this.maxConcurrent) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }

  private processQueue(): void {
    if (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getActiveRequests(): number {
    return this.activeRequests;
  }
}

// シングルトンのリクエストキュー（スマレジAPI用）
export const smaregiRequestQueue = new RequestQueue(3, 200); // 同時3リクエスト、200ms間隔

/**
 * スマレジAPI用のレート制限付きリクエスト
 */
export async function smaregiRequestWithRateLimit<T = any>(
  requestFn: () => Promise<AxiosResponse<T>>
): Promise<AxiosResponse<T>> {
  return smaregiRequestQueue.add(() =>
    requestWithRetry(requestFn, {
      maxRetries: 5,
      initialDelayMs: 2000,  // スマレジAPIは厳しいので2秒から
      retryableStatuses: [429, 500, 502, 503, 504],
    })
  );
}

export default {
  requestWithRetry,
  smaregiRequestWithRateLimit,
  smaregiRequestQueue,
};
