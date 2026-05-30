import { GameBase } from './GameBase.js';
import type { GameState, GameAction } from '../../../shared/types.js';

const TARGET_NEEDLES = 20;
const GAME_DURATION = 60;
const CIRCLE_RADIUS = 80;
const NEEDLE_LENGTH = 60;
const ROTATION_SPEED = 0.03;

interface NeedlePlayerState {
  needles: number[];
  targetAngles: number[];
  rotation: number;
  score: number;
  gameOver: boolean;
  won: boolean;
  time: number;
  startTime: number;
  canShoot: boolean;
  collision: boolean;
  speed: number;
}

export class Needle extends GameBase {
  private centerX = 150;
  private centerY = 200;

  constructor(roomId: string, players: string[]) {
    super(roomId, players, 'needle');
  }

  protected createInitialPlayerState(): NeedlePlayerState {
    return {
      needles: [],
      targetAngles: [],
      rotation: 0,
      score: 0,
      gameOver: false,
      won: false,
      time: 0,
      startTime: 0,
      canShoot: true,
      collision: false,
      speed: ROTATION_SPEED
    };
  }

  init(): void {
    this.initPlayerStates();
    for (const playerId of this.players) {
      const state = this.gameState.players[playerId] as NeedlePlayerState;
      state.needles = this.generateInitialNeedles();
      state.targetAngles = [];
      state.rotation = Math.random() * Math.PI * 2;
      state.score = 0;
      state.gameOver = false;
      state.won = false;
      state.time = 0;
      state.startTime = Date.now();
      state.canShoot = true;
      state.collision = false;
      state.speed = ROTATION_SPEED * (Math.random() > 0.5 ? 1 : -1);
    }
  }

  private generateInitialNeedles(): number[] {
    const needles: number[] = [];
    const count = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
      needles.push(angle);
    }

    return needles;
  }

  handleAction(userId: string, action: GameAction): void {
    const state = this.gameState.players[userId] as NeedlePlayerState;
    if (!state || state.gameOver || state.won) return;

    state.time = Math.floor((Date.now() - state.startTime) / 1000);

    this.updateRotation(state);

    if (action.type === 'shoot') {
      this.shootNeedle(state);
    }

    this.checkCollisions(state);
    this.checkWinCondition(state);
    this.update();
  }

  private updateRotation(state: NeedlePlayerState): void {
    state.rotation += state.speed;
    if (state.rotation > Math.PI * 2) {
      state.rotation -= Math.PI * 2;
    } else if (state.rotation < 0) {
      state.rotation += Math.PI * 2;
    }

    if (state.score > 0 && state.score % 5 === 0) {
      state.speed = ROTATION_SPEED * (1 + state.score * 0.1) * (state.speed > 0 ? 1 : -1);
    }
  }

  private shootNeedle(state: NeedlePlayerState): void {
    if (!state.canShoot || state.gameOver || state.won) return;

    const targetAngle = state.rotation;
    state.targetAngles.push(targetAngle);

    const collision = this.checkNeedleCollision(state, targetAngle);

    if (collision) {
      state.collision = true;
      state.gameOver = true;
    } else {
      state.needles.push(targetAngle);
      state.score++;

      if (state.score >= TARGET_NEEDLES) {
        state.won = true;
      }
    }

    state.canShoot = false;
    setTimeout(() => {
      state.canShoot = true;
    }, 300);
  }

  private checkNeedleCollision(state: NeedlePlayerState, newAngle: number): boolean {
    const minDistance = 0.25;

    for (const angle of state.needles) {
      let distance = Math.abs(angle - newAngle);
      if (distance > Math.PI) {
        distance = Math.PI * 2 - distance;
      }

      if (distance < minDistance) {
        return true;
      }
    }

    return false;
  }

  private checkCollisions(state: NeedlePlayerState): void {
    for (let i = 0; i < state.targetAngles.length; i++) {
      const targetAngle = state.targetAngles[i];
      for (const existingAngle of state.needles) {
        let distance = Math.abs(existingAngle - targetAngle);
        if (distance > Math.PI) {
          distance = Math.PI * 2 - distance;
        }

        if (distance < 0.2 && !state.needles.includes(targetAngle)) {
          state.collision = true;
          state.gameOver = true;
          return;
        }
      }
    }

    state.targetAngles = state.targetAngles.filter(angle => state.needles.includes(angle));
  }

  private checkWinCondition(state: NeedlePlayerState): void {
    if (state.score >= TARGET_NEEDLES) {
      state.won = true;
    }
  }

  protected updateGameLogic(): void {
    const elapsed = this.getElapsedTime();
    if (elapsed >= GAME_DURATION) {
      for (const playerId of this.players) {
        const state = this.gameState.players[playerId] as NeedlePlayerState;
        if (!state.gameOver && !state.won) {
          state.gameOver = true;
        }
      }
    }
  }

  checkGameOver(): boolean {
    for (const playerId of this.players) {
      const state = this.gameState.players[playerId] as NeedlePlayerState;
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
    let bestScore = -1;
    let bestTime = Infinity;

    for (const playerId of this.players) {
      const state = this.gameState.players[playerId] as NeedlePlayerState;

      if (state.won) {
        if (state.time < bestTime) {
          bestTime = state.time;
          winner = playerId;
        }
      } else if (state.score > bestScore) {
        bestScore = state.score;
        winner = playerId;
      }
    }

    return winner;
  }

  getScores(): { [userId: string]: number } {
    const scores: { [userId: string]: number } = {};
    for (const playerId of this.players) {
      const state = this.gameState.players[playerId] as NeedlePlayerState;
      scores[playerId] = state.score * 100 - state.time * 2;
    }
    return scores;
  }

  getState(): GameState {
    return { ...this.gameState };
  }

  getPlayerState(userId: string): NeedlePlayerState | null {
    return this.gameState.players[userId] || null;
  }

  getCircleRadius(): number {
    return CIRCLE_RADIUS;
  }

  getNeedleLength(): number {
    return NEEDLE_LENGTH;
  }

  getCenter(): { x: number; y: number } {
    return { x: this.centerX, y: this.centerY };
  }
}
