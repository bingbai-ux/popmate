import supabase from '../utils/supabase.js';
import type { 
  PopmateTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest,
  ApiResponse 
} from '../types/index.js';

/**
 * システムテンプレート一覧を取得
 */
export async function getSystemTemplates(): Promise<PopmateTemplate[]> {
  console.log('=== getSystemTemplates ===');

  const { data, error } = await supabase
    .from('popmate_templates')
    .select('*')
    .eq('is_system', true)
    .order('type', { ascending: true });

  if (error) {
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to fetch system templates: ${error.message}`);
  }

  return data || [];
}

/**
 * ユーザーのカスタムテンプレート一覧を取得
 */
export async function getUserTemplates(userId: string): Promise<PopmateTemplate[]> {
  console.log('=== getUserTemplates ===', { userId });

  const { data, error } = await supabase
    .from('popmate_templates')
    .select('*')
    .eq('user_id', userId)
    .eq('is_system', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to fetch user templates: ${error.message}`);
  }

  return data || [];
}

/**
 * テンプレートを取得（IDで）
 */
export async function getTemplateById(templateId: string): Promise<PopmateTemplate | null> {
  console.log('=== getTemplateById ===', { templateId });

  const { data, error } = await supabase
    .from('popmate_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to fetch template: ${error.message}`);
  }

  return data;
}

/**
 * カスタムテンプレートを作成
 */
export async function createTemplate(
  userId: string,
  request: CreateTemplateRequest
): Promise<PopmateTemplate> {
  console.log('=== createTemplate ===', { userId, name: request.name });

  const { data, error } = await supabase
    .from('popmate_templates')
    .insert({
      user_id: userId,
      name: request.name,
      type: request.type,
      width_mm: request.width_mm,
      height_mm: request.height_mm,
      design_data: request.design_data,
      is_system: false
    })
    .select()
    .single();

  if (error) {
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to create template: ${error.message}`);
  }

  return data;
}

/**
 * テンプレートを更新
 */
export async function updateTemplate(
  templateId: string,
  userId: string,
  request: UpdateTemplateRequest
): Promise<PopmateTemplate> {
  console.log('=== updateTemplate ===', { templateId, userId });

  // 所有者確認
  const existing = await getTemplateById(templateId);
  if (!existing) {
    throw new Error('Template not found');
  }
  if (existing.is_system) {
    throw new Error('Cannot modify system templates');
  }
  if (existing.user_id !== userId) {
    throw new Error('Not authorized to modify this template');
  }

  const updateData: Partial<PopmateTemplate> = {};
  if (request.name !== undefined) updateData.name = request.name;
  if (request.width_mm !== undefined) updateData.width_mm = request.width_mm;
  if (request.height_mm !== undefined) updateData.height_mm = request.height_mm;
  if (request.design_data !== undefined) updateData.design_data = request.design_data;

  const { data, error } = await supabase
    .from('popmate_templates')
    .update(updateData)
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to update template: ${error.message}`);
  }

  return data;
}

/**
 * テンプレートを削除
 */
export async function deleteTemplate(
  templateId: string,
  userId: string
): Promise<void> {
  console.log('=== deleteTemplate ===', { templateId, userId });

  // 所有者確認
  const existing = await getTemplateById(templateId);
  if (!existing) {
    throw new Error('Template not found');
  }
  if (existing.is_system) {
    throw new Error('Cannot delete system templates');
  }
  if (existing.user_id !== userId) {
    throw new Error('Not authorized to delete this template');
  }

  const { error } = await supabase
    .from('popmate_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to delete template: ${error.message}`);
  }
}
