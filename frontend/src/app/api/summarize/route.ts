import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

/**
 * AI文章省略API
 * 長い商品説明文を指定文字数以内に要約する
 * Claude Haiku 4.5 を使用、APIキー未設定時は簡易省略にフォールバック
 */

// プロンプトキャッシュ対象のシステムプロンプト（リクエスト間で固定）
// 注: Haiku 4.5 の最小キャッシュ対象プレフィックスは 4096 トークン。
// 現状この system は短いため実際にはキャッシュ発火しないが、
// 将来プロンプトが伸びたとき自動的にキャッシュが効くようマーカーは付けておく。
const SYSTEM_PROMPT = `あなたは小売店の商品POPを書くプロのコピーライターです。元の商品説明をもとに、そのまま店頭に印刷して出せる、自然で完結した紹介文を書いてください。

最優先事項（文章として成立していること）：
- 一文一文を必ず述語まで書ききった、文法的に完全な文にする
- 「〜をブレンド。」「〜をサポートし。」「〜蒸留水で。」のような、動詞の途中や助詞で切れた不完全な表現は絶対に禁止。必ず「〜します。」「〜です。」など言い切る
- 商品を知らないお客様が読んで、魅力が自然に伝わる、なめらかな紹介文にする
- 主語や修飾の係り受けが破綻していないか確認する（例:「潤いを与え天然成分が整えます」のように主語が二重にならないよう、適切に読点や接続で整える）

内容のルール：
- 元の説明に書かれていない事実を創作しない。産地・成分・効能などは元文の範囲内で
- 同じ意味の言葉の繰り返しを避ける（例:「ハイドロソル」と「芳香蒸留水」を両方入れて冗長にしない）
- 商品の特徴・魅力・産地・効能・使い方のうち、魅力が伝わるものを自然に盛り込む

長さ（重要）：
- 指定された最大文字数を絶対に超えない
- その範囲内で、完結した文をできるだけ入れて枠を埋める。1文で足りなければ2文3文と続けてよい
- ただし次の一文を入れると最大文字数を超える場合は、その文を入れず、前の文で自然に止める（文を途中で切ってはいけない）
- 文字数を埋めるために不自然な言い回しや冗長な繰り返しをしてはいけない。自然さが最優先

体裁：
- 「…」「〜」「等」などの省略表現は使わない
- 改行は入れず1行で出力する
- 紹介文の本文のみを出力する（前置きや説明は不要）`;

// SDKは ANTHROPIC_API_KEY を環境変数から自動的に読み込む
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const client = anthropicKey ? new Anthropic() : null;

