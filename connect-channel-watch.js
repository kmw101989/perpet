// WebSocket 클라이언트로 특정 채널에 연결하고 피그마 프레임 정보를 받는 스크립트
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
  console.log('\n✓ Join message sent! Waiting for Figma frame selection...\n');
  console.log('💡 피그마에서 프레임을 선택하면 정보가 전송됩니다.\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    // 시스템 메시지는 간단히 표시
    if (message.type === 'system') {
      if (message.message && typeof message.message === 'string' && message.message.includes('Joined')) {
        console.log('✓', message.message);
        console.log('\n⏳ 피그마에서 프레임을 선택해주세요...\n');
      }
      return;
    }
    
    // 피그마 프레임 정보가 포함된 메시지
    console.log('=== 📐 Figma Frame Information Received ===');
    console.log(JSON.stringify(message, null, 2));
    console.log('');
    
    // 프레임 정보가 있으면 파일로 저장
    if (message.frame || message.selection || message.node) {
      const fs = require('fs');
      const frameData = {
        timestamp: new Date().toISOString(),
        channel: CHANNEL,
        data: message
      };
      fs.writeFileSync('figma-frame-data.json', JSON.stringify(frameData, null, 2));
      console.log('💾 Frame data saved to figma-frame-data.json\n');
    }
    
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

