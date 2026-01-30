import { Router, Request, Response } from 'express';
import * as smaregiService from '../services/smaregiService.js';
import supabase from '../utils/supabase.js';

const router = Router();

/**
 * GET /api/smaregi/auth
 * スマレジ認証URLを取得
 */
router.get('/auth', async (req: Request, res: Response) => {
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
    
    res.json({ 
      success: true, 
      data: { 
        authUrl,
        state 
      } 
    });
  } catch (error) {
    console.error('=== Error in GET /smaregi/auth ===', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * POST /api/smaregi/callback
 * スマレジ認証コールバック処理
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Authorization code required' 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User ID required' 
      });
    }

    const redirectUri = process.env.SMAREGI_REDIRECT_URI;
    if (!redirectUri) {
      return res.status(500).json({ 
        success: false, 
        error: 'Redirect URI not configured' 
      });
    }

    // トークンを取得
    const tokenResponse = await smaregiService.exchangeCodeForToken(code, redirectUri);

    // ユーザー情報を更新（契約IDを保存）
    // 注: 実際の契約IDはトークンから取得するか、別途APIで取得する必要があります
    // ここでは仮の処理として、トークンを返します

    res.json({ 
      success: true, 
      data: {
        accessToken: tokenResponse.access_token,
        expiresIn: tokenResponse.expires_in
      },
      message: 'Smaregi authentication successful'
    });
  } catch (error) {
    console.error('=== Error in POST /smaregi/callback ===', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/smaregi/products
 * 商品一覧を取得
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-smaregi-token'] as string;
    const contractId = req.headers['x-smaregi-contract-id'] as string;

    if (!accessToken || !contractId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Smaregi credentials required' 
      });
    }

    const { keyword, category_id, page, limit } = req.query;

    const result = await smaregiService.getProducts(
      { contractId, accessToken },
      {
        keyword: keyword as string,
        categoryId: category_id as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      }
    );

    res.json(result);
  } catch (error) {
    console.error('=== Error in GET /smaregi/products ===', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/smaregi/products/:id
 * 商品詳細を取得
 */
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-smaregi-token'] as string;
    const contractId = req.headers['x-smaregi-contract-id'] as string;

    if (!accessToken || !contractId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Smaregi credentials required' 
      });
    }

    const { id } = req.params;

    const product = await smaregiService.getProductById(
      { contractId, accessToken },
      id
    );

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('=== Error in GET /smaregi/products/:id ===', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/smaregi/categories
 * カテゴリ一覧を取得
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-smaregi-token'] as string;
    const contractId = req.headers['x-smaregi-contract-id'] as string;

    if (!accessToken || !contractId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Smaregi credentials required' 
      });
    }

    const categories = await smaregiService.getCategories({ contractId, accessToken });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('=== Error in GET /smaregi/categories ===', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
