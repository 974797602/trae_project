import type { GameState, GameAction, GameResult, GameType } from '../../../shared/types.js';

export abstract class GameBase {
  protected roomId: string;
  protected players: string[];
  protected gameType: GameType;
  protected gameState: GameState;
  protected startTime: number;

  constructor(roomId: string, players: string[], gameType: GameType) {
    this.roomId = roomId;
    this.players = players;
    this.gameType = gameType;
    this.startTime = Date.now();
    this.gameState = {
      roomId,
      gameType,
      status: 'waiting',
      players: {},
      winner: null
    };
  }

  abstract init(): void;
  abstract handleAction(userId: string, action: GameAction): void;
  abstract getState(): GameState;
  abstract checkGameOver(): boolean;
  abstract getWinner(): string | null;
  abstract getScores(): { [userId: string]: number };
  abstract getPlayerState(userId: string): any;

  protected initPlayerStates(): void {
    for (const playerId of this.players) {
      this.gameState.players[playerId] = this.createInitialPlayerState();
    }
  }

  protected abstract createInitialPlayerState(): any;

  start(): void {
    this.gameState.status = 'playing';
    this.startTime = Date.now();
    this.init();
  }

  getResult(): GameResult | null {
    if (!this.checkGameOver()) return null;

    const winnerId = this.getWinner();
    if (!winnerId) return null;

    const winnerState = this.gameState.players[winnerId];
    const winnerUsername = winnerState?.username || '未知玩家';

    return {
      roomId: this.roomId,
      winnerId,
      winnerUsername,
      scores: this.getScores()
    };
  }

  update(): void {
    if (this.gameState.status !== 'playing') return;

    this.updateGameLogic();

    if (this.checkGameOver()) {
      this.gameState.status = 'finished';
      this.gameState.winner = this.getWinner();
    }
  }

  protected updateGameLogic(): void {
  }

  getElapsedTime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  isPlaying(): boolean {
    return this.gameState.status === 'playing';
  }

  isFinished(): boolean {
    return this.gameState.status === 'finished';
  }
}
