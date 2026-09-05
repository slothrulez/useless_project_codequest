import React, { useState } from 'react';
import { X, GitCommit, Check, Sparkles, FileText, AlertCircle } from 'lucide-react';
import { GitFile, GitCommit as GitCommitType } from '../types';
import { soundFx } from '../utils/audio';
import { gitApi } from '../utils/gitApi';

interface CommitForgeModalProps {
  files: GitFile[];
  branch: string;
  isClean: boolean;
  onCommitSuccess: (newCommit: GitCommitType) => void;
  onClose: () => void;
}

export const CommitForgeModal: React.FC<CommitForgeModalProps> = ({
  files,
  branch,
  isClean,
  onCommitSuccess,
  onClose
}) => {
  const [fileList, setFileList] = useState<GitFile[]>(files);
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<GitFile | null>(files[0] || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleStage = (fileToToggle: GitFile) => {
    soundFx.playButton();
    setFileList((prev) =>
      prev.map((f) => {
        if (f.path === fileToToggle.path) {
          const nextStatus = f.status === 'staged' ? 'modified' : 'staged';
          return { ...f, status: nextStatus };
        }
        return f;
      })
    );
  };

  const stageAll = () => {
    soundFx.playButton();
    setFileList((prev) => prev.map((f) => ({ ...f, status: 'staged' })));
  };

  const stagedCount = fileList.filter((f) => f.status === 'staged').length;

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await gitApi.commit(commitMessage.trim());

      if (res.success) {
        soundFx.playCommitSuccess();
        setSuccessMsg(res.message || 'Changes committed successfully!');

        const newCommit: GitCommitType = {
          hash: res.status?.currentCommit?.hash || Math.random().toString(16).substring(2, 9),
          message: commitMessage.trim(),
          author: res.status?.currentCommit?.author || 'CodeQuest Hero',
          timestamp: 'just now',
          branch
        };

        setTimeout(() => {
          onCommitSuccess(newCommit);
          onClose();
        }, 700);
      } else {
        setErrorMsg(res.error || 'Failed to execute git commit.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with Git service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickMessages = [
    'feat: implement Gorillaz 16x16 sprite animation',
    'fix: extinguish merge conflicts at the Git Shrine',
    'docs: record ancient Elder wisdom scrolls',
    'style: illuminate village torches with pixel glow'
  ];

  return (
    <div
      id="commit-forge-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        id="commit-forge-box"
        className="relative w-full max-w-2xl bg-stone-900 border-4 border-emerald-800/90 rounded-xl shadow-2xl p-4 sm:p-6 text-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 40px rgba(16, 185, 129, 0.25), inset 0 0 20px rgba(0,0,0,0.8)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <GitCommit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-pixel text-amber-300">COMMIT STATION</h2>
                <span className="px-2 py-0.5 bg-stone-950 border border-stone-700 text-stone-300 font-pixel text-[9px] rounded">
                  Branch: {branch}
                </span>
              </div>
              <p className="text-[10px] font-pixelated text-stone-400">git add . && git commit -m "[message]"</p>
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

        {isClean && fileList.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-stone-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-pixel text-xs text-emerald-300 mb-1">WORKING TREE CLEAN!</h3>
            <p className="text-xs font-pixelated text-stone-400 max-w-sm mx-auto">
              All repository changes are committed. Roam freely, seek quests from the Elder, or visit the Git Shrine!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Left Column: Files list & staging */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-pixelated">
                <span className="font-pixel text-[9px] text-stone-400">
                  UNCOMMITTED FILES ({fileList.length})
                </span>
                <button
                  onClick={stageAll}
                  className="text-[9px] font-pixel text-emerald-400 hover:underline"
                >
                  Stage All [git add .]
                </button>
              </div>

              <div className="bg-stone-950 border border-stone-800 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1.5">
                {fileList.map((file) => (
                  <div
                    key={file.path}
                    onClick={() => {
                      soundFx.playButton();
                      setSelectedFile(file);
                    }}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs font-pixelated transition border ${
                      selectedFile?.path === file.path
                        ? 'bg-stone-800 border-amber-600 text-amber-200'
                        : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 shrink-0 text-stone-500" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[8px] uppercase px-1.5 py-0.5 rounded font-pixel ${
                          file.status === 'staged'
                            ? 'bg-stone-950 text-emerald-300 border border-emerald-800/80'
                            : file.status === 'untracked'
                            ? 'bg-stone-950 text-stone-300 border border-stone-700'
                            : 'bg-stone-950 text-amber-300 border border-amber-800/80'
                        }`}
                      >
                        {file.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStage(file);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-pixel transition ${
                          file.status === 'staged'
                            ? 'bg-stone-800 hover:bg-stone-700 text-stone-400'
                            : 'bg-stone-800 hover:bg-stone-700 text-emerald-300 border border-emerald-800/60'
                        }`}
                        title={file.status === 'staged' ? 'Unstage' : 'Stage file'}
                      >
                        {file.status === 'staged' ? 'unstage' : 'stage'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Diff Preview */}
            <div className="space-y-2 flex flex-col">
              <div className="font-pixel text-[9px] text-stone-400 flex items-center justify-between">
                <span>DIFF PREVIEW</span>
                <span className="text-stone-500 font-pixelated text-[9px] truncate max-w-[150px]">
                  {selectedFile ? selectedFile.path : 'None selected'}
                </span>
              </div>
              <div className="flex-1 bg-stone-950 border border-stone-800 rounded-lg p-3 font-pixelated text-[11px] overflow-auto max-h-48 text-stone-300">
                {selectedFile ? (
                  <pre className="whitespace-pre-wrap leading-relaxed text-xs">
                    {selectedFile.diff || `--- a/${selectedFile.path}\n+++ b/${selectedFile.path}\n@@ -1,1 +1,1 @@\n+ [Modified file changes in repository]`}
                  </pre>
                ) : (
                  <span className="text-stone-600">Select a file to preview git diff</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-3 p-2.5 rounded bg-stone-950 border border-rose-800 text-xs font-pixelated text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 rounded bg-stone-950 border border-emerald-800 text-xs font-pixelated text-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Commit Form */}
        <form onSubmit={handleCommit} className="space-y-3 border-t border-stone-800 pt-3">
          <div>
            <label className="block text-[10px] font-pixel text-stone-400 mb-1.5">
              COMMIT MESSAGE [git commit -m "..."]
            </label>
            <div className="relative">
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="e.g. feat: awaken ancient code relic"
                className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-pixelated text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
              />
              <span className="absolute right-2.5 top-2.5 text-[10px] font-pixel text-stone-600">
                {commitMessage.length}/72
              </span>
            </div>
          </div>

          {/* Quick preset messages */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[9px] font-pixel text-stone-500 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Presets:
            </span>
            {quickMessages.map((msg) => (
              <button
                key={msg}
                type="button"
                onClick={() => {
                  soundFx.playButton();
                  setCommitMessage(msg);
                }}
                className="text-[9px] font-pixelated bg-stone-800 hover:bg-stone-700 hover:text-amber-300 text-stone-400 px-2 py-0.5 rounded border border-stone-700 transition"
              >
                {msg.slice(0, 32)}...
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] font-pixelated text-stone-500">
              {fileList.length > 0
                ? `${fileList.length} change${fileList.length === 1 ? '' : 's'} will be packaged`
                : 'Repository is clean'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playButton();
                  onClose();
                }}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs font-pixelated rounded transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!commitMessage.trim() || isSubmitting}
                className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 border border-amber-600 text-amber-200 disabled:opacity-50 disabled:border-stone-700 disabled:text-stone-600 font-pixel text-[9px] font-bold rounded shadow-lg transition flex items-center gap-1.5"
              >
                <GitCommit className="w-3.5 h-3.5 text-amber-400" />
                <span>{isSubmitting ? 'COMMITTING...' : 'FORGE COMMIT'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
