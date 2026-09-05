import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HomePage } from './components/HomePage';
import { EnteringTransition } from './components/EnteringTransition';
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
  GitHubUser,
  GitHubRepoSummary,
  GitHubFullRepoData
} from './types';
import { INITIAL_COMMIT_HISTORY, INITIAL_GIT_FILES } from './data/mapData';
import { soundFx } from './utils/audio';
import { gitApi } from './utils/gitApi';
import { githubApi, githubStorage } from './utils/githubApi';
import { getElderDialogue, elderDialogues } from './utils/dialogueTree';

export default function App() {
  // Screen state: 'home' | 'transition' | 'game'
  const [appScreen, setAppScreen] = useState<'home' | 'transition' | 'game'>('home');

  // Authenticated GitHub state
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [userRepos, setUserRepos] = useState<GitHubRepoSummary[]>([]);
  const [activeGitHubRepo, setActiveGitHubRepo] = useState<GitHubRepoSummary | null>(null);
  const [fullRepoData, setFullRepoData] = useState<GitHubFullRepoData | null>(null);

  // Real Git status from Express server
  const [realGit, setRealGit] = useState<RealGitStatus | null>(null);

  // Central GameState
  const [gameState, setGameState] = useState<GameState>({
    repo: {
      name: 'codequest-repo',
      path: '/app/applet',
      remoteURL: 'https://github.com'
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
        author: 'Hero',
        date: 'just now'
      },
      hasMergeConflict: false,
      conflictFiles: []
    },
    gameData: {
      playerPosition: { x: 700, y: 690 },
      playerFacingDirection: 'down',
      visitedLocations: ['plaza'],
      completedActions: ['explored'],
      lastInteraction: null,
      difficulty: 'normal',
      tutorialStep: 'welcome',
      tutorialCompleted: false,
      cleanStartTime: null,
      totalCleanTimeSeconds: 0
    }
  });

  // Notification queue system
  const [notifications, setNotifications] = useState<GameNotification[]>([]);

  // Local / mirror state
  const [repoName, setRepoName] = useState('codequest-repo');
  const [branch, setBranch] = useState('main');
  const [branches, setBranches] = useState(['main', 'develop', 'feature/real-world']);
  const [gitFiles, setGitFiles] = useState<GitFile[]>(INITIAL_GIT_FILES);
  const [commitHistory, setCommitHistory] = useState<GitCommit[]>(INITIAL_COMMIT_HISTORY);
  const [gitStatus, setGitStatus] = useState<GitStatusMode>('clean');

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

  // Check existing authentication on load (GitHub or Google)
  useEffect(() => {
    const checkAuth = async () => {
      const provider = githubStorage.getProvider();
      const token = githubStorage.getToken();
      const cachedUser = githubStorage.getUser();

      if (provider === 'google' && cachedUser && token) {
        handleAuthenticated(cachedUser, token);
        return;
      }

      if (token) {
        try {
          const res = await githubApi.verifyToken(token);
          if (res.success && res.user) {
            handleAuthenticated(res.user, token);
          }
        } catch {
          // Stay on home screen
        }
      }
    };
    checkAuth();
  }, []);

  // Handle successful GitHub / Google Authentication
  const handleAuthenticated = async (user: GitHubUser, token: string) => {
    setGithubUser(user);
    githubStorage.setToken(token);
    githubStorage.setUser(user);

    try {
      const isGoogle = githubStorage.getProvider() === 'google';

      if (!isGoogle) {
        // 1. Fetch real user repos for GitHub users
        const reposRes = await githubApi.fetchUserRepos(token);
        let selectedRepo: GitHubRepoSummary | null = null;

        if (reposRes.success && reposRes.repos && reposRes.repos.length > 0) {
          setUserRepos(reposRes.repos);
          selectedRepo = reposRes.repos[0];
          setActiveGitHubRepo(selectedRepo);
        }

        // 2. Fetch full repository data
        if (selectedRepo) {
          const fullDataRes = await githubApi.fetchFullRepoData(
            selectedRepo.owner.login,
            selectedRepo.name,
            selectedRepo.default_branch,
            token
          );
          if (fullDataRes.success && fullDataRes.data) {
            const data = fullDataRes.data;
            setFullRepoData(data);
            applyRealGitHubData(user, data);
          }
        } else {
          // Fallback for user without repos
          setRepoName(`${user.login}'s Realm`);
          setGameState((prev) => ({
            ...prev,
            repo: {
              name: `${user.login}-realm`,
              path: user.html_url,
              remoteURL: user.html_url
            },
            git: {
              ...prev.git,
              lastCommit: {
                hash: 'github1',
                message: `feat: Connected to ${user.login}'s GitHub account`,
                author: user.name || user.login,
                date: 'just now'
              }
            }
          }));
        }
      } else {
        // Google Authenticated Hero
        const heroName = user.name || user.login;
        setRepoName(`${heroName}'s Quest Realm`);
        setGameState((prev) => ({
          ...prev,
          repo: {
            name: `${user.login}-realm`,
            path: `codequest://${user.login}`,
            remoteURL: user.html_url
          },
          git: {
            ...prev.git,
            lastCommit: {
              hash: 'google1',
              message: `feat: Welcomed ${heroName} to CodeQuest`,
              author: heroName,
              date: 'just now'
            }
          }
        }));
      }

      // 3. Show RPG Entering Transition
      setAppScreen('transition');
    } catch {
      setAppScreen('transition');
    }
  };

  const applyRealGitHubData = (user: GitHubUser, data: GitHubFullRepoData) => {
    setRepoName(data.repo.full_name);
    setBranch(data.activeBranch);
    setBranches(data.branches.length > 0 ? data.branches : [data.activeBranch]);

    // Map commits
    if (data.commits && data.commits.length > 0) {
      const mappedCommits: GitCommit[] = data.commits.map((c) => ({
        hash: c.sha.substring(0, 7),
        message: c.commit.message,
        author: c.commit.author.name || user.name || user.login,
        timestamp: new Date(c.commit.author.date).toLocaleDateString(),
        branch: data.activeBranch
      }));
      setCommitHistory(mappedCommits);
    }

    // Map files from tree
    if (data.tree && data.tree.length > 0) {
      const mappedFiles: GitFile[] = data.tree.slice(0, 30).map((t) => ({
        name: t.path.split('/').pop() || t.path,
        path: t.path,
        status: 'staged'
      }));
      setGitFiles(mappedFiles);
    }

    setGameState((prev) => ({
      ...prev,
      repo: {
        name: data.repo.name,
        path: data.repo.full_name,
        remoteURL: data.repo.html_url
      },
      git: {
        ...prev.git,
        branch: data.activeBranch,
        isClean: true,
        uncommittedChanges: [],
        untrackedFiles: [],
        commitsAheadOfRemote: 0,
        commitsBehindRemote: 0,
        lastCommit: data.commits[0]
          ? {
              hash: data.commits[0].sha.substring(0, 7),
              message: data.commits[0].commit.message,
              author: data.commits[0].commit.author.name || user.name || user.login,
              date: new Date(data.commits[0].commit.author.date).toLocaleDateString()
            }
          : prev.git.lastCommit
      }
    }));
  };

  // Switch active GitHub repository
  const handleSelectRepo = async (selected: GitHubRepoSummary) => {
    setActiveGitHubRepo(selected);
    const token = githubStorage.getToken() || '';
    const user: GitHubUser = githubUser || {
      login: selected.owner.login || 'explorer',
      id: selected.owner.id || 1,
      name: selected.owner.login,
      avatar_url: selected.owner.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=hero',
      html_url: selected.owner.html_url || `https://github.com/${selected.owner.login}`,
      public_repos: 1,
      followers: 0,
      following: 0
    };

    const fullDataRes = await githubApi.fetchFullRepoData(
      selected.owner.login,
      selected.name,
      selected.default_branch,
      token
    );

    if (fullDataRes.success && fullDataRes.data) {
      setFullRepoData(fullDataRes.data);
      applyRealGitHubData(user, fullDataRes.data);
      addNotification('success', `✓ Switched active realm to: ${selected.full_name}`);
      addXP(30);
    } else {
      throw new Error(fullDataRes.error || `Failed to fetch data for ${selected.full_name}`);
    }
  };

  // Load custom or public repo by owner and name (e.g. facebook/react or torvalds/linux)
  const handleLoadCustomRepo = async (owner: string, repo: string) => {
    const token = githubStorage.getToken() || '';
    const user: GitHubUser = githubUser || {
      login: owner,
      id: 1,
      name: owner,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${owner}`,
      html_url: `https://github.com/${owner}`,
      public_repos: 1,
      followers: 0,
      following: 0
    };

    const fullDataRes = await githubApi.fetchFullRepoData(owner, repo, undefined, token);

    if (fullDataRes.success && fullDataRes.data) {
      setFullRepoData(fullDataRes.data);
      setActiveGitHubRepo(fullDataRes.data.repo);
      applyRealGitHubData(user, fullDataRes.data);
      addNotification('success', `✓ Consecrated new realm from: ${owner}/${repo}`);
      addXP(40);
    } else {
      throw new Error(fullDataRes.error || `Repository "${owner}/${repo}" could not be found or loaded.`);
    }
  };

  // Refresh user repositories list from GitHub
  const handleRefreshUserRepos = async () => {
    const token = githubStorage.getToken() || '';
    const res = await githubApi.fetchUserRepos(token);
    if (res.success && res.repos) {
      setUserRepos(res.repos);
      addNotification('info', `✓ Fetched ${res.repos.length} repositories from GitHub.`);
    } else {
      throw new Error(res.error || 'Failed to refresh repositories from GitHub');
    }
  };

  // Player RPG stats
  const [stats, setStats] = useState<PlayerStats>({
    level: 1,
    xp: 45,
    commitsCount: 4,
    shrineVisits: 0,
    elderWisdomFound: 0,
    achievements: [
      {
        id: 'first_step',
        title: 'Step into CodeQuest',
        description: 'Take your first steps in the git realm',
        unlocked: true,
        icon: 'footprints'
      },
      {
        id: 'meet_elder',
        title: 'Elder Wisdom',
        description: 'Speak with The Elder to receive git guidance',
        unlocked: false,
        icon: 'scroll'
      },
      {
        id: 'clean_tree',
        title: 'Master of Order',
        description: 'Commit all files and achieve a clean working tree',
        unlocked: false,
        icon: 'sparkles'
      },
      {
        id: 'shrine_init',
        title: 'Shrine Consecration',
        description: 'Commune with the .git obsidian shrine',
        unlocked: false,
        icon: 'flame'
      },
      {
        id: 'first_push',
        title: 'Ascension to Remote',
        description: 'Push your commits to origin at the Git Shrine',
        unlocked: false,
        icon: 'shield'
      }
    ]
  });

  // Modals and Dialogue
  const [dialogue, setDialogue] = useState<DialogueData | null>(null);
  const [activeModal, setActiveModal] = useState<
    | 'elder'
    | 'git_shrine'
    | 'house'
    | 'commit'
    | 'learn'
    | 'grow'
    | 'explore'
    | 'branch'
    | 'conflict'
    | 'simulate'
    | 'connect'
    | null
  >(null);
  const [activeLocation, setActiveLocation] = useState<GameLocation | null>(null);

  // Audio & Ambience
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isAmbienceActive, setIsAmbienceActive] = useState(false);

  // Movement & Interaction
  const [nearLocation, setNearLocation] = useState<GameLocation | null>(null);
  const [externalMoveDir, setExternalMoveDir] = useState<Direction | null>(null);
  const [teleportTarget, setTeleportTarget] = useState<Position | null>(null);
  const [movementState, setMovementState] = useState<{
    isMoving: boolean;
    activeKeys: { up: boolean; down: boolean; left: boolean; right: boolean };
  }>({
    isMoving: false,
    activeKeys: { up: false, down: false, left: false, right: false }
  });

  // Visual effects
  const [celebrationTimestamp, setCelebrationTimestamp] = useState<number | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);

  // Poll real Git status
  const syncGitState = useCallback(async () => {
    try {
      const status = await gitApi.fetchStatus();
      if (status) {
        setRealGit(status);
        if (!fullRepoData) {
          setRepoName(status.repoName);
          setBranch(status.currentBranch);
          setBranches(status.branches.length > 0 ? status.branches : [status.currentBranch]);
        }
      }
    } catch {
      // Keep state
    }
  }, [fullRepoData]);

  useEffect(() => {
    if (appScreen === 'game') {
      syncGitState();
      const interval = setInterval(syncGitState, 3000);
      return () => clearInterval(interval);
    }
  }, [appScreen, syncGitState]);

  useEffect(() => {
    if (appScreen === 'game') {
      const fadeTimer = setTimeout(() => setIsLoaded(true), 50);
      const statusTimer = setTimeout(() => setShowStatusPanel(true), 800);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(statusTimer);
      };
    }
  }, [appScreen]);

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

  const unlockAchievement = (id: string) => {
    setStats((prev) => ({
      ...prev,
      achievements: prev.achievements.map((a) => (a.id === id ? { ...a, unlocked: true } : a))
    }));
  };

  const handlePushRemote = async () => {
    soundFx.playButton();
    addNotification('info', `Pushing commits to origin/${branch}...`);
    try {
      const res = await gitApi.push(branch);
      if (res.success) {
        addNotification('success', `✓ Successfully pushed to origin/${branch}!`);
        addXP(100);
        unlockAchievement('first_push');
        setCelebrationTimestamp(Date.now());
        syncGitState();
      } else {
        addNotification('error', `Push rejected: ${res.error || 'Failed'}`);
      }
    } catch (err: any) {
      addNotification('error', `Push failed: ${err.message}`);
    }
  };

  const handlePullRemote = async () => {
    soundFx.playButton();
    addNotification('info', `Pulling updates from origin/${branch}...`);
    try {
      const res = await gitApi.pull(branch);
      if (res.success) {
        addNotification('success', `✓ Repository in sync with origin/${branch}!`);
        addXP(60);
        syncGitState();
      } else {
        addNotification('error', `Pull failed: ${res.error || 'Failed'}`);
      }
    } catch (err: any) {
      addNotification('error', `Pull failed: ${err.message}`);
    }
  };

  const handleCycleStatus = () => {
    soundFx.playButton();
    const modes: GitStatusMode[] = ['clean', 'dirty', 'conflict', 'ahead', 'behind'];
    const currentIdx = modes.indexOf(gitStatus);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    setGitStatus(nextMode);
  };

  const closeDialogue = () => {
    soundFx.playButton();
    setDialogue(null);
  };

  const handleInteractLocation = (loc: GameLocation) => {
    setActiveLocation(loc);

    if (loc.id === 'elder') {
      soundFx.playElder();
      unlockAchievement('meet_elder');
      const elderDialogue = getElderDialogue(gameState);
      setDialogue({
        ...elderDialogue,
        actionButton: {
          label: "Elder's Chamber",
          onClick: () => {
            closeDialogue();
            setActiveModal('elder');
          }
        }
      });
    } else if (loc.id === 'git_shrine') {
      soundFx.playShrine();
      unlockAchievement('shrine_init');
      setDialogue({
        title: 'GIT SHRINE (.git)',
        lines: [
          'Obsidian runes pulse with version control essence.',
          'Push your local commits or consecrate your working tree.'
        ],
        actionButton: {
          label: 'Enter Shrine',
          onClick: () => {
            closeDialogue();
            setActiveModal('git_shrine');
          }
        }
      });
    } else if (loc.id === 'commit_station') {
      soundFx.playInteract();
      setActiveModal('commit');
    } else if (loc.id === 'branch_npc') {
      soundFx.playInteract();
      setActiveModal('branch');
    } else if (loc.id === 'merge_boss') {
      soundFx.playInteract();
      setActiveModal('conflict');
    } else {
      soundFx.playInteract();
      setActiveModal('house');
    }
  };

  const handleCommitSuccess = async (newCommit: GitCommit) => {
    setCommitHistory((prev) => [newCommit, ...prev]);
    setCelebrationTimestamp(Date.now());
    addXP(85);
    unlockAchievement('clean_tree');
    await syncGitState();
  };

  const handleTeleport = (loc: GameLocation) => {
    setTeleportTarget({ x: loc.x, y: loc.y + 40 });
  };

  const isClean = realGit ? realGit.status === 'clean' : gitFiles.length === 0;

  // Derive dynamic character name from authenticated GitHub user
  const characterName = (
    githubUser?.login ||
    githubUser?.name ||
    'HERO'
  ).toUpperCase();

  // 1. HOME SCREEN: Minimalist Connect to GitHub
  if (appScreen === 'home') {
    return (
      <HomePage
        onAuthenticated={handleAuthenticated}
        onError={(err) => addNotification('error', err)}
      />
    );
  }

  // 2. ENTERING CODEQUEST TRANSITION
  if (appScreen === 'transition') {
    return (
      <EnteringTransition
        username={githubUser?.login || githubUser?.name || 'HERO'}
        repoName={fullRepoData?.repo.name || activeGitHubRepo?.name || 'REALM'}
        onComplete={() => setAppScreen('game')}
      />
    );
  }

  // 3. MAIN GAME SCREEN
  return (
    <div
      id="codequest-app-root"
      className={`relative w-screen h-screen bg-stone-950 overflow-hidden flex flex-col md:flex-row font-sans transition-opacity duration-500 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Unified Left Sidebar (Non-overlaying) */}
      <aside
        id="game-sidebar"
        className="w-full md:w-80 lg:w-88 h-auto md:h-full bg-stone-950 border-b md:border-b-0 md:border-r border-stone-800/80 flex flex-col shrink-0 overflow-y-auto p-3 gap-3 z-20 shadow-2xl"
      >
        {/* Status Panel */}
        <StatusPanel
          repoName={fullRepoData?.repo.full_name || repoName}
          repoPath={fullRepoData?.repo.html_url || gameState.repo.path}
          branch={branch}
          gitStatus={realGit ? realGit.status : gitStatus}
          uncommittedCount={realGit ? realGit.uncommittedChanges.length : 0}
          untrackedCount={realGit ? realGit.untrackedFiles.length : 0}
          commitsAhead={realGit ? realGit.commitsAhead : 0}
          commitsBehind={realGit ? realGit.commitsBehind : 0}
          lastCommit={
            commitHistory[0]
              ? {
                  hash: commitHistory[0].hash,
                  message: commitHistory[0].message,
                  author: commitHistory[0].author
                }
              : {
                  hash: 'github0',
                  message: 'Repository connected',
                  author: characterName
                }
          }
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

        {/* Bottom Toolbar: EXPLORE, LEARN, COMMIT, GROW, REPO */}
        <BottomToolbar
          activeModal={activeModal}
          onOpenExplore={() => setActiveModal((cur) => (cur === 'explore' ? null : 'explore'))}
          onOpenLearn={() => setActiveModal((cur) => (cur === 'learn' ? null : 'learn'))}
          onOpenCommit={() => setActiveModal((cur) => (cur === 'commit' ? null : 'commit'))}
          onOpenGrow={() => setActiveModal((cur) => (cur === 'grow' ? null : 'grow'))}
          onOpenConnectRepo={() => setActiveModal((cur) => (cur === 'connect' ? null : 'connect'))}
          dirtyFilesCount={realGit ? realGit.uncommittedChanges.length + realGit.untrackedFiles.length : gitFiles.length}
        />
      </aside>

      {/* Main Interactive Game Viewport */}
      <main className="flex-1 w-full h-full relative overflow-hidden bg-stone-950 flex items-center justify-center">
        <GameCanvas
          onInteractLocation={handleInteractLocation}
          onNearLocationChange={setNearLocation}
          externalMoveDir={externalMoveDir}
          teleportTarget={teleportTarget}
          onClearTeleport={() => setTeleportTarget(null)}
          gitStatus={realGit ? realGit.status : gitStatus}
          playerName={characterName}
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

      {/* Movement Indicator (Bottom Right) */}
      <MovementIndicator
        isMoving={movementState.isMoving}
        activeDirection={null}
        activeKeys={movementState.activeKeys}
      />

      {/* Dialogue System */}
      <DialogueBox dialogue={dialogue} onClose={closeDialogue} />

      {/* Toast Notification System */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* Virtual Touch D-Pad */}
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

      {/* MODALS */}
      {/* 0. Connect Repository Modal / GitHub Switcher */}
      {activeModal === 'connect' && (
        <ConnectRepoModal
          currentPath={fullRepoData?.repo.html_url || gameState.repo.path}
          currentRepoName={fullRepoData?.repo.full_name || gameState.repo.name}
          remoteUrl={fullRepoData?.repo.html_url || gameState.repo.remoteURL}
          userRepos={userRepos}
          activeGitHubRepo={activeGitHubRepo}
          githubUser={githubUser}
          onSelectGitHubRepo={handleSelectRepo}
          onLoadCustomRepo={handleLoadCustomRepo}
          onRefreshUserRepos={handleRefreshUserRepos}
          onConnectedLocal={(repoInfo) => {
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

      {/* 1. Elder Dialog */}
      {activeModal === 'elder' && (
        <ElderDialogModal
          isClean={isClean}
          dirtyCount={gitFiles.length}
          onClose={() => setActiveModal(null)}
          onOpenCommit={() => setActiveModal('commit')}
          onAddWisdomXP={() => addXP(50)}
        />
      )}

      {/* 2. Git Shrine Modal */}
      {activeModal === 'git_shrine' && (
        <GitShrineModal
          commitHistory={commitHistory}
          branch={branch}
          isClean={isClean}
          onClose={() => setActiveModal(null)}
          onOpenCommit={() => setActiveModal('commit')}
        />
      )}

      {/* 3. House Dialog Modal with Real Repository Data */}
      {activeModal === 'house' && activeLocation && (
        <HouseDialogModal
          location={activeLocation}
          realRepoData={fullRepoData}
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

      {/* 7. Explore Modal */}
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
            setActiveModal(null);
            addXP(120);
          }}
          onClose={() => {
            setActiveModal(null);
            syncGitState();
          }}
        />
      )}

      {/* 10. Git Playground Modal */}
      {activeModal === 'simulate' && (
        <GitPlaygroundModal
          onActionComplete={syncGitState}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
