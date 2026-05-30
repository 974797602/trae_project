export type GameType = 'minesweeper' | 'climb100' | 'needle';

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';

export interface User {
  id: string;
  username: string;
  avatar: string;
  isOnline: boolean;
}

export interface Player {
  userId: string;
  username: string;
  avatar: string;
  isReady: boolean;
  score: number;
  isHost: boolean;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  gameType: GameType;
  status: RoomStatus;
  players: Player[];
  maxPlayers: number;
  createdAt: number;
}

export interface GameState {
  roomId: string;
  gameType: GameType;
  status: GameStatus;
  players: { [userId: string]: any };
  winner: string | null;
}

export interface GameAction {
  type: string;
  payload: any;
}

export interface GameResult {
  roomId: string;
  winnerId: string;
  winnerUsername: string;
  scores: { [userId: string]: number };
}

export interface MinesweeperPlayerState {
  board: number[][];
  revealed: boolean[][];
  flagged: boolean[][];
  minesLeft: number;
  gameOver: boolean;
  won: boolean;
  time: number;
  cellsRevealed: number;
}

export interface Climb100PlayerState {
  currentFloor: number;
  lives: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  isJumping: boolean;
  gameOver: boolean;
  time: number;
}

export interface NeedlePlayerState {
  needles: number[];
  targetCircle: number[];
  score: number;
  gameOver: boolean;
  time: number;
}

export const GAME_INFO: Record<GameType, { name: string; icon: string; description: string }> = {
  minesweeper: {
    name: '扫雷',
    icon: '💣',
    description: '快速找出所有安全格子，避开地雷！'
  },
  climb100: {
    name: '是男人就上一百层',
    icon: '🏔️',
    description: '不断向上跳跃，看谁能到达更高的楼层！'
  },
  needle: {
    name: '见缝插针',
    icon: '📍',
    description: '精准时机插针，不要碰到其他针！'
  }
};

export interface ClientToServerEvents {
  join_room: (roomId: string, userId: string) => void;
  leave_room: (roomId: string, userId: string) => void;
  ready: (roomId: string, userId: string, isReady: boolean) => void;
  start_game: (roomId: string, userId: string) => void;
  game_action: (roomId: string, userId: string, action: GameAction) => void;
  quick_match: (userId: string, gameType: GameType) => void;
  cancel_match: (userId: string) => void;
  set_game_type: (roomId: string, userId: string, gameType: GameType) => void;
}

export interface ServerToClientEvents {
  room_updated: (room: Room) => void;
  player_joined: (player: Player) => void;
  player_left: (userId: string) => void;
  player_ready: (userId: string, isReady: boolean) => void;
  game_started: (gameState: GameState) => void;
  game_updated: (gameState: GameState) => void;
  game_over: (result: GameResult) => void;
  match_found: (room: Room) => void;
  error: (message: string) => void;
  game_type_changed: (gameType: GameType) => void;
}
