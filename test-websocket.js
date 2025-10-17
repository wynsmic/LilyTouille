const { io } = require('socket.io-client');

console.log('Testing WebSocket connection...');

const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  timeout: 20000,
  forceNew: true,
});

socket.on('connect', () => {
  console.log('✅ Connected successfully!', {
    socketId: socket.id,
    transport: socket.io.engine.transport.name,
  });
  
  // Test sending a message
  socket.emit('get-queue-status');
  
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

socket.on('queue-status', (data) => {
  console.log('📊 Received queue status:', data);
});

socket.on('queue-status-error', (error) => {
  console.error('❌ Queue status error:', error);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Connection timeout');
  socket.disconnect();
  process.exit(1);
}, 10000);
