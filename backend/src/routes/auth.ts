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

/**
 * GET /api/auth/identity
 * 現在のユーザーID（契約ID）を返す
 * テンプレート同期などでユーザー識別に使用
 */
router.get('/identity', async (req: Request, res: Response) => {
  try {
    const contractId = process.env.SMAREGI_CONTRACT_ID;
    if (!contractId) {
      return res.status(500).json({
        success: false,
        error: 'Contract ID not configured',
      });
    }
    res.json({
      success: true,
      userId: contractId,
    });
  } catch (error: any) {
    console.error('[Auth Identity Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
    });
  }
});

export default router;
