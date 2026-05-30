import { GameBase } from './GameBase.js';
import type { GameState, GameAction } from '../../../shared/types.js';

const BOARD_SIZE = 8;
const MINE_COUNT = 10;
const WIN_TIMEOUT = 180;

interface MinesweeperPlayerState {
  board: number[][];
  revealed: boolean[][];
  flagged: boolean[][];
  minesLeft: number;
  gameOver: boolean;
  won: boolean;
  time: number;
  cellsRevealed: number;
  startTime: number;
}

export class Minesweeper extends GameBase {
  constructor(roomId: string, players: string[]) {
    super(roomId, players, 'minesweeper');
  }

  protected createInitialPlayerState(): MinesweeperPlayerState {
    return {
      board: [],
      revealed: [],
      flagged: [],
      minesLeft: MINE_COUNT,
      gameOver: false,
      won: false,
      time: 0,
      cellsRevealed: 0,
      startTime: 0
    };
  }

  init(): void {
    this.initPlayerStates();
    for (const playerId of this.players) {
      const state = this.gameState.players[playerId] as MinesweeperPlayerState;
      state.board = this.generateBoard();
      state.revealed = this.create2DArray(false);
      state.flagged = this.create2DArray(false);
      state.minesLeft = MINE_COUNT;
      state.gameOver = false;
      state.won = false;
      state.time = 0;
      state.cellsRevealed = 0;
      state.startTime = Date.now();
    }
  }

  private generateBoard(): number[][] {
    const board = this.create2DArray(0);

    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
      const x = Math.floor(Math.random() * BOARD_SIZE);
      const y = Math.floor(Math.random() * BOARD_SIZE);
      if (board[y][x] !== -1) {
        board[y][x] = -1;
        minesPlaced++;
      }
    }

    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (board[y][x] === -1) continue;
        board[y][x] = this.countAdjacentMines(board, x, y);
      }
    }

    return board;
  }

  private create2DArray<T>(value: T): T[][] {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(value));
  }

  private countAdjacentMines(board: number[][], x: number, y: number): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
          if (board[ny][nx] === -1) count++;
        }
      }
    }
    return count;
  }

  handleAction(userId: string, action: GameAction): void {
    const state = this.gameState.players[userId] as MinesweeperPlayerState;
    if (!state || state.gameOver || state.won) return;

    state.time = Math.floor((Date.now() - state.startTime) / 1000);

    if (action.type === 'reveal') {
      const { x, y } = action.payload;
      this.revealCell(state, x, y);
    } else if (action.type === 'flag') {
      const { x, y } = action.payload;
      this.toggleFlag(state, x, y);
    }

    this.checkWinCondition(state);
    this.update();
  }

  private revealCell(state: MinesweeperPlayerState, x: number, y: number): void {
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return;
    if (state.revealed[y][x] || state.flagged[y][x]) return;

    state.revealed[y][x] = true;
    state.cellsRevealed++;

    if (state.board[y][x] === -1) {
      state.gameOver = true;
      this.revealAllMines(state);
      return;
    }

    if (state.board[y][x] === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          this.revealCell(state, x + dx, y + dy);
        }
      }
    }
  }

  private toggleFlag(state: MinesweeperPlayerState, x: number, y: number): void {
    if (state.revealed[y][x]) return;

    state.flagged[y][x] = !state.flagged[y][x];
    state.minesLeft += state.flagged[y][x] ? -1 : 1;
  }

  private revealAllMines(state: MinesweeperPlayerState): void {
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (state.board[y][x] === -1) {
          state.revealed[y][x] = true;
        }
      }
    }
  }

  private checkWinCondition(state: MinesweeperPlayerState): void {
    const totalSafeCells = BOARD_SIZE * BOARD_SIZE - MINE_COUNT;
    if (state.cellsRevealed >= totalSafeCells && !state.gameOver) {
      state.won = true;
    }
  }

  checkGameOver(): boolean {
    for (const playerId of this.players) {
      const state = this.gameState.players[playerId] as MinesweeperPlayerState;
      if (state.won || state.gameOver) {
        return true;
      }
    }

    const elapsed = this.getElapsedTime();
    if (elapsed >= WIN_TIMEOUT) {
      return true;
    }

    return false;
  }

  getWinner(): string | null {
    let winner: string | null = null;
    let bestScore = -1;

    for (const playerId of this.players) {
      const state = this.gameState.players[playerId] as MinesweeperPlayerState;
      const score = this.calculateScore(state);

      if (score > bestScore) {
        bestScore = score;
        winner = playerId;
      }
    }

    return winner;
  }

  private calculateScore(state: MinesweeperPlayerState): number {
    if (state.won) {
      return 1000 + (180 - state.time) * 10;
    }
    return state.cellsRevealed * 10 - state.time;
  }

  getScores(): { [userId: string]: number } {
    const scores: { [userId: string]: number } = {};
    for (const playerId of this.players) {
      const state = this.gameState.players[playerId] as MinesweeperPlayerState;
      scores[playerId] = this.calculateScore(state);
    }
    return scores;
  }

  getState(): GameState {
    return { ...this.gameState };
  }

  getPlayerState(userId: string): MinesweeperPlayerState | null {
    return this.gameState.players[userId] || null;
  }
}
