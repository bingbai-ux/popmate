import { Router, Request, Response } from 'express';
import * as savedPopService from '../services/savedPopService.js';
import type { SavePopRequest } from '../types/index.js';

const router = Router();

/**
 * GET /api/saved-pops
 * ユーザーの保存データ一覧を取得
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const savedPops = await savedPopService.getSavedPops(userId);
    res.json({ success: true, data: savedPops });
  } catch (error) {
    console.error('=== Error in GET /saved-pops ===', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/saved-pops/:id
 * 保存データを取得
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const { id } = req.params;
    const savedPop = await savedPopService.getSavedPopById(id, userId);

    if (!savedPop) {
      return res.status(404).json({ success: false, error: 'Saved pop not found' });
    }

    res.json({ success: true, data: savedPop });
  } catch (error) {
    console.error('=== Error in GET /saved-pops/:id ===', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * POST /api/saved-pops
 * ポップデータを保存
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const request: SavePopRequest = req.body;
    const savedPop = await savedPopService.savePop(userId, request);
    res.status(201).json({ success: true, data: savedPop });
  } catch (error) {
    console.error('=== Error in POST /saved-pops ===', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * PUT /api/saved-pops/:id
 * 保存データを更新
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const { id } = req.params;
    const request: Partial<SavePopRequest> = req.body;
    const savedPop = await savedPopService.updateSavedPop(id, userId, request);
    res.json({ success: true, data: savedPop });
  } catch (error) {
    console.error('=== Error in PUT /saved-pops/:id ===', error);
    const status = (error as Error).message.includes('not found') ? 404 : 500;
    res.status(status).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * DELETE /api/saved-pops/:id
 * 保存データを削除
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const { id } = req.params;
    await savedPopService.deleteSavedPop(id, userId);
    res.json({ success: true, message: 'Saved pop deleted' });
  } catch (error) {
    console.error('=== Error in DELETE /saved-pops/:id ===', error);
    const status = (error as Error).message.includes('not found') ? 404 : 500;
    res.status(status).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
