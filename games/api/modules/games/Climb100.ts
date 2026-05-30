import { GameBase } from './GameBase.js';
import type { GameState, GameAction } from '../../../shared/types.js';

const TARGET_FLOOR = 50;
const GAME_DURATION = 60;
const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const MOVE_SPEED = 3;
const PLATFORM_COUNT = 10;

interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  type: 'normal' | 'moving' | 'breakable';
  direction?: number;
  broken?: boolean;
}

interface Climb100PlayerState {
  currentFloor: number;
  maxFloor: number;
  lives: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  isJumping: boolean;
  isOnGround: boolean;
  gameOver: boolean;
  won: boolean;
  time: number;
  startTime: number;
  platforms: Platform[];
  screenOffset: number;
  facingRight: boolean;
}

export class Climb100 extends GameBase {
  private gameWidth = 300;
  private gameHeight = 500;
  private platformHeight = 15;
  private playerWidth = 30;
  private playerHeight = 40;

  constructor(roomId: string, players: string[]) {
    super(roomId, players, 'climb100');
  }

  protected createInitialPlayerState(): Climb100PlayerState {
    return {
      currentFloor: 0,
      maxFloor: 0,
      lives: 3,
      position: { x: 135, y: 400 },
      velocity: { x: 0, y: 0 },
      isJumping: false,
      isOnGround: false,
      gameOver: false,
      won: false,
      time: 0,
      startTime: 0,
      platforms: [],
      screenOffset: 0,
      facingRight: true
    };
  }

  init(): void {
    this.initPlayerStates();
    for (const playerId of this.players) {
      const state = this.gameState.players[playerId] as Climb100PlayerState;
      state.platforms = this.generatePlatforms();
      state.position = { x: 135, y: 400 };
      state.velocity = { x: 0, y: 0 };
      state.currentFloor = 0;
      state.maxFloor = 0;
      state.lives = 3;
      state.gameOver = false;
      state.won = false;
      state.time = 0;
      state.screenOffset = 0;
      state.startTime = Date.now();
      state.isOnGround = false;
      state.isJumping = false;
    }
  }

  private generatePlatforms(): Platform[] {
    const platforms: Platform[] = [];

    platforms.push({
      id: 0,
      x: 100,
      y: 450,
      width: 100,
      type: 'normal'
    });

    for (let i = 1; i < PLATFORM_COUNT * 10; i++) {
      const y = 450 - i * 50;
      const platform: Platform = {
        id: i,
        x: Math.random() * (this.gameWidth - 60),
        y,
        width: 50 + Math.random() * 30,
        type: 'normal'
      };

      const rand = Math.random();
      if (rand < 0.15) {
        platform.type = 'moving';
        platform.direction = Math.random() > 0.5 ? 1 : -1;
      } else if (rand < 0.25) {
        platform.type = 'breakable';
      }

      platforms.push(platform);
    }

    return platforms;
  }

  handleAction(userId: string, action: GameAction): void {
    const state = this.gameState.players[userId] as Climb100PlayerState;
    if (!state || state.gameOver || state.won) return;

    state.time = Math.floor((Date.now() - state.startTime) / 1000);

    if (action.type === 'move') {
      const { direction } = action.payload;
      state.velocity.x = direction * MOVE_SPEED;
      state.facingRight = direction > 0;
    } else if (action.type === 'jump') {
      if (state.isOnGround) {
        state.velocity.y = JUMP_FORCE;
        state.isJumping = true;
        state.isOnGround = false;
      }
    } else if (action.type === 'stopMove') {
      state.velocity.x = 0;
    }

    this.updatePhysics(state);
    this.checkCollisions(state);
    this.updateCamera(state);
    this.checkWinCondition(state);
    this.update();
  }

  private updatePhysics(state: Climb100PlayerState): void {
    state.velocity.y += GRAVITY;

    state.position.x += state.velocity.x;
    state.position.y += state.velocity.y;

    if (state.position.x < 0) state.position.x = 0;
    if (state.position.x > this.gameWidth - this.playerWidth) {
      state.position.x = this.gameWidth - this.playerWidth;
    }

    state.platforms.forEach(platform => {
      if (platform.type === 'moving' && platform.direction) {
        platform.x += platform.direction * 1.5;
        if (platform.x <= 0 || platform.x >= this.gameWidth - platform.width) {
          platform.direction *= -1;
        }
      }
    });

    state.isJumping = state.velocity.y < 0;
  }

