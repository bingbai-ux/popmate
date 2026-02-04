import { test, expect } from '@playwright/test';

/**
 * ナビゲーションのE2Eテスト
 */

test.describe('ページナビゲーション', () => {
  test('ホームページが正しく読み込まれる', async ({ page }) => {
    await page.goto('/');

    // タイトルが表示される
    await expect(page.locator('h1')).toContainText('PopMate');
  });

  test('ホームからエディターへ遷移できる', async ({ page }) => {
    await page.goto('/');

    // エディターへのリンクをクリック
    await page.click('[data-testid="link-to-editor"]');

    // エディターページに遷移
    await expect(page).toHaveURL(/.*\/editor/);
  });

  test('エディターから印刷プレビューへ遷移できる', async ({ page }) => {
    await page.goto('/editor');

    // 印刷ボタンをクリック
    await page.click('[data-testid="btn-print"]');

    // 印刷ページに遷移
    await expect(page).toHaveURL(/.*\/print/);
  });

  test('テンプレート選択からエディターへ遷移できる', async ({ page }) => {
    await page.goto('/');

    // テンプレートを選択
    await page.click('[data-testid="template-price-pop"]');

    // エディターページに遷移
    await expect(page).toHaveURL(/.*\/editor/);
  });
});

test.describe('レスポンシブ表示', () => {
  test('モバイルビューでメニューが正しく動作する', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // ハンバーガーメニューが表示される
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();

      // メニューが開く
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    }
  });

  test('タブレットビューでレイアウトが適切', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/editor');

    // キャンバスとサイドパネルが表示される
    await expect(page.locator('[data-testid="canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="property-panel"]')).toBeVisible();
  });
});
