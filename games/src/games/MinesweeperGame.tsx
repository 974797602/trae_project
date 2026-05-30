import React from 'react';
import type { MinesweeperPlayerState } from '../../shared/types';

interface MinesweeperGameProps {
  playerState: MinesweeperPlayerState;
  onAction: (action: { type: string; payload: any }) => void;
  isPlayer: boolean;
}

const BOARD_SIZE = 8;

export const MinesweeperGame: React.FC<MinesweeperGameProps> = ({
  playerState,
  onAction,
  isPlayer
}) => {
  const getCellContent = (value: number, revealed: boolean, flagged: boolean) => {
    if (flagged && !revealed) return '🚩';
    if (!revealed) return '';
    if (value === -1) return '💣';
    if (value === 0) return '';
    return value;
  };

  const getCellColor = (value: number, revealed: boolean, flagged: boolean) => {
    if (flagged && !revealed) return 'bg-yellow-500/30';
    if (!revealed) return 'bg-slate-600 hover:bg-slate-500';
    if (value === -1) return 'bg-red-500/50';
    
    const colors: Record<number, string> = {
      1: 'text-blue-400',
      2: 'text-green-400',
      3: 'text-red-400',
      4: 'text-purple-400',
      5: 'text-yellow-400',
      6: 'text-cyan-400',
      7: 'text-white',
      8: 'text-gray-400'
    };
    
    return `bg-slate-700/50 ${colors[value] || 'text-white'}`;
  };

  const handleClick = (x: number, y: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!isPlayer || playerState?.gameOver || playerState?.won) return;
    onAction({ type: 'reveal', payload: { x, y } });
  };

  const handleRightClick = (x: number, y: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!isPlayer || playerState?.gameOver || playerState?.won) return;
    onAction({ type: 'flag', payload: { x, y } });
  };

  if (!playerState) {
    return (
      <div className="flex items-center justify-center h-80 glass-card rounded-xl">
        <p className="text-gray-400">等待游戏开始...</p>
      </div>
    );
  }

  const { board, revealed, flagged, minesLeft, gameOver, won, time, cellsRevealed } = playerState;

  return (
    <div className="flex flex-col items-center gap-4 p-4 glass-card rounded-xl">
      <div className="flex justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💣</span>
          <span className="font-display font-bold text-accent-cyan text-xl">{minesLeft}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏱️</span>
          <span className="font-display font-bold text-accent-orange text-xl">{time}s</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <span className="font-display font-bold text-green-400 text-xl">{cellsRevealed}</span>
        </div>
      </div>

      {(gameOver || won) && (
        <div className={`text-center py-2 px-4 rounded-lg font-display font-bold text-lg ${
          won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {won ? '🎉 恭喜获胜！' : '💥 游戏结束'}
        </div>
      )}

      <div 
        className="grid gap-1 p-3 bg-slate-800/50 rounded-lg"
        style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
      >
        {board?.map((row, y) =>
          row.map((cell, x) => {
            const isRevealed = revealed?.[y]?.[x];
            const isFlagged = flagged?.[y]?.[x];
            
            return (
              <button
                key={`${x}-${y}`}
                className={`
                  w-10 h-10 flex items-center justify-center
                  font-bold text-sm rounded-md
                  transition-all duration-150
                  ${getCellColor(cell, isRevealed, isFlagged)}
                  ${isPlayer && !gameOver && !won ? 'cursor-pointer' : 'cursor-default'}
                  ${!isRevealed && isPlayer && !gameOver && !won ? 'hover:scale-105 active:scale-95' : ''}
                `}
                onClick={(e) => handleClick(x, y, e)}
                onContextMenu={(e) => handleRightClick(x, y, e)}
                disabled={!isPlayer || gameOver || won}
              >
                {getCellContent(cell, isRevealed, isFlagged)}
              </button>
            );
          })
        )}
      </div>

      {isPlayer && !gameOver && !won && (
        <div className="text-sm text-gray-400 text-center">
          <p>左键点击揭开格子 | 右键点击标记旗帜</p>
        </div>
      )}
    </div>
  );
};
