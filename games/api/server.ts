/**
 * local server entry file, for local development
 */
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { setupSocketHandlers } from './socket/handler.js';
import type { ClientToServerEvents, ServerToClientEvents } from '../shared/types.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
  console.log(`Socket.IO server running`);
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { httpServer, io };
export default app;