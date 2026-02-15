'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

/** 目次セクション定義 */
const SECTIONS = [
  { id: 'flow', label: '基本的な流れ' },
  { id: 'step1', label: 'Step 1: スタート画面' },
  { id: 'step2', label: 'Step 2: テンプレートを選ぶ' },
  { id: 'step3', label: 'Step 3: デザインを編集する' },
  { id: 'step4', label: 'Step 4: 商品を選ぶ' },
  { id: 'step5', label: 'Step 5: 情報を確認・編集する' },
  { id: 'step6', label: 'Step 6: 印刷・PDF出力' },
  { id: 'save', label: '保存と読み込み' },
  { id: 'custom', label: 'カスタムテンプレート' },
  { id: 'shortcuts', label: 'ショートカットキー' },
  { id: 'faq', label: 'よくある質問' },
] as const;

export default function ManualPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* サブヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ホームに戻る
          </Link>
          <div className="h-5 w-px bg-gray-300" />
          <h2 className="font-bold text-gray-800">取り扱い説明書</h2>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        {/* サイドバー目次 */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <nav className="sticky top-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">目次</h3>
            <ul className="space-y-1">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollToSection(s.id)}
                    className={`block w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                      activeSection === s.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* メインコンテンツ */}
        <article className="flex-1 min-w-0">
          {/* タイトル */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-8 mb-8">
            <h1 className="text-2xl font-bold mb-2">ポップメイト 取り扱い説明書</h1>
            <p className="text-blue-100">スマレジから商品情報を取得し、プライスポップを簡単に作成できるツールです。</p>
          </div>

          {/* 基本的な流れ */}
          <Section id="flow" title="基本的な流れ">
            <div className="flex flex-wrap items-center justify-center gap-2 py-4">
              {[
                { step: '1', label: 'テンプレート選択' },
                { step: '2', label: 'デザイン編集' },
                { step: '3', label: '商品選択' },
                { step: '4', label: '情報編集・プレビュー' },
                { step: '5', label: '印刷/PDF出力・保存' },
              ].map((item, i) => (
                <div key={item.step} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {item.step}
                    </span>
                    <span className="text-sm font-medium text-blue-800 whitespace-nowrap">{item.label}</span>
                  </div>
                  {i < 4 && (
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 font-medium">5つのステップで簡単にポップが作れます！</p>
          </Section>

          {/* Step 1 */}
          <Section id="step1" title="Step 1: スタート画面" step={1}>
            <p className="mb-4">アプリを開くと最初に表示される画面です。3つの選択肢から始められます。</p>
            <Table
              headers={['ボタン', '説明']}
              rows={[
                ['テンプレートから選ぶ', '用意されたテンプレートを使ってポップを作成'],
                ['保存データから選ぶ', '以前保存したプロジェクトを開いて続きから作業'],
                ['新規テンプレートを作成', '自分でサイズを決めてオリジナルテンプレートを作成'],
              ]}
            />
            <Tip>初めての方は「テンプレートから選ぶ」がおすすめです</Tip>
          </Section>

          {/* Step 2 */}
          <Section id="step2" title="Step 2: テンプレートを選ぶ" step={2}>
            <h4 className="font-bold text-gray-700 mb-2">システムテンプレート</h4>
            <Table
              headers={['テンプレート名', 'サイズ', '用途']}
              rows={[
                ['プライスポップ', '91 x 55 mm', '小さい価格札。一番よく使います'],
                ['A4', '210 x 297 mm', '大きなポップや説明POP'],
                ['A5', '148 x 210 mm', '中サイズのポップ'],
                ['A6', '105 x 148 mm', '小サイズのポップ'],
              ]}
            />
            <h4 className="font-bold text-gray-700 mt-6 mb-2">カスタムテンプレート・保存テンプレート</h4>
            <p className="text-gray-600 mb-4">
              自分で作成したカスタムテンプレートや、以前「テンプレートとして保存」したデザインもこの画面に表示されます。
            </p>
            <h4 className="font-bold text-gray-700 mb-2">操作</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li><strong>クリック</strong> → そのテンプレートでデザイン編集へ進む</li>
              <li><strong>複製ボタン</strong> → テンプレートをコピーして新しく作成</li>
              <li><strong>削除ボタン</strong> → カスタム・保存テンプレートを削除（確認あり）</li>
            </ul>
          </Section>

          {/* Step 3 */}
          <Section id="step3" title="Step 3: デザインを編集する" step={3}>
            <LayoutDiagram
              rows={[
                ['ツールバー（要素追加、ズーム、Undo/Redo）'],
                ['キャンバス（デザイン作成エリア）', 'プロパティパネル（設定変更）'],
              ]}
            />

            <h4 className="font-bold text-gray-700 mt-6 mb-2">追加できる要素</h4>
            <Table
              headers={['要素', '説明']}
              rows={[
                ['テキスト', '文字を追加。商品名や価格を表示するのに使います'],
                ['画像', '画像ファイルをアップロードして配置'],
                ['図形', '四角形、角丸四角形、円、三角形、星'],
                ['線', '直線や矢印付きの線'],
                ['バーコード', '商品コードからバーコードを自動生成（CODE128, EAN13 等）'],
                ['QRコード', '商品コードやURLからQRコードを自動生成'],
              ]}
            />

            <h4 className="font-bold text-gray-700 mt-6 mb-3">プレースホルダー</h4>
            <p className="text-gray-600 mb-3">テキスト要素やバーコード・QRコードに入力すると、プレビュー・印刷時に自動で商品情報に置き換わります。</p>
            <Table
              headers={['プレースホルダー', '内容', '例']}
              rows={[
                ['{{productName}}', '商品名', 'りんご'],
                ['{{price}}', '税抜価格（¥付き）', '¥100'],
                ['{{priceNumber}}', '税抜価格（数値のみ）', '100'],
                ['{{taxIncludedPrice}}', '税込価格（¥付き・自動計算）', '¥110'],
                ['{{taxIncludedPriceNumber}}', '税込価格（数値のみ）', '110'],
                ['{{description}}', '商品説明', '青森県産の甘いりんご'],
                ['{{maker}}', 'メーカー名', '○○農園'],
                ['{{category}}', 'カテゴリ名', '果物'],
                ['{{productCode}}', '商品コード', '4901234567890'],
                ['{{taxRate}}', '税率（%付き）', '10%'],
                ['{{taxRateNumber}}', '税率（数値のみ）', '10'],
              ]}
            />
            <Important>プレースホルダーは <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{'{{'}</code> と <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{'}}'}</code> で囲んでください。大文字・小文字を正確に入力する必要があります。</Important>
            <Tip>価格表示で ¥ マークを付けたくない場合は {'{{priceNumber}}'} や {'{{taxIncludedPriceNumber}}'} を使えます。</Tip>

            <h4 className="font-bold text-gray-700 mt-6 mb-2">要素の編集方法</h4>
            <ol className="list-decimal list-inside text-gray-600 space-y-1">
              <li><strong>選択</strong>: キャンバス上の要素をクリック</li>
              <li><strong>移動</strong>: ドラッグまたは矢印キー（0.1mm単位）</li>
              <li><strong>サイズ変更</strong>: 角や辺をドラッグ、またはプロパティパネルで数値入力</li>
              <li><strong>コピー</strong>: Ctrl+C → Ctrl+V で複製（2mmずらして貼り付け）</li>
              <li><strong>削除</strong>: Delete または Backspace キー</li>
              <li><strong>元に戻す</strong>: Ctrl+Z（最大50回）</li>
            </ol>

            <h4 className="font-bold text-gray-700 mt-6 mb-2">プロパティパネル</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <PropertyCard title="テキスト" items={[
                'フォント（20種類以上の日本語フォント）',
                '文字サイズ・太字・斜体・下線',
                '文字色・不透明度',
                '配置（左/中央/右/均等割付）',
                '行間・字間・文字幅',
                '縦書き/横書き・自動折り返し',
              ]} />
              <PropertyCard title="図形" items={[
                '塗りつぶし色・不透明度',
                '枠線の色・太さ・不透明度',
                '角の丸み（角丸四角形のみ）',
              ]} />
              <PropertyCard title="バーコード" items={[
                '形式（CODE128, EAN13 等）',
                '値（プレースホルダー使用可）',
                'バー色・背景色',
                'テキスト表示ON/OFF',
              ]} />
              <PropertyCard title="QRコード" items={[
                '値（プレースホルダー使用可）',
                '前景色・背景色',
                '誤り訂正レベル（L/M/Q/H）',
              ]} />
            </div>

            <h4 className="font-bold text-gray-700 mt-6 mb-2">税込価格の端数処理</h4>
            <Table
              headers={['設定', '説明']}
              rows={[
                ['切り捨て', '小数点以下を切り捨て'],
                ['四捨五入', '小数点以下を四捨五入'],
                ['切り上げ', '小数点以下を切り上げ'],
              ]}
            />
          </Section>

          {/* Step 4 */}
          <Section id="step4" title="Step 4: 商品を選ぶ" step={4}>
            <LayoutDiagram
              rows={[
                ['検索フィルター（キーワード、カテゴリ、メーカーなど）'],
                ['商品一覧テーブル（チェックで選択）', '選択済み商品サイドバー'],
              ]}
            />

            <h4 className="font-bold text-gray-700 mt-6 mb-2">検索方法</h4>
            <Table
              headers={['フィルター', '使い方']}
              rows={[
                ['キーワード検索', '商品名や商品コードで検索'],
                ['カテゴリ', 'ドロップダウンから選択（複数可）'],
                ['メーカー', 'タグから選択（複数可）'],
                ['仕入先', 'グループから選択（複数可）'],
              ]}
            />

            <h4 className="font-bold text-gray-700 mt-6 mb-2">選択方法</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>商品のチェックボックスにチェック → 右側「選択済み商品」に追加</li>
              <li>「すべて選択」で表示中の全商品を一括選択</li>
              <li>右サイドバーの <strong>x ボタン</strong> で個別解除、「すべてクリア」で一括解除</li>
            </ul>
            <Tip>商品の選択状態は検索条件を変更しても保持されます。複数回に分けて検索・選択できます。</Tip>
          </Section>

          {/* Step 5 */}
          <Section id="step5" title="Step 5: 商品情報を確認・編集する" step={5}>
            <LayoutDiagram
              rows={[
                ['プレビューキャンバス（実際の印刷イメージを確認）'],
                ['AI要約 | # | 商品名 | 税込価格 | 商品説明 | ...'],
              ]}
            />
            <p className="text-gray-500 text-sm mb-4">上下の分割バーをドラッグして、プレビューとテーブルの表示比率を調整できます。</p>

            <h4 className="font-bold text-gray-700 mb-2">操作方法</h4>
            <ol className="list-decimal list-inside text-gray-600 space-y-1 mb-6">
              <li><strong>商品の切り替え</strong>: テーブルの行をクリック → プレビューに反映</li>
              <li><strong>情報の編集</strong>: セルを直接クリックして編集（商品名・価格・説明・メーカー）</li>
              <li><strong>行の展開</strong>: 左端の ▶ で展開。長いテキストも全文表示・編集可</li>
              <li><strong>列幅の調整</strong>: ヘッダー境界をドラッグして列幅変更</li>
              <li><strong>リアルタイム反映</strong>: 編集するとすぐにプレビューに反映</li>
            </ol>

            <h4 className="font-bold text-gray-700 mb-2">AI要約機能</h4>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-gray-700 mb-3">
                デザインに <code className="bg-white px-1.5 py-0.5 rounded text-sm font-mono border">{'{{description}}'}</code> が含まれている場合、
                商品説明が長すぎてテキストボックスに収まらないとき、AIが自動的に要約します。
              </p>

              <h5 className="font-bold text-purple-800 mb-2">商品ごとのAI要約ON/OFF</h5>
              <Table
                headers={['操作', '説明']}
                rows={[
                  ['各行のチェックボックス', 'その商品のAI要約をON/OFFに切り替え'],
                  ['ヘッダーのチェックボックス', '全商品のAI要約を一括でON/OFF'],
                ]}
              />
              <ul className="list-disc list-inside text-gray-600 space-y-1 mt-3">
                <li><strong>チェックON</strong>（デフォルト）: AIが商品説明をテキストボックスに収まるよう要約</li>
                <li><strong>チェックOFF</strong>: 要約せず、元の商品説明をそのまま表示</li>
              </ul>
              <Tip>AI要約の結果が意図と異なる場合は、チェックを外して商品説明を手動で短く編集することもできます。</Tip>
            </div>
          </Section>

          {/* Step 6 */}
          <Section id="step6" title="Step 6: 印刷・PDF出力" step={6}>
            <LayoutDiagram
              rows={[
                ['印刷プレビュー（用紙に配置されたイメージ）', '印刷設定・出力ボタン・レイアウト情報'],
              ]}
            />

            <h4 className="font-bold text-gray-700 mt-6 mb-2">印刷設定</h4>
            <Table
              headers={['設定項目', '説明']}
              rows={[
                ['用紙サイズ', 'A4（210x297mm）、A3（297x420mm）、B4（257x364mm）、B5（182x257mm）'],
                ['枠あり印刷', 'ONでカット位置のガイド線を表示'],
                ['位置調整（上下）', '印刷位置を上下にずらす（0.5mm単位）'],
                ['位置調整（左右）', '印刷位置を左右にずらす（0.5mm単位）'],
              ]}
            />

            <h4 className="font-bold text-gray-700 mt-6 mb-2">出力方法</h4>
            <Table
              headers={['ボタン', '説明']}
              rows={[
                ['印刷する', 'ブラウザの印刷画面を開く。そのまま印刷可'],
                ['PDF書き出し', 'PDFファイルとしてダウンロード（進捗表示あり）'],
                ['データを保存', 'プロジェクトまたはテンプレートとして保存'],
              ]}
            />

            <h4 className="font-bold text-gray-700 mt-6 mb-2">レイアウトの自動配置</h4>
            <p className="text-gray-600 mb-3">用紙サイズとテンプレートサイズから自動的にグリッドレイアウトを計算します。余白は上下・左右にセンタリングされます。</p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <strong>例: プライスポップ（91x55mm）+ A4用紙</strong><br />
              配置: 2列 x 5行 = 1ページあたり10面
            </div>
          </Section>

          {/* 保存と読み込み */}
          <Section id="save" title="保存と読み込み">
            <h4 className="font-bold text-gray-700 mb-2">保存の種類</h4>
            <Table
              headers={['種類', '保存される内容', '用途']}
              rows={[
                ['テンプレート', 'デザインのみ', '繰り返し使うデザインを保存'],
                ['プロジェクト', 'デザイン＋商品データ＋税設定', '作業途中のものを後で再開'],
              ]}
            />

            <h4 className="font-bold text-gray-700 mt-6 mb-2">保存方法</h4>
            <ol className="list-decimal list-inside text-gray-600 space-y-1">
              <li>印刷画面の「データを保存」ボタンをクリック</li>
              <li>保存タイプを選択（プロジェクト or テンプレート）</li>
              <li>名前を入力</li>
              <li>「保存」をクリック</li>
            </ol>
            <Tip>既に保存済みのプロジェクトを開いている場合は「上書き保存」ボタンが表示されます。</Tip>

            <h4 className="font-bold text-gray-700 mt-6 mb-2">読み込み方法</h4>
            <ol className="list-decimal list-inside text-gray-600 space-y-1">
              <li>スタート画面で「保存データから選ぶ」をクリック</li>
              <li>一覧から開きたいプロジェクトをクリック</li>
              <li>デザイン・商品データ・税設定が復元され、編集画面から再開</li>
            </ol>
          </Section>

          {/* カスタムテンプレート */}
          <Section id="custom" title="カスタムテンプレートの作成">
            <p className="text-gray-600 mb-4">スタート画面の「新規テンプレートを作成」から、任意のサイズでオリジナルテンプレートを作れます。</p>
            <Table
              headers={['項目', '必須', '説明']}
              rows={[
                ['テンプレート名', '必須', '50文字以内（例: 「店頭POP大」）'],
                ['説明', '任意', '100文字以内'],
                ['幅（mm）', '必須', '0.1〜1000mm、0.1mm単位'],
                ['高さ（mm）', '必須', '0.1〜1000mm、0.1mm単位'],
              ]}
            />
            <p className="text-gray-600 mt-3">「作成してエディターへ」を押すと、テンプレートが保存され、すぐにデザイン編集画面に進みます。</p>
          </Section>

          {/* ショートカットキー */}
          <Section id="shortcuts" title="便利なショートカットキー">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-gray-700 mb-2">基本操作</h4>
                <Table
                  headers={['キー', '動作']}
                  rows={[
                    ['Ctrl + Z', '元に戻す（Undo）'],
                    ['Ctrl + Shift + Z', 'やり直し（Redo）'],
                    ['Ctrl + C', 'コピー'],
                    ['Ctrl + V', '貼り付け'],
                    ['Delete / Backspace', '削除'],
                    ['Escape', '選択解除'],
                  ]}
                />
              </div>
              <div>
                <h4 className="font-bold text-gray-700 mb-2">移動操作</h4>
                <Table
                  headers={['キー', '動作']}
                  rows={[
                    ['矢印キー', '0.1mm移動（精密）'],
                    ['Shift + 矢印キー', '1mm移動（粗）'],
                  ]}
                />
                <Tip>Macの場合は Ctrl の代わりに Cmd キーを使います。</Tip>
              </div>
            </div>
          </Section>

          {/* FAQ */}
          <Section id="faq" title="よくある質問（Q&A）">
            <div className="space-y-4">
              <FAQ q="商品が見つかりません">
                <ul className="list-disc list-inside space-y-1">
                  <li>キーワードの入力ミスがないか確認</li>
                  <li>フィルターが絞り込みすぎていないか確認</li>
                  <li>スマレジに商品が登録されているか確認</li>
                  <li>検索ボタンを押したか確認</li>
                </ul>
              </FAQ>
              <FAQ q="プレースホルダーが置き換わりません">
                <ul className="list-disc list-inside space-y-1">
                  <li>{'{{  }}'} で正しく囲んでいるか確認</li>
                  <li>スペルが正しいか（大文字小文字も注意）</li>
                  <li>商品データが選択されているか確認</li>
                </ul>
              </FAQ>
              <FAQ q="AI要約が意図どおりにならない">
                <ul className="list-disc list-inside space-y-1">
                  <li>AI要約のチェックをOFFにして、手動で商品説明を短く編集</li>
                  <li>テキストボックスのサイズを大きくする</li>
                  <li>フォントサイズを小さくして文字を多く収める</li>
                </ul>
              </FAQ>
              <FAQ q="印刷位置がずれます">
                <p>印刷画面の「位置調整」で上下・左右のオフセットを調整してください。0.5mm単位で調整できます。</p>
              </FAQ>
              <FAQ q="保存したデータはどこにありますか？">
                <ul className="list-disc list-inside space-y-1">
                  <li>データはブラウザ内に保存されています</li>
                  <li>同じPC・同じブラウザでのみ読み込めます</li>
                  <li>大切なデータはPDFに書き出して保管することをおすすめします</li>
                </ul>
              </FAQ>
              <FAQ q="用紙サイズを変えたい">
                <p>印刷画面の「用紙サイズ」で A4、A3、B4、B5 から選択できます。1ページあたりの面数は自動計算されます。</p>
              </FAQ>
              <FAQ q="縦書きのテキストを入れたい">
                <p>テキスト要素を選択し、プロパティパネルの「書字方向」で「縦書き」を選択してください。</p>
              </FAQ>
            </div>
          </Section>

          {/* フッター */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
            <p><strong>ポップメイト</strong> - スマレジ連携プライスポップ作成ツール</p>
            <p>最終更新: 2026年2月</p>
          </div>
        </article>
      </div>
    </main>
  );
}

/* ============================================================
 *  以下、ページ内で使うサブコンポーネント
 * ============================================================ */

function Section({ id, title, step, children }: { id: string; title: string; step?: number; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-8">
      <div className="flex items-center gap-3 mb-4">
        {step && (
          <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {step}
          </span>
        )}
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 bg-gray-100 text-left font-semibold text-gray-700 border border-gray-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-gray-50">
              {row.map((cell, ci) => (
                <td key={ci} className={`px-3 py-2 border border-gray-200 text-gray-600 ${ci === 0 ? 'font-medium text-gray-700' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 my-3 text-sm">
      <span className="text-blue-500 font-bold flex-shrink-0">Tip</span>
      <span className="text-blue-800">{children}</span>
    </div>
  );
}

