import { GameState, ProgressionStageInfo, TutorialStep } from '../types';
import { DialogueData, DialogueOption } from '../components/DialogueBox';

export interface DialogueNode {
  title: string;
  text: string;
  lines: string[];
  nextAction?: 'push' | 'pull' | 'commit' | 'branch' | 'conflict' | 'elder' | 'git_shrine' | 'codex' | null;
  actionLabel?: string;
  secondaryLabel?: string;
  options?: DialogueOption[];
  condition: (state: GameState) => boolean;
}

// 5-Stage Progression System
export function getProgressionStage(state: GameState): ProgressionStageInfo {
  if (state.git.hasMergeConflict) {
    return {
      id: 'conflict',
      stageNumber: 5,
      title: 'Stage 5: MERGE CONFLICT',
      badge: '⚠ Merge Conflict',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/60',
      displayColor: '#ef4444',
      elderGuidance: 'Reality has collapsed! You must resolve the conflict before proceeding.',
      currentGoal: 'Resolve conflict, complete merge',
      availableActions: ['Resolve conflict', 'Face Conflict Boss']
    };
  }

  if (!state.git.isClean) {
    const changesCount = state.git.uncommittedChanges.length + state.git.untrackedFiles.length;
    return {
      id: 'dirty',
      stageNumber: 1,
      title: 'Stage 1: DIRTY STATE',
      badge: `✗ Dirty (${changesCount})`,
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/60',
      displayColor: '#ff7043',
      elderGuidance: 'You must commit first. Your working tree is tainted.',
      currentGoal: 'Make first commit',
      availableActions: ['Stage files', 'Commit changes']
    };
  }

  if (state.git.commitsAheadOfRemote > 0) {
    return {
      id: 'clean_ahead',
      stageNumber: 2,
      title: 'Stage 2: CLEAN, NOT SYNCED',
      badge: `✓ Clean, ↑ ${state.git.commitsAheadOfRemote} ahead`,
      badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/60',
      displayColor: '#38bdf8',
      elderGuidance: "You're ready to push! Visit the Git Shrine to synchronize with remote.",
      currentGoal: 'Push to remote',
      availableActions: ['Visit Git Shrine', 'Push to remote origin']
    };
  }

  if (state.git.commitsBehindRemote > 0) {
    return {
      id: 'behind',
      stageNumber: 4,
      title: 'Stage 4: BEHIND REMOTE',
      badge: `↓ ${state.git.commitsBehindRemote} behind`,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/60',
      displayColor: '#fbbf24',
      elderGuidance: 'Updates available from the remote dimension. You should pull first.',
      currentGoal: 'Pull latest changes',
      availableActions: ['Pull from remote', 'Synchronize origin']
    };
  }

  return {
    id: 'synced',
    stageNumber: 3,
    title: 'Stage 3: SYNCED & CLEAN',
    badge: '✓ Clean, ↕ In sync',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60',
    displayColor: '#81c784',
    elderGuidance: 'Your world is perfect. Continue exploring and forging new history.',
    currentGoal: 'Make more changes, loop continues',
    availableActions: ['Continue working', 'Create new commits', 'Switch branch']
  };
}

