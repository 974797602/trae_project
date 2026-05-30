import { v4 as uuidv4 } from 'uuid';
import { roomStore } from '../../types.js';
import { getUserById } from '../auth/index.js';
import type { Room, Player, GameType, RoomStatus } from '../../../shared/types.js';

export function createRoom(name: string, hostId: string, gameType: GameType = 'minesweeper'): { success: boolean; room?: Room; error?: string } {
  const host = getUserById(hostId);
  if (!host) {
    return { success: false, error: '用户不存在' };
  }

  const roomId = uuidv4();
  const player: Player = {
    userId: hostId,
    username: host.username,
    avatar: host.avatar,
    isReady: false,
    score: 0,
    isHost: true
  };

  const room: Room = {
    id: roomId,
    name: name || `${host.username}的房间`,
    hostId,
    gameType,
    status: 'waiting',
    players: [player],
    maxPlayers: 2,
    createdAt: Date.now()
  };

  roomStore.rooms.set(roomId, room);
  return { success: true, room };
}

export function getRoom(roomId: string): Room | undefined {
  return roomStore.rooms.get(roomId);
}

export function getAllRooms(): Room[] {
  const rooms: Room[] = [];
  for (const room of roomStore.rooms.values()) {
    if (room.status === 'waiting') {
      rooms.push(room);
    }
  }
  return rooms.sort((a, b) => b.createdAt - a.createdAt);
}

export function joinRoom(roomId: string, userId: string): { success: boolean; room?: Room; error?: string } {
  const room = roomStore.rooms.get(roomId);
  if (!room) {
    return { success: false, error: '房间不存在' };
  }

  if (room.status !== 'waiting') {
    return { success: false, error: '房间已开始游戏' };
  }

  if (room.players.length >= room.maxPlayers) {
    return { success: false, error: '房间已满' };
  }

  if (room.players.find(p => p.userId === userId)) {
    return { success: true, room };
  }

  const user = getUserById(userId);
  if (!user) {
    return { success: false, error: '用户不存在' };
  }

  const player: Player = {
    userId,
    username: user.username,
    avatar: user.avatar,
    isReady: false,
    score: 0,
    isHost: false
  };

  room.players.push(player);
  return { success: true, room };
}

export function leaveRoom(roomId: string, userId: string): { success: boolean; room?: Room | null; error?: string } {
  const room = roomStore.rooms.get(roomId);
  if (!room) {
    return { success: false, error: '房间不存在' };
  }

  const playerIndex = room.players.findIndex(p => p.userId === userId);
  if (playerIndex === -1) {
    return { success: false, error: '玩家不在房间内' };
  }

  room.players.splice(playerIndex, 1);

  if (room.players.length === 0) {
    roomStore.rooms.delete(roomId);
    return { success: true, room: null };
  }

  if (userId === room.hostId) {
    room.hostId = room.players[0].userId;
    room.players[0].isHost = true;
    room.players[0].isReady = false;
  }

  return { success: true, room };
}

export function setPlayerReady(roomId: string, userId: string, isReady: boolean): { success: boolean; room?: Room; error?: string } {
  const room = roomStore.rooms.get(roomId);
  if (!room) {
    return { success: false, error: '房间不存在' };
  }

  const player = room.players.find(p => p.userId === userId);
  if (!player) {
    return { success: false, error: '玩家不在房间内' };
  }

  player.isReady = isReady;
  return { success: true, room };
}

export function setGameType(roomId: string, userId: string, gameType: GameType): { success: boolean; room?: Room; error?: string } {
  const room = roomStore.rooms.get(roomId);
  if (!room) {
    return { success: false, error: '房间不存在' };
  }

  if (room.hostId !== userId) {
    return { success: false, error: '只有房主可以更改游戏类型' };
  }

  if (room.status !== 'waiting') {
    return { success: false, error: '游戏已开始，无法更改类型' };
  }

  room.gameType = gameType;
  room.players.forEach(p => p.isReady = false);

  return { success: true, room };
}

export function canStartGame(roomId: string): boolean {
  const room = roomStore.rooms.get(roomId);
  if (!room) return false;
  if (room.players.length < 2) return false;
  return room.players.every(p => p.isReady);
}

export function setRoomStatus(roomId: string, status: RoomStatus): void {
  const room = roomStore.rooms.get(roomId);
  if (room) {
    room.status = status;
  }
}

export function getRoomWithGame(roomId: string) {
  return roomStore.rooms.get(roomId);
}

export function cleanupEmptyRooms() {
  for (const [roomId, room] of roomStore.rooms.entries()) {
    if (room.players.length === 0) {
      roomStore.rooms.delete(roomId);
    }
  }
}
