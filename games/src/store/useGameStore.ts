import { create } from 'zustand';
import type { User, Room, GameState, GameResult, GameType } from '../../shared/types';

interface GameStore {
  user: User | null;
  token: string | null;
  currentRoom: Room | null;
  gameState: GameState | null;
  gameResult: GameResult | null;
  rooms: Room[];
  onlineUsers: User[];
  isMatching: boolean;
  error: string | null;
  notification: string | null;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setCurrentRoom: (room: Room | null) => void;
  setGameState: (state: GameState | null) => void;
  setGameResult: (result: GameResult | null) => void;
  setRooms: (rooms: Room[]) => void;
  setOnlineUsers: (users: User[]) => void;
  setIsMatching: (matching: boolean) => void;
  setError: (error: string | null) => void;
  setNotification: (notification: string | null) => void;
  clearGameState: () => void;
  logout: () => void;

  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  fetchRooms: () => Promise<void>;
  createRoom: (name: string, gameType: GameType) => Promise<Room | null>;
  fetchRoom: (roomId: string) => Promise<Room | null>;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useGameStore = create<GameStore>((set, get) => ({
  user: null,
  token: null,
  currentRoom: null,
  gameState: null,
  gameResult: null,
  rooms: [],
  onlineUsers: [],
  isMatching: false,
  error: null,
  notification: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setGameState: (state) => set({ gameState: state }),
  setGameResult: (result) => set({ gameResult: result }),
  setRooms: (rooms) => set({ rooms }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  setIsMatching: (isMatching) => set({ isMatching }),
  setError: (error) => set({ error }),
  setNotification: (notification) => {
    set({ notification });
    if (notification) {
      setTimeout(() => set({ notification: null }), 3000);
    }
  },

  clearGameState: () => set({
    gameState: null,
    gameResult: null
  }),

  logout: () => {
    set({
      user: null,
      token: null,
      currentRoom: null,
      gameState: null,
      gameResult: null,
      isMatching: false
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  login: async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (data.success) {
        set({
          user: data.user,
          token: data.token,
          error: null
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      } else {
        set({ error: data.error });
        return false;
      }
    } catch (error) {
      set({ error: '登录失败，请稍后重试' });
      return false;
    }
  },

  register: async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (data.success) {
        set({
          user: data.user,
          token: data.token,
          error: null
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      } else {
        set({ error: data.error });
        return false;
      }
    } catch (error) {
      set({ error: '注册失败，请稍后重试' });
      return false;
    }
  },

  fetchRooms: async () => {
    try {
      const response = await fetch(`${API_BASE}/rooms`);
      const data = await response.json();
      if (data.success) {
        set({ rooms: data.rooms });
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  },

  createRoom: async (name: string, gameType: GameType) => {
    const { token } = get();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, gameType })
      });
      const data = await response.json();

      if (data.success) {
        set({ currentRoom: data.room });
        return data.room;
      } else {
        set({ error: data.error });
        return null;
      }
    } catch (error) {
      set({ error: '创建房间失败' });
      return null;
    }
  },

  fetchRoom: async (roomId: string) => {
    try {
      const response = await fetch(`${API_BASE}/rooms/${roomId}`);
      const data = await response.json();
      if (data.success) {
        set({ currentRoom: data.room });
        return data.room;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch room:', error);
      return null;
    }
  }
}));

export function initializeFromStorage() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      useGameStore.getState().setToken(token);
      useGameStore.getState().setUser(user);
    } catch (e) {
      console.error('Failed to parse stored user:', e);
    }
  }
}
