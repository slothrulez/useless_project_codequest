import express from "express";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const execAsync = promisify(exec);
const PORT = 3000;

interface GitStatusResult {
  repoName: string;
  repoPath: string;
  currentBranch: string;
  status: 'clean' | 'dirty' | 'conflict' | 'ahead' | 'behind';
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

let currentRepoPath = process.cwd();

// Helper to run git command safely
async function runGit(cmd: string, cwd = currentRepoPath): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd });
    return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
  } catch (err: any) {
    return {
      stdout: (err.stdout || '').trim(),
      stderr: (err.stderr || err.message || '').trim(),
      exitCode: err.code || 1
    };
  }
}

// Friendly error and suggestion analyzer
function analyzeGitError(errorStr: string, cmd = ''): { message: string; suggestion: string } {
  const lower = (errorStr + ' ' + cmd).toLowerCase();
  if (lower.includes('nothing to commit')) {
    return {
      message: 'There are no changes to commit.',
      suggestion: 'Make some changes to your project files before forging a commit.'
    };
  }
  if (lower.includes('non-fast-forward') || lower.includes('failed to push some refs') || lower.includes('fetch first')) {
    return {
      message: 'Remote origin contains commits you do not have locally.',
      suggestion: 'Pull updates from origin first before pushing (git pull origin <branch>).'
    };
  }
  if (lower.includes('conflict') || lower.includes('automatic merge failed')) {
    return {
      message: 'Merge conflict detected in working tree.',
      suggestion: 'Face the Merge Conflict Boss to resolve file contradictions.'
    };
  }
  if (lower.includes('not a git repository')) {
    return {
      message: 'Selected directory is not a Git repository.',
      suggestion: 'Run "git init" in this folder or connect to a valid Git repository.'
    };
  }
  if (lower.includes('up to date')) {
    return {
      message: 'Branch is already up to date with remote.',
      suggestion: 'All commits are synchronized with origin.'
    };
  }
  if (lower.includes('could not read from remote') || lower.includes('permission denied')) {
    return {
      message: 'Authentication or connection failed with remote repository.',
      suggestion: 'Verify your remote URL and SSH/credentials settings.'
    };
  }
  return {
    message: errorStr || 'The Git operation could not be completed.',
    suggestion: 'Review your branch state and retry the operation.'
  };
}

