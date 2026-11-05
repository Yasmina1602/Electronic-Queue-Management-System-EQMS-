import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { ENV } from './config/env.js';
import { initSocketIO } from './services/socketService.js';
import { pool } from './config/db.js';

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ENV.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

initSocketIO(server, io);

server.listen(ENV.PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Elektron Navbat Boshqaruv Backend API ishga tushdi`);
  console.log(`📍 Port: http://localhost:${ENV.PORT}`);
  console.log(`📡 WebSocket Real-time: http://localhost:${ENV.PORT}`);
  console.log(`💾 PostgreSQL URL: ${ENV.DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);
  console.log(`====================================================`);

  try {
    const res = await pool.query('SELECT NOW()');
    console.log(`✓ PostgreSQL ulanishi muvaffaqiyatli: ${res.rows[0].now}`);
  } catch (err) {
    console.error(`✗ PostgreSQL ulanishida xatolik:`, err.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM qabul qilindi, server to‘xtatilmoqda...');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

