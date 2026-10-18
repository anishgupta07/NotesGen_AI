import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
import { registerUser, loginUser } from '../api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'signin' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your name.');
        if (!email.trim()) throw new Error('Please enter your email.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const res = await registerUser(name, email, password);
        onAuthSuccess(res.user);
        onClose();
      } else {
        if (!email.trim() || !password) throw new Error('Please enter both email and password.');

        const res = await loginUser(email, password);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[#FFFFFF] border border-[#E5DDD1] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative text-[#1C1917]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#F2EFE9] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#1C1917]">
              {mode === 'signin' ? 'Sign in to NotesGen' : 'Create your account'}
            </h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              {mode === 'signin'
                ? 'Access your private video notes and study history'
                : 'Generate smart notes from any educational video'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#8C827A] hover:text-[#1C1917] hover:bg-[#F2EFE9] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 mx-6 mt-4 bg-[#F2EFE9] rounded-xl border border-[#E5DDD1]">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#FFFFFF] text-[#1C1917] shadow-xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === 'register'
                ? 'bg-[#FFFFFF] text-[#1C1917] shadow-xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Anish Gupta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#DDD6C8] focus:border-[#B83826] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#1C1917] placeholder-[#8C827A] outline-none transition"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#44403C] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#DDD6C8] focus:border-[#B83826] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#1C1917] placeholder-[#8C827A] outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#44403C] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#DDD6C8] focus:border-[#B83826] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#1C1917] placeholder-[#8C827A] outline-none transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#B83826] hover:bg-[#A32E1E] text-white font-medium text-xs shadow-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
