import type { User, Player, Room, GameState, GameType } from '../shared/types.js';

export interface UserWithPassword extends User {
  password: string;
}

export interface RoomWithGame extends Room {
  gameInstance?: any;
}

export interface AuthStore {
  users: Map<string, UserWithPassword>;
  usernameToId: Map<string, string>;
  tokens: Map<string, string>;
}

export interface RoomStore {
  rooms: Map<string, RoomWithGame>;
}

export interface MatchingStore {
  queues: Map<GameType, string[]>;
}

export interface GameStore {
  games: Map<string, any>;
}

export const authStore: AuthStore = {
  users: new Map(),
  usernameToId: new Map(),
  tokens: new Map()
};

export const roomStore: RoomStore = {
  rooms: new Map()
};

export const matchingStore: MatchingStore = {
  queues: new Map()
};

export const gameStore: GameStore = {
  games: new Map()
};
