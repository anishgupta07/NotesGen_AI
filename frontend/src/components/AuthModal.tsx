import React, { useState } from 'react';
import { X, Key, Mail, Lock, User as UserIcon, Sparkles, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
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
  const [groqKey, setGroqKey] = useState('');
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

        const res = await registerUser(name, email, password, groqKey.trim() || undefined);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#101117] border border-[#232533] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#1b1d28] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#250d13] text-[#ff2442] border border-[#4d1622] flex items-center justify-center font-black text-sm">
              N
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {mode === 'signin' ? 'Welcome Back to NotesGen' : 'Create Your NotesGen Account'}
              </h3>
              <p className="text-xs text-[#848c9c]">
                {mode === 'signin'
                  ? 'Access your isolated video notes & chat history'
                  : 'Start transforming YouTube videos into smart notes'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#181a24] hover:bg-[#202330] text-[#848c9c] hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 mx-6 mt-5 bg-[#151722] rounded-xl border border-[#202230]">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#ff2442] text-white shadow-md'
                : 'text-[#848c9c] hover:text-white'
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
                ? 'bg-[#ff2442] text-white shadow-md'
                : 'text-[#848c9c] hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-[#240c11] border border-[#4d1620] text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#ff2442] shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#a6b0c3] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#5c6479] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Anish Gupta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#141520] border border-[#232635] focus:border-[#ff2442] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#555d72] outline-none transition"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#a6b0c3] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#5c6479] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#141520] border border-[#232635] focus:border-[#ff2442] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#555d72] outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a6b0c3] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#5c6479] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#141520] border border-[#232635] focus:border-[#ff2442] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#555d72] outline-none transition"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#a6b0c3] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#ff2442]" />
                  <span>Groq API Key (Optional)</span>
                </label>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#ff4d66] hover:underline flex items-center gap-1 font-medium"
                >
                  Get free key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                placeholder="gsk_..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="w-full bg-[#141520] border border-[#232635] focus:border-[#ff2442] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#555d72] outline-none transition"
              />
              <p className="text-[11px] text-[#6b758b] mt-1.5 leading-relaxed">
                Bring Your Own Key (BYOK) gives you unlimited free high-speed notes and cloud Whisper transcription.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#ff2442] hover:bg-[#e61b36] text-white font-bold text-xs shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{mode === 'signin' ? 'Sign In to Workspace' : 'Create Free Account'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
