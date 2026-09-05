import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { StatusPanel } from './components/StatusPanel';
import { DialogueBox, DialogueData } from './components/DialogueBox';
import { MovementIndicator } from './components/MovementIndicator';
import { BottomToolbar } from './components/BottomToolbar';
import { ElderDialogModal } from './components/ElderDialogModal';
import { GitShrineModal } from './components/GitShrineModal';
import { HouseDialogModal } from './components/HouseDialogModal';
import { CommitForgeModal } from './components/CommitForgeModal';
import { LearnCodexModal } from './components/LearnCodexModal';
import { GrowSkillsModal } from './components/GrowSkillsModal';
import { ExploreModal } from './components/ExploreModal';
import { BranchSwitchModal } from './components/BranchSwitchModal';
import { TouchControls } from './components/TouchControls';
import { MergeConflictBossModal } from './components/MergeConflictBossModal';
import { GitPlaygroundModal } from './components/GitPlaygroundModal';
import { NotificationToast } from './components/NotificationToast';
import { ConnectRepoModal } from './components/ConnectRepoModal';
import {
  Achievement,
  DifficultyLevel,
  Direction,
  GameLocation,
  GitCommit,
  GitFile,
  GitStatusMode,
  PlayerStats,
  Position,
  RealGitStatus,
  GameState,
  GameNotification,
  TutorialStep
} from './types';
import { INITIAL_COMMIT_HISTORY, INITIAL_GIT_FILES } from './data/mapData';
import { soundFx } from './utils/audio';
import { gitApi } from './utils/gitApi';
import {
  getElderDialogue,
  getGitShrineDialogue,
  getDocsLibraryDialogue,
  getDocsTopicDialogue,
  getMainPlazaDialogue,
  getRemoteOriginDialogue,
  getProgressionStage
} from './utils/dialogueTree';

const SESSION_STORAGE_KEY = 'codequest_rpg_session_v3';

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'initiate',
    title: 'Initiate',
    description: 'Forged your first commit into the immutable Git chronicle.',
    unlocked: false,
    icon: 'flame'
  },
  {
    id: 'synchronize',
    title: 'Synchronize',
    description: 'Pushed your local commits upstream to remote origin.',
    unlocked: false,
    icon: 'sparkles'
  },
  {
    id: 'peace_maker',
    title: 'Peace Maker',
    description: 'Resolved a dimensional merge conflict and restored reality.',
    unlocked: false,
    icon: 'shield'
  },
  {
    id: 'productive',
    title: 'Productive',
    description: 'Forged 10 or more atomic commits into repository history.',
    unlocked: false,
    icon: 'hammer'
  },
  {
    id: 'organized',
    title: 'Organized',
    description: 'Maintained a clean working tree without untracked files for 1 hour.',
    unlocked: false,
    icon: 'award'
  }
];

function loadSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse saved session:', e);
  }
  return null;
}

