/**
 * キャッシュマネージャー
 * メモリキャッシュからRedisへの移行を容易にする抽象化レイヤー
 */

export interface CacheOptions {
  ttl?: number;  // Time to live in milliseconds
  tags?: string[];  // Cache invalidation tags
}

export interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
  tags: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  invalidateByTag(tag: string): Promise<number>;
  getStats(): CacheStats;
}

// デフォルトTTL: 5分
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * メモリベースのキャッシュプロバイダー
 * 本番環境ではRedisProviderに置き換え可能
 */
class MemoryCacheProvider implements CacheProvider {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private stats = { hits: 0, misses: 0 };
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 定期的に期限切れエントリを削除
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // 期限切れチェック
    if (Date.now() > entry.expiresAt) {
      await this.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const now = Date.now();
    const ttl = options.ttl ?? DEFAULT_TTL;
    const tags = options.tags ?? [];

    const entry: CacheEntry<T> = {
      data: value,
      createdAt: now,
      expiresAt: now + ttl,
      tags,
    };

    this.cache.set(key, entry);

    // タグインデックスを更新
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // タグインデックスから削除
    for (const tag of entry.tags) {
      this.tagIndex.get(tag)?.delete(key);
    }

    this.cache.delete(key);
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    if (Date.now() > entry.expiresAt) {
      await this.delete(key);
      return false;
    }
    return true;
  }

  async invalidateByTag(tag: string): Promise<number> {
    const keys = this.tagIndex.get(tag);
    if (!keys || keys.size === 0) {
      return 0;
    }

    let count = 0;
    for (const key of Array.from(keys)) {
      if (await this.delete(key)) {
        count++;
      }
    }

    this.tagIndex.delete(tag);
    return count;
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Redis キャッシュプロバイダー（将来の実装用スタブ）
 * Redis接続を設定後、ここに実装を追加
 */
// class RedisCacheProvider implements CacheProvider {
//   private client: RedisClient;
//   constructor(redisUrl: string) { ... }
//   async get<T>(key: string): Promise<T | null> { ... }
//   async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> { ... }
//   async delete(key: string): Promise<boolean> { ... }
//   async clear(): Promise<void> { ... }
//   async has(key: string): Promise<boolean> { ... }
//   async invalidateByTag(tag: string): Promise<number> { ... }
//   getStats(): CacheStats { ... }
// }

// キャッシュマネージャーシングルトン
class CacheManager {
  private provider: CacheProvider;
  private static instance: CacheManager;

  private constructor() {
    // 環境変数でRedisが設定されている場合はRedisCacheProviderを使用
    // const redisUrl = process.env.REDIS_URL;
    // if (redisUrl) {
    //   this.provider = new RedisCacheProvider(redisUrl);
    // } else {
    //   this.provider = new MemoryCacheProvider();
    // }
    this.provider = new MemoryCacheProvider();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  getProvider(): CacheProvider {
    return this.provider;
  }
}

// エクスポート用のシングルトンインスタンス
export const cacheManager = CacheManager.getInstance();
export const cache = cacheManager.getProvider();

// キャッシュキー生成ヘルパー
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  return `${prefix}:${sortedParams}`;
}

// キャッシュタグ定義
export const CACHE_TAGS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  SUPPLIERS: 'suppliers',
  TEMPLATES: 'templates',
  USER_DATA: 'user-data',
} as const;

// キャッシュTTL定義（ミリ秒）
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1分
  MEDIUM: 5 * 60 * 1000,     // 5分
  LONG: 30 * 60 * 1000,      // 30分
  HOUR: 60 * 60 * 1000,      // 1時間
  DAY: 24 * 60 * 60 * 1000,  // 24時間
} as const;

/**
 * キャッシュデコレータ（メソッド用）
 * 使用例: @Cached({ ttl: CACHE_TTL.MEDIUM, tags: [CACHE_TAGS.PRODUCTS] })
 */
export function Cached(options: CacheOptions = {}) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;

      // キャッシュから取得を試みる
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // キャッシュミス：元のメソッドを実行
      const result = await originalMethod.apply(this, args);

      // 結果をキャッシュに保存
      await cache.set(cacheKey, result, options);

      return result;
    };

    return descriptor;
  };
}

/**
 * キャッシュ付き関数ラッパー
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // キャッシュから取得を試みる
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // キャッシュミス：関数を実行
  const result = await fn();

  // 結果をキャッシュに保存
  await cache.set(key, result, options);

  return result;
}
