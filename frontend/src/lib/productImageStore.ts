/**
 * 商品画像のメモリストア
 *
 * 商品画像（base64 data URL）は非常に大きいため、sessionStorage に保存すると
 * 容量制限（約5MB）を超えてしまう。代わりにモジュールレベルの Map で管理する。
 * Next.js のクライアント側ナビゲーション（router.push）ではJSバンドルが
 * メモリに保持されるため、ページ遷移間でデータが維持される。
 */

/** productId/productCode → 圧縮済み画像 data URL */
const imageStore = new Map<string, string>();

/**
 * 商品の画像を保存
 */
export function setProductImage(productKey: string, dataUrl: string): void {
  if (dataUrl) {
    imageStore.set(productKey, dataUrl);
  } else {
    imageStore.delete(productKey);
  }
}

/**
 * 商品の画像を取得
 */
export function getProductImage(productKey: string): string | undefined {
  return imageStore.get(productKey);
}

/**
 * 商品の画像を削除
 */
export function removeProductImage(productKey: string): void {
  imageStore.delete(productKey);
}

/**
 * 全画像をクリア
 */
export function clearProductImages(): void {
  imageStore.clear();
}

/**
 * 商品のキーを生成（productId優先、なければproductCode）
 */
export function getProductKey(product: { productId?: string; productCode?: string; productName?: string }): string {
  return product.productId || product.productCode || product.productName || '';
}

/**
 * 画像をリサイズ・圧縮してから data URL として返す
 * POP印刷用なので最大 600x600px, JPEG品質80%で十分
 */
export function compressImage(dataUrl: string, maxSize = 600, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // 既に十分小さい場合はそのまま返す
      if (width <= maxSize && height <= maxSize) {
        // ただしJPEG圧縮はかける
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', quality));
        return;
      }

      // アスペクト比を維持してリサイズ
      if (width > height) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      // 失敗時は元のデータをそのまま返す
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}
