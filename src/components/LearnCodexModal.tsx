import React, { useState } from 'react';
import { X, BookOpen, GitBranch, GitMerge, RotateCcw, Shield, Terminal } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface LearnCodexModalProps {
  onClose: () => void;
}

export const LearnCodexModal: React.FC<LearnCodexModalProps> = ({ onClose }) => {
  const [activeTopic, setActiveTopic] = useState<'basics' | 'branching' | 'rebase' | 'cheatsheet'>('basics');

  return (
    <div
      id="learn-codex-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        id="learn-codex-box"
        className="relative w-full max-w-2xl bg-stone-900 border-4 border-blue-800/90 rounded-xl shadow-2xl p-4 sm:p-6 text-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 40px rgba(59, 130, 246, 0.25), inset 0 0 20px rgba(0,0,0,0.8)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950/80 border-2 border-blue-500 flex items-center justify-center text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-pixel text-blue-300">GIT CODEX & SPELLBOOK</h2>
              <p className="text-[10px] font-retro text-stone-400">Sacred knowledge of distributed version control</p>
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-800 mb-4 gap-1 text-[10px] font-pixel overflow-x-auto pb-1">
          <button
            onClick={() => {
              setActiveTopic('basics');
              soundFx.playButton();
            }}
            className={`px-3 py-1.5 rounded-t transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTopic === 'basics'
                ? 'bg-blue-950/70 text-blue-300 border-t-2 border-blue-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            The 3 Trees
          </button>
          <button
            onClick={() => {
              setActiveTopic('branching');
              soundFx.playButton();
            }}
            className={`px-3 py-1.5 rounded-t transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTopic === 'branching'
                ? 'bg-blue-950/70 text-blue-300 border-t-2 border-blue-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Branch & Merge
          </button>
          <button
            onClick={() => {
              setActiveTopic('rebase');
              soundFx.playButton();
            }}
            className={`px-3 py-1.5 rounded-t transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTopic === 'rebase'
                ? 'bg-blue-950/70 text-blue-300 border-t-2 border-blue-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Rebase vs Merge
          </button>
          <button
            onClick={() => {
              setActiveTopic('cheatsheet');
              soundFx.playButton();
            }}
            className={`px-3 py-1.5 rounded-t transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTopic === 'cheatsheet'
                ? 'bg-blue-950/70 text-blue-300 border-t-2 border-blue-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Spell Cheat Sheet
          </button>
        </div>

        {/* Content Section */}
        <div className="max-h-72 overflow-y-auto pr-1 text-xs font-mono">
          {activeTopic === 'basics' && (
            <div className="space-y-3">
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg">
                <div className="font-pixel text-[10px] text-blue-400 mb-2">1. WORKING DIRECTORY (Files on Disk)</div>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  Your sandbox where you write code and edit files. These changes are volatile until added to the index.
                </p>
              </div>

              <div className="text-center font-pixel text-blue-500 text-[9px]">&#8595; git add &#8595;</div>

              <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg">
                <div className="font-pixel text-[10px] text-amber-400 mb-2">2. STAGING INDEX (The Blueprint)</div>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  The staging area where changes are previewed and prepared. Allows you to craft focused, atomic commits.
                </p>
              </div>

              <div className="text-center font-pixel text-emerald-500 text-[9px]">&#8595; git commit &#8595;</div>

              <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg">
                <div className="font-pixel text-[10px] text-emerald-400 mb-2">3. REPOSITORY (Immutable History)</div>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  Permanent snapshots cryptographically secured in the .git database. Once committed, your code can always be recovered.
                </p>
              </div>
            </div>
          )}

          {activeTopic === 'branching' && (
            <div className="space-y-3">
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg">
                <div className="font-pixel text-[10px] text-blue-400 mb-1">BRANCHES ARE LIGHTWEIGHT POINTERS</div>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  A Git branch is simply a 41-byte pointer to a commit hash. Creating a branch with <code>git checkout -b feature</code> takes 0.001 seconds!
                </p>
              </div>
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg">
                <div className="font-pixel text-[10px] text-amber-400 mb-1">FAST-FORWARD vs 3-WAY MERGE</div>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  If the target branch hasn't diverged, Git simply moves the pointer forward (Fast-Forward). If both have new commits, Git creates a merge commit tying both histories together.
                </p>
              </div>
            </div>
          )}

          {activeTopic === 'rebase' && (
            <div className="space-y-3">
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg">
                <div className="font-pixel text-[10px] text-purple-400 mb-1">GIT REBASE: THE TIMELINE RE-WRITER</div>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  Rebase picks your feature commits and replays them on top of the latest main branch, creating a completely linear history without cluttering merge commits.
                </p>
              </div>
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg">
                <div className="font-pixel text-[10px] text-rose-400 mb-1">THE GOLDEN RULE OF REBASE:</div>
                <p className="text-rose-200 text-[11px]">
                  Never rebase commits that have already been pushed to a public remote branch shared by other developers!
                </p>
              </div>
            </div>
          )}

          {activeTopic === 'cheatsheet' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-stone-950 rounded border border-stone-800">
                <div className="font-bold text-amber-400">git status</div>
                <div className="text-stone-400 text-[10px]">Show working tree status</div>
              </div>
              <div className="p-2 bg-stone-950 rounded border border-stone-800">
                <div className="font-bold text-amber-400">git add -A</div>
                <div className="text-stone-400 text-[10px]">Stage all modified/untracked files</div>
              </div>
              <div className="p-2 bg-stone-950 rounded border border-stone-800">
                <div className="font-bold text-amber-400">git commit -m &quot;...&quot;</div>
                <div className="text-stone-400 text-[10px]">Record changes with message</div>
              </div>
              <div className="p-2 bg-stone-950 rounded border border-stone-800">
                <div className="font-bold text-amber-400">git log --graph --oneline</div>
                <div className="text-stone-400 text-[10px]">Visual commit lineage ASCII tree</div>
              </div>
              <div className="p-2 bg-stone-950 rounded border border-stone-800">
                <div className="font-bold text-amber-400">git stash pop</div>
                <div className="text-stone-400 text-[10px]">Restore shelved work from stash</div>
              </div>
              <div className="p-2 bg-stone-950 rounded border border-stone-800">
                <div className="font-bold text-amber-400">git diff</div>
                <div className="text-stone-400 text-[10px]">Show unstaged line changes</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
