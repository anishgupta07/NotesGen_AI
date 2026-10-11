import React, { useState } from 'react';
import { X, Key, ShieldCheck, AlertTriangle, ExternalLink, Loader2, Check } from 'lucide-react';
import { updateGroqApiKey } from '../api';

interface KeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasGroqKey: boolean;
  onKeyUpdated: () => void;
}

export const KeySettingsModal: React.FC<KeySettingsModalProps> = ({
  isOpen,
  onClose,
  hasGroqKey,
  onKeyUpdated,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setErrorMessage('Please enter a valid Groq API key.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await updateGroqApiKey(apiKey.trim());
      setSuccess(true);
      onKeyUpdated();
      setTimeout(() => {
        setSuccess(false);
        setApiKey('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update Groq API key');
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
            <div className="w-8 h-8 rounded-xl bg-[#250d13] text-[#ff2442] border border-[#4d1622] flex items-center justify-center font-bold text-sm">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Groq API Key Settings</h3>
              <p className="text-xs text-[#848c9c]">Bring Your Own Key (BYOK) Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#181a24] hover:bg-[#202330] text-[#848c9c] hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Status Pill */}
        <div className="px-6 pt-5">
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
              hasGroqKey
                ? 'bg-[#0f1f18] border-[#18462d] text-emerald-300'
                : 'bg-[#261b0c] border-[#4e3414] text-amber-300'
            }`}
          >
            {hasGroqKey ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">Groq Key Active:</span> You are ready to generate unlimited high-speed notes and cloud Whisper transcriptions.
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold">No API Key Set:</span> Add your personal Groq key below to enable notes generation and RAG queries.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#a6b0c3]">
                Groq API Key
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#ff4d66] hover:underline flex items-center gap-1 font-medium"
              >
                Get free key on Groq Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder={hasGroqKey ? "•••••••••••••••••••••••••••• (Enter new key to replace)" : "gsk_..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-[#141520] border border-[#232635] focus:border-[#ff2442] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#555d72] outline-none transition"
              required
            />
          </div>

          <div className="p-3 bg-[#13141f] rounded-xl border border-[#1d202e] text-[11px] text-[#848c9c] space-y-1 leading-relaxed">
            <p className="font-semibold text-[#cbd5e1]">💡 Why do you need your own Groq key?</p>
            <p>• <strong>$0 Cost:</strong> Groq provides a generous free tier with instant inference.</p>
            <p>• <strong>Cloud Whisper:</strong> Transcribes video audio in seconds without burdening the server.</p>
            <p>• <strong>Privacy:</strong> Your API key is encrypted and strictly used for your requests.</p>
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-400 font-medium">{errorMessage}</p>
          )}

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-xl bg-[#171822] hover:bg-[#1e202e] text-xs font-semibold text-[#848c9c] hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                success
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#ff2442] hover:bg-[#e61b36] text-white disabled:opacity-50'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : success ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Key Saved!</span>
                </>
              ) : (
                <span>Save Groq Key</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
