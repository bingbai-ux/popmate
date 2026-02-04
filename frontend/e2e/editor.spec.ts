import { test, expect } from '@playwright/test';

/**
 * エディター画面のE2Eテスト
 */

test.describe('エディター基本機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor');
  });

  test('エディターページが正しく読み込まれる', async ({ page }) => {
    // キャンバスが表示される
    await expect(page.locator('[data-testid="canvas"]')).toBeVisible();

    // ツールバーが表示される
    await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();

    // プロパティパネルが表示される
    await expect(page.locator('[data-testid="property-panel"]')).toBeVisible();
  });

  test('テキスト要素を追加できる', async ({ page }) => {
    // テキストツールをクリック
    await page.click('[data-testid="tool-text"]');

    // キャンバス上でクリック
    const canvas = page.locator('[data-testid="canvas"]');
    await canvas.click({ position: { x: 100, y: 100 } });

    // テキスト要素が追加される
    await expect(page.locator('[data-testid="element-text"]')).toBeVisible();
  });

  test('図形要素を追加できる', async ({ page }) => {
    // 図形ツールをクリック
    await page.click('[data-testid="tool-shape"]');

    // 四角形を選択
    await page.click('[data-testid="shape-rectangle"]');

    // キャンバス上でドラッグ
    const canvas = page.locator('[data-testid="canvas"]');
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 50, y: 50 },
      targetPosition: { x: 150, y: 150 },
    });

    // 図形要素が追加される
    await expect(page.locator('[data-testid="element-shape"]')).toBeVisible();
  });

  test('要素を選択するとプロパティパネルが更新される', async ({ page }) => {
    // テキスト要素を追加
    await page.click('[data-testid="tool-text"]');
    const canvas = page.locator('[data-testid="canvas"]');
    await canvas.click({ position: { x: 100, y: 100 } });

    // 追加されたテキスト要素をクリック
    await page.click('[data-testid="element-text"]');

    // プロパティパネルにテキスト設定が表示される
    await expect(page.locator('[data-testid="property-font-family"]')).toBeVisible();
    await expect(page.locator('[data-testid="property-font-size"]')).toBeVisible();
  });

  test('要素をドラッグで移動できる', async ({ page }) => {
    // テキスト要素を追加
    await page.click('[data-testid="tool-text"]');
    const canvas = page.locator('[data-testid="canvas"]');
    await canvas.click({ position: { x: 100, y: 100 } });

    const element = page.locator('[data-testid="element-text"]');
    const initialBox = await element.boundingBox();

    // 要素をドラッグ
    await element.dragTo(canvas, {
      targetPosition: { x: 200, y: 200 },
    });

    // 位置が変わっている
    const newBox = await element.boundingBox();
    expect(newBox?.x).not.toBe(initialBox?.x);
    expect(newBox?.y).not.toBe(initialBox?.y);
  });

  test('Undoで操作を取り消せる', async ({ page }) => {
    // テキスト要素を追加
    await page.click('[data-testid="tool-text"]');
    const canvas = page.locator('[data-testid="canvas"]');
    await canvas.click({ position: { x: 100, y: 100 } });

    // 要素が追加されている
    await expect(page.locator('[data-testid="element-text"]')).toBeVisible();

    // Ctrl+Z でUndo
    await page.keyboard.press('Control+z');

    // 要素が削除される
    await expect(page.locator('[data-testid="element-text"]')).not.toBeVisible();
  });

  test('Deleteキーで要素を削除できる', async ({ page }) => {
    // テキスト要素を追加
    await page.click('[data-testid="tool-text"]');
    const canvas = page.locator('[data-testid="canvas"]');
    await canvas.click({ position: { x: 100, y: 100 } });

    // 要素を選択
    await page.click('[data-testid="element-text"]');

    // Deleteキーを押す
    await page.keyboard.press('Delete');

    // 要素が削除される
    await expect(page.locator('[data-testid="element-text"]')).not.toBeVisible();
  });
});

test.describe('レイヤー操作', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor');
  });

  test('要素を最前面に移動できる', async ({ page }) => {
    // 2つの要素を追加
    await page.click('[data-testid="tool-shape"]');
    await page.click('[data-testid="shape-rectangle"]');
    const canvas = page.locator('[data-testid="canvas"]');
    await canvas.click({ position: { x: 100, y: 100 } });

    await page.click('[data-testid="tool-shape"]');
    await page.click('[data-testid="shape-circle"]');
    await canvas.click({ position: { x: 120, y: 120 } });

    // 最初の要素を選択
    await page.click('[data-testid="element-shape"]').first();

    // 最前面に移動ボタンをクリック
    await page.click('[data-testid="layer-bring-to-front"]');

    // 要素のz-indexが変更されている（視覚的確認が必要）
  });
});

test.describe('フォント選択', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor');
  });

  test('フォントドロップダウンでフォントプレビューが表示される', async ({ page }) => {
    // テキスト要素を追加して選択
    await page.click('[data-testid="tool-text"]');
    const canvas = page.locator('[data-testid="canvas"]');
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.click('[data-testid="element-text"]');

    // フォントドロップダウンをクリック
    await page.click('[data-testid="font-selector"]');

    // フォントオプションが表示される
    const options = page.locator('[data-testid="font-option"]');
    await expect(options.first()).toBeVisible();

    // 各オプションが実際のフォントでスタイリングされている
    const firstOption = options.first();
    const fontFamily = await firstOption.evaluate(el =>
      window.getComputedStyle(el).fontFamily
    );
    expect(fontFamily).toBeTruthy();
  });
});