function Important({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 my-3 text-sm">
      <span className="text-amber-600 font-bold flex-shrink-0">重要</span>
      <span className="text-amber-900">{children}</span>
    </div>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group bg-white border border-gray-200 rounded-lg overflow-hidden">
      <summary className="px-4 py-3 cursor-pointer font-medium text-gray-800 hover:bg-gray-50 transition-colors flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Q: {q}
      </summary>
      <div className="px-4 pb-3 pt-1 text-sm text-gray-600 border-t border-gray-100">
        {children}
      </div>
    </details>
  );
}

function PropertyCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h5 className="font-bold text-gray-700 mb-2 text-sm">{title}</h5>
      <ul className="text-sm text-gray-600 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="text-blue-400 mt-1 flex-shrink-0">-</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LayoutDiagram({ rows }: { rows: string[][] }) {
  return (
    <div className="border-2 border-gray-300 rounded-lg overflow-hidden my-4 text-sm">
      {rows.map((cols, ri) => (
        <div key={ri} className={`flex ${ri > 0 ? 'border-t-2 border-gray-300' : ''}`}>
          {cols.map((col, ci) => (
            <div
              key={ci}
              className={`flex-1 px-4 py-3 text-center text-gray-500 bg-gray-50 ${ci > 0 ? 'border-l-2 border-gray-300' : ''}`}
            >
              {col}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
