// フォント一覧（日本語・英語フリーフォント 30種類以上）

export interface FontOption {
  value: string;
  label: string;
  category: 'japanese' | 'english';
  weights: string[];
}

export const FONTS: FontOption[] = [
  // ========== 日本語フォント ==========
  { value: 'Noto Sans JP', label: 'Noto Sans JP', category: 'japanese', weights: ['400', '500', '700'] },
  { value: 'Noto Serif JP', label: 'Noto Serif JP', category: 'japanese', weights: ['400', '500', '700'] },
  { value: 'M PLUS 1p', label: 'M PLUS 1p', category: 'japanese', weights: ['400', '500', '700'] },
  { value: 'M PLUS Rounded 1c', label: 'M PLUS Rounded 1c', category: 'japanese', weights: ['400', '500', '700'] },
  { value: 'Kosugi', label: 'Kosugi', category: 'japanese', weights: ['400'] },
  { value: 'Kosugi Maru', label: 'Kosugi Maru', category: 'japanese', weights: ['400'] },
  { value: 'Sawarabi Gothic', label: 'Sawarabi Gothic', category: 'japanese', weights: ['400'] },
  { value: 'Sawarabi Mincho', label: 'Sawarabi Mincho', category: 'japanese', weights: ['400'] },
  { value: 'Zen Kaku Gothic New', label: 'Zen Kaku Gothic New', category: 'japanese', weights: ['400', '500', '700'] },
  { value: 'Zen Maru Gothic', label: 'Zen Maru Gothic', category: 'japanese', weights: ['400', '500', '700'] },
  { value: 'Zen Old Mincho', label: 'Zen Old Mincho', category: 'japanese', weights: ['400', '700'] },
  { value: 'Shippori Mincho', label: 'Shippori Mincho', category: 'japanese', weights: ['400', '500', '700'] },
  { value: 'Kiwi Maru', label: 'Kiwi Maru', category: 'japanese', weights: ['400', '500'] },
  { value: 'Hachi Maru Pop', label: 'Hachi Maru Pop', category: 'japanese', weights: ['400'] },
  { value: 'Yusei Magic', label: 'Yusei Magic', category: 'japanese', weights: ['400'] },
  { value: 'Dela Gothic One', label: 'Dela Gothic One', category: 'japanese', weights: ['400'] },
  { value: 'Reggae One', label: 'Reggae One', category: 'japanese', weights: ['400'] },
  { value: 'RocknRoll One', label: 'RocknRoll One', category: 'japanese', weights: ['400'] },
  { value: 'Stick', label: 'Stick', category: 'japanese', weights: ['400'] },
  { value: 'DotGothic16', label: 'DotGothic16', category: 'japanese', weights: ['400'] },
  
  // ========== 英語フォント ==========
  { value: 'Roboto', label: 'Roboto', category: 'english', weights: ['400', '500', '700'] },
  { value: 'Open Sans', label: 'Open Sans', category: 'english', weights: ['400', '600', '700'] },
  { value: 'Lato', label: 'Lato', category: 'english', weights: ['400', '700'] },
  { value: 'Montserrat', label: 'Montserrat', category: 'english', weights: ['400', '500', '700'] },
  { value: 'Poppins', label: 'Poppins', category: 'english', weights: ['400', '500', '700'] },
  { value: 'Inter', label: 'Inter', category: 'english', weights: ['400', '500', '700'] },
  { value: 'Oswald', label: 'Oswald', category: 'english', weights: ['400', '500', '700'] },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'english', weights: ['400', '700'] },
  { value: 'Raleway', label: 'Raleway', category: 'english', weights: ['400', '500', '700'] },
  { value: 'Ubuntu', label: 'Ubuntu', category: 'english', weights: ['400', '500', '700'] },
  { value: 'Bebas Neue', label: 'Bebas Neue', category: 'english', weights: ['400'] },
  { value: 'Anton', label: 'Anton', category: 'english', weights: ['400'] },
  { value: 'Abril Fatface', label: 'Abril Fatface', category: 'english', weights: ['400'] },
  { value: 'Pacifico', label: 'Pacifico', category: 'english', weights: ['400'] },
  { value: 'Dancing Script', label: 'Dancing Script', category: 'english', weights: ['400', '700'] },
];

// Google Fontsのインポート用URL生成
export function generateGoogleFontsUrl(): string {
  const families = FONTS.map(font => {
    const weights = font.weights.join(';');
    return `family=${font.value.replace(/ /g, '+')}:wght@${weights}`;
  }).join('&');
  
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// フォントをカテゴリ別にグループ化
export function getFontsByCategory() {
  return {
    japanese: FONTS.filter(f => f.category === 'japanese'),
    english: FONTS.filter(f => f.category === 'english'),
  };
}
