import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import templatesRouter from './routes/templates.js';
import savedPopsRouter from './routes/savedPops.js';
import smaregiRouter from './routes/smaregi.js';
import authRouter from './routes/auth.js';
import webhookRouter from './routes/webhook.js';

// 環境変数を読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 許可するオリジンのリスト（静的）
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://popmate.vercel.app',
  'https://popmate-git-main-bingbai-uxs-projects.vercel.app',
  'http://localhost:3000',
].filter((origin): origin is string => Boolean(origin));

// Vercelプレビューデプロイメント用パターン（プロジェクト固有）
// 例: popmate-xxxx-bingbai-uxs-projects.vercel.app
const vercelPreviewPattern = /^https:\/\/popmate(-[a-z0-9]+)?(-[a-z0-9-]+)?\.vercel\.app$/;

/**
 * オリジンが許可されているか検証
 */
function isOriginAllowed(origin: string): boolean {
  // 静的リストに存在するか
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  // Vercelプレビューデプロイメントパターンに一致するか
  if (vercelPreviewPattern.test(origin)) {
    return true;
  }
  return false;
}

// ミドルウェア設定
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // オリジンがない場合（サーバー間リクエスト・cURLなど）
    // 本番環境では拒否、開発環境では許可
    if (!origin) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      return callback(null, isDevelopment);
    }
    // 許可リストまたはパターンに一致するか検証
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id'],
  maxAge: 86400 // プリフライトキャッシュ: 24時間
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// x-user-id が未指定の場合、CONTRACT_ID をフォールバックとして使用
app.use((req, res, next) => {
  if (!req.headers['x-user-id'] && process.env.SMAREGI_CONTRACT_ID) {
    req.headers['x-user-id'] = process.env.SMAREGI_CONTRACT_ID;
  }
  next();
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'popmate-backend'
  });
});

// APIルート
app.use('/api/templates', templatesRouter);
app.use('/api/saved-pops', savedPopsRouter);
app.use('/api/smaregi', smaregiRouter);
app.use('/api/auth', authRouter);
app.use('/api/webhook', webhookRouter);

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Not Found',
    path: req.path 
  });
});

// エラーハンドラー
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('=== Unhandled Error ===', {
    message: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(500).json({ 
    success: false, 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log('=== PopMate Backend Server ===');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
