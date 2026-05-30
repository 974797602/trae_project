import { Server, Socket } from 'socket.io';
import {
  joinRoom,
  leaveRoom,
  setPlayerReady,
  setGameType,
  canStartGame,
  setRoomStatus,
  getRoom,
  getRoomWithGame
} from '../modules/room/index.js';
import { addToQueue, removeFromQueue } from '../modules/matching/index.js';
import { GameFactory } from '../modules/games/GameFactory.js';
import { gameStore } from '../types.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  GameType,
  GameAction,
  Room
} from '../../shared/types.js';

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_room', (roomId: string, userId: string) => {
      handleJoinRoom(io, socket, roomId, userId);
    });

    socket.on('leave_room', (roomId: string, userId: string) => {
      handleLeaveRoom(io, socket, roomId, userId);
    });

    socket.on('ready', (roomId: string, userId: string, isReady: boolean) => {
      handleReady(io, roomId, userId, isReady);
    });

    socket.on('start_game', (roomId: string, userId: string) => {
      handleStartGame(io, roomId, userId);
    });

    socket.on('game_action', (roomId: string, userId: string, action: GameAction) => {
      handleGameAction(io, roomId, userId, action);
    });

    socket.on('quick_match', (userId: string, gameType: GameType) => {
      handleQuickMatch(io, socket, userId, gameType);
    });

    socket.on('cancel_match', (userId: string) => {
      handleCancelMatch(userId);
    });

    socket.on('set_game_type', (roomId: string, userId: string, gameType: GameType) => {
      handleSetGameType(io, roomId, userId, gameType);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      handleDisconnect(socket);
    });
  });
}

function handleJoinRoom(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket,
  roomId: string,
  userId: string
): void {
  const result = joinRoom(roomId, userId);
  if (!result.success) {
    socket.emit('error', result.error || '加入房间失败');
    return;
  }

  socket.join(roomId);
  removeFromQueue(userId);

  if (result.room) {
    io.to(roomId).emit('room_updated', result.room);
  }
}

function handleLeaveRoom(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket,
  roomId: string,
  userId: string
): void {
  const result = leaveRoom(roomId, userId);
  if (!result.success) {
    socket.emit('error', result.error || '离开房间失败');
    return;
  }

  socket.leave(roomId);

  if (result.room) {
    io.to(roomId).emit('room_updated', result.room);
  }

  const game = gameStore.games.get(roomId);
  if (game) {
    gameStore.games.delete(roomId);
  }
}

function handleReady(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  userId: string,
  isReady: boolean
): void {
  const result = setPlayerReady(roomId, userId, isReady);
  if (!result.success) {
    io.to(roomId).emit('error', result.error || '设置准备状态失败');
    return;
  }

  if (result.room) {
    io.to(roomId).emit('room_updated', result.room);
    io.to(roomId).emit('player_ready', userId, isReady);
  }
}

function handleSetGameType(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  userId: string,
  gameType: GameType
): void {
  const result = setGameType(roomId, userId, gameType);
  if (!result.success) {
    io.to(roomId).emit('error', result.error || '更改游戏类型失败');
    return;
  }

  if (result.room) {
    io.to(roomId).emit('room_updated', result.room);
    io.to(roomId).emit('game_type_changed', gameType);
  }
}

function handleStartGame(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  userId: string
): void {
  const room = getRoom(roomId);
  if (!room) {
    io.to(roomId).emit('error', '房间不存在');
    return;
  }

  if (room.hostId !== userId) {
    io.to(roomId).emit('error', '只有房主可以开始游戏');
    return;
  }

  if (!canStartGame(roomId)) {
    io.to(roomId).emit('error', '还有玩家未准备好');
    return;
  }

  const playerIds = room.players.map(p => p.userId);

  try {
    const game = GameFactory.createGame(room.gameType, roomId, playerIds);
    game.start();
    gameStore.games.set(roomId, game);

    setRoomStatus(roomId, 'playing');

    const updatedRoom = getRoom(roomId);
    if (updatedRoom) {
      io.to(roomId).emit('room_updated', updatedRoom);
    }

    io.to(roomId).emit('game_started', game.getState());

    startGameLoop(io, roomId, game);
  } catch (error) {
    io.to(roomId).emit('error', '游戏启动失败');
  }
}

function startGameLoop(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  game: any
): void {
  const interval = setInterval(() => {
    const currentGame = gameStore.games.get(roomId);
    if (!currentGame || currentGame.isFinished()) {
      clearInterval(interval);

      if (currentGame) {
        const result = currentGame.getResult();
        if (result) {
          io.to(roomId).emit('game_over', result);
          setRoomStatus(roomId, 'finished');
        }
      }
      return;
    }

    io.to(roomId).emit('game_updated', currentGame.getState());
  }, 100);
}

function handleGameAction(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  userId: string,
  action: GameAction
): void {
  const game = gameStore.games.get(roomId);
  if (!game) {
    io.to(roomId).emit('error', '游戏未开始');
    return;
  }

  if (!game.isPlaying()) {
    return;
  }

  game.handleAction(userId, action);

  io.to(roomId).emit('game_updated', game.getState());

  if (game.checkGameOver()) {
    const result = game.getResult();
    if (result) {
      io.to(roomId).emit('game_over', result);
      setRoomStatus(roomId, 'finished');
    }
  }
}

function handleQuickMatch(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket,
  userId: string,
  gameType: GameType
): void {
  const result = addToQueue(userId, gameType);
  if (!result.success) {
    socket.emit('error', result.error || '匹配失败');
    return;
  }

  if (result.room) {
    const room = result.room as Room;

    room.players.forEach(player => {
      const sockets = io.sockets.sockets;
      for (const s of sockets.values()) {
        s.join(room.id);
      }
    });

    io.to(room.id).emit('match_found', room);
    io.to(room.id).emit('room_updated', room);
  }
}

function handleCancelMatch(userId: string): void {
  removeFromQueue(userId);
}

function handleDisconnect(socket: Socket): void {
  const rooms = Array.from(socket.rooms);
  rooms.forEach(roomId => {
    if (roomId !== socket.id) {
      const room = getRoomWithGame(roomId);
      if (room) {
        const player = room.players.find(p => {
          return true;
        });
        if (player) {
          leaveRoom(roomId, player.userId);
          const updatedRoom = getRoom(roomId);
          if (updatedRoom) {
            socket.to(roomId).emit('room_updated', updatedRoom);
          }
        }
      }
    }
  });
}

export function broadcastRoomUpdate(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string
): void {
  const room = getRoom(roomId);
  if (room) {
    io.to(roomId).emit('room_updated', room);
  }
}
