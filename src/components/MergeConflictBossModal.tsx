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
        className="relative w-full max-w-2xl bg-stone-950 border-4 border-red-600 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.7)] p-5 sm:p-6 text-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Boss Header */}
        <div className="flex items-center justify-between border-b border-red-800/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-950 border-2 border-red-500 flex items-center justify-center text-red-400 animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-pixel text-red-400">MERGE CONFLICT BOSS</h2>
                <span className="px-2 py-0.5 bg-red-950 border border-red-600 text-red-300 font-mono text-[10px] rounded uppercase font-bold animate-pulse">
                  Reality Distortion
                </span>
              </div>
              <p className="text-xs font-mono text-red-300/80">
                &lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD vs ======= vs &gt;&gt;&gt;&gt;&gt;&gt;&gt; incoming
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 border border-red-800/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Narrative Alert */}
        <div className="bg-red-950/40 border border-red-800/60 rounded-lg p-3 mb-4 font-mono text-xs text-red-200 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-300">REALITY HAS COLLAPSED!</p>
            <p className="text-[11px] text-stone-300 mt-0.5">
              Two divergent branches claim dominion over the exact same code coordinates. The world is bathed in crimson static until all conflicting files are harmonized.
            </p>
          </div>
        </div>

        {/* Conflicting Files List */}
        <div className="mb-4">
          <div className="text-[11px] font-mono text-stone-400 mb-1.5 uppercase font-semibold">
            Conflicting Files ({conflictingFiles.length})
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {conflictingFiles.map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFile(f)}
                className={`w-full text-left px-3 py-2 rounded font-mono text-xs flex items-center justify-between border transition ${
                  selectedFile === f
                    ? 'bg-red-900/40 border-red-500 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-red-800 hover:text-stone-200'
                }`}
              >
                <span className="truncate">{f}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-red-950 text-red-400 rounded border border-red-800 font-bold">
                  CONFLICT (UU)
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Strategies */}
        <div className="space-y-2 mb-4">
          <div className="text-[11px] font-mono text-stone-400 uppercase font-semibold">
            Select Resolution Strategy for <span className="text-cyan-300">{selectedFile}</span>:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
            {/* Strategy 1: KEEP OURS */}
            <button
              disabled={isProcessing}
              onClick={() => handleResolve('ours')}
              className="p-3 bg-stone-900 hover:bg-emerald-950/60 border border-emerald-600/70 rounded-lg text-left transition hover:border-emerald-400 group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-emerald-400 group-hover:underline flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>[KEEP OURS]</span>
                </div>
                <p className="text-[10px] text-stone-400 mt-1 leading-snug">
                  git checkout --ours
                  <br />Preserve current local branch changes.
                </p>
              </div>
            </button>

            {/* Strategy 2: KEEP THEIRS */}
            <button
              disabled={isProcessing}
              onClick={() => handleResolve('theirs')}
              className="p-3 bg-stone-900 hover:bg-sky-950/60 border border-sky-600/70 rounded-lg text-left transition hover:border-sky-400 group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-sky-400 group-hover:underline flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>[KEEP THEIRS]</span>
                </div>
                <p className="text-[10px] text-stone-400 mt-1 leading-snug">
                  git checkout --theirs
                  <br />Accept incoming timeline changes.
                </p>
              </div>
            </button>

            {/* Strategy 3: MANUAL RESOLVE */}
            <button
              disabled={isProcessing}
              onClick={() => handleResolve('mark-resolved')}
              className="p-3 bg-stone-900 hover:bg-amber-950/60 border border-amber-600/70 rounded-lg text-left transition hover:border-amber-400 group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-amber-400 group-hover:underline flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>[MARK RESOLVED]</span>
                </div>
                <p className="text-[10px] text-stone-400 mt-1 leading-snug">
                  git add [file]
                  <br />Mark conflict markers resolved.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Feedback bar */}
        {feedback && (
          <div className="p-2.5 rounded bg-stone-900 border border-red-700/50 text-xs font-mono text-center text-red-200 animate-pulse mb-3">
            {feedback}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-800 text-[11px] font-mono text-stone-500">
          <span>Once all conflicts resolve, git commit finalizes peace.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded"
          >
            Retreat to Village
          </button>
        </div>
      </div>
    </div>
  );
};
