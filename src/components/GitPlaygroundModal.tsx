import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, CheckCircle2, FilePlus, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { gitApi } from '../utils/gitApi';
import { soundFx } from '../utils/audio';

interface GitPlaygroundModalProps {
  onActionComplete: () => void;
  onClose: () => void;
}

export const GitPlaygroundModal: React.FC<GitPlaygroundModalProps> = ({
  onActionComplete,
  onClose
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const runSimulate = async (action: 'dirty' | 'untracked' | 'ahead' | 'conflict' | 'clean', desc: string) => {
    setLoadingAction(action);
    setMessage(`Executing Git operation: ${desc}...`);
    soundFx.playButton();

    try {
      const res = await gitApi.simulate(action);
      if (res.success) {
        soundFx.playCommitSuccess();
        setMessage(`Success: ${desc} completed!`);
        setTimeout(() => {
          onActionComplete();
          onClose();
        }, 600);
      } else {
        setMessage(`Operation failed: ${(res as any).error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setMessage(`Failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      id="git-playground-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        id="git-playground-box"
        className="relative w-full max-w-lg bg-stone-900 border-4 border-amber-700/80 rounded-xl shadow-2xl p-5 text-stone-200 font-pixelated"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0,0,0,0.8)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-stone-950 border border-amber-700/80 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-pixel text-amber-300">GIT SCENARIO PLAYGROUND</h2>
              <p className="text-[10px] font-pixelated text-stone-400">Instantly test real Git states & NPC dialogues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 border border-stone-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5 font-pixelated text-xs">
          <button
            disabled={Boolean(loadingAction)}
            onClick={() => runSimulate('dirty', 'Taint Working Tree (Dirty)')}
            className="w-full text-left p-3 rounded-lg bg-stone-950 border border-amber-800/80 hover:border-amber-600 hover:bg-stone-850 transition flex items-center justify-between"
          >
            <div>
              <div className="font-pixel text-[9px] text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>1. Taint Working Tree (Dirty Changes)</span>
              </div>
              <p className="text-[10px] font-pixelated text-stone-400 mt-0.5">Modifies real files in src/ to trigger Elder's tainted tree dialogue.</p>
            </div>
          </button>

          <button
            disabled={Boolean(loadingAction)}
            onClick={() => runSimulate('untracked', 'Spawn Untracked Spirit File')}
            className="w-full text-left p-3 rounded-lg bg-stone-950 border border-stone-700 hover:border-amber-700 hover:bg-stone-850 transition flex items-center justify-between"
          >
            <div>
              <div className="font-pixel text-[9px] text-stone-200 flex items-center gap-1.5">
                <FilePlus className="w-3.5 h-3.5 text-stone-400" />
                <span>2. Create Untracked File</span>
              </div>
              <p className="text-[10px] font-pixelated text-stone-400 mt-0.5">Creates new unversioned file to trigger "untracked spirits" dialogue.</p>
            </div>
          </button>

          <button
            disabled={Boolean(loadingAction)}
            onClick={() => runSimulate('ahead', 'Commit Locally (Ahead of Origin)')}
            className="w-full text-left p-3 rounded-lg bg-stone-950 border border-stone-700 hover:border-amber-700 hover:bg-stone-850 transition flex items-center justify-between"
          >
            <div>
              <div className="font-pixel text-[9px] text-amber-200 flex items-center gap-1.5">
                <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Commit Changes (Ahead of Remote)</span>
              </div>
              <p className="text-[10px] font-pixelated text-stone-400 mt-0.5">Commits to local branch so Git Shrine glows and allows push to origin.</p>
            </div>
          </button>

          <button
            disabled={Boolean(loadingAction)}
            onClick={() => runSimulate('conflict', 'Trigger Real Merge Conflict')}
            className="w-full text-left p-3 rounded-lg bg-stone-950 border border-rose-900/80 hover:border-rose-700 hover:bg-stone-850 transition flex items-center justify-between"
          >
            <div>
              <div className="font-pixel text-[9px] text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>4. Trigger Merge Conflict (Spawn Boss)</span>
              </div>
              <p className="text-[10px] font-pixelated text-stone-400 mt-0.5">Generates genuine git merge conflict: crimson world tint & Boss NPC!</p>
            </div>
          </button>

          <button
            disabled={Boolean(loadingAction)}
            onClick={() => runSimulate('clean', 'Reset to Pristine Clean State')}
            className="w-full text-left p-3 rounded-lg bg-stone-950 border border-emerald-900/80 hover:border-emerald-700 hover:bg-stone-850 transition flex items-center justify-between"
          >
            <div>
              <div className="font-pixel text-[9px] text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>5. Reset to Clean State</span>
              </div>
              <p className="text-[10px] font-pixelated text-stone-400 mt-0.5">Hard reset and clean to return world to pristine tranquility.</p>
            </div>
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="mt-3 p-2 rounded bg-stone-950 border border-amber-700/80 text-xs font-pixelated text-amber-200 text-center">
            {message}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-stone-800 text-[10px] font-pixelated text-stone-500 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-pixel text-[8px] rounded border border-stone-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