export const elderDialogues: Record<string, DialogueNode> = {
  conflict: {
    title: 'THE ELDER',
    text: 'Reality has collapsed. A merge conflict has occurred.',
    lines: [
      'Reality has collapsed. A merge conflict has occurred.',
      '',
      'You must resolve the conflict before proceeding.'
    ],
    nextAction: 'conflict',
    actionLabel: 'Face Conflict Boss',
    condition: (state: GameState) => state.git.hasMergeConflict
  },
  dirty: {
    title: 'THE ELDER',
    text: 'Your working tree is tainted. You must commit your changes before visiting the Git Shrine.',
    lines: [
      'Your working tree is tainted.',
      'You must commit your changes before visiting the Git Shrine.',
      'Package your modifications into the permanent chronicle.'
    ],
    nextAction: 'commit',
    actionLabel: 'Commit Station',
    condition: (state: GameState) => !state.git.isClean
  },
  readyToPush: {
    title: 'THE ELDER',
    text: "You're ready to push! Your world is ahead of the remote dimension.",
    lines: [
      "You're ready to push.",
      'Your world is ahead of the remote dimension.',
      'You are ready to synchronize with the Git Shrine.'
    ],
    nextAction: 'git_shrine',
    actionLabel: 'Visit Git Shrine',
    condition: (state: GameState) => state.git.isClean && state.git.commitsAheadOfRemote > 0
  },
  behind: {
    title: 'THE ELDER',
    text: 'Your world is behind the remote dimension. Updates are available.',
    lines: [
      'Your world is behind the remote dimension.',
      '',
      'You should pull updates from the Remote Origin first.'
    ],
    nextAction: 'pull',
    actionLabel: 'Remote Origin',
    condition: (state: GameState) => state.git.isClean && state.git.commitsBehindRemote > 0
  },
  clean: {
    title: 'THE ELDER',
    text: 'Your world is perfect. Everything is clean and synchronized.',
    lines: [
      'Welcome, developer.',
      'Your world is clean and synchronized. Your world is perfect.',
      'What brings you here?'
    ],
    nextAction: 'elder',
    actionLabel: "Elder's Chamber",
    condition: (state: GameState) => state.git.isClean && state.git.commitsAheadOfRemote === 0
  }
};

// 1. THE ELDER (Central Authority)
export function getElderDialogue(state: GameState, tutorialStep?: TutorialStep): DialogueData {
  // Tutorial onboarding overrides
  if (tutorialStep === 'welcome') {
    return {
      title: 'THE ELDER',
      lines: [
        'Welcome, developer, to the sacred realm of CodeQuest!',
        'Move with WASD or Arrow Keys. Press [E] or Space to interact.',
        'To begin your journey, walk southeast to the DOCS LIBRARY.'
      ],
      actionButton: {
        label: 'Walk to Docs Library',
        onClick: () => {}
      }
    };
  }

  if (tutorialStep === 'elder_after_commit') {
    return {
      title: 'THE ELDER',
      lines: [
        'Magnificent! You have forged your first commit into history.',
        'Your chronicle now holds changes ahead of the remote dimension.',
        'Proceed northeast to the sacred GIT SHRINE to synchronize!'
      ],
      actionButton: {
        label: 'Visit Git Shrine',
        onClick: () => {}
      }
    };
  }

  // Progression checks in priority order: conflict -> dirty -> readyToPush -> behind -> clean
  let node = elderDialogues.clean;
  if (elderDialogues.conflict.condition(state)) {
    node = elderDialogues.conflict;
  } else if (elderDialogues.dirty.condition(state)) {
    node = elderDialogues.dirty;
  } else if (elderDialogues.readyToPush.condition(state)) {
    node = elderDialogues.readyToPush;
  } else if (elderDialogues.behind.condition(state)) {
    node = elderDialogues.behind;
  }

  const dynamicLines = [...node.lines];
  if (node === elderDialogues.dirty) {
    const list = state.git.uncommittedChanges.concat(state.git.untrackedFiles).slice(0, 3).join(', ');
    if (list) {
      dynamicLines.push(`Changes: [${list}]`);
    }
  } else if (node === elderDialogues.readyToPush) {
    dynamicLines.push(`Commits to push: [${state.git.commitsAheadOfRemote}]`);
  } else if (node === elderDialogues.behind) {
    dynamicLines.push(`Commits behind: [${state.git.commitsBehindRemote}]`);
  }

  return {
    title: node.title,
    lines: dynamicLines,
    actionButton: node.actionLabel
      ? {
          label: node.actionLabel,
          onClick: () => {}
        }
      : undefined
  };
}

