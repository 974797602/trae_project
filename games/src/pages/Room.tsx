import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Gamepad2, Crown, MessageCircle, Check, X, Play, Settings } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { getSocket, joinRoom, leaveRoom, setReady, startGame, setGameType as setRoomGameType } from '../socket/client';
import { PlayerCard } from '../components/PlayerCard';
import { GameSelector } from '../components/GameSelector';
import type { GameType, Room as RoomType } from '../../shared/types';
import { GAME_INFO } from '../../shared/types';

export const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    user,
    currentRoom,
    gameState,
    error,
    notification,
    fetchRoom,
    setCurrentRoom,
    setGameState,
    setError,
    setNotification
  } = useGameStore();

  const [isReady, setIsReady] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!user || !roomId) {
      navigate('/login');
      return;
    }

    fetchRoom(roomId);
    joinRoom(roomId, user.id);

    return () => {
      leaveRoom(roomId, user.id);
    };
  }, [user, roomId, navigate, fetchRoom]);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const handleRoomUpdated = (room: RoomType) => {
      setCurrentRoom(room);

      const player = room.players.find(p => p.userId === user.id);
      if (player) {
        setIsReady(player.isReady);
      }

      if (room.status === 'playing') {
        setNotification('游戏即将开始...');
        setTimeout(() => {
          navigate(`/game/${room.id}`);
        }, 500);
      }
    };

    const handlePlayerJoined = (player: any) => {
      setNotification(`${player.username} 加入了房间`);
    };

    const handlePlayerLeft = (userId: string) => {
      setNotification('有玩家离开了房间');
    };

    const handleGameStarted = (state: any) => {
      setGameState(state);
      if (roomId) {
        navigate(`/game/${roomId}`);
      }
    };

    const handleGameTypeChanged = (gameType: GameType) => {
      setNotification(`房主已切换游戏为 ${GAME_INFO[gameType].name}`);
    };

    const handleError = (message: string) => {
      setError(message);
    };

    socket.on('room_updated', handleRoomUpdated);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);
    socket.on('game_started', handleGameStarted);
    socket.on('game_type_changed', handleGameTypeChanged);
    socket.on('error', handleError);

    return () => {
      socket.off('room_updated', handleRoomUpdated);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
      socket.off('game_started', handleGameStarted);
      socket.off('game_type_changed', handleGameTypeChanged);
      socket.off('error', handleError);
    };
  }, [user, roomId, navigate, setCurrentRoom, setGameState, setError, setNotification]);

  if (!user || !currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-cyan" />
      </div>
    );
  }

  const isHost = currentRoom.hostId === user.id;
  const allReady = currentRoom.players.length >= 2 && currentRoom.players.every(p => p.isReady);
  const canStart = isHost && allReady;
  const gameInfo = GAME_INFO[currentRoom.gameType];

  const handleToggleReady = () => {
    if (!user || !roomId) return;
    const newReady = !isReady;
    setIsReady(newReady);
    setReady(roomId, user.id, newReady);
  };

  const handleStartGame = () => {
    if (!user || !roomId || !canStart) return;
    startGame(roomId, user.id);
  };

  const handleBackToLobby = () => {
    if (!user || !roomId) return;
    leaveRoom(roomId, user.id);
    setCurrentRoom(null);
    navigate('/lobby');
  };

  const handleGameTypeChange = (gameType: GameType) => {
    if (!user || !roomId || !isHost) return;
    setRoomGameType(roomId, user.id, gameType);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-slide-down">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToLobby}
              className="glass-card p-2 hover:border-accent-cyan/50 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-white neon-text">
                {currentRoom.name}
              </h1>
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span>{currentRoom.players.length} / {currentRoom.maxPlayers} 人</span>
                <span className="mx-2">|</span>
                <Gamepad2 className="w-4 h-4 text-accent-cyan" />
                <span className="text-accent-cyan">{gameInfo.icon} {gameInfo.name}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowChat(!showChat)}
            className="glass-card p-2 hover:border-accent-cyan/50 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-cyan" />
                玩家列表
              </h2>
              <div className="space-y-3">
                {currentRoom.players.map((player) => (
                  <PlayerCard
                    key={player.userId}
                    player={player}
                    isCurrentUser={player.userId === user.id}
                  />
                ))}
                {Array.from({ length: currentRoom.maxPlayers - currentRoom.players.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="glass-card p-4 border-dashed border-gray-600 flex items-center justify-center">
                    <span className="text-gray-500">等待玩家加入...</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-accent-orange" />
                游戏设置
              </h2>
              <GameSelector
                value={currentRoom.gameType}
                onChange={handleGameTypeChange}
                disabled={!isHost || currentRoom.players.some(p => p.isReady)}
              />
              {!isHost && (
                <p className="text-sm text-gray-500 mt-2">
                  只有房主可以更改游戏类型
                </p>
              )}
              {currentRoom.players.some(p => p.isReady) && (
                <p className="text-sm text-accent-orange mt-2">
                  已有玩家准备，无法更改游戏类型
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="font-display text-xl font-bold text-white mb-4">
                准备状态
              </h2>
              <div className="space-y-3 mb-6">
                {currentRoom.players.map((player) => (
                  <div key={player.userId} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {player.isHost && <Crown className="w-4 h-4 text-accent-orange" />}
                      {player.username}
                    </span>
                    <div className={`flex items-center gap-2 ${player.isReady ? 'text-accent-green' : 'text-accent-orange'}`}>
                      {player.isReady ? (
                        <><Check className="w-4 h-4" /> 已准备</>
                      ) : (
                        <><X className="w-4 h-4" /> 未准备</>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!isHost ? (
                <button
                  onClick={handleToggleReady}
                  className={`w-full py-4 rounded-lg font-display font-semibold transition-all ${
                    isReady
                      ? 'orange-button'
                      : 'green-button'
                  }`}
                >
                  {isReady ? '取消准备' : '准备'}
                </button>
              ) : (
                <button
                  onClick={handleStartGame}
                  disabled={!canStart}
                  className={`w-full py-4 rounded-lg font-display font-semibold transition-all ${
                    canStart
                      ? 'green-button'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-5 h-5 inline mr-2" />
                  {canStart ? '开始游戏' : (
                    currentRoom.players.length < 2
                      ? '等待玩家加入'
                      : '等待所有玩家准备'
                  )}
                </button>
              )}
            </div>

            <div className="glass-card p-6">
              <h3 className="font-display text-lg font-bold text-white mb-3">
                游戏说明
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {gameInfo.description}
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• 所有玩家准备后，房主可以开始游戏</p>
                <p>• 游戏开始后，双方同时进行对战</p>
                <p>• 先完成目标或分数更高的玩家获胜</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
