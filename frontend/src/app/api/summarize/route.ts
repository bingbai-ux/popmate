import { NextRequest, NextResponse } from 'next/server';

/**
 * AI文章省略API
 * 長い商品説明文を指定文字数以内に要約する
 */
export async function POST(request: NextRequest) {
  try {
    const { text, maxChars, context } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'テキストが必要です' }, { status: 400 });
    }

    const targetChars = maxChars || 50;

    // OpenAI API キーを確認
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // APIキーがない場合は簡易的な省略処理を行う
      return NextResponse.json({
        summarized: simpleSummarize(text, targetChars),
        method: 'simple',
        message: 'OpenAI APIキーが設定されていないため、簡易省略を適用しました',
      });
    }

    // OpenAI API を使用して要約
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
      // APIエラー時は簡易省略を適用
      return NextResponse.json({
        summarized: simpleSummarize(text, targetChars),
        method: 'simple',
        message: 'AI要約に失敗したため、簡易省略を適用しました',
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
      method: 'ai',
      originalLength: text.length,
      summarizedLength: finalText.length,
    });

  } catch (error) {
    console.error('Summarize API error:', error);
    return NextResponse.json(
      { error: '要約処理に失敗しました' },
      { status: 500 }
    );
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
