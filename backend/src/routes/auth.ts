// backend/src/routes/auth.ts

import { Router, Request, Response } from 'express';
import { testConnection } from '../services/smaregiService.js';

const router = Router();

/**
 * GET /api/auth/smaregi/status
 * スマレジAPIへの接続状態を確認
 * Client Credentials Grant なのでログイン不要
 */
router.get('/smaregi/status', async (req: Request, res: Response) => {
  try {
    const result = await testConnection();
    res.json({
      connected: result.success,
      message: result.message,
      authMethod: 'client_credentials',
    });
  } catch (error: any) {
    console.error('[Auth Status Error]', error);
    res.status(500).json({
      connected: false,
      message: error.message || 'Unknown error',
    });
  }
});

export default router;
