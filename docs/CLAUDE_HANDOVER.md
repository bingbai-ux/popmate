## ポップメイト開発プロジェクト - Claudeへの引き継ぎ

お疲れ様です。ポップメイト開発プロジェクトのフロントエンド実装をClaudeにお願いするため、現在の環境と状況をまとめました。

### プロジェクト概要

スマレジAPIから商品情報を取得し、プライスポップを自動で作成するサービスです。

- **要件定義書**: `docs/REQUIREMENTS_DEFINITION.md`
- **データベース設計**: `docs/DATABASE_DESIGN.md`

### 現在の状況

- **フロントエンド**: コードをリセット済み（Next.js 15 + TypeScript + Tailwind CSS）
- **バックエンド**: 実装済み（Express.js + TypeScript）
- **データベース**: 構築済み（Supabase）
- **インフラ**: Vercel（フロントエンド）、Railway（バックエンド）にデプロイ済み

### 環境情報

| サービス | URL / 情報 |
|---|---|
| **GitHubリポジトリ** | https://github.com/bingbai-ux/popmate |
| **フロントエンド (Vercel)** | https://popmate.vercel.app/ |
| **バックエンド (Railway)** | https://popmate-production.up.railway.app/ |
| **Supabase URL** | https://dwcezludkyvzyarifgbc.supabase.co |
| **Supabase anon key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3Y2V6bHVka3l2enlhcm...(省略)` |

### 開発の進め方

1. **Phase 1: メイン画面の実装**
   - ブランドガイドライン (`brand_guideline_page1.png`など) に沿ったデザイン
   - 「テンプレートを選ぶ」「保存データから選ぶ」の2つの選択肢

2. **Phase 2: テンプレート選択機能**
   - 4種類のテンプレート（プライスポップ、A4、A5、A6）を表示
   - テンプレート選択→エディター画面への遷移

3. **Phase 3: テンプレートデザイン機能**
   - テキスト、画像、表の挿入・編集
   - **0.1mm単位での精密な編集**

4. **Phase 4: スマレジ連携**
   - 商品データ取得・表示

5. **Phase 5: 印刷機能**
   - A4用紙への自動配置プレビュー
   - PDF出力

### Claudeへのお願い

上記の情報を元に、Phase 1からフロントエンドのコーディングを開始してください。

- **UI/UX**: ブランドガイドラインとユーザーの好みを反映した、洗練されたシンプルなデザインをお願いします。
- **コード品質**: 保守性が高く、読みやすいコードを期待しています。

不明点があれば、いつでも質問してください。
