import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('Connected to server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('error', (message: string) => {
      console.error('Socket error:', message);
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinRoom(roomId: string, userId: string): void {
  const s = getSocket();
  s.emit('join_room', roomId, userId);
}

export function leaveRoom(roomId: string, userId: string): void {
  const s = getSocket();
  s.emit('leave_room', roomId, userId);
}

export function setReady(roomId: string, userId: string, isReady: boolean): void {
  const s = getSocket();
  s.emit('ready', roomId, userId, isReady);
}

export function startGame(roomId: string, userId: string): void {
  const s = getSocket();
  s.emit('start_game', roomId, userId);
}

export function sendGameAction(roomId: string, userId: string, action: any): void {
  const s = getSocket();
  s.emit('game_action', roomId, userId, action);
}

export function quickMatch(userId: string, gameType: any): void {
  const s = getSocket();
  s.emit('quick_match', userId, gameType);
}

export function cancelMatch(userId: string): void {
  const s = getSocket();
  s.emit('cancel_match', userId);
}

export function setGameType(roomId: string, userId: string, gameType: any): void {
  const s = getSocket();
  s.emit('set_game_type', roomId, userId, gameType);
}
