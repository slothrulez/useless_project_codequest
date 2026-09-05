import React from 'react';
import { Compass, BookOpen, GitCommit, TrendingUp, FolderGit2 } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface BottomToolbarProps {
  activeModal: string | null;
  onOpenExplore: () => void;
  onOpenLearn: () => void;
  onOpenCommit: () => void;
  onOpenGrow: () => void;
  onOpenConnectRepo?: () => void;
  dirtyFilesCount: number;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  activeModal,
  onOpenExplore,
  onOpenLearn,
  onOpenCommit,
  onOpenGrow,
  onOpenConnectRepo,
  dirtyFilesCount
}) => {
  return (
    <div
      id="bottom-left-toolbar"
      className="absolute bottom-4 left-4 z-30 flex flex-col gap-1.5 select-none pointer-events-auto"
    >
      {/* Wooden Signboard Header decoration */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-stone-900/80 border-t border-x border-amber-900/60 rounded-t text-[9px] font-pixel text-amber-500/80 uppercase tracking-widest backdrop-blur-xs">
        <span>QUEST ACTIONS</span>
      </div>

      {/* Stacked Wooden Action Buttons */}
      <div className="flex flex-col gap-1.5 p-1.5 bg-stone-950/85 border-2 border-stone-800 rounded-b-lg rounded-tr-lg shadow-2xl backdrop-blur-md">
        {/* EXPLORE Button */}
        <button
          id="btn-explore"
          onClick={() => {
            soundFx.playButton();
            onOpenExplore();
          }}
          className={`relative group flex items-center justify-between w-36 sm:w-44 px-3 py-2 rounded font-pixel text-[10px] tracking-wider uppercase transition-all duration-150 border-2 ${
            activeModal === 'explore'
              ? 'bg-amber-600 border-amber-300 text-stone-950 shadow-md translate-y-0.5'
              : 'bg-stone-800 hover:bg-stone-700/90 border-stone-600 hover:border-amber-500/70 text-amber-200 shadow-sm active:translate-y-0.5'
          }`}
          style={{
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(0,0,0,0.25))'
          }}
        >
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
            <span>EXPLORE</span>
          </div>
          <span className="text-[8px] opacity-60 font-mono">[1]</span>
        </button>

        {/* LEARN Button */}
        <button
          id="btn-learn"
          onClick={() => {
            soundFx.playButton();
            onOpenLearn();
          }}
          className={`relative group flex items-center justify-between w-36 sm:w-44 px-3 py-2 rounded font-pixel text-[10px] tracking-wider uppercase transition-all duration-150 border-2 ${
            activeModal === 'learn'
              ? 'bg-amber-600 border-amber-300 text-stone-950 shadow-md translate-y-0.5'
              : 'bg-stone-800 hover:bg-stone-700/90 border-stone-600 hover:border-amber-500/70 text-amber-200 shadow-sm active:translate-y-0.5'
          }`}
          style={{
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(0,0,0,0.25))'
          }}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span>LEARN</span>
          </div>
          <span className="text-[8px] opacity-60 font-mono">[2]</span>
        </button>

        {/* COMMIT Button */}
        <button
          id="btn-commit"
          onClick={() => {
            soundFx.playButton();
            onOpenCommit();
          }}
          className={`relative group flex items-center justify-between w-36 sm:w-44 px-3 py-2 rounded font-pixel text-[10px] tracking-wider uppercase transition-all duration-150 border-2 ${
            activeModal === 'commit'
              ? 'bg-emerald-600 border-emerald-300 text-stone-950 shadow-md translate-y-0.5'
              : dirtyFilesCount > 0
              ? 'bg-amber-900/70 hover:bg-amber-800/80 border-amber-600 text-amber-100 shadow-sm animate-pulse'
              : 'bg-stone-800 hover:bg-stone-700/90 border-stone-600 hover:border-amber-500/70 text-amber-200 shadow-sm'
          }`}
          style={{
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(0,0,0,0.25))'
          }}
        >
          <div className="flex items-center gap-2">
            <GitCommit className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-90 transition-transform" />
            <span>COMMIT</span>
          </div>
          {dirtyFilesCount > 0 ? (
            <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono">
              {dirtyFilesCount}
            </span>
          ) : (
            <span className="text-[8px] opacity-60 font-mono">[3]</span>
          )}
        </button>

        {/* GROW Button */}
        <button
          id="btn-grow"
          onClick={() => {
            soundFx.playButton();
            onOpenGrow();
          }}
          className={`relative group flex items-center justify-between w-36 sm:w-44 px-3 py-2 rounded font-pixel text-[10px] tracking-wider uppercase transition-all duration-150 border-2 ${
            activeModal === 'grow'
              ? 'bg-amber-600 border-amber-300 text-stone-950 shadow-md translate-y-0.5'
              : 'bg-stone-800 hover:bg-stone-700/90 border-stone-600 hover:border-amber-500/70 text-amber-200 shadow-sm active:translate-y-0.5'
          }`}
          style={{
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(0,0,0,0.25))'
          }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400 group-hover:translate-y-[-2px] transition-transform" />
            <span>GROW</span>
          </div>
          <span className="text-[8px] opacity-60 font-mono">[4]</span>
        </button>

        {/* CONNECT REPO Button */}
        {onOpenConnectRepo && (
          <button
            id="btn-connect-repo"
            onClick={() => {
              soundFx.playButton();
              onOpenConnectRepo();
            }}
            className={`relative group flex items-center justify-between w-36 sm:w-44 px-3 py-2 rounded font-pixel text-[10px] tracking-wider uppercase transition-all duration-150 border-2 ${
              activeModal === 'connect'
                ? 'bg-amber-600 border-amber-300 text-stone-950 shadow-md translate-y-0.5'
                : 'bg-stone-800 hover:bg-stone-700/90 border-stone-600 hover:border-amber-500/70 text-amber-200 shadow-sm active:translate-y-0.5'
            }`}
            style={{
              backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(0,0,0,0.25))'
            }}
          >
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>REPO</span>
            </div>
            <span className="text-[8px] opacity-60 font-mono">[5]</span>
          </button>
        )}
      </div>
    </div>
  );
};
