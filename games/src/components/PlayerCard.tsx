import React from 'react';
import { Crown, Check, X } from 'lucide-react';
import type { Player } from '../../shared/types';

interface PlayerCardProps {
  player: Player;
  showReady?: boolean;
  isCurrentUser?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, showReady = true, isCurrentUser = false }) => {
  return (
    <div
      className={`glass-card p-4 flex items-center gap-4 transition-all duration-300 ${
        isCurrentUser ? 'neon-border' : ''
      } ${player.isReady && showReady ? 'border-accent-green/50' : ''}`}
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-2xl">
          {player.avatar}
        </div>
        {player.isHost && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-orange rounded-full flex items-center justify-center">
            <Crown className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-white">
            {player.username}
          </span>
          {isCurrentUser && (
            <span className="text-xs text-accent-cyan">(你)</span>
          )}
        </div>
        {showReady && (
          <div className="flex items-center gap-2 mt-1">
            <div className={`ready-indicator ${player.isReady ? 'ready' : 'not-ready'}`} />
            <span className={`text-sm ${player.isReady ? 'text-accent-green' : 'text-accent-orange'}`}>
              {player.isReady ? '已准备' : '未准备'}
            </span>
          </div>
        )}
      </div>

      {showReady && (
        <div className="text-2xl font-display font-bold text-accent-cyan">
          {player.score}
        </div>
      )}
    </div>
  );
};
