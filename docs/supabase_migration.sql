-- ポップメイト データベースマイグレーション
-- Supabase用 PostgreSQL

-- 1. users テーブル
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    smaregi_contract_id VARCHAR(50),
    smaregi_access_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. templates テーブル
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('price_pop', 'a4', 'a5', 'a6', 'custom')),
    width_mm DECIMAL(10,2) NOT NULL,
    height_mm DECIMAL(10,2) NOT NULL,
    design_data JSONB NOT NULL DEFAULT '{}',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. saved_pops テーブル
CREATE TABLE IF NOT EXISTS saved_pops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    design_data JSONB NOT NULL DEFAULT '{}',
    products_data JSONB NOT NULL DEFAULT '[]',
    print_layout JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. design_elements テーブル
CREATE TABLE IF NOT EXISTS design_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saved_pop_id UUID NOT NULL REFERENCES saved_pops(id) ON DELETE CASCADE,
    element_type VARCHAR(50) NOT NULL CHECK (element_type IN ('text', 'image', 'table', 'shape')),
    position_x DECIMAL(10,2) NOT NULL DEFAULT 0,
    position_y DECIMAL(10,2) NOT NULL DEFAULT 0,
    width DECIMAL(10,2) NOT NULL,
    height DECIMAL(10,2) NOT NULL,
    rotation DECIMAL(5,2) NOT NULL DEFAULT 0,
    z_index INT NOT NULL DEFAULT 0,
    properties JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_smaregi_contract_id ON users(smaregi_contract_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_saved_pops_user_id ON saved_pops(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_pops_created_at ON saved_pops(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_design_elements_saved_pop_id ON design_elements(saved_pop_id);

-- updated_at 自動更新用トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガー設定
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_pops_updated_at
    BEFORE UPDATE ON saved_pops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_design_elements_updated_at
    BEFORE UPDATE ON design_elements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_pops ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_elements ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー: users
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- RLS ポリシー: templates
CREATE POLICY "Users can view own and system templates"
    ON templates FOR SELECT
    USING (user_id = auth.uid() OR is_system = true);

CREATE POLICY "Users can insert own templates"
    ON templates FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own templates"
    ON templates FOR UPDATE
    USING (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete own templates"
    ON templates FOR DELETE
    USING (user_id = auth.uid() AND is_system = false);

-- RLS ポリシー: saved_pops
CREATE POLICY "Users can view own saved_pops"
    ON saved_pops FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saved_pops"
    ON saved_pops FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own saved_pops"
    ON saved_pops FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own saved_pops"
    ON saved_pops FOR DELETE
    USING (user_id = auth.uid());

-- RLS ポリシー: design_elements
CREATE POLICY "Users can view own design_elements"
    ON design_elements FOR SELECT
    USING (
        saved_pop_id IN (
            SELECT id FROM saved_pops WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own design_elements"
    ON design_elements FOR INSERT
    WITH CHECK (
        saved_pop_id IN (
            SELECT id FROM saved_pops WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own design_elements"
    ON design_elements FOR UPDATE
    USING (
        saved_pop_id IN (
            SELECT id FROM saved_pops WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own design_elements"
    ON design_elements FOR DELETE
    USING (
        saved_pop_id IN (
            SELECT id FROM saved_pops WHERE user_id = auth.uid()
        )
    );

-- システムテンプレートの初期データ
INSERT INTO templates (id, user_id, name, type, width_mm, height_mm, design_data, is_system)
VALUES 
    (
        gen_random_uuid(),
        NULL,
        'プライスポップ（標準）',
        'price_pop',
        65.0,
        45.0,
        '{
            "background": {"color": "#FFFFFF"},
            "elements": [
                {
                    "id": "product_name",
                    "type": "text",
                    "x": 5,
                    "y": 5,
                    "width": 55,
                    "height": 15,
                    "properties": {
                        "content": "{{productName}}",
                        "fontFamily": "Noto Sans JP",
                        "fontSize": 12,
                        "fontWeight": "bold",
                        "color": "#333333",
                        "textAlign": "center"
                    }
                },
                {
                    "id": "price",
                    "type": "text",
                    "x": 5,
                    "y": 25,
                    "width": 55,
                    "height": 15,
                    "properties": {
                        "content": "¥{{price}}",
                        "fontFamily": "Noto Sans JP",
                        "fontSize": 18,
                        "fontWeight": "bold",
                        "color": "#E53935",
                        "textAlign": "center"
                    }
                }
            ]
        }',
        TRUE
    ),
    (
        gen_random_uuid(),
        NULL,
        'A4ポップ',
        'a4',
        210.0,
        297.0,
        '{"background": {"color": "#FFFFFF"}, "elements": []}',
        TRUE
    ),
    (
        gen_random_uuid(),
        NULL,
        'A5ポップ',
        'a5',
        148.0,
        210.0,
        '{"background": {"color": "#FFFFFF"}, "elements": []}',
        TRUE
    ),
    (
        gen_random_uuid(),
        NULL,
        'A6ポップ',
        'a6',
        105.0,
        148.0,
        '{"background": {"color": "#FFFFFF"}, "elements": []}',
        TRUE
    );
