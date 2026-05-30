import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, LogOut, Users, Zap, Gamepad2, X } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { getSocket, joinRoom, quickMatch, cancelMatch } from '../socket/client';
import { RoomCard } from '../components/RoomCard';
import { GameSelector } from '../components/GameSelector';
import type { GameType, Room } from '../../shared/types';
import { GAME_INFO } from '../../shared/types';

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    rooms,
    currentRoom,
    isMatching,
    error,
    notification,
    fetchRooms,
    createRoom,
    setCurrentRoom,
    setIsMatching,
    setError,
    setNotification,
    logout
  } = useGameStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedGame, setSelectedGame] = useState<GameType>('minesweeper');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);

    return () => clearInterval(interval);
  }, [user, navigate, fetchRooms]);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const handleMatchFound = (room: Room) => {
      setCurrentRoom(room);
      setIsMatching(false);
      setNotification('匹配成功！正在进入房间...');
      setTimeout(() => {
        navigate(`/room/${room.id}`);
      }, 1000);
    };

    const handleError = (message: string) => {
      setError(message);
      setIsMatching(false);
    };

    socket.on('match_found', handleMatchFound);
    socket.on('error', handleError);

    return () => {
      socket.off('match_found', handleMatchFound);
      socket.off('error', handleError);
    };
  }, [user, navigate, setCurrentRoom, setIsMatching, setError, setNotification]);

  const handleCreateRoom = async () => {
    if (!user) return;

    const room = await createRoom(newRoomName || `${user.username}的房间`, selectedGame);
    if (room) {
      joinRoom(room.id, user.id);
      setShowCreateModal(false);
      setNewRoomName('');
      navigate(`/room/${room.id}`);
    }
  };

  const handleJoinRoom = async (room: Room) => {
    if (!user) return;

    if (room.players.length >= room.maxPlayers) {
      setError('房间已满');
      return;
    }

    joinRoom(room.id, user.id);
    setCurrentRoom(room);
    navigate(`/room/${room.id}`);
  };

  const handleQuickMatch = () => {
    if (!user || isMatching) return;

    setIsMatching(true);
    setError(null);
    quickMatch(user.id, selectedGame);

    setTimeout(() => {
      if (useGameStore.getState().isMatching) {
        setNotification('正在匹配中，请稍候...');
      }
    }, 2000);
  };

  const handleCancelMatch = () => {
    if (!user) return;
    cancelMatch(user.id);
    setIsMatching(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRooms();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-slide-down">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white neon-text mb-2">
              游戏大厅
            </h1>
            <p className="text-gray-400">欢迎回来，{user.username}！选择一个游戏开始对战吧</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 glass-card px-4 py-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xl">
                {user.avatar}
              </div>
              <span className="font-display font-semibold">{user.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="glass-card p-2 hover:bg-accent-red/20 hover:border-accent-red/50 transition-all"
              title="退出登录"
            >
              <LogOut className="w-5 h-5 text-accent-red" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-accent-red/20 border border-accent-red/50 rounded-lg text-accent-red animate-shake">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {notification && (
          <div className="mb-6 p-4 bg-accent-cyan/20 border border-accent-cyan/50 rounded-lg text-accent-cyan animate-slide-up">
            {notification}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-accent-cyan" />
                房间列表
              </h2>
              <button
                onClick={handleRefresh}
                className="glass-card p-2 hover:border-accent-cyan/50 transition-all"
                title="刷新列表"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">暂无房间，创建一个房间开始游戏吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onJoin={() => handleJoinRoom(room)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent-orange" />
                快速匹配
              </h3>

              <GameSelector
                value={selectedGame}
                onChange={setSelectedGame}
                disabled={isMatching}
              />

              <div className="mt-6">
                {isMatching ? (
                  <button
                    onClick={handleCancelMatch}
                    className="w-full orange-button py-4"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      匹配中... 点击取消
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleQuickMatch}
                    className="w-full green-button py-4 text-lg"
                  >
                    <Zap className="w-5 h-5 inline mr-2" />
                    快速匹配
                  </button>
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent-cyan" />
                创建房间
              </h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full neon-button py-4 text-lg"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                创建房间
              </button>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-green" />
                在线人数
              </h3>
              <div className="text-4xl font-display font-bold text-accent-green text-center">
                {rooms.reduce((sum, r) => sum + r.players.length, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 w-full max-w-md animate-slide-up neon-border">
            <h3 className="font-display text-2xl font-bold text-white mb-6">
              创建房间
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  房间名称
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder={`${user.username}的房间`}
                  className="w-full px-4 py-3 bg-dark-300 border border-primary-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan transition-colors"
                />
              </div>

              <GameSelector
                value={selectedGame}
                onChange={setSelectedGame}
              />

              <div className="flex gap-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-lg font-display font-semibold hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateRoom}
                  className="flex-1 neon-button py-3"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
