// バックエンド型定義
// 共有型定義からの再エクスポート + バックエンド固有の型

// ============================================
// 共有型定義（@popmate/shared から）
// ============================================
// Note: ビルド時にパス解決されるため、直接インポートパスを使用
export type {
  // Position & Size
  Position,
  Size,

  // User Types
  PopmateUser,

  // Template Types
  TemplateType,
  PopmateTemplate,
  TemplateConfig,

  // Design Data Types
  DesignData,
  BackgroundSettings,
  DesignElement,
  ElementProperties,

  // Product Types
  SmaregiProduct,
  SmaregiCategory,
  SmaregiSupplier,
  Product,
  Category,
  Supplier,

  // Saved Pop Types
  PopmateSavedPop,
  SelectedProduct,
  PrintSettings,

  // Tax Settings
  TaxSettings,
  RoundingMethod,

  // Project Types
  SaveType,
  SavedProject,

  // API Response Types
  ApiResponse,
  PaginatedResponse,
  PaginationInfo,

  // Request Types
  CreateTemplateRequest,
  UpdateTemplateRequest,
  SavePopRequest,
  ProductSearchParams,

  // Webhook Types
  WebhookEventType,
  WebhookPayload,

  // Placeholder Types
  PlaceholderDefinition,
} from '../../../shared/types/index.js';

export {
  DEFAULT_TAX_SETTINGS,
  TEMPLATES,
  PLACEHOLDERS,
} from '../../../shared/types/index.js';

// ============================================
// バックエンド固有の型定義
// ============================================

/**
 * Smaregi APIトークン情報
 */
export interface SmaregiTokenInfo {
  accessToken: string;
  expiresAt: number;
  contractId: string;
}

/**
 * Smaregi API設定
 */
export interface SmaregiApiConfig {
  clientId: string;
  clientSecret: string;
  contractId: string;
  scopes: string[];
}

/**
 * キャッシュエントリ
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * API レート制限ステータス
 */
export interface RateLimitStatus {
  remaining: number;
  limit: number;
  resetTime: number;
}

/**
 * バッチ処理リクエスト
 */
export interface BatchRequest<T> {
  items: T[];
  batchSize: number;
  delayMs: number;
}

/**
 * バッチ処理結果
 */
export interface BatchResult<T, R> {
  successful: Array<{ item: T; result: R }>;
  failed: Array<{ item: T; error: Error }>;
}

/**
 * ページング情報（Smaregi API）
 */
export interface SmaregiPagination {
  limit: number;
  page: number;
  hasMore: boolean;
}

/**
 * Supabase ユーザーセッション
 */
export interface UserSession {
  userId: string;
  contractId: string | null;
  email: string;
}
