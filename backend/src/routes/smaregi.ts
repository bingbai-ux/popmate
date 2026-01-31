// backend/src/routes/smaregi.ts

import { Router, Request, Response } from 'express';
import { getProducts, getProductById, getCategories } from '../services/smaregiService.js';

const router = Router();

/**
 * GET /api/smaregi/products
 * 商品一覧取得（ページネーション対応）
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const keyword = req.query.keyword as string | undefined;
    const categoryId = req.query.category_id as string | undefined;

    const result = await getProducts(page, limit, { keyword, categoryId });
    res.json(result);
  } catch (error: any) {
    console.error('[Smaregi Products Error]', error.response?.data || error.message);

    if (error.response?.status === 401) {
      res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'スマレジAPIの認証に失敗しました。クライアントIDとシークレットを確認してください。',
      });
    } else {
      res.status(error.response?.status || 500).json({
        success: false,
        error: 'api_error',
        message: error.response?.data?.message || error.message,
      });
    }
  }
});

/**
 * GET /api/smaregi/products/:id
 * 商品詳細取得
 */
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: '商品が見つかりません',
      });
    }

    res.json({ success: true, data: product });
  } catch (error: any) {
    console.error('[Smaregi Product Detail Error]', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'api_error',
      message: error.response?.data?.message || error.message,
    });
  }
});

/**
 * GET /api/smaregi/categories
 * カテゴリ一覧取得
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await getCategories();
    res.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('[Smaregi Categories Error]', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'api_error',
      message: error.response?.data?.message || error.message,
    });
  }
});

export default router;
