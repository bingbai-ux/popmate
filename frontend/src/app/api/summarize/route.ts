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
const SYSTEM_PROMPT = `あなたは小売店の商品POPに印刷する商品説明文を要約するアシスタントです。テキストボックスの余白ができないよう、指定された最大文字数のギリギリまで情報を詰め込んで要約してください。

長さの絶対厳守ルール（超重要）：
- 出力は指定された最大文字数を1文字も超えない
- 出力は指定された最小文字数を必ず上回る（下回るのは失格）
- 目標は最大文字数の直前（例: 上限80文字なら75〜80文字）。可能な限り上限に近づける
- 情報を絞りすぎない。元の文章の魅力・産地・特徴・効能・使い方などを最大限盛り込む

書き方の絶対厳守ルール：
- 出力の最後は必ず「。」「！」「？」のいずれかで終わる完結した文にする
- 「…」「...」「等」「〜」などの省略記号・省略語は絶対に使わない（途中で切ったような表現は禁止）
- 文の途中で終わらせない。最後まで自然に言い切る

その他のルール：
- 商品の特徴・魅力・産地・効能などのキーワードを優先的に残す
- できるだけ元の文章の表現を活かす
- 自然な日本語で1文または複数文を組み合わせる
- 改行は絶対に入れず1行で出力する
- 要約した文章のみを出力する（説明や前置きは不要）`;

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
 * AI要約結果をtargetChars以内に自然な文末で切り詰める。
 * 「…」は絶対に付けない。優先順位:
 *   1. targetChars以内かつ target の 70% 以降の位置にある最後の句点(。！？) を使う
 *      （目標長にできるだけ近い位置で自然に終わらせるため、序盤の句点は無視）
 *   2. targetChars以内かつ target の 50% 以降の読点(、) で切って「。」を付ける
 *   3. 最終手段: ハードカット後に「。」を付ける
 */
function trimToFit(text: string, targetChars: number): string {
  // AIが指示に反して末尾に「…」等を付けてきた場合に備えて除去
  const cleaned = text.replace(/[…]+$/, '').replace(/\.{2,}$/, '').trim();
  if (cleaned.length <= targetChars) return cleaned;

  const truncated = cleaned.substring(0, targetChars);

  // 1. 目標長の70%以降にある句点なら使う（早すぎる句点は捨てる）
  const sentenceFloor = Math.floor(targetChars * 0.7);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('？')
  );
  if (lastSentenceEnd >= sentenceFloor) {
    return cleaned.substring(0, lastSentenceEnd + 1);
  }

  // 2. 目標長の50%以降にある読点で切って句点を付ける
  const commaFloor = Math.floor(targetChars * 0.5);
  const lastComma = truncated.lastIndexOf('、');
  if (lastComma >= commaFloor) {
    return cleaned.substring(0, lastComma) + '。';
  }

  // 3. 最終手段: ハードカット + 「。」（「…」は付けない）
  return cleaned.substring(0, targetChars - 1) + '。';
}

/**
 * Claude Haiku 4.5 で要約
 * 戦略: 文字数の上限を厳守 + 「。」で終わる完結した文を依頼。
 * Claude は指示追従が良いので、原則としてこれで target 以内に収まり
 * 末尾も自然に「。」で終わる。trimToFit は保険。
 */
function buildUserPrompt(cleanText: string, minChars: number, maxChars: number): string {
  return `以下の商品説明文を要約してください。

長さの厳守事項：
- 出力は必ず${minChars}文字以上、${maxChars}文字以下（${maxChars}文字を1文字でも超えたら失格）
- 目標は${maxChars}文字ギリギリ。${minChars}文字未満は禁止。余白を残さず情報を詰め込む
- 短くまとめすぎず、元の商品説明の魅力・特徴・産地・効能などを最大限盛り込む

書き方の厳守事項：
- 最後は必ず「。」で終わる完結した文にする
- 「…」「...」「等」などの省略記号・省略語は絶対に使わない

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
  // ボックスを活かすため下限を設けつつ、上限は絶対厳守
  const requestMinChars = Math.max(20, Math.floor(targetChars * 0.9));
  const requestMaxChars = targetChars;

  try {
    const firstPrompt = buildUserPrompt(cleanText, requestMinChars, requestMaxChars);
    console.log('[Claude] Request 1:', {
      targetChars,
      range: `${requestMinChars}-${requestMaxChars}`,
      orig: cleanText.length,
    });

    let result = await callClaude(client, firstPrompt);
    let attempts = 1;

    // 90%未満で かつ 元文に詰め込む余地がある場合、最大2回まで再依頼して
    // 一番充填率の高いものを採用する（合計最大3回のAPI呼び出し）
    const minAcceptable = Math.floor(targetChars * 0.9);
    const hasHeadroom = cleanText.length > targetChars * 1.1;

    while (
      attempts < 3 &&
      result.text &&
      result.text.length < minAcceptable &&
      hasHeadroom
    ) {
      console.log('[Claude] Retry:', {
        attempt: attempts,
        outputLen: result.text.length,
        threshold: minAcceptable,
      });
      const retryPrompt = `以下の商品説明文を、${requestMinChars}文字以上${requestMaxChars}文字以下で要約してください。

前回のあなたの要約(${result.text.length}文字)は短すぎました:
「${result.text}」

前回落ちた元文の魅力・特徴・産地・使い方などをできる限り拾って、${requestMaxChars}文字ギリギリまで詰め込んで書き直してください。

厳守事項：
- 出力は${requestMinChars}文字以上、${requestMaxChars}文字以下（${requestMaxChars}文字を1文字でも超えたら失格）
- 最後は必ず「。」で終わる完結した文
- 「…」「等」「〜」などの省略記号・省略語は禁止
- 要約文のみを1行で出力

元文（${cleanText.length}文字）:
${cleanText}`;

      const retryResult = await callClaude(client, retryPrompt);
      attempts += 1;
      // より長い結果が来たら採用（上限内である前提で trimToFit が保険）
      if (retryResult.text && retryResult.text.length > result.text.length) {
        result = retryResult;
      } else {
        // 改善しなかったのでそれ以上リトライしない（Claude が既に飽和）
        break;
      }
    }

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
      codeVersion: 'v5-smart-trim',
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
