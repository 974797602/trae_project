import React from 'react';
import type { GameType, GameState } from '../../shared/types';
import { MinesweeperGame } from './MinesweeperGame';
import { Climb100Game } from './Climb100Game';
import { NeedleGame } from './NeedleGame';

interface GameContainerProps {
  gameType: GameType;
  gameState: GameState;
  userId: string;
  onAction: (action: any) => void;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  gameType,
  gameState,
  userId,
  onAction
}) => {
  const playerState = gameState.players[userId];
  const opponentId = Object.keys(gameState.players).find(id => id !== userId);
  const opponentState = opponentId ? gameState.players[opponentId] : null;

  const renderGame = () => {
    switch (gameType) {
      case 'minesweeper':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-display font-bold text-lg text-accent-cyan mb-4 text-center">
                你的棋盘
              </h3>
              <MinesweeperGame
                playerState={playerState}
                onAction={onAction}
                isPlayer={true}
              />
            </div>
            {opponentState && (
              <div>
                <h3 className="font-display font-bold text-lg text-accent-orange mb-4 text-center">
                  对手的棋盘
                </h3>
                <MinesweeperGame
                  playerState={opponentState}
                  onAction={() => {}}
                  isPlayer={false}
                />
              </div>
            )}
          </div>
        );

      case 'climb100':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-display font-bold text-lg text-accent-cyan mb-4 text-center">
                你的游戏
              </h3>
              <Climb100Game
                playerState={playerState}
                onAction={onAction}
                isPlayer={true}
              />
            </div>
            {opponentState && (
              <div>
                <h3 className="font-display font-bold text-lg text-accent-orange mb-4 text-center">
                  对手的游戏
                </h3>
                <Climb100Game
                  playerState={opponentState}
                  onAction={() => {}}
                  isPlayer={false}
                />
              </div>
            )}
          </div>
        );

      case 'needle':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-display font-bold text-lg text-accent-cyan mb-4 text-center">
                你的游戏
              </h3>
              <NeedleGame
                playerState={playerState}
                onAction={onAction}
                isPlayer={true}
              />
            </div>
            {opponentState && (
              <div>
                <h3 className="font-display font-bold text-lg text-accent-orange mb-4 text-center">
                  对手的游戏
                </h3>
                <NeedleGame
                  playerState={opponentState}
                  onAction={() => {}}
                  isPlayer={false}
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-400">未知游戏类型</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderGame()}
    </div>
  );
};