// 2. THE GIT SHRINE (Push Location)
export function getGitShrineDialogue(
  state: GameState,
  callbacks: { onPush: () => void; onOpenCommit: () => void; onInspect: () => void }
): DialogueData {
  if (state.git.hasMergeConflict) {
    return {
      title: 'THE GIT SHRINE',
      lines: [
        'The portal to remote origin is sealed by dimensional corruption.',
        'A merge conflict has distorted the timeline.',
        'Speak to The Elder or defeat the Conflict Boss to restore order.'
      ],
      actionButton: {
        label: 'Resolve Conflict',
        onClick: callbacks.onInspect
      }
    };
  }

  if (!state.git.isClean) {
    const count = state.git.uncommittedChanges.length + state.git.untrackedFiles.length;
    return {
      title: 'THE GIT SHRINE',
      lines: [
        'The Git Shrine senses an uncommitted working tree.',
        `You have [${count}] uncommitted change(s).`,
        'You must commit your changes before visiting the Git Shrine to push.'
      ],
      actionButton: {
        label: 'Commit Station',
        onClick: callbacks.onOpenCommit
      }
    };
  }

  if (state.git.commitsAheadOfRemote > 0) {
    return {
      title: 'THE GIT SHRINE',
      lines: [
        'The celestial portal hums with vibrant blue energy.',
        'Ready to synchronize your local commits with remote origin?',
        `Commits ready to push: [${state.git.commitsAheadOfRemote}]`
      ],
      actionButton: {
        label: 'Execute Push',
        onClick: callbacks.onPush
      },
      secondaryButton: {
        label: 'Inspect .git',
        onClick: callbacks.onInspect
      }
    };
  }

  if (state.git.commitsBehindRemote > 0) {
    return {
      title: 'THE GIT SHRINE',
      lines: [
        'The shrine reflects incoming changes from the remote dimension.',
        `Origin is [${state.git.commitsBehindRemote}] commits ahead of your local branch.`,
        'Pull latest changes from Remote Origin before pushing new history.'
      ],
      actionButton: {
        label: 'Inspect Remote',
        onClick: callbacks.onInspect
      }
    };
  }

  return {
    title: 'THE GIT SHRINE',
    lines: [
      'Enter to synchronize.',
      'Your repository is in pristine resonance with remote origin.',
      'No pending commits require push at this moment.'
    ],
    actionButton: {
      label: 'Inspect Repository',
      onClick: callbacks.onInspect
    }
  };
}

// 3. THE DOCS LIBRARY (Learn Location)
export function getDocsLibraryDialogue(
  onSelectTopic: (topic: 'commit' | 'conflict' | 'push') => void,
  onOpenCodex: () => void
): DialogueData {
  return {
    title: 'THE DOCS LIBRARY',
    lines: [
      'Welcome to the Grand Archive of Version Control.',
      '"What would you like to learn?"',
      'Select a concept below to reveal the sacred Git knowledge:'
    ],
    options: [
      {
        label: "What does 'commit' mean?",
        onClick: () => onSelectTopic('commit')
      },
      {
        label: "What's a 'merge conflict'?",
        onClick: () => onSelectTopic('conflict')
      },
      {
        label: 'How do I push to remote?',
        onClick: () => onSelectTopic('push')
      }
    ],
    secondaryButton: {
      label: 'Full Codex',
      onClick: onOpenCodex
    }
  };
}

