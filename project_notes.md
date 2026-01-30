# ポップメイト プロジェクト資料まとめ

## ブランドガイドライン

### カラーパレット
| 用途 | カラーコード | 説明 |
|------|------------|------|
| Primary Gradient Button | #2563EB → #1E40AF | グラデーションボタン |
| Header Background | #2563EB | ヘッダー背景（青グラデーション） |
| Card Header Gradient | #2563EB系 | カードヘッダー |
| Dark Mode Background | #0A1628 | ダークモード背景 |
| Light Mode Background | #FFFFFF | ライトモード背景（Border: #2563EB） |
| Primary Button | #2563EB | プライマリボタン |
| Secondary Outline Button | #2563EB | アウトラインボタン |
| Disabled Button | #BDBDBD | 無効ボタン |
| Table Header | #2563EB | テーブルヘッダー（白文字、太字） |
| Table Body | #FFFFFF / #EFF6FF | 交互行（白/薄青） |
| Table Border | #E5E7EB | 1px solid |
| Cell Padding | 12px horizontal, 8px vertical | セルパディング |

### テキストカラー
- ライト背景: ダークテキスト
- ダーク/グラデーション背景: 白テキスト (#FFFFFF)

### UIコンポーネント
- フォーム要素: Border #0A1628
- ステータスバッジ: 在庫あり（緑）、在庫なし（赤）

---

## スマレジAPI仕様（基本仕様 ver.2.5.2）

### 概要
- HTTPS連携でHTTPリクエストによる情報の受け渡し
- データ形式: JSON

### 提供機能
1. **スマレジデータ更新機能**: データ登録/更新/削除（上限500件/リクエスト）
   - 部門情報、商品情報、会員情報、在庫情報、取引情報、セール情報
   
2. **スマレジデータ参照機能**: データ取得（上限1000件/リクエスト）
   - 部門情報、商品情報、会員情報、在庫情報、取引情報、店舗情報、日次締め情報、セール情報
   - ウェイター用: カテゴリー情報、商品情報、店舗情報、注文情報

3. **スマレジデータ送信機能（PUSH）**: データ更新時にHTTP送信（100件毎に分割）

### 認証・認可方式
- スマレジ管理画面で発行したアクセストークンと契約IDを使用
- 誤ったアクセストークンで10回連続アクセスするとロック

### HTTPリクエスト
- POST送信
- ヘッダに認証情報（契約ID、アクセストークン）
- パラメータ: UTF-8エンコード、application/x-www-form-urlencoded
- タイムアウト: 180秒

### HTTPレスポンス
- 成功: HTTP 200 (OK)
- 失敗: HTTP 400 (Bad Request)

### 利用制限
- 1秒あたり10回を超えるリクエスト禁止
- 1万件を超えるデータ登録を数時間に渡って継続禁止

---

## 開発基本方針（DEVELOPMENT_RULES.md）

### アーキテクチャ原則
- フロントエンド: 表示のみ（APIを呼ぶ、結果を表示）
- バックエンド: 計算・ロジック（計算、データ取得、加工）
- データベース: 保存のみ

### API設計
- 1リクエスト = 1画面分のデータ
- 計算済みデータを返す
- 必要な情報を全て含める

### 型の統一
- product_id, store_id, category_id → 全て文字列（string）

### コーディング規約
- シンプルさを優先
- 1関数は1つのことだけ（50行以下）
- 全てのAPI呼び出しにtry-catch
- デバッグログを出力

### 禁止事項
- フロントエンドで計算処理
- 複数のAPIを組み合わせてデータを作る
- 型を混在させる
- エラーハンドリングなしでAPI呼び出し
- テストせずにコミット


---

## スマレジAPI（POS）商品情報参照 詳細

### 商品情報参照 (product_ref)
取得可能なデータ（上限1000件/リクエスト）

#### 主要フィールド（ポップ作成に必要な情報）
| NO | 項目名 | 物理名 | TYPE | 説明 |
|----|--------|--------|------|------|
| 1 | 商品ID | productId | BIGINT | 15桁以内 |
| 2 | 部門ID | categoryId | INT | 9桁以内 |
| 3 | 商品コード | productCode | VARCHAR | 20文字以内 |
| 4 | 商品名 | productName | VARCHAR | 85文字以内 |
| 5 | 商品カナ | productKana | VARCHAR | 85文字以内 |
| 8 | 商品単価 | price | DECIMAL | 8桁以内（販売価格） |
| 11 | 規格 | attribute | TEXT | 1000文字以内（カラー・サイズ等） |
| 12 | 説明 | description | TEXT | 1000文字以内（商品説明） |
| 16 | タグ | tag | VARCHAR | 85文字以内（カンマ区切り） |
| 17 | グループコード | groupCode | VARCHAR | 関連商品紐付け用 |
| 28 | 品番 | supplierProductNo | CHAR | 85文字以内 |

#### 部門情報参照 (category_ref)
| NO | 項目名 | 物理名 | TYPE | 説明 |
|----|--------|--------|------|------|
| 1 | 部門ID | categoryId | INT | 9桁以内 |
| 2 | 部門コード | categoryCode | VARCHAR | 20文字以内 |
| 3 | 部門名 | categoryName | VARCHAR | 85文字以内 |
| 14 | タグ | tag | VARCHAR | 85文字以内 |

### API認証
- ヘッダ: X-contract-id, X-access-token
- Content-Type: application/x-www-form-urlencoded;charset=UTF-8
- リクエスト形式: POST

### リクエスト例
```
proc_name=product_ref&params={
  "fields":["productId","productName","price"],
  "conditions":[{"productName like":"%テ%"}],
  "order":["productId desc"],
  "limit":100,
  "table_name":"Product"
}
```

### 検索条件
- メーカー別: タグ（tag）で検索
- カテゴリー別: 部門ID（categoryId）で検索
- 仕入れ先別: グループコード（groupCode）で検索
