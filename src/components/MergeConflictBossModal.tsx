import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Flame, RefreshCw, X } from 'lucide-react';
import { gitApi } from '../utils/gitApi';
import { soundFx } from '../utils/audio';

interface MergeConflictBossModalProps {
  conflictingFiles: string[];
  onResolved: () => void;
  onClose: () => void;
}

export const MergeConflictBossModal: React.FC<MergeConflictBossModalProps> = ({
  conflictingFiles,
  onResolved,
  onClose
}) => {
  const [selectedFile, setSelectedFile] = useState<string>(conflictingFiles[0] || 'src/conflict_orb.txt');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleResolve = async (strategy: 'ours' | 'theirs' | 'mark-resolved') => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setFeedback(`Invoking resolution strategy: ${strategy}...`);
    soundFx.playButton();

    try {
      const res = await gitApi.resolveConflict(selectedFile, strategy);
      if (res.success) {
        soundFx.playCommitSuccess();
        setFeedback(res.message || 'Conflict resolved!');
        setTimeout(() => {
          onResolved();
        }, 800);
      } else {
        setFeedback(res.message || 'Resolution failed');
      }
    } catch (err: any) {
      setFeedback(err.message || 'Error executing git resolution');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="merge-conflict-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="merge-conflict-box"
        className="relative w-full max-w-2xl bg-stone-950 border-4 border-rose-800 rounded-xl shadow-2xl p-5 sm:p-6 text-stone-200 overflow-hidden font-pixelated"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Boss Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-900 border border-rose-700/80 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-pixel text-rose-300">MERGE CONFLICT BOSS</h2>
                <span className="px-2 py-0.5 bg-stone-900 border border-rose-800 text-rose-300 font-pixel text-[8px] rounded uppercase font-bold">
                  Reality Distortion
                </span>
              </div>
              <p className="text-[10px] font-pixelated text-stone-400">
                &lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD vs ======= vs &gt;&gt;&gt;&gt;&gt;&gt;&gt; incoming
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 border border-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Narrative Alert */}
        <div className="bg-stone-900 border border-rose-900/60 rounded-lg p-3 mb-4 font-pixelated text-xs text-stone-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-pixel text-[9px] text-amber-300">REALITY HAS COLLAPSED!</p>
            <p className="text-[10.5px] text-stone-300 mt-0.5">
              Two divergent branches claim dominion over the exact same code coordinates. The world is bathed in crimson static until all conflicting files are harmonized.
            </p>
          </div>
        </div>

        {/* Conflicting Files List */}
        <div className="mb-4">
          <div className="text-[9px] font-pixel text-stone-400 mb-1.5 uppercase font-semibold">
            Conflicting Files ({conflictingFiles.length})
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {conflictingFiles.map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFile(f)}
                className={`w-full text-left px-3 py-2 rounded font-pixelated text-xs flex items-center justify-between border transition ${
                  selectedFile === f
                    ? 'bg-stone-850 border-rose-700 text-rose-200'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                }`}
              >
                <span className="truncate">{f}</span>
                <span className="text-[8px] font-pixel px-1.5 py-0.5 bg-stone-900 text-rose-300 rounded border border-rose-800/80 font-bold">
                  CONFLICT (UU)
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Strategies */}
        <div className="space-y-2 mb-4">
          <div className="text-[9px] font-pixel text-stone-400 uppercase font-semibold">
            Select Resolution Strategy for <span className="text-amber-300">{selectedFile}</span>:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-pixelated">
            {/* Strategy 1: KEEP OURS */}
            <button
              disabled={isProcessing}
              onClick={() => handleResolve('ours')}
              className="p-3 bg-stone-900 hover:bg-stone-850 border border-emerald-800/80 rounded-lg text-left transition group flex flex-col justify-between"
            >
              <div>
                <div className="text-[10px] font-pixel text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>[KEEP OURS]</span>
                </div>
                <p className="text-[10px] font-pixelated text-stone-400 mt-1 leading-snug">
                  git checkout --ours
                  <br />Preserve current local branch changes.
                </p>
              </div>
            </button>

            {/* Strategy 2: KEEP THEIRS */}
            <button
              disabled={isProcessing}
              onClick={() => handleResolve('theirs')}
              className="p-3 bg-stone-900 hover:bg-stone-850 border border-stone-700 rounded-lg text-left transition group flex flex-col justify-between"
            >
              <div>
                <div className="text-[10px] font-pixel text-stone-200 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>[KEEP THEIRS]</span>
                </div>
                <p className="text-[10px] font-pixelated text-stone-400 mt-1 leading-snug">
                  git checkout --theirs
                  <br />Accept incoming timeline changes.
                </p>
              </div>
            </button>

            {/* Strategy 3: MANUAL RESOLVE */}
            <button
              disabled={isProcessing}
              onClick={() => handleResolve('mark-resolved')}
              className="p-3 bg-stone-900 hover:bg-stone-850 border border-amber-700/80 rounded-lg text-left transition group flex flex-col justify-between"
            >
              <div>
                <div className="text-[10px] font-pixel text-amber-300 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>[MARK RESOLVED]</span>
                </div>
                <p className="text-[10px] font-pixelated text-stone-400 mt-1 leading-snug">
                  git add [file]
                  <br />Mark conflict markers resolved.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Feedback bar */}
        {feedback && (
          <div className="p-2.5 rounded bg-stone-900 border border-stone-700 text-xs font-pixelated text-center text-amber-200 mb-3">
            {feedback}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-800 text-[10px] font-pixelated text-stone-500">
          <span>Once all conflicts resolve, git commit finalizes peace.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-pixel text-[8px] rounded border border-stone-700 transition"
          >
            Retreat to Village
          </button>
        </div>
      </div>
    </div>
  );
};
