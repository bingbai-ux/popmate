import supabase from '../utils/supabase.js';
import type { 
  PopmateSavedPop, 
  SavePopRequest,
  ApiResponse 
} from '../types/index.js';

/**
 * ユーザーの保存データ一覧を取得
 */
export async function getSavedPops(userId: string): Promise<PopmateSavedPop[]> {
  console.log('=== getSavedPops ===', { userId });

  const { data, error } = await supabase
    .from('popmate_saved_pops')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to fetch saved pops: ${error.message}`);
  }

  return data || [];
}

/**
 * 保存データを取得（IDで）
 */
export async function getSavedPopById(
  savedPopId: string,
  userId: string
): Promise<PopmateSavedPop | null> {
  console.log('=== getSavedPopById ===', { savedPopId, userId });

  const { data, error } = await supabase
    .from('popmate_saved_pops')
    .select('*')
    .eq('id', savedPopId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to fetch saved pop: ${error.message}`);
  }

  return data;
}

/**
 * ポップデータを保存
 */
export async function savePop(
  userId: string,
  request: SavePopRequest
): Promise<PopmateSavedPop> {
  console.log('=== savePop ===', { userId, name: request.name });

  const { data, error } = await supabase
    .from('popmate_saved_pops')
    .insert({
      user_id: userId,
      name: request.name,
      template_id: request.template_id || null,
      width_mm: request.width_mm,
      height_mm: request.height_mm,
      design_data: request.design_data,
      selected_products: request.selected_products,
      print_settings: request.print_settings
    })
    .select()
    .single();

  if (error) {
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to save pop: ${error.message}`);
  }

  return data;
}

/**
 * 保存データを更新
 */
export async function updateSavedPop(
  savedPopId: string,
  userId: string,
  request: Partial<SavePopRequest>
): Promise<PopmateSavedPop> {
  console.log('=== updateSavedPop ===', { savedPopId, userId });

  // 所有者確認
  const existing = await getSavedPopById(savedPopId, userId);
  if (!existing) {
    throw new Error('Saved pop not found');
  }

  const updateData: Partial<PopmateSavedPop> = {};
  if (request.name !== undefined) updateData.name = request.name;
  if (request.template_id !== undefined) updateData.template_id = request.template_id;
  if (request.width_mm !== undefined) updateData.width_mm = request.width_mm;
  if (request.height_mm !== undefined) updateData.height_mm = request.height_mm;
  if (request.design_data !== undefined) updateData.design_data = request.design_data;
  if (request.selected_products !== undefined) updateData.selected_products = request.selected_products;
  if (request.print_settings !== undefined) updateData.print_settings = request.print_settings;

  const { data, error } = await supabase
    .from('popmate_saved_pops')
    .update(updateData)
    .eq('id', savedPopId)
    .select()
    .single();

  if (error) {
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to update saved pop: ${error.message}`);
  }

  return data;
}

/**
 * 保存データを削除
 */
export async function deleteSavedPop(
  savedPopId: string,
  userId: string
): Promise<void> {
  console.log('=== deleteSavedPop ===', { savedPopId, userId });

  // 所有者確認
  const existing = await getSavedPopById(savedPopId, userId);
  if (!existing) {
    throw new Error('Saved pop not found');
  }

  const { error } = await supabase
    .from('popmate_saved_pops')
    .delete()
    .eq('id', savedPopId);

  if (error) {
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to delete saved pop: ${error.message}`);
  }
}
