import { v4 as uuidv4 } from 'uuid';
import { authStore } from '../../types.js';
import type { User, UserWithPassword } from '../../types.js';

const AVATARS = ['🎮', '👾', '🕹️', '🎲', '🎯', '🚀', '⭐', '🔥', '💎', '🎪', '🎨', '🎭', '🎪', '🦊', '🐱', '🐶'];

function generateToken(): string {
  return uuidv4();
}

function getRandomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export function register(username: string, password: string): { success: boolean; user?: User; token?: string; error?: string } {
  if (!username || !password) {
    return { success: false, error: '用户名和密码不能为空' };
  }

  if (username.length < 2 || username.length > 20) {
    return { success: false, error: '用户名长度必须在2-20个字符之间' };
  }

  if (password.length < 4) {
    return { success: false, error: '密码长度至少4个字符' };
  }

  if (authStore.usernameToId.has(username)) {
    return { success: false, error: '用户名已存在' };
  }

  const userId = uuidv4();
  const user: UserWithPassword = {
    id: userId,
    username,
    password,
    avatar: getRandomAvatar(),
    isOnline: true
  };

  authStore.users.set(userId, user);
  authStore.usernameToId.set(username, userId);

  const token = generateToken();
  authStore.tokens.set(token, userId);

  const { password: _, ...safeUser } = user;
  return { success: true, user: safeUser, token };
}

export function login(username: string, password: string): { success: boolean; user?: User; token?: string; error?: string } {
  const userId = authStore.usernameToId.get(username);
  if (!userId) {
    return { success: false, error: '用户不存在' };
  }

  const user = authStore.users.get(userId);
  if (!user || user.password !== password) {
    return { success: false, error: '密码错误' };
  }

  user.isOnline = true;

  const token = generateToken();
  authStore.tokens.set(token, userId);

  const { password: _, ...safeUser } = user;
  return { success: true, user: safeUser, token };
}

export function logout(token: string): { success: boolean } {
  const userId = authStore.tokens.get(token);
  if (userId) {
    const user = authStore.users.get(userId);
    if (user) {
      user.isOnline = false;
    }
    authStore.tokens.delete(token);
  }
  return { success: true };
}

export function getUserByToken(token: string): User | null {
  const userId = authStore.tokens.get(token);
  if (!userId) return null;

  const user = authStore.users.get(userId);
  if (!user) return null;

  const { password: _, ...safeUser } = user;
  return safeUser;
}

export function getUserById(userId: string): User | null {
  const user = authStore.users.get(userId);
  if (!user) return null;

  const { password: _, ...safeUser } = user;
  return safeUser;
}

export function getOnlineUsers(): User[] {
  const users: User[] = [];
  for (const user of authStore.users.values()) {
    if (user.isOnline) {
      const { password: _, ...safeUser } = user;
      users.push(safeUser);
    }
  }
  return users;
}
