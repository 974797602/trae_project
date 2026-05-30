import React, { useEffect, useRef, useCallback } from 'react';
import type { Climb100PlayerState } from '../../shared/types';

interface Climb100GameProps {
  playerState: Climb100PlayerState;
  onAction: (action: { type: string; payload: any }) => void;
  isPlayer: boolean;
}

const GAME_WIDTH = 300;
const GAME_HEIGHT = 500;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 40;
const PLATFORM_HEIGHT = 15;

export const Climb100Game: React.FC<Climb100GameProps> = ({
  playerState,
  onAction,
  isPlayer
}) => {
  const keysPressed = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isPlayer) return;
    keysPressed.current.add(e.key.toLowerCase());
    
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
      e.preventDefault();
      onAction({ type: 'jump', payload: {} });
    }
  }, [isPlayer, onAction]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current.delete(e.key.toLowerCase());
  }, []);

  const gameLoop = useCallback(() => {
    if (!isPlayer || !playerState || playerState.gameOver || playerState.won) {
      return;
    }

    const leftPressed = keysPressed.current.has('arrowleft') || keysPressed.current.has('a');
    const rightPressed = keysPressed.current.has('arrowright') || keysPressed.current.has('d');

    if (leftPressed) {
      onAction({ type: 'move', payload: { direction: -1 } });
    } else if (rightPressed) {
      onAction({ type: 'move', payload: { direction: 1 } });
    } else {
      onAction({ type: 'stopMove', payload: {} });
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [isPlayer, playerState, onAction]);

  useEffect(() => {
    if (isPlayer && playerState && !playerState.gameOver && !playerState.won) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isPlayer, playerState, handleKeyDown, handleKeyUp, gameLoop]);

  if (!playerState) {
    return (
      <div className="flex items-center justify-center h-[500px] glass-card rounded-xl">
        <p className="text-gray-400">等待游戏开始...</p>
      </div>
    );
  }

  const { position, velocity, platforms, screenOffset, currentFloor, maxFloor, lives, gameOver, won, time } = playerState;

  const getPlatformColor = (type: string, broken?: boolean) => {
    if (broken) return 'bg-gray-600/30';
    switch (type) {
      case 'moving': return 'bg-accent-cyan';
      case 'breakable': return 'bg-accent-orange';
      default: return 'bg-green-500';
    }
  };

  const renderPlayer = () => {
    const screenY = position.y - screenOffset;
    if (screenY < -100 || screenY > GAME_HEIGHT + 100) return null;

    return (
      <div
        className="absolute rounded-lg bg-gradient-to-b from-blue-400 to-blue-600 border-2 border-blue-300 shadow-lg shadow-blue-500/50"
        style={{
          left: position.x,
          top: screenY,
          width: PLAYER_WIDTH,
          height: PLAYER_HEIGHT,
          transform: playerState.facingRight ? 'scaleX(1)' : 'scaleX(-1)'
        }}
      >
        <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full" />
        <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4 h-1 bg-white rounded-full" />
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 glass-card rounded-xl">
      <div className="flex justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏔️</span>
          <span className="font-display font-bold text-accent-cyan text-xl">{maxFloor}层</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">❤️</span>
          <span className="font-display font-bold text-red-400 text-xl">{lives}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏱️</span>
          <span className="font-display font-bold text-accent-orange text-xl">{time}s</span>
        </div>
      </div>

      {(gameOver || won) && (
        <div className={`text-center py-2 px-4 rounded-lg font-display font-bold text-lg ${
          won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {won ? '🎉 恭喜登顶！' : '💥 游戏结束'}
        </div>
      )}

      <div 
        className="relative overflow-hidden rounded-lg border-2 border-slate-600"
        style={{ 
          width: GAME_WIDTH, 
          height: GAME_HEIGHT,
          background: 'linear-gradient(to bottom, #0f172a 0%, #1e293b 50%, #334155 100%)'
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${(i * 50) % 100}%`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}

        {platforms?.map((platform: any) => {
          const screenY = platform.y - screenOffset;
          if (screenY < -50 || screenY > GAME_HEIGHT + 50) return null;

          return (
            <div
              key={platform.id}
              className={`absolute rounded-sm ${getPlatformColor(platform.type, platform.broken)} ${
                platform.type === 'moving' ? 'shadow-lg shadow-cyan-500/50' : ''
              } ${platform.type === 'breakable' ? 'shadow-lg shadow-orange-500/50' : ''}`}
              style={{
                left: platform.x,
                top: screenY,
                width: platform.width,
                height: PLATFORM_HEIGHT,
                opacity: platform.broken ? 0.3 : 1
              }}
            />
          );
        })}

        {renderPlayer()}

        <div className="absolute top-2 left-2 bg-slate-900/80 px-2 py-1 rounded text-xs text-accent-cyan font-display">
          当前: {currentFloor}层
        </div>
      </div>

      {isPlayer && !gameOver && !won && (
        <div className="text-sm text-gray-400 text-center">
          <p>← → 或 A D 移动 | 空格/W/↑ 跳跃</p>
        </div>
      )}

      {isPlayer && !gameOver && !won && (
        <div className="flex gap-4 md:hidden">
          <button
            className="w-16 h-16 rounded-full bg-slate-700 active:bg-slate-600 text-2xl flex items-center justify-center"
            onTouchStart={() => { keysPressed.current.add('arrowleft'); }}
            onTouchEnd={() => { keysPressed.current.delete('arrowleft'); }}
          >
            ←
          </button>
          <button
            className="w-20 h-16 rounded-lg bg-accent-cyan active:bg-cyan-400 text-white font-bold flex items-center justify-center"
            onTouchStart={() => onAction({ type: 'jump', payload: {} })}
          >
            跳跃
          </button>
          <button
            className="w-16 h-16 rounded-full bg-slate-700 active:bg-slate-600 text-2xl flex items-center justify-center"
            onTouchStart={() => { keysPressed.current.add('arrowright'); }}
            onTouchEnd={() => { keysPressed.current.delete('arrowright'); }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};