export function getDocsTopicDialogue(
  topic: 'commit' | 'conflict' | 'push',
  onBack: () => void,
  onOpenAction?: () => void
): DialogueData {
  if (topic === 'commit') {
    return {
      title: "DOCS: WHAT IS A 'COMMIT'?",
      lines: [
        'A commit is an immutable snapshot of your project at a point in time.',
        'It packages staged files with a unique SHA-1 hash, author, and message.',
        'Think of it as saving a permanent checkpoint in your game chronicle!'
      ],
      actionButton: onOpenAction
        ? {
            label: 'Try Commit Forge',
            onClick: onOpenAction
          }
        : undefined,
      secondaryButton: {
        label: 'Back to Library',
        onClick: onBack
      }
    };
  }

  if (topic === 'conflict') {
    return {
      title: "DOCS: WHAT IS A 'MERGE CONFLICT'?",
      lines: [
        'A merge conflict occurs when two branches modify the same line differently.',
        'Git pauses the merge and inserts <<<<<<< and >>>>>>> markers.',
        'You must choose which version to preserve, stage the file, and commit!'
      ],
      actionButton: onOpenAction
        ? {
            label: 'Conflict Arena',
            onClick: onOpenAction
          }
        : undefined,
      secondaryButton: {
        label: 'Back to Library',
        onClick: onBack
      }
    };
  }

  return {
    title: 'DOCS: HOW DO I PUSH TO REMOTE?',
    lines: [
      'Pushing uploads your local commits to a remote repository like GitHub.',
      'Run `git push origin <branch>` once your working tree is clean.',
      'The Git Shrine acts as the celestial portal that transmits your work!'
    ],
    actionButton: onOpenAction
      ? {
          label: 'Visit Git Shrine',
          onClick: onOpenAction
        }
      : undefined,
      secondaryButton: {
        label: 'Back to Library',
        onClick: onBack
      }
  };
}

// 4. MAIN PLAZA (Commit Station)
export function getMainPlazaDialogue(
  state: GameState,
  callbacks: { onOpenCommit: () => void; onInspect: () => void }
): DialogueData {
  const totalChanges = state.git.uncommittedChanges.length + state.git.untrackedFiles.length;

  if (totalChanges > 0) {
    const previewList = state.git.uncommittedChanges
      .concat(state.git.untrackedFiles)
      .slice(0, 3)
      .join(', ');

    return {
      title: 'MAIN PLAZA (COMMIT STATION)',
      lines: [
        `Ready to commit [${totalChanges}] changes?`,
        `Pending files: [${previewList}]`,
        'Stage your modifications and forge an atomic commit.'
      ],
      actionButton: {
        label: 'Commit Changes',
        onClick: callbacks.onOpenCommit
      }
    };
  }

  return {
    title: 'MAIN PLAZA (COMMIT STATION)',
    lines: [
      'The forge anvil rests in silence.',
      'Your working directory is clean! No files need staging.',
      'Create or modify code in your project to prepare new commits.'
    ],
    actionButton: {
      label: 'Inspect History',
      onClick: callbacks.onInspect
    }
  };
}

// 5. REMOTE ORIGIN (Pull Location)
export function getRemoteOriginDialogue(
  state: GameState,
  callbacks: { onPull: () => void; onTeleportShrine: () => void; onInspect: () => void }
): DialogueData {
  if (state.git.commitsBehindRemote > 0) {
    return {
      title: 'REMOTE ORIGIN (BEACON)',
      lines: [
        'Sync with remote?',
        'Updates available from the remote dimension.',
        `Origin has [${state.git.commitsBehindRemote}] new commit(s) ready to pull.`
      ],
      actionButton: {
        label: 'Execute Pull',
        onClick: callbacks.onPull
      }
    };
  }

  if (state.git.commitsAheadOfRemote > 0) {
    return {
      title: 'REMOTE ORIGIN (BEACON)',
      lines: [
        'The beacon is ready to receive your chronicle.',
        `You are [${state.git.commitsAheadOfRemote}] commit(s) ahead of origin.`,
        'Visit the Git Shrine to push your work to remote.'
      ],
      actionButton: {
        label: 'Visit Git Shrine',
        onClick: callbacks.onTeleportShrine
      }
    };
  }

  return {
    title: 'REMOTE ORIGIN (BEACON)',
    lines: [
      'The remote beacon glows with emerald stability.',
      'Your branch is synchronized with origin. No updates pending.',
      'The cosmic timeline is unified.'
    ],
    actionButton: {
      label: 'Inspect Remote',
      onClick: callbacks.onInspect
    }
  };
}
