import React from 'react';
import { Users, Gamepad2, Crown } from 'lucide-react';
import type { Room } from '../../shared/types';
import { GAME_INFO } from '../../shared/types';

interface RoomCardProps {
  room: Room;
  onJoin: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  const gameInfo = GAME_INFO[room.gameType];
  const isFull = room.players.length >= room.maxPlayers;

  return (
    <div className="glass-card p-6 hover:neon-border transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-xl text-white group-hover:text-accent-cyan transition-colors">
            {room.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
            <Crown className="w-4 h-4 text-accent-orange" />
            <span>房主: {room.players.find(p => p.isHost)?.username}</span>
          </div>
        </div>
        <div className="text-4xl">{gameInfo.icon}</div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-accent-cyan" />
          <span className="text-sm text-accent-cyan">{gameInfo.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-accent-green" />
          <span className={`text-sm ${isFull ? 'text-accent-red' : 'text-accent-green'}`}>
            {room.players.length} / {room.maxPlayers}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {room.players.map(player => (
          <div
            key={player.userId}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-lg"
            title={player.username}
          >
            {player.avatar}
          </div>
        ))}
        {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-8 h-8 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center"
          >
            <span className="text-gray-600">+</span>
          </div>
        ))}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onJoin();
        }}
        disabled={isFull}
        className={`w-full py-2 rounded-lg font-display font-semibold transition-all ${
          isFull
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'neon-button'
        }`}
      >
        {isFull ? '房间已满' : '加入房间'}
      </button>
    </div>
  );
};
