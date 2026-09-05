export type Direction = 'down' | 'up' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export type LocationId =
  | 'elder'
  | 'git_shrine'
  | 'docs'
  | 'remote_origin'
  | 'commit_station'
  | 'branch_npc'
  | 'merge_boss'
  | 'house_green' // src/
  | 'house_red' // README.md
  | 'house_brown' // package.json
  | 'house_dark' // .gitignore
  | 'house_blue' // tests/
  | 'house_purple' // assets/
  | 'plaza'; // MAIN circular plaza

export interface GameLocation {
  id: LocationId;
  name: string;
  subtitle?: string;
  type: 'npc' | 'shrine' | 'house' | 'facility' | 'landmark' | 'boss';
  // Map coordinate in virtual 1200x800 world space
  x: number;
  y: number;
  width: number;
  height: number;
  interactionRadius: number; // default 64
  roofColor?: string;
  fileRepresentation?: string;
  promptQuote?: string;
  dialogue: string[];
}

export interface GitFile {
  name: string;
  path: string;
  status: 'modified' | 'staged' | 'untracked';
  diff?: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  branch: string;
}

export type GitStatusMode = 'clean' | 'dirty' | 'conflict' | 'ahead' | 'behind';

export interface RealGitStatus {
  repoName: string;
  currentBranch: string;
  status: GitStatusMode;
  uncommittedChanges: { file: string; status: string }[];
  untrackedFiles: string[];
  commitsAhead: number;
  commitsBehind: number;
  hasConflict: boolean;
  conflictingFiles: string[];
  currentCommit: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
  remoteUrl: string;
  branches: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface PlayerStats {
  level: number;
  xp: number;
  commitsCount: number;
  shrineVisits: number;
  elderWisdomFound: number;
  achievements: Achievement[];
}

export interface GameNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  suggestion?: string;
  retryAction?: () => void;
  timestamp: number;
  duration?: number;
}

export type DifficultyLevel = 'easy' | 'normal' | 'hardcore';

export type ProgressionStageId = 'dirty' | 'clean_ahead' | 'synced' | 'behind' | 'conflict';

export interface ProgressionStageInfo {
  id: ProgressionStageId;
  stageNumber: number;
  title: string;
  badge: string;
  badgeColor: string;
  displayColor: string;
  elderGuidance: string;
  currentGoal: string;
  availableActions: string[];
}

export type TutorialStep = 
  | 'welcome'           // 1. Show welcome dialogue from Elder, explain controls
  | 'walk_to_docs'      // 2. Ask player to walk to DOCS library
  | 'learn_git'         // 3. DOCS explains what Git is
  | 'make_commit'       // 4. Ask player to make a commit
  | 'elder_after_commit'// 5. After commit, Elder dialogue changes
  | 'visit_shrine'      // 6. Ask player to visit Git Shrine
  | 'completed';        // 7. Free play

export interface GameState {
  repo: {
    name: string;
    path: string;
    remoteURL: string;
  };
  git: {
    branch: string;
    isClean: boolean;
    uncommittedChanges: string[];
    untrackedFiles: string[];
    commitsAheadOfRemote: number;
    commitsBehindRemote: number;
    lastCommit: {
      hash: string;
      message: string;
      author: string;
      date: string;
    };
    hasMergeConflict: boolean;
    conflictFiles: string[];
  };
  gameData: {
    playerPosition: { x: number; y: number };
    playerFacingDirection: Direction;
    visitedLocations: string[];
    completedActions: string[];
    lastInteraction: string | null;
    difficulty: DifficultyLevel;
    tutorialStep: TutorialStep;
    tutorialCompleted: boolean;
    cleanStartTime: number | null;
    totalCleanTimeSeconds: number;
  };
}
