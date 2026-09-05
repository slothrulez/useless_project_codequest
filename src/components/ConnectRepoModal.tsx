import React, { useState } from 'react';
import { FolderGit2, X, Check, Loader2, HardDrive, Terminal, Sparkles, AlertCircle } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { gitApi } from '../utils/gitApi';

interface ConnectRepoModalProps {
  currentPath: string;
  currentRepoName: string;
  remoteUrl: string;
  onConnected: (repoInfo: { name: string; path: string; remoteURL: string }) => void;
  onClose: () => void;
}

export const ConnectRepoModal: React.FC<ConnectRepoModalProps> = ({
  currentPath,
  currentRepoName,
  remoteUrl,
  onConnected,
  onClose
}) => {
  const [repoPath, setRepoPath] = useState(currentPath || '/Users/anirudh/Projects/my-project');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConnect = async (targetPath: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    soundFx.playInteract();

    // Visual analyzer steps for rich feedback
    setAnalysisStep('Querying Git analyzer for metadata...');
    await new Promise((r) => setTimeout(r, 200));
    setAnalysisStep('Parsing branches & status porcelain...');
    await new Promise((r) => setTimeout(r, 200));

    try {
      const res = await gitApi.connectRepo(targetPath);
      if (res.success && res.repo) {
        setAnalysisStep('Repository metadata synchronized!');
        soundFx.playPushSuccess();
        await new Promise((r) => setTimeout(r, 250));
        onConnected(res.repo);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to connect to specified repository path.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBrowseNative = async () => {
    try {
      // Modern Web File System Access API
      if ('showDirectoryPicker' in window) {
        soundFx.playButton();
        const dirHandle = await (window as any).showDirectoryPicker();
        if (dirHandle && dirHandle.name) {
          const selectedName = dirHandle.name;
          const inferredPath = `/Users/anirudh/Projects/${selectedName}`;
          setRepoPath(inferredPath);
          await handleConnect(inferredPath);
        }
      } else {
        // Fallback
        handleConnect(repoPath);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMsg('Directory selection cancelled or not accessible.');
      }
    }
  };

  return (
    <div
      id="connect-repo-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="connect-repo-modal"
        className="relative w-full max-w-lg bg-stone-900 border-4 border-amber-600/90 rounded-2xl shadow-2xl p-6 text-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 50px rgba(217, 119, 6, 0.25), inset 0 0 30px rgba(0,0,0,0.85)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-500/80 flex items-center justify-center text-amber-400">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-pixel text-amber-300">CONNECT LOCAL REPOSITORY</h2>
              <p className="text-[11px] font-mono text-stone-400">
                Git Analyzer Initialization & Sync
              </p>
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

        {/* Current Repository Card */}
        <div className="mb-5 p-3.5 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-pixel text-stone-500 uppercase">Current Active Repository:</span>
            <span className="flex items-center gap-1 text-[10px] font-pixel text-emerald-400">
              <Check className="w-3 h-3" /> CONNECTED
            </span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-mono font-bold text-amber-200 truncate">{currentRepoName}</span>
          </div>
          <div className="text-[11px] font-mono text-stone-400 truncate bg-stone-900/90 px-2 py-1 rounded border border-stone-800/80">
            Path: {currentPath || process.cwd()}
          </div>
          <div className="text-[10px] font-mono text-stone-500 truncate">
            Remote: {remoteUrl || 'git@github.com:anirudh/my-project.git'}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded bg-red-950/80 border border-red-700 text-xs font-mono text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Path selection / input */}
        <div className="space-y-3 mb-5">
          <label className="block text-[10px] font-pixel text-stone-400">
            LOCAL REPOSITORY PATH:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Terminal className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
              <input
                type="text"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                placeholder="/Users/anirudh/Projects/my-project"
                disabled={isAnalyzing}
                className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-stone-200 placeholder-stone-600 focus:outline-none"
              />
            </div>
            <button
              onClick={handleBrowseNative}
              disabled={isAnalyzing}
              className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 text-xs font-mono rounded-lg transition shrink-0"
              title="Browse folder via browser file system picker"
            >
              Browse...
            </button>
          </div>
        </div>

        {/* Analyzer Loading Progress */}
        {isAnalyzing && (
          <div className="mb-4 p-3 rounded-lg bg-amber-950/40 border border-amber-700/60 text-xs font-mono text-amber-300 flex items-center gap-2.5 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <span>{analysisStep}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
          <button
            onClick={() => handleConnect(process.cwd())}
            disabled={isAnalyzing}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono rounded-lg border border-stone-700 transition"
          >
            Reset to Workspace
          </button>
          <button
            onClick={() => handleConnect(repoPath)}
            disabled={isAnalyzing || !repoPath.trim()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-pixel text-[9px] font-bold rounded-lg transition flex items-center gap-1.5 shadow-lg shadow-amber-900/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Connect & Analyze</span>
          </button>
        </div>
      </div>
    </div>
  );
};
