# ポップメイト データベース設計書

## 1. 概要

本ドキュメントは、ポップメイトのデータベース設計を定義する。データベースはSupabaseを使用し、PostgreSQLをベースとする。

## 2. テーブル設計

### 2.1. users（ユーザー）

ユーザー情報を管理するテーブル。Supabase Authと連携する。

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| email | VARCHAR(255) | NO | - | メールアドレス |
| smaregi_contract_id | VARCHAR(50) | YES | NULL | スマレジ契約ID |
| smaregi_access_token | TEXT | YES | NULL | スマレジアクセストークン（暗号化） |
| created_at | TIMESTAMP | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMP | NO | NOW() | 更新日時 |

### 2.2. templates（テンプレート）

ポップのテンプレート情報を管理するテーブル。

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | YES | NULL | ユーザーID（NULLはシステムテンプレート） |
| name | VARCHAR(100) | NO | - | テンプレート名 |
| type | VARCHAR(20) | NO | - | タイプ（price_pop, a4, a5, a6, custom） |
| width_mm | DECIMAL(10,2) | NO | - | 幅（mm） |
| height_mm | DECIMAL(10,2) | NO | - | 高さ（mm） |
| design_data | JSONB | NO | '{}' | デザインデータ（JSON形式） |
| is_system | BOOLEAN | NO | FALSE | システムテンプレートフラグ |
| created_at | TIMESTAMP | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMP | NO | NOW() | 更新日時 |

### 2.3. saved_pops（保存済みポップ）

ユーザーが作成・保存したポップデータを管理するテーブル。

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | ユーザーID（外部キー） |
| name | VARCHAR(255) | NO | - | 保存名 |
| template_id | UUID | YES | NULL | 元テンプレートID（外部キー） |
| design_data | JSONB | NO | '{}' | デザインデータ（JSON形式） |
| products_data | JSONB | NO | '[]' | 選択した商品データ（JSON形式） |
| print_layout | JSONB | YES | NULL | 印刷レイアウト設定 |
| created_at | TIMESTAMP | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMP | NO | NOW() | 更新日時 |

### 2.4. design_elements（デザイン要素）

ポップ内の個別デザイン要素を管理するテーブル。

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| saved_pop_id | UUID | NO | - | 保存済みポップID（外部キー） |
| element_type | VARCHAR(50) | NO | - | 要素タイプ（text, image, table, shape） |
| position_x | DECIMAL(10,2) | NO | 0 | X座標（mm） |
| position_y | DECIMAL(10,2) | NO | 0 | Y座標（mm） |
| width | DECIMAL(10,2) | NO | - | 幅（mm） |
| height | DECIMAL(10,2) | NO | - | 高さ（mm） |
| rotation | DECIMAL(5,2) | NO | 0 | 回転角度 |
| z_index | INT | NO | 0 | 重なり順 |
| properties | JSONB | NO | '{}' | 要素固有のプロパティ |
| created_at | TIMESTAMP | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMP | NO | NOW() | 更新日時 |

## 3. JSONB構造定義

### 3.1. design_data（デザインデータ）

```json
{
  "background": {
    "color": "#FFFFFF",
    "image_url": null
  },
  "elements": [
    {
      "id": "uuid",
      "type": "text",
      "x": 10.5,
      "y": 20.3,
      "width": 50.0,
      "height": 15.0,
      "rotation": 0,
      "zIndex": 1,
      "properties": {
        "content": "{{productName}}",
        "fontFamily": "Noto Sans JP",
        "fontSize": 14,
        "fontWeight": "bold",
        "color": "#333333",
        "textAlign": "center"
      }
    }
  ]
}
```

### 3.2. products_data（商品データ）

```json
[
  {
    "productId": "12345",
    "productCode": "ABC001",
    "productName": "商品名",
    "productKana": "ショウヒンメイ",
    "price": 1980,
    "description": "商品説明",
    "tag": "メーカーA",
    "categoryId": "1",
    "categoryName": "カテゴリ名",
    "customFields": {
      "displayPrice": "¥1,980",
      "taxIncludedPrice": 2178
    }
  }
]
```

### 3.3. print_layout（印刷レイアウト）

```json
{
  "paperSize": "A4",
  "orientation": "portrait",
  "margin": {
    "top": 0,
    "right": 0,
    "bottom": 0,
    "left": 0
  },
  "border": {
    "enabled": true,
    "width": 0.5,
    "color": "#000000"
  },
  "arrangement": [
    {
      "popId": "uuid",
      "productIndex": 0,
      "row": 0,
      "col": 0
    }
  ]
}
```

## 4. インデックス設計

| テーブル | インデックス名 | カラム | 種類 |
|---------|--------------|--------|------|
| users | idx_users_email | email | UNIQUE |
| users | idx_users_smaregi_contract_id | smaregi_contract_id | INDEX |
| templates | idx_templates_user_id | user_id | INDEX |
| templates | idx_templates_type | type | INDEX |
| saved_pops | idx_saved_pops_user_id | user_id | INDEX |
| saved_pops | idx_saved_pops_created_at | created_at | INDEX |
| design_elements | idx_design_elements_saved_pop_id | saved_pop_id | INDEX |

## 5. 外部キー制約

| テーブル | カラム | 参照テーブル | 参照カラム | ON DELETE |
|---------|--------|-------------|-----------|-----------|
| templates | user_id | users | id | CASCADE |
| saved_pops | user_id | users | id | CASCADE |
| saved_pops | template_id | templates | id | SET NULL |
| design_elements | saved_pop_id | saved_pops | id | CASCADE |

## 6. Row Level Security (RLS)

Supabaseの行レベルセキュリティを使用して、ユーザーが自分のデータのみにアクセスできるようにする。

### 6.1. users テーブル
- SELECT: 自分のレコードのみ
- UPDATE: 自分のレコードのみ

### 6.2. templates テーブル
- SELECT: 自分のレコード + システムテンプレート（is_system = true）
- INSERT: 自分のuser_idのみ
- UPDATE/DELETE: 自分のレコードのみ（システムテンプレート除く）

### 6.3. saved_pops テーブル
- SELECT/INSERT/UPDATE/DELETE: 自分のレコードのみ

### 6.4. design_elements テーブル
- SELECT/INSERT/UPDATE/DELETE: 自分のsaved_popに属するレコードのみ
