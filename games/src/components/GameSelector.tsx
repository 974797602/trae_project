import React from 'react';
import type { GameType } from '../../shared/types';
import { GAME_INFO } from '../../shared/types';

interface GameSelectorProps {
  value: GameType;
  onChange: (value: GameType) => void;
  disabled?: boolean;
}

export const GameSelector: React.FC<GameSelectorProps> = ({ value, onChange, disabled = false }) => {
  const gameTypes: GameType[] = ['minesweeper', 'climb100', 'needle'];

  return (
    <div className="space-y-3">
      <label className="block font-display font-semibold text-white">
        选择游戏
      </label>
      <div className="grid grid-cols-3 gap-3">
        {gameTypes.map((type) => {
          const info = GAME_INFO[type];
          const isSelected = value === type;
          return (
            <button
              key={type}
              onClick={() => !disabled && onChange(type)}
              disabled={disabled}
              className={`glass-card p-4 flex flex-col items-center gap-2 transition-all ${
                isSelected
                  ? 'neon-border scale-105'
                  : 'hover:border-accent-cyan/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-4xl">{info.icon}</div>
              <div className="text-center">
                <div className="font-display font-semibold text-sm text-white">
                  {info.name}
                </div>
              </div>
              {isSelected && (
                <div className="w-full h-1 bg-accent-cyan rounded-full mt-1" />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-gray-400 mt-2">
        {GAME_INFO[value].description}
      </p>
    </div>
  );
};
