import { NextRequest, NextResponse } from 'next/server';

/**
 * AI文章省略API
 * 長い商品説明文を指定文字数以内に要約する
 * Gemini API優先、なければOpenAI、なければ簡易省略
 */
export async function POST(request: NextRequest) {
  try {
    const { text, maxChars } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'テキストが必要です' }, { status: 400 });
    }

    const targetChars = maxChars || 50;

    // Gemini API キーを確認（優先）
    const geminiKey = process.env.GEMINI_API_KEY;
    // OpenAI API キーを確認（フォールバック）
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      // Gemini API を使用して要約
      return await summarizeWithGemini(text, targetChars, geminiKey);
    } else if (openaiKey) {
      // OpenAI API を使用して要約
      return await summarizeWithOpenAI(text, targetChars, openaiKey);
    } else {
      // APIキーがない場合は簡易的な省略処理を行う
      return NextResponse.json({
        summarized: simpleSummarize(text, targetChars),
        method: 'simple',
        message: 'APIキーが設定されていないため、簡易省略を適用しました',
      });
    }

  } catch (error) {
    console.error('Summarize API error:', error);
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
  const prompt = `あなたは商品説明文を簡潔に要約するアシスタントです。

以下のルールに従ってください：
- 必ず${targetChars}文字以内に収めてください
- 商品の特徴や魅力を維持してください
- 自然な日本語で出力してください
- 「...」や「等」は使わず、完結した文章にしてください
- 重要なキーワード（産地、特徴、効能など）を優先的に残してください
- 要約した文章のみを出力してください（説明や前置きは不要）

以下の商品説明文を${targetChars}文字以内に要約してください：

${text}`;

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

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', error);
      return NextResponse.json({
        summarized: simpleSummarize(text, targetChars),
        method: 'simple',
        message: 'Gemini API エラーのため、簡易省略を適用しました',
      });
    }

    const data = await response.json();
    const summarized = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || simpleSummarize(text, targetChars);

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
    console.error('Gemini API error:', error);
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
            content: `あなたは商品説明文を簡潔に要約するアシスタントです。
以下のルールに従ってください：
- 必ず${targetChars}文字以内に収めてください
- 商品の特徴や魅力を維持してください
- 自然な日本語で出力してください
- 「...」や「等」は使わず、完結した文章にしてください
- 重要なキーワード（産地、特徴、効能など）を優先的に残してください`,
          },
          {
            role: 'user',
            content: `以下の商品説明文を${targetChars}文字以内に要約してください：\n\n${text}`,
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
  if (text.length <= maxChars) {
    return text;
  }

  // 句点、読点で区切って、収まる範囲で返す
  const sentences = text.split(/([。、！？])/);
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
    return text.substring(0, maxChars - 1) + '…';
  }

  // 最後が句点でない場合は「…」を追加
  if (!result.endsWith('。') && !result.endsWith('！') && !result.endsWith('？')) {
    if (result.length < maxChars) {
      result += '…';
    }
  }

  return result;
}