  private checkCollisions(state: Climb100PlayerState): void {
    state.isOnGround = false;

    const playerBottom = state.position.y + this.playerHeight;
    const playerLeft = state.position.x;
    const playerRight = state.position.x + this.playerWidth;

    for (const platform of state.platforms) {
      if (platform.broken) continue;

      const platformTop = platform.y - state.screenOffset;
      const platformBottom = platformTop + this.platformHeight;
      const platformLeft = platform.x;
      const platformRight = platform.x + platform.width;

      if (
        state.velocity.y > 0 &&
        playerBottom >= platformTop &&
        playerBottom <= platformBottom + 10 &&
        playerRight > platformLeft &&
        playerLeft < platformRight
      ) {
        state.position.y = platformTop - this.playerHeight;
        state.velocity.y = 0;
        state.isOnGround = true;
        state.isJumping = false;

        if (platform.type === 'breakable') {
          platform.broken = true;
        }

        const floor = Math.floor((450 - platform.y) / 50) + 1;
        if (floor > state.maxFloor) {
          state.maxFloor = floor;
          state.currentFloor = floor;
        }
      }
    }

    const screenBottom = state.position.y + this.playerHeight - state.screenOffset;
    if (screenBottom > this.gameHeight + 50) {
      state.lives--;
      if (state.lives <= 0) {
        state.gameOver = true;
      } else {
        this.respawnPlayer(state);
      }
    }
  }

  private respawnPlayer(state: Climb100PlayerState): void {
    const safePlatform = state.platforms.find(p => !p.broken && p.y > state.position.y - 200);
    if (safePlatform) {
      state.position.x = safePlatform.x + safePlatform.width / 2 - this.playerWidth / 2;
      state.position.y = safePlatform.y - this.playerHeight - state.screenOffset;
    } else {
      state.position.x = 135;
      state.position.y = 400 - state.screenOffset;
    }
    state.velocity = { x: 0, y: 0 };
  }

  private updateCamera(state: Climb100PlayerState): void {
    const targetOffset = Math.max(0, state.position.y - this.gameHeight / 2);
    if (targetOffset > state.screenOffset) {
      state.screenOffset = targetOffset;
    }
  }

  private checkWinCondition(state: Climb100PlayerState): void {
    if (state.maxFloor >= TARGET_FLOOR) {
      state.won = true;
    }
  }

  protected updateGameLogic(): void {
    const elapsed = this.getElapsedTime();
    if (elapsed >= GAME_DURATION) {
      for (const playerId of this.players) {
        const state = this.gameState.players[playerId] as Climb100PlayerState;
        if (!state.gameOver && !state.won) {
          state.gameOver = true;
        }
      }
    }
  }

  checkGameOver(): boolean {
    for (const playerId of this.players) {
      const state = this.gameState.players[playerId] as Climb100PlayerState;
      if (state.won || state.gameOver) {
        return true;
      }
    }

    const elapsed = this.getElapsedTime();
    if (elapsed >= GAME_DURATION) {
      return true;
    }

    return false;
  }

  getWinner(): string | null {
    let winner: string | null = null;
    let bestFloor = -1;
    let bestTime = Infinity;

    for (const playerId of this.players) {
      const state = this.gameState.players[playerId] as Climb100PlayerState;

      if (state.won) {
        if (state.time < bestTime) {
          bestTime = state.time;
          winner = playerId;
        }
      } else if (state.maxFloor > bestFloor) {
        bestFloor = state.maxFloor;
        winner = playerId;
      }
    }

    return winner;
  }

  getScores(): { [userId: string]: number } {
    const scores: { [userId: string]: number } = {};
    for (const playerId of this.players) {
      const state = this.gameState.players[playerId] as Climb100PlayerState;
      scores[playerId] = state.maxFloor * 100 - state.time * 2;
    }
    return scores;
  }

  getState(): GameState {
    return { ...this.gameState };
  }

  getPlayerState(userId: string): Climb100PlayerState | null {
    return this.gameState.players[userId] || null;
  }
}
