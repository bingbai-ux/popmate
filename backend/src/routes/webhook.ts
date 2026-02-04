import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { cache, CACHE_TAGS } from '../utils/cacheManager.js';
import type { WebhookEventType, WebhookPayload } from '../types/index.js';

const router = Router();

// Webhook検証用シークレット（環境変数から取得）
const WEBHOOK_SECRET = process.env.SMAREGI_WEBHOOK_SECRET || '';

/**
 * Webhookペイロードの署名を検証
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | undefined
): boolean {
  if (!WEBHOOK_SECRET || !signature) {
    // シークレットが設定されていない場合は開発環境とみなしスキップ
    console.warn('Webhook signature verification skipped: no secret configured');
    return process.env.NODE_ENV === 'development';
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  // タイミング攻撃対策
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}

/**
 * Webhookイベントを処理
 */
async function handleWebhookEvent(event: WebhookPayload): Promise<void> {
  console.log(`Processing webhook event: ${event.event}`, {
    id: event.data.id,
    timestamp: event.timestamp,
  });

  switch (event.event) {
    case 'product.created':
    case 'product.updated':
    case 'product.deleted':
      // 商品キャッシュを無効化
      await cache.invalidateByTag(CACHE_TAGS.PRODUCTS);
      console.log('Product cache invalidated');
      break;

    case 'category.created':
    case 'category.updated':
    case 'category.deleted':
      // カテゴリキャッシュを無効化
      await cache.invalidateByTag(CACHE_TAGS.CATEGORIES);
      console.log('Category cache invalidated');
      break;

    default:
      console.warn(`Unknown webhook event type: ${event.event}`);
  }
}

/**
 * Webhookエンドポイント
 * POST /api/webhook/smaregi
 */
router.post('/smaregi', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-smaregi-signature'] as string | undefined;
    const rawBody = JSON.stringify(req.body);

    // 署名検証
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Webhook signature verification failed');
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    // ペイロードの検証
    const payload = req.body as WebhookPayload;
    if (!payload.event || !payload.timestamp || !payload.data) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payload format',
      });
    }

    // イベントを非同期で処理（即座にレスポンスを返す）
    handleWebhookEvent(payload).catch(error => {
      console.error('Webhook event processing failed:', error);
    });

    // 即座に200を返す（Webhook受信確認）
    res.status(200).json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Webhook検証エンドポイント（Smaregiからの確認用）
 * GET /api/webhook/smaregi
 */
router.get('/smaregi', (req: Request, res: Response) => {
  // チャレンジレスポンス（Webhook登録時の確認用）
  const challenge = req.query.challenge as string;
  if (challenge) {
    return res.status(200).send(challenge);
  }

  res.status(200).json({
    success: true,
    message: 'Webhook endpoint is active',
    supported_events: [
      'product.created',
      'product.updated',
      'product.deleted',
      'category.created',
      'category.updated',
      'category.deleted',
    ] as WebhookEventType[],
  });
});

/**
 * Webhookログエンドポイント（管理用）
 * GET /api/webhook/logs
 */
router.get('/logs', (req: Request, res: Response) => {
  // 将来的にWebhookログをDBに保存して取得可能にする
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    message: 'Webhook logging will be available in a future release',
  });
});

export default router;
