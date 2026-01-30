import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import templatesRouter from './routes/templates.js';
import savedPopsRouter from './routes/savedPops.js';
import smaregiRouter from './routes/smaregi.js';

// 環境変数を読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア設定
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
