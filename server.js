const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 티어 랭킹 데이터 저장소 (메모리 기반)
let tierData = {
  S: [],
  A: [],
  B: [],
  C: [],
  D: [],
  unranked: [
    { id: '1', name: '아이템 1' },
    { id: '2', name: '아이템 2' },
    { id: '3', name: '아이템 3' },
    { id: '4', name: '아이템 4' },
    { id: '5', name: '아이템 5' },
    { id: '6', name: '아이템 6' },
    { id: '7', name: '아이템 7' },
    { id: '8', name: '아이템 8' }
  ]
};

// 현재 연결된 사용자 수
let connectedUsers = 0;

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  connectedUsers++;
  console.log(`새 사용자 연결됨. 현재 ${connectedUsers}명 접속 중`);
  
  // 모든 클라이언트에게 사용자 수 업데이트
  io.emit('userCountUpdate', connectedUsers);
  
  // 클라이언트에게 현재 티어 데이터 전송
  socket.emit('initialData', tierData);
  
  // 티어 업데이트 처리
  socket.on('updateTier', (data) => {
    // 티어 데이터 업데이트
    tierData = data.tierData;
    
    // 모든 클라이언트에게 업데이트된 데이터 브로드캐스트
    socket.broadcast.emit('tierUpdated', tierData);
    
    console.log('티어 랭킹이 업데이트되었습니다');
  });
  
  // 아이템 추가 처리
  socket.on('addItem', (item) => {
    tierData.unranked.push(item);
    
    // 모든 클라이언트에게 새 아이템 브로드캐스트
    io.emit('itemAdded', item);
    
    console.log(`새 아이템 추가됨: ${item.name}`);
  });
  
  // 연결 해제 처리
  socket.on('disconnect', () => {
    connectedUsers--;
    console.log(`사용자 연결 해제됨. 현재 ${connectedUsers}명 접속 중`);
    
    // 모든 클라이언트에게 사용자 수 업데이트
    io.emit('userCountUpdate', connectedUsers);
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`http://localhost:${PORT} 에서 접속 가능합니다`);
});
