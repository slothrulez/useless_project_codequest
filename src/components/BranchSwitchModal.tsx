import React, { useState } from 'react';
import { X, GitBranch, Plus, Check, Loader2, AlertCircle } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { gitApi } from '../utils/gitApi';

interface BranchSwitchModalProps {
  currentBranch: string;
  branches: string[];
  onSelectBranch: (branch: string) => void;
  onCreateBranch: (branch: string) => void;
  onClose: () => void;
}

export const BranchSwitchModal: React.FC<BranchSwitchModalProps> = ({
  currentBranch,
  branches,
  onSelectBranch,
  onCreateBranch,
  onClose
}) => {
  const [newBranchName, setNewBranchName] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelect = async (b: string) => {
    if (b === currentBranch) {
      onClose();
      return;
    }
    setIsSwitching(true);
    setErrorMsg(null);
    soundFx.playInteract();

    try {
      const res = await gitApi.checkout(b);
      if (res.success) {
        soundFx.playCommitSuccess();
        onSelectBranch(b);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to checkout branch.');
      }
    } catch (err: any) {
      // Fallback client-side if offline
      onSelectBranch(b);
      onClose();
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || isSwitching) return;

    soundFx.playInteract();
    const formatted = newBranchName.trim().toLowerCase().replace(/\s+/g, '-');
    setIsSwitching(true);
    setErrorMsg(null);

    try {
      const res = await gitApi.checkout(formatted, true);
      if (res.success) {
        soundFx.playCommitSuccess();
        onCreateBranch(formatted);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to create and checkout branch.');
      }
    } catch (err: any) {
      onCreateBranch(formatted);
      onClose();
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div
      id="branch-switch-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        id="branch-switch-box"
        className="relative w-full max-w-md bg-stone-900 border-4 border-amber-700/90 rounded-xl shadow-2xl p-5 text-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 40px rgba(245, 158, 11, 0.25), inset 0 0 20px rgba(0,0,0,0.8)'
        }}
      >
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-amber-950 border border-amber-500 flex items-center justify-center text-amber-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-pixel text-amber-300">SWITCH BRANCH</h2>
              <p className="text-[10px] font-mono text-stone-400">git checkout &lt;branch&gt;</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playButton();
              onClose();
            }}
            className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 border border-stone-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2 rounded bg-red-950/80 border border-red-700 text-xs font-mono text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Existing Branches */}
        <div className="space-y-1.5 mb-4 max-h-48 overflow-y-auto pr-1">
          <div className="text-[9px] font-pixel text-stone-500 mb-1">AVAILABLE BRANCHES:</div>
          {branches.map((b) => (
            <button
              key={b}
              disabled={isSwitching}
              onClick={() => handleSelect(b)}
              className={`w-full flex items-center justify-between p-2.5 rounded text-xs font-mono transition border ${
                b === currentBranch
                  ? 'bg-amber-950/70 border-amber-500 text-amber-200 font-bold'
                  : 'bg-stone-950/70 hover:bg-stone-800 border-stone-800 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                <span>{b}</span>
              </div>
              {b === currentBranch ? (
                <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-pixel">
                  <Check className="w-3.5 h-3.5" /> ACTIVE
                </span>
              ) : isSwitching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />
              ) : null}
            </button>
          ))}
        </div>

        {/* Create new branch form */}
        <form onSubmit={handleCreate} className="border-t border-stone-800 pt-3">
          <div className="text-[9px] font-pixel text-stone-500 mb-1">CREATE & CHECKOUT NEW BRANCH:</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="e.g. feature/elder-wisdom"
              disabled={isSwitching}
              className="flex-1 bg-stone-950 border border-stone-800 focus:border-amber-500 rounded px-2.5 py-1.5 text-xs font-mono text-stone-200 placeholder-stone-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newBranchName.trim() || isSwitching}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-pixel text-[8px] font-bold rounded transition flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Checkout -b</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
