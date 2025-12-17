// Netlify Function: AI 채팅 처리
// Firebase AI 또는 외부 AI API를 서버 사이드에서 호출하여 API 키 보호

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { message, userId, conversationId } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    // 환경 변수에서 API 키 가져오기 (Netlify 대시보드에서 설정)
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
    
    // 방법 1: OpenAI API 사용
    if (OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: '당신은 반려동물 건강 관리 전문가입니다. 친절하고 전문적으로 답변해주세요.',
            },
            {
              role: 'user',
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'AI API 호출 실패');
      }

      const aiResponse = data.choices[0]?.message?.content || '응답을 생성할 수 없습니다.';

      // Supabase에 대화 내역 저장 (선택사항)
      // await saveToSupabase(userId, conversationId, message, aiResponse);

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: aiResponse,
          conversationId,
        }),
      };
    }

    // 방법 2: Firebase AI 사용 (Vertex AI 등)
    // Firebase 서비스 계정 키는 환경 변수로 관리
    // const firebaseAdmin = require('firebase-admin');
    // const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    // firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(serviceAccount) });
    // ... Firebase AI 호출 로직

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'AI service not configured' }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};

