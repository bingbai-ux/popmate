import supabase from '../utils/supabase.js';
import type {
  PopmateSavedPop,
  SavePopRequest,
  ApiResponse
} from '../types/index.js';

/**
 * 契約IDからSupabaseユーザーUUIDを解決する
 * ユーザーが存在しなければ自動作成する
 */
async function resolveUserUUID(contractId: string): Promise<string> {
  // 既存ユーザーを検索
  const { data: existingUser, error: lookupError } = await supabase
    .from('popmate_users')
    .select('id')
    .eq('smaregi_contract_id', contractId)
    .maybeSingle();

  if (lookupError) {
    console.error('=== resolveUserUUID lookup error ===', lookupError);
    throw new Error(`Failed to lookup user: ${lookupError.message}`);
  }

  if (existingUser) {
    return existingUser.id;
  }

  // 新規ユーザーを作成
  console.log('=== resolveUserUUID: creating new user ===', { contractId });
  const { data: newUser, error: createError } = await supabase
    .from('popmate_users')
    .insert({
      email: `${contractId}@smaregi.jp`,
      smaregi_contract_id: contractId,
    })
    .select('id')
    .single();

  if (createError || !newUser) {
    console.error('=== resolveUserUUID create error ===', createError);
    throw new Error(`Failed to create user: ${createError?.message}`);
  }

  return newUser.id;
}

/**
 * Supabase行データ → API応答形式に変換
 * DB列名: products_data, print_layout → API: selected_products, print_settings
 * width_mm/height_mm は design_data内に格納
 */
function transformToApiFormat(row: Record<string, unknown>): PopmateSavedPop {
  const designData = row.design_data as Record<string, unknown> | null;
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    name: row.name as string,
    template_id: (row.template_id as string) || null,
    width_mm: (designData?.width_mm as number) || 0,
    height_mm: (designData?.height_mm as number) || 0,
    design_data: designData as unknown as PopmateSavedPop['design_data'],
    selected_products: (row.products_data || []) as PopmateSavedPop['selected_products'],
    print_settings: (row.print_layout || {}) as PopmateSavedPop['print_settings'],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/**
 * ユーザーの保存データ一覧を取得
 */
export async function getSavedPops(contractId: string): Promise<PopmateSavedPop[]> {
  console.log('=== getSavedPops ===', { contractId });

  const userUUID = await resolveUserUUID(contractId);

  const { data, error } = await supabase
    .from('popmate_saved_pops')
    .select('*')
    .eq('user_id', userUUID)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to fetch saved pops: ${error.message}`);
  }

  return (data || []).map(transformToApiFormat);
}

/**
 * 保存データを取得（IDで）
 */
export async function getSavedPopById(
  savedPopId: string,
  contractId: string
): Promise<PopmateSavedPop | null> {
  console.log('=== getSavedPopById ===', { savedPopId, contractId });

  const userUUID = await resolveUserUUID(contractId);

  const { data, error } = await supabase
    .from('popmate_saved_pops')
    .select('*')
    .eq('id', savedPopId)
    .eq('user_id', userUUID)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to fetch saved pop: ${error.message}`);
  }

  return transformToApiFormat(data);
}

/**
 * ポップデータを保存
 */
export async function savePop(
  contractId: string,
  request: SavePopRequest
): Promise<PopmateSavedPop> {
  console.log('=== savePop ===', { contractId, name: request.name, clientId: request.id });

  const userUUID = await resolveUserUUID(contractId);

  // design_data に width_mm/height_mm を含める
  const designDataWithDimensions = {
    ...(request.design_data || {}),
    width_mm: request.width_mm,
    height_mm: request.height_mm,
  };

  const insertData: Record<string, unknown> = {
    user_id: userUUID,
    name: request.name,
    template_id: request.template_id || null,
    design_data: designDataWithDimensions,
    products_data: request.selected_products || [],
    print_layout: request.print_settings || {},
  };

  // クライアントからUUID形式のIDが提供された場合はそのIDを使用
  if (request.id) {
    insertData.id = request.id;
  }

  const { data, error } = await supabase
    .from('popmate_saved_pops')
    .upsert(insertData)
    .select()
    .single();

  if (error) {
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to save pop: ${error.message}`);
  }

  return transformToApiFormat(data);
}

/**
 * 保存データを更新
 */
export async function updateSavedPop(
  savedPopId: string,
  contractId: string,
  request: Partial<SavePopRequest>
): Promise<PopmateSavedPop> {
  console.log('=== updateSavedPop ===', { savedPopId, contractId });

  const userUUID = await resolveUserUUID(contractId);

  // 所有者確認
  const existing = await getSavedPopById(savedPopId, contractId);
  if (!existing) {
    throw new Error('Saved pop not found');
  }

  const updateData: Record<string, unknown> = {};
  if (request.name !== undefined) updateData.name = request.name;
  if (request.template_id !== undefined) updateData.template_id = request.template_id;
  if (request.design_data !== undefined) {
    updateData.design_data = {
      ...(request.design_data || {}),
      width_mm: request.width_mm,
      height_mm: request.height_mm,
    };
  }
  if (request.selected_products !== undefined) updateData.products_data = request.selected_products;
  if (request.print_settings !== undefined) updateData.print_layout = request.print_settings;

  const { data, error } = await supabase
    .from('popmate_saved_pops')
    .update(updateData)
    .eq('id', savedPopId)
    .eq('user_id', userUUID)
    .select()
    .single();

  if (error) {
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to update saved pop: ${error.message}`);
  }

  return transformToApiFormat(data);
}

/**
 * 保存データを削除
 */
export async function deleteSavedPop(
  savedPopId: string,
  contractId: string
): Promise<void> {
  console.log('=== deleteSavedPop ===', { savedPopId, contractId });

  const userUUID = await resolveUserUUID(contractId);

  // 所有者確認
  const existing = await getSavedPopById(savedPopId, contractId);
  if (!existing) {
    throw new Error('Saved pop not found');
  }

  const { error } = await supabase
    .from('popmate_saved_pops')
    .delete()
    .eq('id', savedPopId)
    .eq('user_id', userUUID);

  if (error) {
    console.error('=== Supabase Error ===', { error });
    throw new Error(`Failed to delete saved pop: ${error.message}`);
  }
}
