import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Trees, UploadCloud, RefreshCw, Sparkles, FolderGit2, Award, Compass, HelpCircle } from 'lucide-react';
import { DifficultyLevel, GitStatusMode, ProgressionStageInfo, TutorialStep } from '../types';
import { soundFx } from '../utils/audio';

interface StatusPanelProps {
  repoName: string;
  repoPath?: string;
  branch: string;
  gitStatus: GitStatusMode;
  progressionStage?: ProgressionStageInfo;
  uncommittedCount: number;
  untrackedCount: number;
  commitsAhead: number;
  commitsBehind: number;
  lastCommit: {
    hash: string;
    message: string;
    author: string;
  };
  difficulty: DifficultyLevel;
  onSelectDifficulty: (difficulty: DifficultyLevel) => void;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  onOpenAchievements: () => void;
  tutorialStep?: TutorialStep;
  tutorialCompleted?: boolean;
  onRefreshStatus?: () => void;
  onCycleStatus: () => void;
  onSwitchBranch: () => void;
  onConnectRepo?: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  isAmbienceActive: boolean;
  onToggleAmbience: () => void;
  onPushRemote?: () => void;
  onPullRemote?: () => void;
  onOpenSimulate?: () => void;
  isVisible?: boolean;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  repoName,
  repoPath,
  branch,
  gitStatus,
  progressionStage,
  uncommittedCount,
  untrackedCount,
  commitsAhead,
  commitsBehind,
  lastCommit,
  difficulty,
  onSelectDifficulty,
  unlockedAchievementsCount,
  totalAchievementsCount,
  onOpenAchievements,
  tutorialStep,
  tutorialCompleted,
  onRefreshStatus,
  onCycleStatus,
  onSwitchBranch,
  onConnectRepo,
  isAudioMuted,
  onToggleAudio,
  isAmbienceActive,
  onToggleAmbience,
  onPushRemote,
  onPullRemote,
  onOpenSimulate,
  isVisible = true
}) => {
  // 100ms Yellow flash highlight on Git status change
  const prevStatusRef = useRef<GitStatusMode>(gitStatus);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState<boolean>(false);

  useEffect(() => {
    if (prevStatusRef.current !== gitStatus) {
      prevStatusRef.current = gitStatus;
      setIsFlashing(true);
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [gitStatus]);

  // Status line text & styling based on gitStatus
  const getStatusDisplay = () => {
    switch (gitStatus) {
      case 'clean':
        return {
          text: commitsAhead > 0 ? `✓ Clean, ↑ ${commitsAhead} ahead` : '✓ Clean, ↕ In sync',
          color: '#a7f3d0',
          accentBg: 'rgba(6, 78, 59, 0.45)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          description: commitsAhead > 0 ? 'Ready to synchronize with Git Shrine' : 'Your world is clean & in sync'
        };
      case 'dirty':
        return {
          text: `✗ Dirty (${uncommittedCount} uncommitted)`,
          color: '#fcd34d',
          accentBg: 'rgba(120, 53, 15, 0.45)',
          border: '1px solid rgba(217, 119, 6, 0.4)',
          description: 'Changes pending in working directory'
        };
      case 'conflict':
        return {
          text: '⚠ Merge Conflict',
          color: '#fca5a5',
          accentBg: 'rgba(136, 19, 55, 0.5)',
          border: '1px solid rgba(225, 29, 72, 0.45)',
          description: 'Reality collapse: conflicting branch'
        };
      case 'ahead':
        return {
          text: `↑ Ahead ${commitsAhead || 1} commit${(commitsAhead || 1) > 1 ? 's' : ''}`,
          color: '#bae6fd',
          accentBg: 'rgba(12, 74, 110, 0.45)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          description: 'Ready to synchronize with Git Shrine'
        };
      case 'behind':
        return {
          text: `↓ Behind ${commitsBehind || 1} commit${(commitsBehind || 1) > 1 ? 's' : ''}`,
          color: '#fed7aa',
          accentBg: 'rgba(124, 45, 18, 0.45)',
          border: '1px solid rgba(249, 115, 22, 0.35)',
          description: 'Pull updates at Remote Origin'
        };
    }
  };

  const statusInfo = getStatusDisplay();

  // Tutorial objective text helper
  const getTutorialObjective = () => {
    if (tutorialCompleted) return null;
    switch (tutorialStep) {
      case 'welcome':
      case 'walk_to_docs':
        return 'Quest: Walk southeast to the DOCS Library';
      case 'learn_git':
        return 'Quest: Talk with the DOCS Archivist to learn Git';
      case 'make_commit':
        return 'Quest: Visit Main Plaza or Forge to make a commit';
      case 'elder_after_commit':
        return 'Quest: Talk to The Elder at the Stone Chamber';
      case 'visit_shrine':
        return 'Quest: Visit the sacred Git Shrine to push';
      default:
        return null;
    }
  };

  const tutorialObjective = getTutorialObjective();

  return (
    <div
      id="status-panel"
      className={`relative w-full z-10 pointer-events-auto select-none transition-all duration-300 font-pixelated ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
      style={{
        backgroundColor: isFlashing ? 'rgba(41, 37, 36, 0.98)' : 'rgba(20, 18, 16, 0.94)',
        borderRadius: '8px',
        padding: '11px 12px',
        border: isFlashing ? '1px solid #d97706' : '1px solid rgba(120, 113, 108, 0.3)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)'
      }}
    >
      <div className="flex flex-col gap-1.5 font-pixelated">
        {/* Top line: Repository name and controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold font-pixel text-[8px]">REPO:</span>
            <button
              onClick={() => {
                if (onConnectRepo) {
                  soundFx.playButton();
                  onConnectRepo();
                }
              }}
              className="flex items-center gap-1 hover:underline text-left truncate group focus:outline-none"
              title={repoPath ? `Repository: ${repoPath} (Click to switch or connect)` : `${repoName} (Click to connect)`}
            >
              <span
                className="font-bold truncate text-amber-200 group-hover:text-amber-100 transition text-xs"
              >
                {repoName}
              </span>
              {onConnectRepo && (
                <FolderGit2 className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-300 shrink-0" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Poll/Refresh Trigger */}
            {onRefreshStatus && (
              <button
                id="status-refresh-btn"
                onClick={() => {
                  onRefreshStatus();
                  soundFx.playButton();
                }}
                className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
                title="Poll & refresh Git repository state"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Test Simulation Trigger */}
            {onOpenSimulate && (
              <button
                id="status-simulate-btn"
                onClick={() => {
                  onOpenSimulate();
                  soundFx.playButton();
                }}
                className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-amber-300 transition"
                title="Git Scenario Playground"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Second line: Current branch */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="text-stone-400 text-[10px]">Branch:</span>
            <span
              className="font-semibold text-emerald-300 text-xs"
            >
              {branch}
            </span>
            <button
              onClick={() => {
                soundFx.playButton();
                onSwitchBranch();
              }}
              className="text-[9px] text-stone-400 hover:underline hover:text-amber-300 transition ml-1"
              title="Switch or checkout branch"
            >
              [switch]
            </button>
          </div>
        </div>

        {/* Third line: Status pill: Clean | Dirty | Merge Conflict | Ahead | Behind */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              soundFx.playButton();
              onCycleStatus();
            }}
            className="flex-1 text-left rounded px-2.5 py-1 transition-all flex items-center justify-between"
            style={{
              fontSize: '11px',
              color: statusInfo.color,
              backgroundColor: statusInfo.accentBg,
              border: statusInfo.border
            }}
            title="Click to cycle status or inspect details"
          >
            <span className="font-semibold">{statusInfo.text}</span>
            <span className="text-[9px] opacity-60 text-stone-400">[cycle]</span>
          </button>

          {/* Action buttons if ahead or behind */}
          {gitStatus === 'ahead' && onPushRemote && (
            <button
              onClick={() => {
                soundFx.playPushSuccess();
                onPushRemote();
              }}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 border border-sky-700 text-sky-200 text-[10px] rounded font-bold flex items-center gap-1 transition"
              title="Push commits upstream to Remote Origin"
            >
              <UploadCloud className="w-3 h-3" />
              <span>PUSH</span>
            </button>
          )}

          {gitStatus === 'behind' && onPullRemote && (
            <button
              onClick={() => {
                soundFx.playPushSuccess();
                onPullRemote();
              }}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 border border-amber-700 text-amber-200 text-[10px] rounded font-bold flex items-center gap-1 transition"
              title="Pull commits from Remote Origin"
            >
              <span>PULL</span>
            </button>
          )}
        </div>

        {/* Progression Stage & Goal Line */}
        {progressionStage && (
          <div className="bg-stone-900/90 border border-stone-800 rounded px-2 py-1 text-[10.5px]">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 font-semibold">{progressionStage.title}</span>
              <span className="text-[9px] text-stone-500 font-pixel text-[8px]">GOAL</span>
            </div>
            <div className="text-stone-300 text-[10px] mt-0.5 leading-tight text-amber-200/90">
              &bull; {progressionStage.currentGoal}
            </div>
          </div>
        )}

        {/* Tutorial / Quest Hint Line (For Easy / Normal modes) */}
        {difficulty !== 'hardcore' && tutorialObjective && (
          <div className="bg-stone-900/90 border border-stone-800 rounded px-2 py-1 text-[10px] text-stone-300 flex items-center gap-1.5">
            <Compass className="w-3 h-3 shrink-0 text-amber-400" />
            <span className="truncate">{tutorialObjective}</span>
          </div>
        )}

        {/* Uncommitted and Untracked counters */}
        <div className="grid grid-cols-2 gap-1 text-[11px] bg-stone-900/90 rounded px-2 py-1 border border-stone-800">
          <div className="text-stone-400">
            Uncommitted: <span className={uncommittedCount > 0 ? 'text-amber-300 font-semibold' : 'text-stone-300'}>{uncommittedCount}</span>
          </div>
          <div className="text-stone-400">
            Untracked: <span className={untrackedCount > 0 ? 'text-stone-300 font-semibold' : 'text-stone-400'}>{untrackedCount}</span>
          </div>
        </div>

        {/* Last commit summary */}
        <div className="flex flex-col text-[10.5px] leading-tight text-stone-400 border-t border-stone-800 pt-1.5">
          <div className="truncate">
            <span className="text-stone-500">Last commit: </span>
            <span className="text-amber-300 font-semibold">{lastCommit.hash}</span>
            <span className="text-stone-300"> - {lastCommit.message}</span>
          </div>
          <div className="truncate text-stone-500 text-[10px] mt-0.5">
            By <span className="text-stone-400">{lastCommit.author}</span>
          </div>
        </div>

        {/* Controls info */}
        <div className="flex items-center justify-between text-[9px] text-stone-500 pt-0.5 border-t border-stone-800">
          <span>WASD / ARROWS: MOVE</span>
          <span>E: INTERACT</span>
        </div>
      </div>
    </div>
  );
};
