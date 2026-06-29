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
const SYSTEM_PROMPT = `あなたは小売店の商品POPに印刷する商品説明文を要約するアシスタントです。テキストボックスに収まるギリギリの長さで要約してください。

最重要ルール：
- 出力は依頼された文字数範囲を必ず守ってください
- 下限未満の短い出力は禁止です。スペースを最大限活用してください
- 目標は上限ギリギリです。余白を残さず情報を詰め込んでください

その他のルール：
- できるだけ元の文章の表現をそのまま残してください
- 商品の特徴・魅力・産地・効能などのキーワードを優先的に残してください
- 自然な日本語で完結した文章にしてください
- 「...」や「等」は使わず、完結した文章にしてください
- 改行は絶対に入れないでください。1行で出力してください
- 要約した文章のみを出力してください（説明や前置きは不要）`;

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
 * AI要約結果をtargetChars以内に文の区切りでトリミング
 * 自然な文末（。！？）で切ることで、要約として自然な形を保つ
 */
function trimToFit(text: string, targetChars: number): string {
  if (text.length <= targetChars) return text;

  const truncated = text.substring(0, targetChars);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('？')
  );

  if (lastSentenceEnd >= targetChars * 0.8) {
    return text.substring(0, lastSentenceEnd + 1);
  }

  return text.substring(0, targetChars - 1) + '…';
}

/**
 * Claude Haiku 4.5 で要約
 * 戦略: LLMは文字数を過少に出力しがちなので、targetの130%で依頼し、
 * 返ってきた結果をtargetChars以内の文末でトリミングする
 */
async function summarizeWithClaude(text: string, targetChars: number, client: Anthropic) {
  const cleanText = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  const requestMaxChars = Math.floor(targetChars * 1.3);
  const requestMinChars = targetChars;

  const userPrompt = `以下の商品説明文を${requestMinChars}〜${requestMaxChars}文字の範囲で要約してください。
出力は必ず${requestMinChars}文字以上、${requestMaxChars}文字以下にしてください。

${cleanText}`;

  console.log('[Claude] Sending request, targetChars:', targetChars, 'requestMax:', requestMaxChars);

  try {
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
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    const rawSummarized = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    const summarized = rawSummarized.replace(/\r?\n/g, '').trim();

    if (!summarized) {
      console.warn('[Claude] Empty response, falling back to simple summarize');
      return NextResponse.json({
        summarized: simpleSummarize(text, targetChars),
        method: 'simple',
        message: 'Claude の応答が空のため、簡易省略を適用しました',
      });
    }

    const finalText = trimToFit(summarized, targetChars);

    console.log('[Claude] Result:', {
      rawLength: summarized.length,
      finalLength: finalText.length,
      targetChars,
      cacheRead: response.usage.cache_read_input_tokens,
      cacheCreate: response.usage.cache_creation_input_tokens,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return NextResponse.json({
      summarized: finalText,
      method: 'claude-haiku-4-5',
      originalLength: text.length,
      summarizedLength: finalText.length,
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
 * 簡易的なテキスト省略（AIなし）
 * 文の区切りを考慮して省略する
 */
function simpleSummarize(text: string, maxChars: number): string {
  const cleanText = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

  if (cleanText.length <= maxChars) {
    return cleanText;
  }

  const sentences = cleanText.split(/([。、！？])/);
  let result = '';

  for (let i = 0; i < sentences.length; i++) {
    const next = result + sentences[i];
    if (next.length <= maxChars - 1) {
      result = next;
    } else {
      break;
    }
  }

  if (result.length < Math.floor(maxChars * 0.8)) {
    return cleanText.substring(0, maxChars - 1) + '…';
  }

  if (!result.endsWith('。') && !result.endsWith('！') && !result.endsWith('？')) {
    if (result.length < maxChars) {
      result += '…';
    }
  }

  return result;
}
