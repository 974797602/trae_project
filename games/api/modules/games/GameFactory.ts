import { GameBase } from './GameBase.js';
import { Minesweeper } from './Minesweeper.js';
import { Climb100 } from './Climb100.js';
import { Needle } from './Needle.js';
import type { GameType } from '../../../shared/types.js';

type GameClass = new (roomId: string, players: string[]) => GameBase;

export class GameFactory {
  private static gameTypes: Map<string, GameClass> = new Map([
    ['minesweeper', Minesweeper],
    ['climb100', Climb100],
    ['needle', Needle]
  ]);

  static createGame(type: GameType, roomId: string, players: string[]): GameBase {
    const GameClass = this.gameTypes.get(type);
    if (!GameClass) {
      throw new Error(`未知的游戏类型: ${type}`);
    }
    return new GameClass(roomId, players);
  }

  static registerGame(type: string, gameClass: GameClass): void {
    this.gameTypes.set(type, gameClass);
  }

  static isGameTypeSupported(type: string): boolean {
    return this.gameTypes.has(type);
  }

  static getSupportedGameTypes(): string[] {
    return Array.from(this.gameTypes.keys());
  }
}
