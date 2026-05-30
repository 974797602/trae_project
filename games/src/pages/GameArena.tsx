import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, User, X } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { getSocket, leaveRoom, sendGameAction } from '../socket/client';
import { GameContainer } from '../games/GameContainer';
import type { GameState, GameResult, Player } from '../../shared/types';
import { GAME_INFO } from '../../shared/types';

export const GameArena: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    user,
    currentRoom,
    gameState,
    gameResult,
    error,
    notification,
    setGameState,
    setGameResult,
    setCurrentRoom,
    setError,
    setNotification,
    clearGameState
  } = useGameStore();

  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!user || !roomId) {
      navigate('/login');
      return;
    }

    const timer = setInterval(() => {
      if (countdown > 0) {
        setCountdown(countdown - 1);
      } else {
        setShowCountdown(false);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [user, roomId, navigate, countdown]);

  useEffect(() => {
    if (showCountdown || !gameState) return;

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showCountdown, gameState]);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const handleGameUpdated = (state: GameState) => {
      setGameState(state);
    };

    const handleGameOver = (result: GameResult) => {
      setGameResult(result);
      setNotification(`游戏结束！${result.winnerUsername} 获胜！`);
    };

    const handleError = (message: string) => {
      setError(message);
    };

    socket.on('game_updated', handleGameUpdated);
    socket.on('game_over', handleGameOver);
    socket.on('error', handleError);

    return () => {
      socket.off('game_updated', handleGameUpdated);
      socket.off('game_over', handleGameOver);
      socket.off('error', handleError);
    };
  }, [user, setGameState, setGameResult, setError, setNotification]);

  if (!user || !currentRoom || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-cyan" />
      </div>
    );
  }

  const gameInfo = GAME_INFO[currentRoom.gameType];
  const currentPlayer = currentRoom.players.find(p => p.userId === user.id);
  const opponent = currentRoom.players.find(p => p.userId !== user.id);
  const myState = gameState.players[user.id];
  const opponentState = opponent ? gameState.players[opponent.userId] : null;
  const isWinner = gameResult && gameResult.winnerId === user.id;

  const handleAction = (action: any) => {
    if (!user || !roomId || showCountdown || gameResult) return;
    sendGameAction(roomId, user.id, action);
  };

  const handleBackToRoom = () => {
    if (!user || !roomId) return;
    clearGameState();
    navigate(`/room/${roomId}`);
  };

  const handleBackToLobby = () => {
    if (!user || !roomId) return;
    leaveRoom(roomId, user.id);
    setCurrentRoom(null);
    clearGameState();
    navigate('/lobby');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 animate-slide-down">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToRoom}
              className="glass-card p-2 hover:border-accent-cyan/50 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-white neon-text flex items-center gap-2">
                {gameInfo.icon} {gameInfo.name}
              </h1>
              <p className="text-gray-400">{currentRoom.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent-cyan" />
              <span className="font-display font-bold text-xl">{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-accent-red/20 border border-accent-red/50 rounded-lg text-accent-red animate-shake">
            {error}
            <button onClick={() => setError(null)} className="float-right ml-4">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {notification && (
          <div className="mb-6 p-4 bg-accent-cyan/20 border border-accent-cyan/50 rounded-lg text-accent-cyan animate-slide-up">
            {notification}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-4">
              <h3 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-accent-cyan" />
                {currentPlayer?.username} (你)
              </h3>
              <div className="text-3xl font-display font-bold text-accent-cyan">
                {myState?.score || myState?.cellsRevealed || myState?.maxFloor || myState?.score || 0}
              </div>
              {myState?.gameOver && (
                <div className="mt-2 text-accent-red text-sm">游戏结束</div>
              )}
              {myState?.won && (
                <div className="mt-2 text-accent-green text-sm">获胜！</div>
              )}
            </div>

            {opponent && (
              <div className="glass-card p-4">
                <h3 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-accent-orange" />
                  {opponent.username}
                </h3>
                <div className="text-3xl font-display font-bold text-accent-orange">
                  {opponentState?.score || opponentState?.cellsRevealed || opponentState?.maxFloor || opponentState?.score || 0}
                </div>
                {opponentState?.gameOver && (
                  <div className="mt-2 text-accent-red text-sm">游戏结束</div>
                )}
                {opponentState?.won && (
                  <div className="mt-2 text-accent-green text-sm">获胜！</div>
                )}
              </div>
            )}

            <div className="glass-card p-4">
              <h3 className="font-display font-bold text-white mb-2">游戏说明</h3>
              <p className="text-sm text-gray-400">{gameInfo.description}</p>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="glass-card p-6">
              {showCountdown ? (
                <div className="flex flex-col items-center justify-center h-96">
                  <div className="text-9xl font-display font-bold text-accent-cyan neon-text animate-pulse">
                    {countdown}
                  </div>
                  <p className="text-xl text-gray-400 mt-4">游戏即将开始...</p>
                </div>
              ) : gameResult ? (
                <div className="flex flex-col items-center justify-center h-96">
                  <Trophy className={`w-24 h-24 mb-6 ${isWinner ? 'text-accent-green' : 'text-accent-orange'} animate-float`} />
                  <h2 className="font-display text-4xl font-bold text-white mb-4">
                    {isWinner ? '恭喜获胜！' : '游戏结束'}
                  </h2>
                  <p className="text-xl text-gray-400 mb-8">
                    {gameResult.winnerUsername} 获得胜利！
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={handleBackToRoom}
                      className="neon-button px-8 py-3"
                    >
                      返回房间
                    </button>
                    <button
                      onClick={handleBackToLobby}
                      className="orange-button px-8 py-3"
                    >
                      返回大厅
                    </button>
                  </div>
                </div>
              ) : (
                <GameContainer
                  gameType={currentRoom.gameType}
                  gameState={gameState}
                  userId={user.id}
                  onAction={handleAction}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
