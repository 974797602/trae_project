import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, UserPlus, Gamepad2 } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

type TabType = 'login' | 'register';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, register, error, setError } = useGameStore();

  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (activeTab === 'register') {
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致');
          return;
        }
        const success = await register(username, password);
        if (success) {
          navigate('/lobby');
        }
      } else {
        const success = await login(username, password);
        if (success) {
          navigate('/lobby');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-accent-cyan to-primary-500 mb-4 animate-float">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white neon-text mb-2">
            游戏对战平台
          </h1>
          <p className="text-gray-400">在线匹配，实时对战</p>
        </div>

        <div className="glass-card p-8 neon-border">
          <div className="flex mb-6 bg-dark-300 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-lg font-display font-semibold transition-all ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-primary-500 to-accent-cyan text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              登录
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 px-4 rounded-lg font-display font-semibold transition-all ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-primary-500 to-accent-cyan text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-3 bg-dark-300 border border-primary-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-4 py-3 bg-dark-300 border border-primary-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan transition-colors"
                  required
                />
              </div>
            </div>

            {activeTab === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入密码"
                    className="w-full pl-10 pr-4 py-3 bg-dark-300 border border-primary-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-accent-red/20 border border-accent-red/50 rounded-lg text-accent-red text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full neon-button py-4"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  处理中...
                </span>
              ) : activeTab === 'login' ? (
                '登录'
              ) : (
                '注册'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {activeTab === 'login' ? (
              <p>
                还没有账号？
                <button
                  onClick={() => setActiveTab('register')}
                  className="text-accent-cyan hover:underline ml-1"
                >
                  立即注册
                </button>
              </p>
            ) : (
              <p>
                已有账号？
                <button
                  onClick={() => setActiveTab('login')}
                  className="text-accent-cyan hover:underline ml-1"
                >
                  立即登录
                </button>
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>提示：注册后即可创建房间或快速匹配对手进行游戏</p>
        </div>
      </div>
    </div>
  );
};