export async function POST(request: NextRequest) {
  try {
    const { text, maxChars } = await request.json();

    console.log('[Summarize API] Request received:', { textLength: text?.length, maxChars });

    if (!text) {
      return NextResponse.json({ error: 'テキストが必要です' }, { status: 400 });
    }

    const targetChars = maxChars || 50;

    if (!client) {
      console.log('[Summarize API] No ANTHROPIC_API_KEY, using simple summarize');
      return NextResponse.json({
        summarized: simpleSummarize(text, targetChars),
        method: 'simple',
        message: 'ANTHROPIC_API_KEYが設定されていないため、簡易省略を適用しました',
      });
    }

    return await summarizeWithClaude(text, targetChars, client);
  } catch (error) {
    console.error('[Summarize API] Error:', error);
    return NextResponse.json(
      { error: '要約処理に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * 要約結果を必ず targetChars 以内に収める（はみ出し禁止）。
 * 文法を壊さないため、切るのは必ず句点(。！？)の位置のみ。
 * 通常は Claude 側で target 以内に収まるよう依頼＋再依頼するので、
 * この関数が実際に切るのは保険的な稀ケース。
 * 注: 読点(、)での切断＋「。」付与や文字数ハードカットは使わない
 *     （「サポートし。」のような壊れた語尾を作るため）。
 */
function trimToFit(text: string, targetChars: number): string {
  // AIが指示に反して末尾に「…」等を付けてきた場合に備えて除去
  const cleaned = text.replace(/[…]+$/, '').replace(/\.{2,}$/, '').trim();
  if (cleaned.length <= targetChars) return cleaned;

  // targetChars以内で最後の句点を探して切る（必ずtarget以内に収める＝はみ出さない）
  const within = cleaned.substring(0, targetChars);
  const endWithin = Math.max(
    within.lastIndexOf('。'),
    within.lastIndexOf('！'),
    within.lastIndexOf('？')
  );
  if (endWithin >= 0) {
    return cleaned.substring(0, endWithin + 1);
  }

  // target以内に句点が無い（＝最初の一文が長すぎる）稀なケース。
  // Claudeへの再依頼で通常は避けられる。ここに来た場合は、文法を壊さないよう
  // 最初の完結文を返す（多少はみ出す可能性はあるが、途中で切って「〜し。」等の
  // 壊れた語尾を作るよりは良い）。
  const firstEnd = Math.min(
    ...['。', '！', '？']
      .map((p) => cleaned.indexOf(p))
      .filter((i) => i >= 0)
  );
  if (Number.isFinite(firstEnd)) {
    return cleaned.substring(0, firstEnd + 1);
  }

  // 句点が一つも無い場合は、不完全な語尾を作らずそのまま返す
  return cleaned;
}

/**
 * Claude Haiku 4.5 で要約
 * 戦略: 「店頭に出せる自然で完結した紹介文」を最優先し、文字数は目安として扱う。
 * 文字数を埋めるための詰め込みはしない（不自然な体言止めや係り受け破綻の原因になる）。
 * trimToFit は上限を大きく超えた時だけ、文の区切りで丸める保険。
 */
function buildUserPrompt(cleanText: string, minChars: number, maxChars: number): string {
  return `次の商品説明をもとに、店頭POPに印刷する紹介文を書いてください。

・${maxChars}文字を絶対に超えないこと。その範囲で、できるだけ${minChars}文字以上になるよう枠を埋める
・元文に十分な内容がある場合、1文だけで終えて枠を余らせない。各文を短めにして2〜3文に分け、${maxChars}文字以内でできるだけ多くの魅力（特徴・産地・効能・使い方など）を盛り込む
・ただし次の一文を足すと${maxChars}文字を超えるなら、その文は入れず前の文で止める。文を途中で切るのは禁止
・一文ずつ必ず言い切り、紹介文として自然に読める文章にする（不自然な詰め込み・冗長な繰り返しはしない）
・元の説明にない事実は足さない

商品説明：
${cleanText}`;
}

type ClaudeCallResult = {
  text: string;
  usage: {
    input: number;
    output: number;
    cacheRead: number | null;
    cacheCreate: number | null;
  };
};

async function callClaude(client: Anthropic, userPrompt: string): Promise<ClaudeCallResult> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return {
    text: raw.replace(/\r?\n/g, '').trim(),
    usage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      cacheRead: response.usage.cache_read_input_tokens,
      cacheCreate: response.usage.cache_creation_input_tokens,
    },
  };
}

async function summarizeWithClaude(text: string, targetChars: number, client: Anthropic) {
  const cleanText = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

  // 元文がそのまま収まる（またはgrace内）なら要約しない。
  // 圧縮すると情報が減るだけなので、元文をそのまま返す（API呼び出しも節約）。
  if (cleanText.length <= Math.ceil(targetChars * 1.08)) {
    console.log('[Claude] Skip: source already fits', { orig: cleanText.length, targetChars });
    return NextResponse.json({
      summarized: cleanText,
      method: 'passthrough',
      originalLength: text.length,
      summarizedLength: cleanText.length,
      attempts: 0,
    });
  }

  // 目安レンジ。下限は自然さを優先して緩め（詰め込みで文章が壊れるのを防ぐ）
  const requestMinChars = Math.max(20, Math.floor(targetChars * 0.75));
  const requestMaxChars = targetChars;

  try {
    const firstPrompt = buildUserPrompt(cleanText, requestMinChars, requestMaxChars);
    console.log('[Claude] Request 1:', {
      targetChars,
      range: `${requestMinChars}-${requestMaxChars}`,
      orig: cleanText.length,
    });

    const first = await callClaude(client, firstPrompt);
    let result = first;
    let attempts = 1;

    const tooShort = Math.floor(targetChars * 0.75);
    const hasHeadroom = cleanText.length > targetChars * 1.1;
    // 候補を「target以内に収めたときの長さ」で評価する。長いほど良い（＝枠が埋まる）。
    const fittedLen = (t: string) =>
      t.length <= requestMaxChars ? t.length : trimToFit(t, requestMaxChars).length;

    let bestText = first.text;

    if (bestText && bestText.length > requestMaxChars) {
      // 【超過】targetを超えた → Claude自身に target以内で凝縮させる。
      console.log('[Claude] Retry (too long):', { outputLen: bestText.length, max: requestMaxChars });
      const retryPrompt = `次の商品説明をもとに、店頭POPの紹介文を書いてください。

前回の紹介文は${bestText.length}文字で、上限の${requestMaxChars}文字を超えてしまいました:
「${bestText}」

内容は良いですが長すぎます。同じ魅力を保ったまま、${requestMinChars}〜${requestMaxChars}文字（${requestMaxChars}文字以内）に収まるよう凝縮して書き直してください。複数の要素は1文にまとめてもかまいません。文を途中で切らず、必ず完結した自然な文章にすること。

商品説明：
${cleanText}`;
      const retry = await callClaude(client, retryPrompt);
      attempts += 1;
      // target以内に収まり、かつ充填が良くなる（または初回が超過のまま）なら採用
      if (retry.text && (retry.text.length <= requestMaxChars || fittedLen(retry.text) > fittedLen(bestText))) {
        bestText = retry.text;
      }
    } else if (bestText && bestText.length < tooShort && hasHeadroom) {
      // 【過少】枠の75%未満 → 元文に中身があるのに短すぎる。
      // 「短い文を2〜3文に分けて枠を埋める」よう促し、最大2回まで試して
      // 一番よく埋まる（target以内で最長の）候補を採用する。
      for (let i = 0; i < 2 && fittedLen(bestText) < tooShort; i++) {
        console.log('[Claude] Retry (too short):', { attempt: attempts, outputLen: bestText.length, threshold: tooShort });
        const retryPrompt = `次の商品説明をもとに、店頭POPの紹介文を書いてください。

前回の紹介文は${bestText.length}文字で、枠（${requestMaxChars}文字）に対して短すぎます:
「${bestText}」

元文にはまだ盛り込める魅力（特徴・産地・効能・使い方など）が残っています。コツ：1つの長い文で終わらせず、短めの文を2〜3個に分けて、合計${requestMinChars}〜${requestMaxChars}文字（${requestMaxChars}文字以内）でできるだけ枠を埋めてください。各文は必ず言い切り、途中で切らないこと。不自然な繰り返しや水増しはしないこと。

商品説明：
${cleanText}`;
        const retry = await callClaude(client, retryPrompt);
        attempts += 1;
        if (retry.text && fittedLen(retry.text) > fittedLen(bestText)) {
          bestText = retry.text;
        } else {
          break; // 改善しなければ打ち切り
        }
      }
    }

    result = { ...first, text: bestText };

    if (!result.text) {
      console.warn('[Claude] Empty response, falling back to simple summarize');
      return NextResponse.json({
        summarized: simpleSummarize(text, targetChars),
        method: 'simple',
        message: 'Claude の応答が空のため、簡易省略を適用しました',
      });
    }

    const finalText = trimToFit(result.text, targetChars);

    console.log('[Claude] Result:', {
      attempts,
      rawLength: result.text.length,
      finalLength: finalText.length,
      targetChars,
      fillRate: `${Math.round((finalText.length / targetChars) * 100)}%`,
      usage: result.usage,
    });

    return NextResponse.json({
      summarized: finalText,
      method: 'claude-haiku-4-5',
      originalLength: text.length,
      summarizedLength: finalText.length,
      attempts,
      codeVersion: 'v11-fill-small-box',
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error('[Claude] Authentication failed:', error.message);
      return NextResponse.json({
        summarized: simpleSummarize(text, targetChars),
        method: 'simple',
        message: 'Claude API 認証エラーのため、簡易省略を適用しました',
      });
    }
    if (error instanceof Anthropic.RateLimitError) {
      console.error('[Claude] Rate limit hit:', error.message);
      return NextResponse.json({
        summarized: simpleSummarize(text, targetChars),
        method: 'simple',
        message: 'Claude APIレート制限のため、簡易省略を適用しました',
      });
    }
    if (error instanceof Anthropic.APIError) {
      console.error('[Claude] API error:', error.status, error.message);
      return NextResponse.json({
        summarized: simpleSummarize(text, targetChars),
        method: 'simple',
        message: `Claude API エラー (${error.status}) のため、簡易省略を適用しました`,
      });
    }
    console.error('[Claude] Unexpected exception:', error);
    return NextResponse.json({
      summarized: simpleSummarize(text, targetChars),
      method: 'simple',
      message: 'Claude API 呼び出し失敗のため、簡易省略を適用しました',
    });
  }
}

/**
 * 簡易的なテキスト省略（AIなし・APIキー無しやエラー時のフォールバック）
 * 「…」は付けず、trimToFit と同じ方針で自然な文末に丸める。
 */
function simpleSummarize(text: string, maxChars: number): string {
  const cleanText = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleanText.length <= maxChars) return cleanText;
  return trimToFit(cleanText, maxChars);
}
