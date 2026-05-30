import React, { useEffect, useRef, useCallback } from 'react';
import type { NeedlePlayerState } from '../../shared/types';

interface NeedleGameProps {
  playerState: NeedlePlayerState;
  onAction: (action: { type: string; payload: any }) => void;
  isPlayer: boolean;
}

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 400;
const CENTER_X = 150;
const CENTER_Y = 200;
const CIRCLE_RADIUS = 80;
const NEEDLE_LENGTH = 60;

export const NeedleGame: React.FC<NeedleGameProps> = ({
  playerState,
  onAction,
  isPlayer
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const handleShoot = useCallback(() => {
    if (!isPlayer || !playerState || playerState.gameOver || playerState.won) return;
    onAction({ type: 'shoot', payload: {} });
  }, [isPlayer, playerState, onAction]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleShoot();
    }
  }, [handleShoot]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !playerState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let i = 0; i < 15; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * CANVAS_WIDTH,
        Math.random() * CANVAS_HEIGHT,
        Math.random() * 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    const { needles, rotation, score, gameOver, won, collision, targetAngles } = playerState;

    const gradient = ctx.createRadialGradient(CENTER_X, CENTER_Y, 0, CENTER_X, CENTER_Y, CIRCLE_RADIUS);
    gradient.addColorStop(0, '#1e3a5f');
    gradient.addColorStop(0.7, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = collision ? '#ef4444' : '#22d3ee';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.shadowColor = collision ? '#ef4444' : '#22d3ee';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const drawNeedle = (angle: number, isTarget: boolean = false) => {
      const startX = CENTER_X + Math.cos(angle) * (CIRCLE_RADIUS - 5);
      const startY = CENTER_Y + Math.sin(angle) * (CIRCLE_RADIUS - 5);
      const endX = CENTER_X + Math.cos(angle) * (CIRCLE_RADIUS + NEEDLE_LENGTH);
      const endY = CENTER_Y + Math.sin(angle) * (CIRCLE_RADIUS + NEEDLE_LENGTH);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = isTarget ? '#fbbf24' : '#94a3b8';
      ctx.lineWidth = isTarget ? 5 : 4;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, Math.PI * 2);
      ctx.fillStyle = isTarget ? '#fbbf24' : '#64748b';
      ctx.fill();
    };

    needles.forEach((angle: number) => {
      drawNeedle(angle + rotation);
    });

    targetAngles?.forEach((angle: number) => {
      drawNeedle(angle + rotation, true);
    });

    const indicatorAngle = rotation;
    const indicatorStartX = CENTER_X + Math.cos(indicatorAngle) * (CIRCLE_RADIUS + NEEDLE_LENGTH + 15);
    const indicatorStartY = CENTER_Y + Math.sin(indicatorAngle) * (CIRCLE_RADIUS + NEEDLE_LENGTH + 15);
    const indicatorEndX = CENTER_X + Math.cos(indicatorAngle) * (CIRCLE_RADIUS + NEEDLE_LENGTH + 35);
    const indicatorEndY = CENTER_Y + Math.sin(indicatorAngle) * (CIRCLE_RADIUS + NEEDLE_LENGTH + 35);

    ctx.beginPath();
    ctx.moveTo(indicatorStartX, indicatorStartY);
    ctx.lineTo(indicatorEndX, indicatorEndY);
    ctx.strokeStyle = playerState.canShoot ? '#22c55e' : '#64748b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(indicatorEndX, indicatorEndY, 8, 0, Math.PI * 2);
    ctx.fillStyle = playerState.canShoot ? '#22c55e' : '#64748b';
    ctx.fill();

    ctx.font = 'bold 24px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#22d3ee';
    ctx.fillText(`${score}/20`, CENTER_X, CENTER_Y + 8);

    if (gameOver || won) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.font = 'bold 32px Orbitron, sans-serif';
      ctx.fillStyle = won ? '#22c55e' : '#ef4444';
      ctx.fillText(won ? '🎉 胜利！' : '💥 失败', CENTER_X, CENTER_Y);
    }
  }, [playerState]);

  useEffect(() => {
    if (isPlayer) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlayer, handleKeyDown]);

  useEffect(() => {
    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  if (!playerState) {
    return (
      <div className="flex items-center justify-center h-[400px] glass-card rounded-xl">
        <p className="text-gray-400">等待游戏开始...</p>
      </div>
    );
  }

  const { score, gameOver, won, time, canShoot } = playerState;

  return (
    <div className="flex flex-col items-center gap-4 p-4 glass-card rounded-xl">
      <div className="flex justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📍</span>
          <span className="font-display font-bold text-accent-cyan text-xl">{score}/20</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏱️</span>
          <span className="font-display font-bold text-accent-orange text-xl">{time}s</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{canShoot ? '✅' : '⏳'}</span>
          <span className={`font-display font-bold text-xl ${canShoot ? 'text-green-400' : 'text-gray-400'}`}>
            {canShoot ? '就绪' : '冷却'}
          </span>
        </div>
      </div>

      {(gameOver || won) && (
        <div className={`text-center py-2 px-4 rounded-lg font-display font-bold text-lg ${
          won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {won ? '🎉 恭喜完成！' : '💥 游戏结束'}
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="rounded-lg border-2 border-slate-600 cursor-pointer"
        onClick={handleShoot}
      />

      {isPlayer && !gameOver && !won && (
        <div className="text-sm text-gray-400 text-center">
          <p>点击画布或按空格键发射针</p>
          <p className="text-xs mt-1">不要让针碰到已有的针！</p>
        </div>
      )}

      {isPlayer && !gameOver && !won && (
        <button
          className={`w-full py-4 rounded-xl font-display font-bold text-xl transition-all duration-200 ${
            canShoot 
              ? 'neon-button bg-gradient-to-r from-accent-cyan to-cyan-400 text-slate-900 hover:scale-[1.02] active:scale-[0.98]' 
              : 'bg-slate-700 text-gray-400 cursor-not-allowed'
          }`}
          onClick={handleShoot}
          disabled={!canShoot}
        >
          {canShoot ? '🎯 发射！' : '⏳ 冷却中...'}
        </button>
      )}
    </div>
  );
};
