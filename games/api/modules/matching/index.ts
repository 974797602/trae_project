import { matchingStore } from '../../types.js';
import { createRoom, joinRoom } from '../room/index.js';
import type { GameType, Room } from '../../../shared/types.js';

export function addToQueue(userId: string, gameType: GameType): { success: boolean; room?: Room; error?: string } {
  if (!matchingStore.queues.has(gameType)) {
    matchingStore.queues.set(gameType, []);
  }

  const queue = matchingStore.queues.get(gameType)!;

  if (queue.includes(userId)) {
    return { success: false, error: '已经在匹配队列中' };
  }

  queue.push(userId);

  if (queue.length >= 2) {
    const player1Id = queue.shift()!;
    const player2Id = queue.shift()!;

    const roomName = `匹配对战-${Date.now()}`;
    const createResult = createRoom(roomName, player1Id, gameType);

    if (!createResult.success || !createResult.room) {
      queue.unshift(player1Id, player2Id);
      return { success: false, error: createResult.error || '创建房间失败' };
    }

    const joinResult = joinRoom(createResult.room.id, player2Id);
    if (!joinResult.success || !joinResult.room) {
      queue.unshift(player1Id, player2Id);
      return { success: false, error: joinResult.error || '加入房间失败' };
    }

    return { success: true, room: joinResult.room };
  }

  return { success: true };
}

export function removeFromQueue(userId: string, gameType?: GameType): { success: boolean } {
  if (gameType) {
    const queue = matchingStore.queues.get(gameType);
    if (queue) {
      const index = queue.indexOf(userId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }
  } else {
    for (const queue of matchingStore.queues.values()) {
      const index = queue.indexOf(userId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }
  }

  return { success: true };
}

export function getQueueLength(gameType: GameType): number {
  const queue = matchingStore.queues.get(gameType);
  return queue ? queue.length : 0;
}

export function isInQueue(userId: string, gameType?: GameType): boolean {
  if (gameType) {
    const queue = matchingStore.queues.get(gameType);
    return queue ? queue.includes(userId) : false;
  }

  for (const queue of matchingStore.queues.values()) {
    if (queue.includes(userId)) {
      return true;
    }
  }
  return false;
}

export function getAllQueueLengths(): { [key in GameType]?: number } {
  const result: { [key in GameType]?: number } = {};
  for (const [gameType, queue] of matchingStore.queues.entries()) {
    result[gameType] = queue.length;
  }
  return result;
}