// Get comprehensive real git status
async function getRealGitStatus(cwd = currentRepoPath): Promise<GitStatusResult> {
  const repoName = path.basename(cwd) || 'codequest-repo';

  // 1. Check branch and status with porcelain
  const { stdout: porcelain } = await runGit('git status --porcelain=v1 -b', cwd);
  const lines = porcelain ? porcelain.split('\n') : [];

  let currentBranch = 'main';
  let commitsAhead = 0;
  let commitsBehind = 0;

  const uncommittedChanges: { file: string; status: string }[] = [];
  const untrackedFiles: string[] = [];
  const conflictingFiles: string[] = [];

  for (const line of lines) {
    if (line.startsWith('##')) {
      // e.g. ## main...origin/main [ahead 1, behind 2]
      const branchMatch = line.match(/^##\s+([^\s\.]+)/);
      if (branchMatch) {
        currentBranch = branchMatch[1];
      }
      const aheadMatch = line.match(/ahead (\d+)/);
      if (aheadMatch) {
        commitsAhead = parseInt(aheadMatch[1], 10);
      }
      const behindMatch = line.match(/behind (\d+)/);
      if (behindMatch) {
        commitsBehind = parseInt(behindMatch[1], 10);
      }
      continue;
    }

    if (!line.trim()) continue;

    const code = line.substring(0, 2);
    const file = line.substring(3).trim();

    // Check conflict codes
    if (['UU', 'AA', 'DD', 'UD', 'DU', 'AU', 'UA'].includes(code)) {
      conflictingFiles.push(file);
    } else if (code === '??') {
      untrackedFiles.push(file);
    } else {
      let statusDesc = 'modified';
      if (code.includes('D')) statusDesc = 'deleted';
      if (code.includes('A')) statusDesc = 'added';
      if (code.includes('R')) statusDesc = 'renamed';
      uncommittedChanges.push({ file, status: statusDesc });
    }
  }

  // 2. Commit info
  let currentCommit = {
    hash: '0000000',
    message: 'No commits yet',
    author: 'Unknown',
    date: 'just now'
  };

  const { stdout: logOut } = await runGit('git log -1 --pretty=format:"%h|%s|%an|%cr"', cwd);
  if (logOut && logOut.includes('|')) {
    const [hash, message, author, date] = logOut.split('|');
    currentCommit = { hash, message, author, date };
  }

  // 3. Remote URL
  let remoteUrl = 'git@github.com:codequest-rpg/main.git';
  const { stdout: remoteOut } = await runGit('git remote get-url origin', cwd);
  if (remoteOut) {
    remoteUrl = remoteOut;
  }

  // 4. Branch list
  const { stdout: branchOut } = await runGit('git branch --format="%(refname:short)"', cwd);
  const branches = branchOut
    ? branchOut.split('\n').map((b) => b.trim()).filter(Boolean)
    : ['main'];
  if (!branches.includes(currentBranch)) {
    branches.push(currentBranch);
  }

  // 5. Determine overall game status
  let status: 'clean' | 'dirty' | 'conflict' | 'ahead' | 'behind' = 'clean';
  if (conflictingFiles.length > 0) {
    status = 'conflict';
  } else if (uncommittedChanges.length > 0 || untrackedFiles.length > 0) {
    status = 'dirty';
  } else if (commitsAhead > 0) {
    status = 'ahead';
  } else if (commitsBehind > 0) {
    status = 'behind';
  }

  return {
    repoName,
    repoPath: cwd,
    currentBranch,
    status,
    uncommittedChanges,
    untrackedFiles,
    commitsAhead,
    commitsBehind,
    hasConflict: conflictingFiles.length > 0,
    conflictingFiles,
    currentCommit,
    remoteUrl,
    branches
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API: Get comprehensive Git status
  app.get("/api/git/status", async (req, res) => {
    try {
      const status = await getRealGitStatus();
      res.json({ success: true, ...status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: General command execution requested in Follow-up Prompt 8
  // e.g. executeGitCommand(command, repo)
  app.post("/api/git", async (req, res) => {
    try {
      const { command, repo } = req.body;
      if (!command || typeof command !== 'string') {
        return res.status(400).json({ success: false, error: "Command string is required" });
      }

      // Target directory
      const targetCwd = (repo && typeof repo === 'string' && fs.existsSync(repo)) ? repo : currentRepoPath;

      // Execute git command
      const { stdout, stderr, exitCode } = await runGit(command, targetCwd);

      if (exitCode !== 0 && !stdout) {
        const analyzed = analyzeGitError(stderr, command);
        return res.json({
          success: false,
          error: analyzed.message,
          suggestion: analyzed.suggestion,
          rawError: stderr,
          command,
          output: stderr
        });
      }

      // Check if output indicates an error even with 0 code
      if (stderr && (stderr.includes('error:') || stderr.includes('fatal:'))) {
        const analyzed = analyzeGitError(stderr, command);
        return res.json({
          success: false,
          error: analyzed.message,
          suggestion: analyzed.suggestion,
          rawError: stderr,
          command,
          output: stderr
        });
      }

      res.json({
        success: true,
        output: stdout || stderr || "Command executed successfully.",
        stdout,
        stderr,
        command
      });
    } catch (err: any) {
      const analyzed = analyzeGitError(err.message);
      res.status(500).json({
        success: false,
        error: analyzed.message,
        suggestion: analyzed.suggestion,
        rawError: err.message
      });
    }
  });

  // API: Connect or switch local repository path
  app.post("/api/git/connect", async (req, res) => {
    try {
      const { path: newPath } = req.body;
      const targetPath = newPath ? newPath.trim() : process.cwd();

      // Check if path exists
      if (!fs.existsSync(targetPath)) {
        return res.status(400).json({
          success: false,
          error: `Directory does not exist: ${targetPath}`,
          suggestion: "Please check the path spelling or select a valid local folder."
        });
      }

      // Check if it's a git repository or needs init
      const gitDir = path.join(targetPath, '.git');
      if (!fs.existsSync(gitDir)) {
        await runGit('git init', targetPath);
      }

      currentRepoPath = targetPath;
      const status = await getRealGitStatus(currentRepoPath);

      res.json({
        success: true,
        message: `Connected to repository: ${status.repoName}`,
        repo: {
          name: status.repoName,
          path: status.repoPath,
          remoteURL: status.remoteUrl
        },
        status
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Get repository info
  app.get("/api/git/repo", async (req, res) => {
    try {
      const status = await getRealGitStatus();
      res.json({
        success: true,
        repo: {
          name: status.repoName,
          path: status.repoPath,
          remoteURL: status.remoteUrl
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Commit changes
  app.post("/api/git/commit", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: "Commit message is required" });
      }

      // Add all changes and commit
      await runGit("git add -A");
      const { stdout, stderr } = await runGit(`git commit -m ${JSON.stringify(message.trim())}`);

      if (stderr && stderr.includes("nothing to commit")) {
        return res.status(400).json({ success: false, error: "Nothing to commit, working tree clean." });
      }

      const status = await getRealGitStatus();
      res.json({
        success: true,
        message: `Commit created: ${message.trim()}`,
        commitHash: status.currentCommit.hash,
        status
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Push to remote origin
  app.post("/api/git/push", async (req, res) => {
    try {
      const currentStatus = await getRealGitStatus();
      const branch = req.body.branch || currentStatus.currentBranch || "main";

      // Execute real git push
      const { stdout, stderr } = await runGit(`git push origin ${branch}`);

      // Re-fetch status
      const updatedStatus = await getRealGitStatus();
      res.json({
        success: true,
        message: `Code synchronized with origin/${branch}`,
        stdout,
        stderr,
        status: updatedStatus
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Pull from remote origin
  app.post("/api/git/pull", async (req, res) => {
    try {
      const currentStatus = await getRealGitStatus();
      const branch = req.body.branch || currentStatus.currentBranch || "main";

      // Execute real git pull
      const { stdout, stderr } = await runGit(`git pull origin ${branch}`);

      const updatedStatus = await getRealGitStatus();
      res.json({
        success: true,
        message: `Updates pulled from remote origin/${branch}`,
        stdout,
        stderr,
        status: updatedStatus
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Checkout/switch branch
  app.post("/api/git/checkout", async (req, res) => {
    try {
      const { branch, create } = req.body;
      if (!branch) {
        return res.status(400).json({ success: false, error: "Branch name is required" });
      }

      const cmd = create ? `git checkout -b ${branch}` : `git checkout ${branch}`;
      const { stdout, stderr } = await runGit(cmd);

      const status = await getRealGitStatus();
      res.json({
        success: true,
        message: `Switched to branch '${branch}'`,
        stdout,
        stderr,
        status
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Resolve merge conflict
  app.post("/api/git/resolve-conflict", async (req, res) => {
    try {
      const { file, strategy } = req.body;
      if (!file) {
        return res.status(400).json({ success: false, error: "File name is required" });
      }

      if (strategy === 'ours') {
        await runGit(`git checkout --ours -- "${file}"`);
        await runGit(`git add -- "${file}"`);
      } else if (strategy === 'theirs') {
        await runGit(`git checkout --theirs -- "${file}"`);
        await runGit(`git add -- "${file}"`);
      } else {
        // Mark as resolved directly
        await runGit(`git add -- "${file}"`);
      }

      // Check remaining conflicts
      const statusCheck = await getRealGitStatus();
      if (statusCheck.conflictingFiles.length === 0) {
        // Automatically create conflict resolved commit
        await runGit('git commit -m "Merge conflict resolved"');
      }

      const finalStatus = await getRealGitStatus();
      res.json({
        success: true,
        message: `Conflict resolved for ${file} using strategy: ${strategy}`,
        status: finalStatus
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Simulation actions for instant state testing in the RPG
  app.post("/api/git/simulate", async (req, res) => {
    try {
      const { action } = req.body;

      if (action === 'dirty') {
        // Append comment to src/quest_notes.txt
        const notesPath = path.join(process.cwd(), 'src', 'quest_notes.txt');
        fs.appendFileSync(notesPath, `// Tainted working tree test at ${new Date().toISOString()}\n`);
      } else if (action === 'untracked') {
        const relicPath = path.join(process.cwd(), `untracked_relic_${Date.now().toString().slice(-4)}.txt`);
        fs.writeFileSync(relicPath, "An ancient untracked scroll floating through the repository realm.");
      } else if (action === 'ahead') {
        const notesPath = path.join(process.cwd(), 'src', 'quest_notes.txt');
        fs.appendFileSync(notesPath, `// Relic discovered at ${new Date().toISOString()}\n`);
        await runGit("git add -A");
        await runGit('git commit -m "feat(relic): unearth ancient code artifact"');
      } else if (action === 'conflict') {
        // Create an intentional conflict
        const conflictFile = path.join(process.cwd(), 'src', 'conflict_orb.txt');
        // Ensure on main with commit
        fs.writeFileSync(conflictFile, "Original state of the Orb.\n");
        await runGit("git add -A");
        await runGit('git commit -m "chore: place orb in sanctuary"');
        await runGit("git push origin main");

        // Create branch conflict-source
        await runGit("git checkout -b conflict-source");
        fs.writeFileSync(conflictFile, "Dark Chaos corrupts the Orb!\n");
        await runGit("git add -A");
        await runGit('git commit -m "chaos: darken the orb"');

        // Back to main and make conflicting change
        await runGit("git checkout main");
        fs.writeFileSync(conflictFile, "Pure Light purifies the Orb!\n");
        await runGit("git add -A");
        await runGit('git commit -m "light: purify the orb"');

        // Attempt merge to trigger genuine git conflict
        await runGit("git merge conflict-source");
      } else if (action === 'clean') {
        await runGit("git reset --hard HEAD");
        await runGit("git clean -fd");
        // Check if in conflict state, abort merge if so
        await runGit("git merge --abort");
      }

      const status = await getRealGitStatus();
      res.json({ success: true, action, status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CodeQuest Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
