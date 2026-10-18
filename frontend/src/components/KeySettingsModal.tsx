import React, { useState } from 'react';
import { X, Key, ShieldCheck, AlertTriangle, ExternalLink, Loader2, Check, Activity } from 'lucide-react';
import { updateApiKeys } from '../api';

interface KeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasGroqKey: boolean;
  hasLangsmithKey?: boolean;
  onKeyUpdated: () => void;
}

export const KeySettingsModal: React.FC<KeySettingsModalProps> = ({
  isOpen,
  onClose,
  hasGroqKey,
  hasLangsmithKey = false,
  onKeyUpdated,
}) => {
  const [groqKey, setGroqKey] = useState('');
  const [langsmithKey, setLangsmithKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groqKey.trim() && !langsmithKey.trim()) {
      setErrorMessage('Please enter at least one key to save.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await updateApiKeys(
        groqKey.trim() || undefined,
        langsmithKey.trim() || undefined
      );
      setSuccess(true);
      onKeyUpdated();
      setTimeout(() => {
        setSuccess(false);
        setGroqKey('');
        setLangsmithKey('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update keys');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[#FFFFFF] border border-[#E5DDD1] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative text-[#1C1917]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#F2EFE9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F2EFE9] text-[#B83826] border border-[#E5DDD1] flex items-center justify-center font-bold text-sm">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1C1917]">API Key Settings</h3>
              <p className="text-xs text-[#78716C]">BYOK Groq & LangSmith Observability</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#8C827A] hover:text-[#1C1917] hover:bg-[#F2EFE9] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Pill */}
        <div className="px-6 pt-4">
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
              hasGroqKey
                ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
            }`}
          >
            {hasGroqKey ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-semibold">Groq Key Active:</span> Ready for fast inference and Whisper transcription.
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-semibold">No Groq Key:</span> Add your free Groq key below to generate notes.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Groq Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#44403C]">
                Groq API Key
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#B83826] hover:underline flex items-center gap-1 font-medium"
              >
                Free key at Groq Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder={hasGroqKey ? "•••••••••••••••••••••••••••• (Enter new key to replace)" : "gsk_..."}
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#DDD6C8] focus:border-[#B83826] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] placeholder-[#8C827A] outline-none transition"
            />
          </div>

          {/* LangSmith Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#44403C] flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#B83826]" />
                <span>LangSmith API Key (Optional)</span>
              </label>
              <a
                href="https://smith.langchain.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#B83826] hover:underline flex items-center gap-1 font-medium"
              >
                LangSmith Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder={hasLangsmithKey ? "•••••••••••••••••••••••••••• (Tracing Active)" : "lsv2_pt_..."}
              value={langsmithKey}
              onChange={(e) => setLangsmithKey(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#DDD6C8] focus:border-[#B83826] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] placeholder-[#8C827A] outline-none transition"
            />
            <p className="text-[11px] text-[#78716C] mt-1 leading-tight">
              Tracks real-time tokens, latency, and HTTP 429 rate limit diagnostics in LangSmith.
            </p>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-xl bg-[#F2EFE9] hover:bg-[#E5DDD1] text-xs font-medium text-[#44403C] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className={`flex-1 py-2 px-3 rounded-xl font-medium text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${
                success
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#B83826] hover:bg-[#A32E1E] text-white disabled:opacity-50'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : success ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Keys</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
