// WebSocket 클라이언트로 특정 채널에 연결하는 스크립트
const WebSocket = require('ws');

const CHANNEL = 'jmaykuun';
const SERVER_URL = 'ws://localhost:3055';
const CONNECTION_TIMEOUT = 5000; // 5초 타임아웃

console.log(`Connecting to WebSocket server at ${SERVER_URL}...`);
console.log(`Joining channel: ${CHANNEL}\n`);

const ws = new WebSocket(SERVER_URL);

// 연결 타임아웃 설정
const timeout = setTimeout(() => {
  if (ws.readyState === WebSocket.CONNECTING) {
    console.error('❌ Connection timeout! 서버가 실행 중인지 확인하세요.');
    ws.terminate();
    process.exit(1);
  }
}, CONNECTION_TIMEOUT);

ws.on('open', () => {
  clearTimeout(timeout);
  console.log('✓ Connected to WebSocket server');
  
  // 채널에 조인하는 메시지 전송
  const joinMessage = {
    type: 'join',
    channel: CHANNEL
  };
  
  console.log(`\nSending join message to channel "${CHANNEL}":`);
  console.log(JSON.stringify(joinMessage, null, 2));
  ws.send(JSON.stringify(joinMessage));
  console.log('\n✓ Join message sent! Waiting for server response...\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('=== Received message from server ===');
    console.log(JSON.stringify(message, null, 2));
    console.log('');
  } catch (e) {
    console.log('=== Received message (raw) ===');
    console.log(data.toString());
    console.log('');
  }
});

ws.on('error', (error) => {
  clearTimeout(timeout);
  console.error('❌ WebSocket error:', error.message);
  console.error('서버가 실행 중인지 확인하세요: bunx cursor-talk-to-figma-socket');
  process.exit(1);
});

ws.on('close', (code, reason) => {
  clearTimeout(timeout);
  console.log(`\nConnection closed (code: ${code}, reason: ${reason || 'none'})`);
  process.exit(0);
});

// Ctrl+C로 종료
process.on('SIGINT', () => {
  console.log('\n\nClosing connection...');
  clearTimeout(timeout);
  ws.close();
});

