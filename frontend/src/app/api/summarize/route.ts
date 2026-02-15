import { NextRequest, NextResponse } from 'next/server';

/**
 * AI文章省略API
 * 長い商品説明文を指定文字数以内に要約する
 * Gemini API優先、なければOpenAI、なければ簡易省略
 */
export async function POST(request: NextRequest) {
  try {
    const { text, maxChars } = await request.json();

    console.log('[Summarize API] Request received:', { textLength: text?.length, maxChars });

    if (!text) {
      return NextResponse.json({ error: 'テキストが必要です' }, { status: 400 });
    }

    const targetChars = maxChars || 50;

    // Gemini API キーを確認（優先）
    const geminiKey = process.env.GEMINI_API_KEY;
    // OpenAI API キーを確認（フォールバック）
    const openaiKey = process.env.OPENAI_API_KEY;

    console.log('[Summarize API] API keys available:', {
      hasGemini: !!geminiKey,
      hasOpenAI: !!openaiKey
    });

    if (geminiKey) {
      // Gemini API を使用して要約
      console.log('[Summarize API] Using Gemini');
      return await summarizeWithGemini(text, targetChars, geminiKey);
    } else if (openaiKey) {
      // OpenAI API を使用して要約
      console.log('[Summarize API] Using OpenAI');
      return await summarizeWithOpenAI(text, targetChars, openaiKey);
    } else {
      // APIキーがない場合は簡易的な省略処理を行う
      console.log('[Summarize API] No API key, using simple summarize');
      return NextResponse.json({
        summarized: simpleSummarize(text, targetChars),
        method: 'simple',
        message: 'APIキーが設定されていないため、簡易省略を適用しました',
      });
    }

  } catch (error) {
    console.error('[Summarize API] Error:', error);
    return NextResponse.json(
      { error: '要約処理に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * Gemini API で要約
 */
async function summarizeWithGemini(text: string, targetChars: number, apiKey: string) {
  // 入力テキストから改行を削除
  const cleanText = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

  const minChars = Math.floor(targetChars * 0.85);
  const isShortText = cleanText.length <= 50;
  const prompt = isShortText
    ? `以下のテキストを${minChars}〜${targetChars}文字の範囲に短縮してください。
ルール：
- 出力は必ず${minChars}文字以上、${targetChars}文字以下にしてください。短すぎるのはNGです
- 商品名や固有名詞はできるだけ残してください
- 内容量（g, ml等）は省略可能です
- 改行は入れず1行で出力してください
- 短縮したテキストのみを出力してください

テキスト：${cleanText}`
    : `あなたは商品説明文を要約するアシスタントです。テキストボックスに収まるギリギリの長さで要約してください。

最重要ルール：
- 出力は必ず${minChars}文字以上、${targetChars}文字以下にしてください
- ${minChars}文字未満の短い出力は絶対にNGです。スペースを最大限活用してください
- 目標は${targetChars}文字ギリギリです。余白を残さず情報を詰め込んでください

その他のルール：
- できるだけ元の文章の表現をそのまま残してください
- 商品の特徴や魅力を維持してください
- 自然な日本語で出力してください
- 「...」や「等」は使わず、完結した文章にしてください
- 重要なキーワード（産地、特徴、効能など）を優先的に残してください
- 要約した文章のみを出力してください（説明や前置きは不要）
- 改行は絶対に入れないでください。1行で出力してください

以下の商品説明文を${minChars}〜${targetChars}文字の範囲で要約してください：

${cleanText}`;

  console.log('[Gemini] Sending request, targetChars:', targetChars);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    console.log('[Gemini] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini] API error response:', errorText);
      return NextResponse.json({
        summarized: simpleSummarize(text, targetChars),
        method: 'simple',
        message: 'Gemini API エラーのため、簡易省略を適用しました',
        debug: { status: response.status, error: errorText }
      });
    }

    const data = await response.json();
    console.log('[Gemini] Success, candidates:', data.candidates?.length);

    // 出力から改行を削除して1行に
    const rawSummarized = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const summarized = rawSummarized.replace(/\r?\n/g, '').trim() || simpleSummarize(cleanText, targetChars);

    // 文字数が超えている場合は再度カット
    const finalText = summarized.length > targetChars
      ? summarized.substring(0, targetChars - 1) + '…'
      : summarized;

    return NextResponse.json({
      summarized: finalText,
      method: 'gemini',
      originalLength: text.length,
      summarizedLength: finalText.length,
    });

  } catch (error) {
    console.error('[Gemini] Exception:', error);
    return NextResponse.json({
      summarized: simpleSummarize(text, targetChars),
      method: 'simple',
      message: 'Gemini API エラーのため、簡易省略を適用しました',
    });
  }
}

/**
 * OpenAI API で要約
 */
async function summarizeWithOpenAI(text: string, targetChars: number, apiKey: string) {
  const minChars = Math.floor(targetChars * 0.85);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたは商品説明文を要約するアシスタントです。テキストボックスに収まるギリギリの長さで要約してください。
最重要ルール：
- 出力は必ず${minChars}文字以上、${targetChars}文字以下にしてください
- ${minChars}文字未満の短い出力は絶対にNGです。スペースを最大限活用してください
- 目標は${targetChars}文字ギリギリです
その他のルール：
- できるだけ元の文章の表現をそのまま残してください
- 商品の特徴や魅力を維持してください
- 自然な日本語で、完結した文章にしてください
- 重要なキーワード（産地、特徴、効能など）を優先的に残してください`,
          },
          {
            role: 'user',
            content: `以下の商品説明文を${minChars}〜${targetChars}文字の範囲で要約してください：\n\n${text}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json({
        summarized: simpleSummarize(text, targetChars),
        method: 'simple',
        message: 'OpenAI API エラーのため、簡易省略を適用しました',
      });
    }

    const data = await response.json();
    const summarized = data.choices[0]?.message?.content?.trim() || simpleSummarize(text, targetChars);

    // 文字数が超えている場合は再度カット
    const finalText = summarized.length > targetChars
      ? summarized.substring(0, targetChars - 1) + '…'
      : summarized;

    return NextResponse.json({
      summarized: finalText,
      method: 'openai',
      originalLength: text.length,
      summarizedLength: finalText.length,
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({
      summarized: simpleSummarize(text, targetChars),
      method: 'simple',
      message: 'OpenAI API エラーのため、簡易省略を適用しました',
    });
  }
}

/**
 * 簡易的なテキスト省略（AIなし）
 * 文の区切りを考慮して省略する
 */
function simpleSummarize(text: string, maxChars: number): string {
  // 改行を削除して1行に
  const cleanText = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

  if (cleanText.length <= maxChars) {
    return cleanText;
  }

  // 句点、読点で区切って、収まる範囲で返す
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

  // 何も収まらない場合は強制カット
  if (result.length === 0) {
    return cleanText.substring(0, maxChars - 1) + '…';
  }

  // 最後が句点でない場合は「…」を追加
  if (!result.endsWith('。') && !result.endsWith('！') && !result.endsWith('？')) {
    if (result.length < maxChars) {
      result += '…';
    }
  }

  return result;
}
