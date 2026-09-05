import React, { useState } from 'react';
import { X, Flame, GitCommit, GitFork, Terminal, ShieldAlert, BookOpen, Layers } from 'lucide-react';
import { GitCommit as GitCommitType } from '../types';
import { soundFx } from '../utils/audio';

interface GitShrineModalProps {
  commitHistory: GitCommitType[];
  branch: string;
  isClean: boolean;
  onClose: () => void;
  onOpenCommit: () => void;
}

export const GitShrineModal: React.FC<GitShrineModalProps> = ({
  commitHistory,
  branch,
  isClean,
  onClose,
  onOpenCommit
}) => {
  const [activeTab, setActiveTab] = useState<'log' | 'internals' | 'terminal'>('log');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Welcome to the .git Inner Chamber terminal.',
    'Type "git status", "git log", "git branch", or "help" below.'
  ]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    soundFx.playButton();
    const cmd = terminalInput.trim().toLowerCase();
    const newLogs = [...terminalLogs, `$ ${terminalInput}`];

    if (cmd === 'help') {
      newLogs.push('Available spells:');
      newLogs.push('  git status      - inspect working tree condition');
      newLogs.push('  git log         - display sacred commit lineage');
      newLogs.push('  git branch      - list existing repository realms');
      newLogs.push('  git rev-parse   - inspect HEAD pointer');
      newLogs.push('  clear           - purge the terminal scroll');
    } else if (cmd === 'git status') {
      newLogs.push(`On branch ${branch}`);
      if (isClean) {
        newLogs.push('nothing to commit, working tree clean');
      } else {
        newLogs.push('Changes not staged for commit:');
        newLogs.push('  modified:   src/App.tsx');
        newLogs.push('  modified:   src/dialogue/elder.ts');
        newLogs.push('Untracked files:');
        newLogs.push('  assets/character.png');
        newLogs.push('use "git add <file>..." to update what will be committed');
      }
    } else if (cmd === 'git log' || cmd === 'git log --oneline') {
      commitHistory.forEach((c) => {
        newLogs.push(`* ${c.hash} (${branch}) ${c.message}`);
      });
    } else if (cmd === 'git branch') {
      newLogs.push(`* ${branch}`);
      newLogs.push('  feature/character-sprites');
      newLogs.push('  hotfix/waterfall-physics');
    } else if (cmd === 'git rev-parse head' || cmd === 'git rev-parse') {
      newLogs.push(commitHistory[0]?.hash ? `refs/heads/${branch} -> ${commitHistory[0].hash}` : 'HEAD: main');
    } else if (cmd === 'clear') {
      setTerminalLogs([]);
      setTerminalInput('');
      return;
    } else {
      newLogs.push(`git: '${cmd}' is not a known git spell. Type "help" for guidance.`);
    }

    setTerminalLogs(newLogs);
    setTerminalInput('');
  };

  return (
    <div
      id="git-shrine-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        id="git-shrine-box"
        className="relative w-full max-w-xl bg-stone-950 border-4 border-rose-900/80 rounded-xl shadow-2xl p-4 sm:p-6 text-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 50px rgba(225, 29, 72, 0.35), inset 0 0 25px rgba(159, 18, 57, 0.4)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-stone-800 pb-3 mb-4 font-pixelated">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-lg bg-stone-900 border border-amber-700/80 flex items-center justify-center text-amber-400 shadow-md">
              <Flame className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-pixel text-amber-300">GIT SHRINE</h2>
                <span className="px-2 py-0.5 bg-stone-950 border border-stone-700 text-stone-300 font-pixel text-[9px] rounded">
                  .git/
                </span>
              </div>
              <p className="text-[10px] font-pixelated text-stone-400">Sacred Heart of Immutable Version History</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playButton();
              onClose();
            }}
            className="p-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 border border-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-stone-800 mb-3 gap-1 text-[9px] font-pixel">
          <button
            onClick={() => {
              setActiveTab('log');
              soundFx.playButton();
            }}
            className={`px-3 py-1.5 rounded-t transition flex items-center gap-1.5 ${
              activeTab === 'log'
                ? 'bg-stone-900 text-amber-300 border-t-2 border-amber-600'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            Commit History ({commitHistory.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('internals');
              soundFx.playButton();
            }}
            className={`px-3 py-1.5 rounded-t transition flex items-center gap-1.5 ${
              activeTab === 'internals'
                ? 'bg-stone-900 text-amber-300 border-t-2 border-amber-600'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            .git Anatomy
          </button>
          <button
            onClick={() => {
              setActiveTab('terminal');
              soundFx.playButton();
            }}
            className={`px-3 py-1.5 rounded-t transition flex items-center gap-1.5 ${
              activeTab === 'terminal'
                ? 'bg-stone-900 text-amber-300 border-t-2 border-amber-600'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Shrine Terminal
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'log' && (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 font-pixelated">
            <div className="flex items-center justify-between px-2 py-1 bg-stone-900 rounded text-[10px] font-pixelated text-stone-400 border border-stone-800">
              <span>HEAD &rarr; refs/heads/{branch}</span>
              {!isClean && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCommit();
                  }}
                  className="text-amber-400 hover:underline font-pixel text-[8px]"
                >
                  + Commit Working Tree
                </button>
              )}
            </div>

            <div className="relative border-l-2 border-stone-800 ml-4 pl-4 space-y-3">
              {commitHistory.map((commit, idx) => (
                <div key={commit.hash} className="relative group font-pixelated">
                  {/* Node point */}
                  <div
                    className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                      idx === 0
                        ? 'bg-amber-700 border-amber-400'
                        : 'bg-stone-900 border-stone-700'
                    }`}
                  />
                  <div className="p-2.5 bg-stone-900/90 hover:bg-stone-850 border border-stone-800 hover:border-amber-700/60 rounded-lg transition">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-pixel text-[10px] text-amber-300 font-bold">{commit.hash}</span>
                      <span className="text-[10px] text-stone-400 font-pixelated">{commit.timestamp}</span>
                    </div>
                    <p className="text-xs font-pixelated text-stone-200 mt-1">{commit.message}</p>
                    <div className="text-[9px] text-stone-400 font-pixelated mt-1 flex items-center justify-between">
                      <span>Author: {commit.author}</span>
                      <span className="text-amber-400 font-pixel text-[8px]">branch: {commit.branch}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'internals' && (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs font-pixelated">
            <div className="p-2.5 bg-stone-900 rounded border border-stone-800">
              <div className="text-amber-300 font-pixel text-[10px] mb-1">.git/HEAD</div>
              <p className="text-stone-300 text-[11px]">
                A compass pointing to your current vantage point: <code>ref: refs/heads/{branch}</code>. Detached HEAD
                occurs when you step directly onto a past commit hash without a branch vessel!
              </p>
            </div>
            <div className="p-2.5 bg-stone-900 rounded border border-stone-800">
              <div className="text-amber-300 font-pixel text-[10px] mb-1">.git/objects/</div>
              <p className="text-stone-300 text-[11px]">
                The immutable cryptographic vault! Blobs (file data), Trees (directories), Commits (metadata + author +
                parents), and Annotated Tags. Every object is named by its SHA-1 hash.
              </p>
            </div>
            <div className="p-2.5 bg-stone-900 rounded border border-stone-800">
              <div className="text-amber-300 font-pixel text-[10px] mb-1">.git/index</div>
              <p className="text-stone-300 text-[11px]">
                The mystical staging area! A binary cache holding the blueprint of your upcoming commit. "git add" drafts
                files here.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="space-y-2 font-pixelated">
            <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 font-pixelated text-xs text-stone-200 h-48 overflow-y-auto space-y-1">
              {terminalLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>

            <form onSubmit={handleCommand} className="flex gap-2">
              <div className="flex-1 flex items-center bg-stone-950 border border-stone-700 rounded px-2 text-stone-200 font-pixelated text-xs">
                <span className="text-amber-400 mr-2">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="type git status, git log..."
                  className="w-full bg-transparent py-1.5 focus:outline-none text-stone-200 placeholder-stone-600 font-pixelated"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-amber-600 text-amber-200 font-pixel text-[9px] rounded transition"
              >
                Invoke
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
