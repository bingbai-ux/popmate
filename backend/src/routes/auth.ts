import { Router, Request, Response } from 'express';
import * as smaregiService from '../services/smaregiService.js';

const router = Router();

/**
 * GET /api/auth/smaregi/authorize
 * スマレジ認証画面へリダイレクト
 */
router.get('/smaregi/authorize', async (req: Request, res: Response) => {
  try {
    const redirectUri = process.env.SMAREGI_REDIRECT_URI;
    if (!redirectUri) {
      return res.status(500).json({ 
        success: false, 
        error: 'Redirect URI not configured' 
      });
    }

    // ランダムなstateを生成（CSRF対策）
    const state = crypto.randomUUID();
    
    const authUrl = smaregiService.generateAuthUrl(redirectUri, state);
    
    // スマレジ認証画面へリダイレクト
    res.redirect(authUrl);
  } catch (error) {
    console.error('=== Error in GET /auth/smaregi/authorize ===', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/auth/smaregi/callback
 * スマレジ認証コールバック（GETリクエスト対応）
 */
router.get('/smaregi/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;

    // エラーがある場合
    if (error) {
      console.error('=== Smaregi Auth Error ===', { error, error_description });
      const frontendUrl = process.env.FRONTEND_URL || 'https://popmate.vercel.app';
      return res.redirect(`${frontendUrl}/auth?error=${encodeURIComponent(String(error_description || error))}`);
    }

    if (!code) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://popmate.vercel.app';
      return res.redirect(`${frontendUrl}/auth?error=${encodeURIComponent('認証コードがありません')}`);
    }

    const redirectUri = process.env.SMAREGI_REDIRECT_URI;
    if (!redirectUri) {
      return res.status(500).json({ 
        success: false, 
        error: 'Redirect URI not configured' 
      });
    }

    // トークンを取得
    const tokenResponse = await smaregiService.exchangeCodeForToken(String(code), redirectUri);

    // 契約IDを環境変数から取得（スマレジAPIでは契約IDはトークンに含まれない）
    const contractId = process.env.SMAREGI_CONTRACT_ID;

    if (!contractId) {
      console.error('=== SMAREGI_CONTRACT_ID not configured ===');
      const frontendUrl = process.env.FRONTEND_URL || 'https://popmate.vercel.app';
      return res.redirect(`${frontendUrl}/auth?error=${encodeURIComponent('契約IDが設定されていません')}`);
    }

    // フロントエンドにリダイレクト（トークンをクエリパラメータで渡す）
    const frontendUrl = process.env.FRONTEND_URL || 'https://popmate.vercel.app';
    const callbackUrl = new URL('/auth/callback', frontendUrl);
    callbackUrl.searchParams.set('token', tokenResponse.access_token);
    callbackUrl.searchParams.set('contractId', contractId);
    callbackUrl.searchParams.set('expiresIn', String(tokenResponse.expires_in));

    res.redirect(callbackUrl.toString());
  } catch (error) {
    console.error('=== Error in GET /auth/smaregi/callback ===', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://popmate.vercel.app';
    const errorMessage = error instanceof Error ? error.message : '認証に失敗しました';
    res.redirect(`${frontendUrl}/auth?error=${encodeURIComponent(errorMessage)}`);
  }
});

/**
 * GET /api/auth/smaregi/status
 * 認証状態を確認
 */
router.get('/smaregi/status', async (req: Request, res: Response) => {
  try {
    const token = req.headers['x-smaregi-token'] as string;
    const contractId = req.headers['x-smaregi-contract-id'] as string;

    if (!token || !contractId) {
      return res.json({ 
        authenticated: false,
        message: 'No credentials provided'
      });
    }

    // スマレジAPIで認証状態を確認（商品一覧を1件取得してみる）
    try {
      const result = await smaregiService.getProducts(
        { contractId, accessToken: token },
        { limit: 1 }
      );
      
      res.json({ 
        authenticated: true,
        contractId,
        message: 'Authentication valid'
      });
    } catch (apiError) {
      // APIエラーの場合は認証無効
      res.json({ 
        authenticated: false,
        message: 'Token expired or invalid'
      });
    }
  } catch (error) {
    console.error('=== Error in GET /auth/smaregi/status ===', error);
    res.json({ 
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
