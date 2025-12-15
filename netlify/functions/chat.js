// Netlify Function: /.netlify/functions/chat
// 실 OpenAI 호출 (gpt-3.5-turbo). GET은 헬스체크, POST는 message/history를 받아 응답.

exports.handler = async (event) => {
  // 메서드 체크
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 헬스체크
  if (event.httpMethod === 'GET') {
    return { statusCode: 200, body: 'OK' };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: 'OPENAI_API_KEY is missing' };
    }

    const { message, history = [] } = JSON.parse(event.body || '{}');
    if (!message) {
      return { statusCode: 400, body: 'message is required' };
    }

    const completionRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant for a pet care app.' },
          ...history, // [{role, content}, ...]
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    const raw = await completionRes.text();
    if (!completionRes.ok) {
      return { statusCode: completionRes.status, body: raw || 'OpenAI error' };
    }

    let reply = raw;
    try {
      const json = JSON.parse(raw);
      reply = json.choices?.[0]?.message?.content || raw;
    } catch (e) {
      // ignore parse error, raw 사용
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Server Error' };
  }
};

