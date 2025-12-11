// Netlify Function: Supabase 인증 토큰 검증 및 서버 사이드 작업
// Supabase 서비스 키를 서버에서만 사용하여 보안 강화

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // 환경 변수에서 Supabase 키 가져오기
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // 서비스 키는 서버에서만 사용

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Supabase configuration missing' }),
      };
    }

    const { action, data } = JSON.parse(event.body || '{}');

    switch (action) {
      case 'verify_token':
        // JWT 토큰 검증
        const { token } = data;
        const verifyResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_SERVICE_KEY,
          },
        });

        if (verifyResponse.ok) {
          const user = await verifyResponse.json();
          return {
            statusCode: 200,
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user, valid: true }),
          };
        } else {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid token', valid: false }),
          };
        }

      case 'admin_query':
        // 서버 사이드에서만 가능한 관리자 쿼리
        // 예: 사용자 목록, 통계 등
        const { query } = data;
        const queryResponse = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
          },
        });

        const result = await queryResponse.json();
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(result),
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};

