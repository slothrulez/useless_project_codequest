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
          color: '#81c784',
          accentBg: 'rgba(129, 199, 132, 0.15)',
          description: commitsAhead > 0 ? 'Ready to synchronize with Git Shrine' : 'Your world is clean & in sync'
        };
      case 'dirty':
        return {
          text: `✗ Dirty`,
          color: '#ff7043',
          accentBg: 'rgba(255, 112, 67, 0.15)',
          description: 'Changes pending in working directory'
        };
      case 'conflict':
        return {
          text: '⚠ Merge Conflict',
          color: '#ef4444',
          accentBg: 'rgba(239, 68, 68, 0.25)',
          description: 'Reality collapse: conflicting branch'
        };
      case 'ahead':
        return {
          text: `↑ Ahead ${commitsAhead || 1} commit${(commitsAhead || 1) > 1 ? 's' : ''}`,
          color: '#38bdf8',
          accentBg: 'rgba(56, 189, 248, 0.2)',
          description: 'Ready to synchronize with Git Shrine'
        };
      case 'behind':
        return {
          text: `↓ Behind ${commitsBehind || 1} commit${(commitsBehind || 1) > 1 ? 's' : ''}`,
          color: '#fbbf24',
          accentBg: 'rgba(251, 191, 36, 0.2)',
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
      className={`fixed z-30 pointer-events-auto select-none transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
      style={{
        top: '10px',
        left: '10px',
        width: '330px',
        backgroundColor: isFlashing ? 'rgba(250, 204, 21, 0.25)' : 'rgba(15, 15, 15, 0.92)',
        borderRadius: '8px',
        padding: '11px 12px',
        border: isFlashing ? '1px solid #facc15' : '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: isFlashing
          ? '0 0 25px rgba(250, 204, 21, 0.9)'
          : gitStatus === 'conflict'
          ? '0 0 20px rgba(239, 68, 68, 0.5)'
          : gitStatus === 'ahead'
          ? '0 0 16px rgba(56, 189, 248, 0.35)'
          : '0 4px 20px rgba(0, 0, 0, 0.7)'
      }}
    >
      <div className="flex flex-col gap-1.5 font-mono">
        {/* Top line: Repository name and controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Repo:</span>
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
                className="font-bold truncate group-hover:text-cyan-200 transition"
                style={{
                  fontSize: '13px',
                  color: '#4dd0e1',
                  letterSpacing: '0.02em'
                }}
              >
                {repoName}
              </span>
              {onConnectRepo && (
                <FolderGit2 className="w-3 h-3 text-cyan-400/70 group-hover:text-cyan-300 shrink-0" />
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
                className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-cyan-300 transition"
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
                className="p-1 rounded hover:bg-stone-800 text-amber-400 hover:text-amber-200 transition"
                title="Git Scenario Playground"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Nature forest ambience toggle */}
            <button
              id="status-ambience-toggle"
              onClick={() => {
                onToggleAmbience();
                soundFx.playButton();
              }}
              className={`p-1 rounded transition ${
                isAmbienceActive
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                  : 'hover:bg-stone-800 text-stone-500 hover:text-stone-300'
              }`}
              title={isAmbienceActive ? 'Forest Ambience: Active' : 'Forest Ambience: Off'}
            >
              <Trees className="w-3.5 h-3.5" />
            </button>

            {/* Retro 8-bit sound effects toggle */}
            <button
              id="status-audio-toggle"
              onClick={() => {
                onToggleAudio();
                soundFx.playButton();
              }}
              className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition"
              title={isAudioMuted ? 'Unmute 8-bit sound' : 'Mute sound'}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          </div>
        </div>

        {/* Second line: Current branch and Difficulty / Achievements */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="text-stone-400 text-[11px]">Branch:</span>
            <span
              className="font-semibold"
              style={{
                fontSize: '12px',
                color: '#81c784'
              }}
            >
              {branch}
            </span>
            <button
              onClick={() => {
                soundFx.playButton();
                onSwitchBranch();
              }}
              className="text-[10px] text-cyan-400 hover:underline hover:text-cyan-300 transition ml-1"
              title="Switch or checkout branch"
            >
              [switch]
            </button>
          </div>

          <div className="flex items-center gap-1.5 relative">
            {/* Achievements button */}
            <button
              id="status-achievements-btn"
              onClick={() => {
                soundFx.playButton();
                onOpenAchievements();
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-[10px] transition font-bold"
              title="View unlocked achievements and developer rank"
            >
              <Award className="w-3 h-3 text-amber-400" />
              <span>{unlockedAchievementsCount}/{totalAchievementsCount}</span>
            </button>

            {/* Difficulty selector */}
            <button
              id="status-difficulty-btn"
              onClick={() => {
                soundFx.playButton();
                setShowDifficultyMenu((prev) => !prev);
              }}
              className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 text-[10px] capitalize transition"
              title={`Difficulty: ${difficulty} (Click to change)`}
            >
              {difficulty}
            </button>

            {/* Difficulty popup menu */}
            {showDifficultyMenu && (
              <div
                className="absolute right-0 top-6 z-50 bg-stone-900 border border-stone-700 rounded shadow-xl p-1.5 flex flex-col gap-1 w-32"
                onClick={(e) => e.stopPropagation()}
              >
                {(['easy', 'normal', 'hardcore'] as DifficultyLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      soundFx.playButton();
                      onSelectDifficulty(level);
                      setShowDifficultyMenu(false);
                    }}
                    className={`px-2 py-1 text-left text-[10px] rounded capitalize transition ${
                      difficulty === level
                        ? 'bg-cyan-950 text-cyan-200 font-bold border border-cyan-500/50'
                        : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Third line: Status: ✓ Clean | ✗ Dirty | ⚠ Merge Conflict | ↑ Ahead | ↓ Behind */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              soundFx.playButton();
              onCycleStatus();
            }}
            className={`flex-1 text-left rounded px-2 py-0.5 transition-all flex items-center justify-between border border-white/10 ${
              gitStatus === 'conflict' ? 'animate-pulse' : ''
            }`}
            style={{
              fontSize: '11px',
              color: statusInfo.color,
              backgroundColor: statusInfo.accentBg
            }}
            title="Click to cycle status or inspect details"
          >
            <span className="font-semibold">{statusInfo.text}</span>
            <span className="text-[9px] opacity-60">cycle</span>
          </button>

          {/* Action buttons if ahead or behind */}
          {gitStatus === 'ahead' && onPushRemote && (
            <button
              onClick={() => {
                soundFx.playPushSuccess();
                onPushRemote();
              }}
              className="px-2 py-0.5 bg-sky-900 hover:bg-sky-800 border border-sky-400 text-sky-200 text-[10px] rounded font-bold flex items-center gap-1 animate-pulse"
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
              className="px-2 py-0.5 bg-amber-900 hover:bg-amber-800 border border-amber-400 text-amber-200 text-[10px] rounded font-bold flex items-center gap-1 animate-pulse"
              title="Pull commits from Remote Origin"
            >
              <span>PULL</span>
            </button>
          )}
        </div>

        {/* Progression Stage & Goal Line */}
        {progressionStage && (
          <div className="bg-black/50 border border-white/5 rounded px-2 py-1 text-[10.5px]">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 font-semibold">{progressionStage.title}</span>
              <span className="text-[9px] text-stone-500">Goal:</span>
            </div>
            <div className="text-stone-300 text-[10px] mt-0.5 leading-tight text-amber-200/90 font-mono">
              &bull; {progressionStage.currentGoal}
            </div>
          </div>
        )}

        {/* Tutorial / Quest Hint Line (For Easy / Normal modes) */}
        {difficulty !== 'hardcore' && tutorialObjective && (
          <div className="bg-cyan-950/40 border border-cyan-800/40 rounded px-2 py-1 text-[10px] text-cyan-300 flex items-center gap-1.5 animate-pulse">
            <Compass className="w-3 h-3 shrink-0 text-cyan-400" />
            <span className="truncate">{tutorialObjective}</span>
          </div>
        )}

        {/* Uncommitted and Untracked counters */}
        <div className="grid grid-cols-2 gap-1 text-[11px] bg-black/40 rounded px-2 py-1 border border-white/5">
          <div className="text-stone-400">
            Uncommitted: <span className={uncommittedCount > 0 ? 'text-amber-400 font-semibold' : 'text-stone-300'}>{uncommittedCount}</span>
          </div>
          <div className="text-stone-400">
            Untracked: <span className={untrackedCount > 0 ? 'text-purple-400 font-semibold' : 'text-stone-300'}>{untrackedCount}</span>
          </div>
        </div>

        {/* Last commit summary */}
        <div className="flex flex-col text-[10.5px] leading-tight text-stone-400 border-t border-white/10 pt-1.5">
          <div className="truncate">
            <span className="text-stone-500">Last commit: </span>
            <span className="text-cyan-300 font-mono font-semibold">{lastCommit.hash}</span>
            <span className="text-stone-300"> - {lastCommit.message}</span>
          </div>
          <div className="truncate text-stone-500 text-[10px] mt-0.5">
            By <span className="text-stone-400">{lastCommit.author}</span>
          </div>
        </div>

        {/* Controls info */}
        <div className="flex items-center justify-between text-[10px] text-stone-500 pt-0.5 border-t border-white/5">
          <span>WASD / Arrows: Move</span>
          <span>E: Interact</span>
        </div>
      </div>
    </div>
  );
};
