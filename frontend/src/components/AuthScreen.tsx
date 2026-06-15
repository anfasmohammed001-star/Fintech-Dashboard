'use client';

import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Wallet, Mail, Lock, User as UserIcon, AlertTriangle, ArrowRight, Sun, Moon } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (user: User) => void;
  isLightMode?: boolean;
  toggleTheme?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, isLightMode = false, toggleTheme }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let user: User;
      if (isLogin) {
        user = await api.login({ email, password });
      } else {
        user = await api.register({ email, password, name });
      }

      if (user && user.token) {
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user));
        onSuccess(user);
      } else {
        throw new Error('Authentication succeeded but token was missing.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)] p-4 font-sans transition-colors duration-300">
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full blur-3xl opacity-30 bg-primary/20 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-20 bg-emerald-500/20 pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl glass-panel p-8 border border-card-border relative overflow-hidden shadow-2xl">
        
        {/* Theme Switcher Button */}
        {toggleTheme && (
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 p-2 bg-input-bg border border-input-border rounded-xl text-text-muted hover:text-text-title transition-all cursor-pointer z-10 shrink-0"
            title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        )}

        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-primary to-indigo-600 rounded-2xl shadow-lg shadow-primary/30 text-white border border-primary/20 mb-3">
            <Wallet className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-text-title tracking-tight">FinSight Tracker</h2>
          <p className="text-xs text-text-muted mt-1">
            {isLogin ? 'Log in to access your financial command center' : 'Register to take control of your financial spending'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-600 dark:text-rose-300 text-xs flex gap-2.5 items-start mb-6">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-muted">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[var(--input-bg)] border border-input-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-title placeholder-slate-600 dark:placeholder-slate-600/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-muted">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[var(--input-bg)] border border-input-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-title placeholder-slate-600 dark:placeholder-slate-600/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-muted">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--input-bg)] border border-input-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-title placeholder-slate-600 dark:placeholder-slate-600/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 cursor-pointer mt-6 active:scale-95"
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              <>
                {isLogin ? 'Log In' : 'Sign Up'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-primary hover:text-primary-hover font-semibold cursor-pointer transition-all"
          >
            {isLogin ? "New to FinSight? Create an account" : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default AuthScreen;