export default function App() {
  const initialSession = useRef(loadSavedSession()).current;

  // Real Git status from Express server
  const [realGit, setRealGit] = useState<RealGitStatus | null>(null);

  // Difficulty and Tutorial states from persistence
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    initialSession?.difficulty || 'normal'
  );
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(
    initialSession?.tutorialStep || 'welcome'
  );
  const [tutorialCompleted, setTutorialCompleted] = useState<boolean>(
    Boolean(initialSession?.tutorialCompleted)
  );

  // Central GameState matching Follow-up Prompt 8 & 10 specification
  const [gameState, setGameState] = useState<GameState>({
    repo: {
      name: initialSession?.repoName || 'codequest-repo',
      path: initialSession?.repoPath || '/app/applet',
      remoteURL: initialSession?.remoteURL || 'git@github.com:anirudh/codequest-repo.git'
    },
    git: {
      branch: 'main',
      isClean: false,
      uncommittedChanges: ['src/App.tsx', 'README.md'],
      untrackedFiles: [],
      commitsAheadOfRemote: 0,
      commitsBehindRemote: 0,
      lastCommit: {
        hash: 'a1b2c3d',
        message: 'feat: Initial commit of CodeQuest RPG world',
        author: 'Anirudh',
        date: 'just now'
      },
      hasMergeConflict: false,
      conflictFiles: []
    },
    gameData: {
      playerPosition: initialSession?.playerPosition || { x: 700, y: 690 },
      playerFacingDirection: initialSession?.playerFacingDirection || 'down',
      visitedLocations: initialSession?.visitedLocations || ['plaza'],
      completedActions: initialSession?.completedActions || [],
      lastInteraction: initialSession?.lastInteraction || null,
      tutorialStep: initialSession?.tutorialStep || 'welcome',
      difficulty: initialSession?.difficulty || 'normal',
      cleanStartTime: null,
      totalCleanTimeSeconds: initialSession?.totalCleanTimeSeconds || 0
    }
  });

  // Notification queue system
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const prevGitRef = useRef<{ isClean: boolean; commitsAhead: number; hasConflict: boolean } | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  // Fallback / Local mirror state
  const [repoName, setRepoName] = useState(initialSession?.repoName || 'codequest-repo');
  const [branch, setBranch] = useState('main');
  const [branches, setBranches] = useState(['main', 'develop', 'feature/gorillaz-sprites']);
  const [gitFiles, setGitFiles] = useState<GitFile[]>(INITIAL_GIT_FILES);
  const [commitHistory, setCommitHistory] = useState<GitCommit[]>(INITIAL_COMMIT_HISTORY);
  const [gitStatus, setGitStatus] = useState<GitStatusMode>('dirty');

  // Notification helper
  const addNotification = useCallback(
    (type: 'success' | 'error' | 'info', message: string, suggestion?: string, retryAction?: () => void) => {
      const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setNotifications((prev) => [
        {
          id,
          type,
          message,
          suggestion,
          retryAction,
          timestamp: Date.now(),
          duration: type === 'error' ? 5500 : 4000
        },
        ...prev.slice(0, 4)
      ]);
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Unlock achievement helper
  const unlockAchievement = useCallback((id: string) => {
    setStats((prev) => {
      const target = prev.achievements.find((a) => a.id === id);
      if (target && !target.unlocked) {
        soundFx.playPushSuccess();
        addNotification('success', `🏆 Achievement Unlocked: ${target.title}!`, target.description);
        return {
          ...prev,
          achievements: prev.achievements.map((a) => (a.id === id ? { ...a, unlocked: true } : a))
        };
      }
      return prev;
    });
  }, [addNotification]);

  // Player RPG stats & achievements
  const [stats, setStats] = useState<PlayerStats>(() => {
    if (initialSession?.stats) {
      const savedAchs: Achievement[] = initialSession.stats.achievements || [];
      const merged = DEFAULT_ACHIEVEMENTS.map((def) => {
        const found = savedAchs.find((s) => s.id === def.id);
        return found ? { ...def, unlocked: found.unlocked } : def;
      });
      return {
        ...initialSession.stats,
        achievements: merged
      };
    }
    return {
      level: 1,
      xp: 45,
      commitsCount: 1,
      shrineVisits: 0,
      elderWisdomFound: 0,
      achievements: DEFAULT_ACHIEVEMENTS
    };
  });

  // Modal & dialogue states
  const [dialogue, setDialogue] = useState<DialogueData | null>(null);
  const [activeModal, setActiveModal] = useState<
    'elder' | 'git_shrine' | 'house' | 'explore' | 'learn' | 'commit' | 'grow' | 'branch' | 'conflict' | 'simulate' | 'connect' | null
  >(null);
  const [activeLocation, setActiveLocation] = useState<GameLocation | null>(null);
  const [nearLocation, setNearLocation] = useState<GameLocation | null>(null);

  // Movement & navigation
  const [externalMoveDir, setExternalMoveDir] = useState<Direction | null>(null);
  const [movementState, setMovementState] = useState<{
    isMoving: boolean;
    activeKeys: { up: boolean; down: boolean; left: boolean; right: boolean };
  }>({
    isMoving: false,
    activeKeys: { up: false, down: false, left: false, right: false }
  });
  const [teleportTarget, setTeleportTarget] = useState<Position | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isAmbienceActive, setIsAmbienceActive] = useState(false);
  const [celebrationTimestamp, setCelebrationTimestamp] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);

  // Save session helper to localStorage
  useEffect(() => {
    try {
      const sessionToSave = {
        playerPosition: gameState.gameData.playerPosition,
        playerFacingDirection: gameState.gameData.playerFacingDirection,
        visitedLocations: gameState.gameData.visitedLocations,
        completedActions: gameState.gameData.completedActions,
        lastInteraction: gameState.gameData.lastInteraction,
        stats,
        difficulty,
        tutorialStep,
        tutorialCompleted,
        totalCleanTimeSeconds: gameState.gameData.totalCleanTimeSeconds,
        repoName,
        repoPath: gameState.repo.path,
        remoteURL: gameState.repo.remoteURL
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionToSave));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  }, [gameState, stats, difficulty, tutorialStep, tutorialCompleted, repoName]);

  // Close dialogue helper
  const closeDialogue = useCallback(() => {
    setDialogue(null);
  }, []);

  // Git state synchronization function
  const syncGitState = useCallback(async () => {
    try {
      const status = await gitApi.fetchStatus();
      if (status) {
        setRealGit(status);
        setRepoName(status.repoName);
        setBranch(status.currentBranch);
        setBranches(status.branches.length > 0 ? status.branches : ['main']);
        setGitStatus(status.status);

        // Update unified gameState object
        setGameState((prev) => ({
          repo: {
            name: status.repoName,
            path: (status as any).repoPath || prev.repo.path,
            remoteURL: status.remoteUrl || prev.repo.remoteURL
          },
          git: {
            branch: status.currentBranch,
            isClean: status.status === 'clean',
            uncommittedChanges: status.uncommittedChanges.map((u) => u.file),
            untrackedFiles: status.untrackedFiles,
            commitsAheadOfRemote: status.commitsAhead,
            commitsBehindRemote: status.commitsBehind,
            lastCommit: {
              hash: status.currentCommit?.hash || prev.git.lastCommit.hash,
              message: status.currentCommit?.message || prev.git.lastCommit.message,
              author: status.currentCommit?.author || prev.git.lastCommit.author,
              date: status.currentCommit?.date || prev.git.lastCommit.date
            },
            hasMergeConflict: Boolean(status.hasConflict),
            conflictFiles: status.conflictingFiles || []
          },
          gameData: {
            ...prev.gameData,
            difficulty,
            tutorialStep
          }
        }));

        // Notifications on status change during 2-second polling cycle
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          addNotification(
            'info',
            `ℹ Connected to local repository: ${status.repoName} [${status.currentBranch}]`
          );
        } else if (prevGitRef.current) {
          const prev = prevGitRef.current;
          const nowClean = status.status === 'clean';
          if (!prev.isClean && nowClean) {
            addNotification('success', '✓ Working tree is clean and synchronized.');
          } else if (prev.isClean && !nowClean) {
            addNotification(
              'info',
              `ℹ Working tree modified: ${status.uncommittedChanges.length} uncommitted file(s).`
            );
          }
          if (!prev.hasConflict && status.hasConflict) {
            addNotification(
              'error',
              '✗ Reality collapsed! A merge conflict occurred.',
              'Resolve conflicts with the Merge Conflict Boss or the Git Shrine.'
            );
          }
          if (status.commitsAhead > prev.commitsAhead) {
            addNotification(
              'info',
              `↑ Ahead of origin by ${status.commitsAhead} commit(s). Ready to push at the Git Shrine!`
            );
          }
        }

        prevGitRef.current = {
          isClean: status.status === 'clean',
          commitsAhead: status.commitsAhead,
          hasConflict: Boolean(status.hasConflict)
        };

        // Map files to GitFile shape
        const combinedFiles: GitFile[] = [
          ...status.uncommittedChanges.map((u) => ({
            name: u.file.split('/').pop() || u.file,
            path: u.file,
            status: u.status === 'staged' ? ('staged' as const) : ('modified' as const)
          })),
          ...status.untrackedFiles.map((f) => ({
            name: f.split('/').pop() || f,
            path: f,
            status: 'untracked' as const
          }))
        ];
        setGitFiles(combinedFiles);

        // Update latest commit if available
        if (status.currentCommit) {
          setCommitHistory((prevHist) => {
            const exists = prevHist.some((c) => c.hash.startsWith(status.currentCommit.hash.substring(0, 7)));
            if (!exists) {
              return [
                {
                  hash: status.currentCommit.hash.substring(0, 7),
                  message: status.currentCommit.message,
                  author: status.currentCommit.author,
                  timestamp: status.currentCommit.date || 'recently',
                  branch: status.currentBranch
                },
                ...prevHist
              ];
            }
            return prevHist;
          });
        }
      }
    } catch {
      // Backend not running or offline, keep local state
    }
  }, [addNotification, difficulty, tutorialStep]);

  // Poll real Git status every 2 seconds
  useEffect(() => {
    syncGitState();
    const interval = setInterval(syncGitState, 2000);
    return () => clearInterval(interval);
  }, [syncGitState]);

  // Clean timer for "Organized" achievement (Stayed clean for 1 hour)
  useEffect(() => {
    const timer = setInterval(() => {
      const isCurrentlyClean = realGit ? realGit.status === 'clean' : gitStatus === 'clean';
      if (isCurrentlyClean) {
        setGameState((prev) => {
          const newSeconds = prev.gameData.totalCleanTimeSeconds + 1;
          if (newSeconds >= 3600) {
            unlockAchievement('organized');
          }
          return {
            ...prev,
            gameData: {
              ...prev.gameData,
              totalCleanTimeSeconds: newSeconds
            }
          };
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [realGit, gitStatus, unlockAchievement]);

  // Entering the game timeline:
  // 1. Page loads (0ms)
  // 2. Screen fade-in over 500ms (black to game world)
  // 3. Status panel fades in at 1000ms
  // 4. If new session, trigger Tutorial Welcome Dialogue from The Elder at 1500ms
  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsLoaded(true), 50);
    const statusTimer = setTimeout(() => setShowStatusPanel(true), 1000);

    const tutorialTimer = setTimeout(() => {
      if (!tutorialCompleted && tutorialStep === 'welcome') {
        soundFx.playElder();
        setDialogue({
          title: 'THE ELDER (GUARDIAN)',
          lines: [
            'Welcome, developer, to the sacred realm of CodeQuest!',
            'Controls: WASD / Arrows to move, [E] or Space to interact.',
            'To begin your journey, walk southeast to the DOCS LIBRARY.'
          ],
          actionButton: {
            label: 'Walk to Docs Library',
            onClick: () => {
              soundFx.playButton();
              setTutorialStep('walk_to_docs');
              closeDialogue();
            }
          }
        });
      }
    }, 1500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(statusTimer);
      clearTimeout(tutorialTimer);
    };
  }, [tutorialCompleted, tutorialStep, closeDialogue]);

  // Add XP helper
  const addXP = (amount: number) => {
    setStats((prev) => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      return {
        ...prev,
        xp: newXP,
        level: newLevel
      };
    });
  };

  // Push to remote origin (Git Shrine) with Error Handling & Notifications
  const handlePushRemote = async () => {
    soundFx.playButton();
    addNotification('info', `ℹ Pushing commits to origin/${branch}...`);
    try {
      const res = await gitApi.push(branch);
      if (res.success) {
        setCelebrationTimestamp(Date.now());
        soundFx.playPushSuccess();
        addXP(100);
        unlockAchievement('synchronize');

        if (!tutorialCompleted) {
          setTutorialCompleted(true);
          setTutorialStep('completed');
          addNotification('success', '🎉 Tutorial Complete! Free play unlocked. Continue exploring the Git Realm.');
        } else {
          addNotification('success', `✓ Push successful! origin/${branch} synchronized.`);
        }

        await syncGitState();
        setDialogue({
          title: 'GIT SHRINE (.git)',
          lines: [
            '✨ Code synchronized with origin.',
            '',
            `Pushed successfully to remote [${branch}].`,
            'The repository dimension vibrates with peace.'
          ]
        });
      } else {
        soundFx.playConflictWarning();
        const suggestion = res.error?.includes('rejected') || res.error?.includes('fetch first')
          ? 'Pull latest updates from origin before pushing.'
          : 'Check remote origin connection or permissions.';
        addNotification('error', `✗ Push failed: ${res.error || 'Remote rejected synchronization'}`, suggestion, () => handlePushRemote());
        setDialogue({
          title: 'GIT SHRINE (.git)',
          lines: [
            '❌ Failed to push to remote origin.',
            '',
            res.error || 'Check network connection or remote credentials.'
          ],
          actionButton: {
            label: 'Pull Updates First',
            onClick: () => {
              setDialogue(null);
              handlePullRemote();
            }
          }
        });
      }
    } catch (err: any) {
      addNotification('error', `✗ Push failed: ${err.message}`, 'Check network connection.', () => handlePushRemote());
      setDialogue({
        title: 'GIT SHRINE (.git)',
        lines: [
          '❌ Error executing git push.',
          err.message || 'Remote rejected synchronization.'
        ]
      });
    }
  };

  // Pull from remote origin with Error Handling & Notifications
  const handlePullRemote = async () => {
    soundFx.playButton();
    addNotification('info', `ℹ Pulling updates from origin/${branch}...`);
    try {
      const res = await gitApi.pull(branch);
      await syncGitState();
      if (res.success) {
        soundFx.playPushSuccess();
        addXP(60);
        addNotification('success', '✓ Pull successful: repository synchronized with origin!');
        setDialogue({
          title: 'REMOTE ORIGIN',
          lines: [
            '✨ Pulled changes from remote successfully!',
            res.message || 'Repository is synchronized with origin.'
          ]
        });
      } else {
        if (res.hasConflict) {
          soundFx.playConflictWarning();
          addNotification('error', '✗ Pull resulted in a merge conflict!', 'Face the Merge Conflict Boss to resolve conflicts.', () => {
            setActiveModal('conflict');
          });
          setDialogue({
            title: 'REALITY COLLAPSED',
            lines: [
              '⚠️ A merge conflict occurred during pull!',
              'Resolve conflicting files before proceeding.'
            ],
            actionButton: {
              label: 'Face Conflict Boss',
              onClick: () => {
                setDialogue(null);
                setActiveModal('conflict');
              }
            }
          });
        } else {
          addNotification('error', `✗ Pull failed: ${res.error || 'Unknown error'}`, 'Check remote configuration.', () => handlePullRemote());
          setDialogue({
            title: 'REMOTE ORIGIN',
            lines: ['Pull failed: ' + (res.error || 'Unknown error')]
          });
        }
      }
    } catch (err: any) {
      addNotification('error', `✗ Pull failed: ${err.message}`, 'Check network connection.');
      setDialogue({
        title: 'REMOTE ORIGIN',
        lines: ['Error during pull: ' + err.message]
      });
    }
  };

  // Cycle Git status mode manually (fallback / dev toggle)
  const handleCycleStatus = () => {
    setGitStatus((prev) => {
      if (prev === 'clean') return 'dirty';
      if (prev === 'dirty') return 'ahead';
      if (prev === 'ahead') return 'conflict';
      return 'clean';
    });
  };

  // Keyboard shortcut listener for 1, 2, 3, 4 to open toolbar modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === '1') {
        setActiveModal((cur) => (cur === 'explore' ? null : 'explore'));
        soundFx.playButton();
      } else if (e.key === '2') {
        setActiveModal((cur) => (cur === 'learn' ? null : 'learn'));
        soundFx.playButton();
      } else if (e.key === '3') {
        setActiveModal((cur) => (cur === 'commit' ? null : 'commit'));
        soundFx.playButton();
      } else if (e.key === '4') {
        setActiveModal((cur) => (cur === 'grow' ? null : 'grow'));
        soundFx.playButton();
      } else if (e.key === 'Escape') {
        setActiveModal(null);
        setDialogue(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Location Interaction Controller (NPC Roles & Functions)
  const handleInteractLocation = (loc: GameLocation) => {
    setActiveLocation(loc);

    // Track interaction in GameState
    setGameState((prev) => ({
      ...prev,
      gameData: {
        ...prev.gameData,
        visitedLocations: Array.from(new Set([...prev.gameData.visitedLocations, loc.id])),
        lastInteraction: loc.id
      }
    }));

    const hasConflict = realGit?.hasConflict || gitStatus === 'conflict';

    // 1. THE ELDER NPC (Central Authority / Guardian)
    if (loc.id === 'elder') {
      soundFx.playElder();

      setGameState((prev) => ({
        ...prev,
        gameData: {
          ...prev.gameData,
          completedActions: Array.from(new Set([...prev.gameData.completedActions, 'talked_to_elder'])),
          lastInteraction: 'elder'
        }
      }));

      // If in tutorial after commit, elder guides to the shrine
      if (tutorialStep === 'elder_after_commit') {
        setDialogue({
          title: 'THE ELDER',
          lines: [
            'Magnificent! You have forged your first commit into history.',
            'Your chronicle now holds changes ahead of the remote dimension.',
            'Proceed northeast to the sacred GIT SHRINE to synchronize!'
          ],
          actionButton: {
            label: 'Visit Git Shrine',
            onClick: () => {
              soundFx.playButton();
              setTutorialStep('visit_shrine');
              closeDialogue();
              setTeleportTarget({ x: 1200, y: 220 });
            }
          }
        });
        return;
      }

      // Progression / State-aware Elder dialogue
      const elderData = getElderDialogue(gameState, tutorialStep);
      let actionButton = elderData.actionButton;

      if (hasConflict) {
        actionButton = {
          label: 'Face Conflict Boss',
          onClick: () => {
            closeDialogue();
            setActiveModal('conflict');
          }
        };
      } else if (!gameState.git.isClean) {
        actionButton = {
          label: 'Commit Station',
          onClick: () => {
            closeDialogue();
            setActiveModal('commit');
          }
        };
      } else if (gameState.git.commitsAheadOfRemote > 0) {
        actionButton = {
          label: 'Visit Git Shrine',
          onClick: () => {
            closeDialogue();
            setTeleportTarget({ x: 1200, y: 220 });
          }
        };
      } else if (gameState.git.commitsBehindRemote > 0) {
        actionButton = {
          label: 'Remote Origin',
          onClick: () => {
            closeDialogue();
            setTeleportTarget({ x: 1250, y: 840 });
          }
        };
      } else {
        actionButton = {
          label: "Elder's Chamber",
          onClick: () => {
            closeDialogue();
            setActiveModal('elder');
          }
        };
      }

      setDialogue({
        ...elderData,
        actionButton
      });
    }

    // 2. THE GIT SHRINE (Push Location)
    else if (loc.id === 'git_shrine') {
      soundFx.playShrine();

      const shrineData = getGitShrineDialogue(gameState, {
        onPush: () => {
          closeDialogue();
          handlePushRemote();
        },
        onOpenCommit: () => {
          closeDialogue();
          setActiveModal('commit');
        },
        onInspect: () => {
          closeDialogue();
          setActiveModal('git_shrine');
        }
      });

      setDialogue(shrineData);
    }

    // 3. THE DOCS LIBRARY (Learn Location)
    else if (loc.id === 'docs') {
      soundFx.playInteract();

      // If in onboarding step 3, explain what Git is and guide to make a commit
      if (tutorialStep === 'walk_to_docs' || tutorialStep === 'learn_git') {
        setDialogue({
          title: 'THE DOCS LIBRARY (ARCHIVIST)',
          lines: [
            'Welcome to the Grand Archive of Version Control!',
            'Git is a distributed timeline system that records atomic snapshots of your code.',
            'Now, head to the Main Plaza Forge to create your first commit!'
          ],
          actionButton: {
            label: 'Visit Commit Forge',
            onClick: () => {
              soundFx.playButton();
              setTutorialStep('make_commit');
              closeDialogue();
              setActiveModal('commit');
            }
          }
        });
        return;
      }

      // Educational Question Dialogue Tree
      const showTopicDialogue = (topic: 'commit' | 'conflict' | 'push') => {
        soundFx.playButton();
        const topicData = getDocsTopicDialogue(
          topic,
          () => {
            handleInteractLocation(loc);
          },
          () => {
            closeDialogue();
            if (topic === 'commit') setActiveModal('commit');
            else if (topic === 'conflict') setActiveModal('conflict');
            else if (topic === 'push') setTeleportTarget({ x: 1200, y: 220 });
          }
        );
        setDialogue(topicData);
      };

      const docsData = getDocsLibraryDialogue(showTopicDialogue, () => {
        closeDialogue();
        setActiveModal('learn');
      });

      setDialogue(docsData);
    }

    // 4. MAIN PLAZA (Commit Station)
    else if (loc.id === 'commit_station' || loc.id === 'plaza') {
      soundFx.playInteract();

      const plazaData = getMainPlazaDialogue(gameState, {
        onOpenCommit: () => {
          closeDialogue();
          setActiveModal('commit');
        },
        onInspect: () => {
          closeDialogue();
          setActiveModal('explore');
        }
      });

      setDialogue(plazaData);
    }

    // 5. REMOTE ORIGIN (Pull Location)
    else if (loc.id === 'remote_origin') {
      soundFx.playInteract();

      const originData = getRemoteOriginDialogue(gameState, {
        onPull: () => {
          closeDialogue();
          handlePullRemote();
        },
        onTeleportShrine: () => {
          closeDialogue();
          setTeleportTarget({ x: 1200, y: 220 });
        },
        onInspect: () => {
          closeDialogue();
          setActiveModal('explore');
        }
      });

      setDialogue(originData);
    }

    // 6. BRANCH NPC: CHRONOMANCER ELENA
    else if (loc.id === 'branch_npc') {
      soundFx.playInteract();
      setDialogue({
        title: 'CHRONOMANCER ELENA',
        lines: [
          `Current branch: [${branch}]`,
          `Available branches: ${branches.join(', ')}`,
          'Navigate to another branch timeline?'
        ],
        actionButton: {
          label: 'Switch Branch',
          onClick: () => {
            closeDialogue();
            setActiveModal('branch');
          }
        }
      });
    }

    // 7. MERGE CONFLICT BOSS
    else if (loc.id === 'merge_boss') {
      soundFx.playInteract();
      setDialogue({
        title: 'MERGE CONFLICT ENTITY',
        lines: [
          hasConflict
            ? 'REALITY HAS COLLAPSED! Conflicting changes detected!'
            : 'The ancient conflict seal is calm. No dimensional paradoxes detect.',
          '',
          hasConflict ? 'Engage the conflict boss to resolve branches!' : 'Roam freely in peace.'
        ],
        actionButton: {
          label: hasConflict ? 'Face Boss' : 'Inspect Seal',
          onClick: () => {
            closeDialogue();
            if (hasConflict) {
              setActiveModal('conflict');
            }
          }
        }
      });
    }

    // 8. VILLAGE HOUSES & LANDMARKS
    else {
      soundFx.playInteract();

      const locationDialogues: Record<string, { title: string; lines: string[]; actionLabel?: string }> = {
        house_red: {
          title: 'README.md MANOR',
          lines: [
            'The front gate to every grand software quest.',
            '',
            'Clear installation guides invite fellow coders to join your party.'
          ],
          actionLabel: 'Inspect README'
        },
        house_green: {
          title: 'SRC/ COTTAGE',
          lines: [
            'Inside rests the heart of the village code.',
            '',
            'Modular components, clean functions, and strong typing thrive here.'
          ],
          actionLabel: 'Explore src/'
        },
        house_brown: {
          title: 'PACKAGE.JSON TAVERN',
          lines: [
            'A lively inn serving curated dependencies.',
            '',
            'Always lock your dependencies before journeying into production.'
          ],
          actionLabel: 'Check Packages'
        },
        house_dark: {
          title: '.GITIGNORE FORTRESS',
          lines: [
            'Silent sentinels guard against secret keys and bulky node_modules.',
            '',
            'What is placed on the ignore list shall never leak to the remote realm.'
          ],
          actionLabel: 'View Ignores'
        },
        house_blue: {
          title: 'TESTS/ SANCTUARY',
          lines: [
            'A tranquil shrine where all assertions pass green.',
            '',
            'Write automated unit tests to shield the village from regressions.'
          ],
          actionLabel: 'Run Tests'
        },
        house_purple: {
          title: 'ASSETS/ WORKSHOP',
          lines: [
            'Pixel anvils forge sprite sheets and 8-bit chiptunes.',
            '',
            'Every visual asset is optimized for lightning-fast rendering.'
          ],
          actionLabel: 'Inspect Assets'
        }
      };

      const matched = locationDialogues[loc.id] || {
        title: loc.name.toUpperCase(),
        lines: [
          loc.subtitle || 'A landmark in the village of CodeQuest.',
          '',
          'Press SPACE or E to resume exploring.'
        ]
      };

      setDialogue({
        title: matched.title,
        lines: matched.lines,
        actionButton: {
          label: matched.actionLabel || 'Details',
          onClick: () => {
            closeDialogue();
            setActiveModal('house');
          }
        }
      });
    }
  };

  // Commit success handler
  const handleCommitSuccess = async (newCommit: GitCommit) => {
    setCommitHistory((prev) => [newCommit, ...prev]);
    setCelebrationTimestamp(Date.now());
    addXP(85);

    // Track commit count and achievements
    setStats((prev) => {
      const nextCommits = prev.commitsCount + 1;
      return {
        ...prev,
        commitsCount: nextCommits
      };
    });

    // Unlock Initiate achievement
    unlockAchievement('initiate');

    // Check 10 commits achievement (Productive)
    if (stats.commitsCount + 1 >= 10) {
      unlockAchievement('productive');
    }

    // Advance tutorial if in make_commit step
    if (tutorialStep === 'make_commit') {
      setTutorialStep('elder_after_commit');
      addNotification('info', 'Quest Update: Talk to The Elder at the Stone Chamber!');
    }

    await syncGitState();
  };

  // Teleport handler from Explore modal
  const handleTeleport = (loc: GameLocation) => {
    setTeleportTarget({ x: loc.x, y: loc.y + 40 });
  };

  const isClean = realGit ? realGit.status === 'clean' : gitFiles.length === 0;
  const progressionStage = getProgressionStage(gameState);

  return (
    <div
      id="codequest-app-root"
      className={`relative w-screen h-screen bg-stone-950 overflow-hidden flex flex-col font-sans transition-opacity duration-500 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Top Left Status Panel */}
      <StatusPanel
        repoName={repoName}
        repoPath={gameState.repo.path}
        branch={branch}
        gitStatus={realGit ? realGit.status : gitStatus}
        progressionStage={progressionStage}
        uncommittedCount={realGit ? realGit.uncommittedChanges.length : gitFiles.filter((f) => f.status !== 'untracked').length}
        untrackedCount={realGit ? realGit.untrackedFiles.length : gitFiles.filter((f) => f.status === 'untracked').length}
        commitsAhead={realGit ? realGit.commitsAhead : (gitStatus === 'ahead' ? 2 : 0)}
        commitsBehind={realGit ? realGit.commitsBehind : 0}
        lastCommit={
          realGit?.currentCommit
            ? {
                hash: realGit.currentCommit.hash,
                message: realGit.currentCommit.message,
                author: realGit.currentCommit.author
              }
            : {
                hash: commitHistory[0]?.hash || 'a1b2c3d',
                message: commitHistory[0]?.message || 'feat: initial repository layout',
                author: commitHistory[0]?.author || 'CodeQuest Hero'
              }
        }
        difficulty={difficulty}
        onSelectDifficulty={(newDiff) => setDifficulty(newDiff)}
        unlockedAchievementsCount={stats.achievements.filter((a) => a.unlocked).length}
        totalAchievementsCount={stats.achievements.length}
        onOpenAchievements={() => setActiveModal('grow')}
        tutorialStep={tutorialStep}
        tutorialCompleted={tutorialCompleted}
        onRefreshStatus={syncGitState}
        onCycleStatus={handleCycleStatus}
        onSwitchBranch={() => setActiveModal('branch')}
        onConnectRepo={() => setActiveModal('connect')}
        isAudioMuted={isAudioMuted}
        onToggleAudio={() => {
          const muted = soundFx.toggleMute();
          setIsAudioMuted(muted);
        }}
        isAmbienceActive={isAmbienceActive}
        onToggleAmbience={() => {
          const active = soundFx.toggleAmbience();
          setIsAmbienceActive(active);
        }}
        onPushRemote={handlePushRemote}
        onPullRemote={handlePullRemote}
        onOpenSimulate={() => setActiveModal('simulate')}
        isVisible={showStatusPanel}
      />

      {/* Main Interactive Game Viewport */}
      <main className="flex-1 w-full h-full relative">
        <GameCanvas
          onInteractLocation={handleInteractLocation}
          onNearLocationChange={setNearLocation}
          externalMoveDir={externalMoveDir}
          teleportTarget={teleportTarget}
          onClearTeleport={() => setTeleportTarget(null)}
          gitStatus={realGit ? realGit.status : gitStatus}
          initialPosition={gameState.gameData.playerPosition}
          onMovementChange={(isMoving, activeKeys) => setMovementState({ isMoving, activeKeys })}
          onPlayerPositionChange={(pos, dir) => {
            setGameState((prev) => ({
              ...prev,
              gameData: {
                ...prev.gameData,
                playerPosition: pos,
                playerFacingDirection: dir
              }
            }));
          }}
          celebrationTimestamp={celebrationTimestamp}
        />
      </main>

      {/* Subtle Arrow Keys Movement Indicator (Bottom Right) */}
      <MovementIndicator
        isMoving={movementState.isMoving}
        activeDirection={null}
        activeKeys={movementState.activeKeys}
      />

      {/* Retro 800px x 150px Monospace Dialogue System */}
      <DialogueBox
        dialogue={dialogue}
        onClose={closeDialogue}
      />

      {/* Bottom Left Toolbar: EXPLORE, LEARN, COMMIT, GROW, REPO */}
      <BottomToolbar
        activeModal={activeModal}
        onOpenExplore={() => setActiveModal((cur) => (cur === 'explore' ? null : 'explore'))}
        onOpenLearn={() => setActiveModal((cur) => (cur === 'learn' ? null : 'learn'))}
        onOpenCommit={() => setActiveModal((cur) => (cur === 'commit' ? null : 'commit'))}
        onOpenGrow={() => setActiveModal((cur) => (cur === 'grow' ? null : 'grow'))}
        onOpenConnectRepo={() => setActiveModal((cur) => (cur === 'connect' ? null : 'connect'))}
        dirtyFilesCount={realGit ? realGit.uncommittedChanges.length + realGit.untrackedFiles.length : gitFiles.length}
      />

      {/* Toast Notification System */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* Virtual Touch D-Pad for mobile / tablet devices */}
      <TouchControls
        onStartMove={(dir) => setExternalMoveDir(dir)}
        onStopMove={() => setExternalMoveDir(null)}
        onInteract={() => {
          if (nearLocation) {
            handleInteractLocation(nearLocation);
          }
        }}
        canInteract={Boolean(nearLocation)}
        interactLabel={nearLocation ? `[E] ${nearLocation.name}` : undefined}
      />

      {/* MODALS & OVERLAYS */}
      {/* 0. Connect Local Repository Modal */}
      {activeModal === 'connect' && (
        <ConnectRepoModal
          currentPath={gameState.repo.path}
          currentRepoName={gameState.repo.name}
          remoteUrl={gameState.repo.remoteURL}
          onConnected={(repoInfo) => {
            setGameState((prev) => ({
              ...prev,
              repo: repoInfo
            }));
            setRepoName(repoInfo.name);
            addNotification('success', `✓ Switched active repository to: ${repoInfo.name}`);
            syncGitState();
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {/* 1. THE ELDER Dialog */}
      {activeModal === 'elder' && (
        <ElderDialogModal
          isClean={isClean}
          dirtyCount={gitFiles.length}
          onClose={() => setActiveModal(null)}
          onOpenCommit={() => setActiveModal('commit')}
          onAddWisdomXP={() => addXP(50)}
        />
      )}

      {/* 2. GIT SHRINE (.git) Modal */}
      {activeModal === 'git_shrine' && (
        <GitShrineModal
          commitHistory={commitHistory}
          branch={branch}
          isClean={isClean}
          onClose={() => setActiveModal(null)}
          onOpenCommit={() => setActiveModal('commit')}
        />
      )}

      {/* 3. House & Location Dialog */}
      {activeModal === 'house' && activeLocation && (
        <HouseDialogModal
          location={activeLocation}
          onClose={() => setActiveModal(null)}
          onTriggerEvent={() => addXP(20)}
        />
      )}

      {/* 4. Commit Forge Modal */}
      {activeModal === 'commit' && (
        <CommitForgeModal
          files={gitFiles}
          branch={branch}
          isClean={isClean}
          onCommitSuccess={handleCommitSuccess}
          onClose={() => {
            setActiveModal(null);
            syncGitState();
          }}
        />
      )}

      {/* 5. Learn Codex Modal */}
      {activeModal === 'learn' && (
        <LearnCodexModal onClose={() => setActiveModal(null)} />
      )}

      {/* 6. Grow Skills Modal */}
      {activeModal === 'grow' && (
        <GrowSkillsModal stats={stats} onClose={() => setActiveModal(null)} />
      )}

      {/* 7. Explore & Fast Travel Modal */}
      {activeModal === 'explore' && (
        <ExploreModal onClose={() => setActiveModal(null)} onTeleport={handleTeleport} />
      )}

      {/* 8. Switch Branch Modal */}
      {activeModal === 'branch' && (
        <BranchSwitchModal
          currentBranch={branch}
          branches={branches}
          onSelectBranch={(newBranch) => {
            setBranch(newBranch);
            addXP(15);
            syncGitState();
          }}
          onCreateBranch={(newBranch) => {
            setBranches((prev) => [...prev, newBranch]);
            setBranch(newBranch);
            addXP(25);
            syncGitState();
          }}
          onClose={() => {
            setActiveModal(null);
            syncGitState();
          }}
        />
      )}

      {/* 9. Merge Conflict Boss Modal */}
      {activeModal === 'conflict' && (
        <MergeConflictBossModal
          conflictingFiles={
            realGit && realGit.conflictingFiles.length > 0
              ? realGit.conflictingFiles
              : ['src/App.tsx']
          }
          onResolved={async () => {
            await syncGitState();
            unlockAchievement('peace_maker');
            setActiveModal(null);
            addXP(120);
          }}
          onClose={() => {
            setActiveModal(null);
            syncGitState();
          }}
        />
      )}

      {/* 10. Git Scenario Playground Modal (Quick Testing) */}
      {activeModal === 'simulate' && (
        <GitPlaygroundModal
          onActionComplete={syncGitState}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
