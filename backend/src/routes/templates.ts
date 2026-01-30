import { Router, Request, Response } from 'express';
import * as templateService from '../services/templateService.js';
import type { CreateTemplateRequest, UpdateTemplateRequest } from '../types/index.js';

const router = Router();

/**
 * GET /api/templates/system
 * システムテンプレート一覧を取得
 */
router.get('/system', async (req: Request, res: Response) => {
  try {
    const templates = await templateService.getSystemTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('=== Error in GET /templates/system ===', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/templates/user
 * ユーザーのカスタムテンプレート一覧を取得
 */
router.get('/user', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const templates = await templateService.getUserTemplates(userId);
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('=== Error in GET /templates/user ===', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/templates/:id
 * テンプレートを取得
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await templateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('=== Error in GET /templates/:id ===', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * POST /api/templates
 * カスタムテンプレートを作成
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const request: CreateTemplateRequest = req.body;
    const template = await templateService.createTemplate(userId, request);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('=== Error in POST /templates ===', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * PUT /api/templates/:id
 * テンプレートを更新
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const { id } = req.params;
    const request: UpdateTemplateRequest = req.body;
    const template = await templateService.updateTemplate(id, userId, request);
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('=== Error in PUT /templates/:id ===', error);
    const status = (error as Error).message.includes('not found') ? 404 : 
                   (error as Error).message.includes('Not authorized') ? 403 : 500;
    res.status(status).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * DELETE /api/templates/:id
 * テンプレートを削除
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const { id } = req.params;
    await templateService.deleteTemplate(id, userId);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('=== Error in DELETE /templates/:id ===', error);
    const status = (error as Error).message.includes('not found') ? 404 : 
                   (error as Error).message.includes('Not authorized') ? 403 : 500;
    res.status(status).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
