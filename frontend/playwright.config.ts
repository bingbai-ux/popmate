import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E テスト設定
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // テストディレクトリ
  testDir: './e2e',

  // 各テストのタイムアウト
  timeout: 30 * 1000,

  // テスト実行のリトライ回数
  retries: process.env.CI ? 2 : 0,

  // 並列実行のワーカー数
  workers: process.env.CI ? 1 : undefined,

  // レポーター設定
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  // 共通設定
  use: {
    // ベースURL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // スクリーンショット
    screenshot: 'only-on-failure',

    // トレース
    trace: 'on-first-retry',

    // ビデオ
    video: 'on-first-retry',
  },

  // プロジェクト（ブラウザ）設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // モバイルテスト
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // ローカル開発サーバー設定
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
