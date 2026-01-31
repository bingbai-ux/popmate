// カスタムテンプレートの型定義

export interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  width: number;   // mm
  height: number;  // mm
  isSystem: boolean;
  createdAt: string;
}

// デフォルトテンプレート
export const DEFAULT_TEMPLATES: CustomTemplate[] = [
  {
    id: 'price-pop',
    name: 'プライスポップ',
    description: '価格表示に最適な定番サイズ',
    width: 91,
    height: 55,
    isSystem: true,
    createdAt: '',
  },
  {
    id: 'a4',
    name: 'A4サイズ',
    description: '大きな掲示物やポスターに',
    width: 210,
    height: 297,
    isSystem: true,
    createdAt: '',
  },
  {
    id: 'a5',
    name: 'A5サイズ',
    description: '棚札やミニポスターに最適',
    width: 148,
    height: 210,
    isSystem: true,
    createdAt: '',
  },
  {
    id: 'a6',
    name: 'A6サイズ',
    description: 'コンパクトな商品タグに',
    width: 105,
    height: 148,
    isSystem: true,
    createdAt: '',
  },
];

// ローカルストレージからカスタムテンプレートを取得
export function getCustomTemplates(): CustomTemplate[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('customTemplates');
  return saved ? JSON.parse(saved) : [];
}

// カスタムテンプレートを保存
export function saveCustomTemplate(template: Omit<CustomTemplate, 'id' | 'isSystem' | 'createdAt'>): CustomTemplate {
  const templates = getCustomTemplates();
  const newTemplate: CustomTemplate = {
    ...template,
    id: `custom-${Date.now()}`,
    isSystem: false,
    createdAt: new Date().toISOString(),
  };
  templates.push(newTemplate);
  localStorage.setItem('customTemplates', JSON.stringify(templates));
  return newTemplate;
}

// カスタムテンプレートを削除
export function deleteCustomTemplate(id: string): boolean {
  const templates = getCustomTemplates();
  const template = templates.find(t => t.id === id);
  if (!template || template.isSystem) return false;
  
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem('customTemplates', JSON.stringify(filtered));
  return true;
}

// 全テンプレートを取得（デフォルト + カスタム）
export function getAllTemplates(): CustomTemplate[] {
  return [...DEFAULT_TEMPLATES, ...getCustomTemplates()];
}

// IDでテンプレートを取得
export function getTemplateById(id: string): CustomTemplate | undefined {
  return getAllTemplates().find(t => t.id === id);
}
