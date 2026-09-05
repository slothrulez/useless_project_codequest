<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# CodeQuest - Your Code. Your World 🎯


## Basic Details
### Team Name: Team CodeQuest


### Team Members
- Team Lead: Anirudh K - Toc H Institute of Science and Technology

### Project Description
CodeQuest is a 2D retro pixel-art RPG that turns mastering Git & GitHub into an immersive, interactive quest. Instead of reading traditional command-line documentation, you explore a fantasy realm where everyday Git operations—staging, committing, branching, stashing, and resolving merge conflicts—are represented as physical world locations and NPC interactions.

### The Problem (that doesn't exist)
We have spent decades turning software development into increasingly efficient workflows. Open a terminal. Run a command. Commit your changes. Create a branch. Push. Merge. Repeat. Efficient? Yes. Memorable? Not exactly. A Git repository can contain the history of an entire project — abandoned ideas, evolving code, branching timelines, unfinished quests, and conflicts born from developers walking different paths — yet all of that is represented through text, hashes, folders, and commands. There is an entire world hidden inside every repository, but we've been looking at it through a terminal window. So, naturally, we decided this was a serious problem that absolutely needed solving.

### The Solution (that nobody asked for)
CODEQUEST turns your GitHub repository into a mystical, playable realm where your codebase becomes the world itself. You don't simply open a repository — you enter it. Your project unfolds into a pixel-art kingdom where ancient commits become fragments of history, folders become unexplored regions, files become inhabitants, branches become divergent paths, issues become quests, and merge conflicts become monsters standing between you and progression. An Elder guides you through the state of your realm, the Commit Forge lets you forge your changes into history, the Git Shrine governs your branches and stash, and when two paths collide, you don't just see conflict markers — you face the consequences as a boss battle. Every realm is generated from the actual repository, meaning every developer gets a world shaped by their own code. We took the most mundane parts of Git, wrapped them in fantasy, adventure, progression, lore, quests, and unnecessarily dramatic pixel-art — because apparently your repository was always an RPG. It just needed a hero.

## Technical Details

### Technologies/Components Used

**For Software:**

**Languages Used:**
- TypeScript (extension logic, game code)
- JavaScript (game engine, runtime)
- HTML5 (webview UI)
- CSS3 (styling, UI overlays)

**Frameworks Used:**
- VS Code Extension API (webview integration, command registration)
- Phaser 3 (2D pixel-art game engine)
- Node.js (backend runtime)

**Libraries Used:**
- `simple-git` (Git operations wrapper)
- `phaser` (game rendering, input, physics)
- `esbuild` (TypeScript bundling)
- `@types/vscode`, `@types/node` (TypeScript definitions)

**Tools Used:**
- npm (package management)
- esbuild (module bundler)
- TypeScript compiler (type checking)
- VS Code (extension testing environment)
- Git CLI (underlying repository operations)

---

### Implementation

#### Installation

```bash
# Clone or create project directory
mkdir codequest && cd codequest

# Initialize npm
npm init -y

# Install production dependencies
npm install phaser simple-git

# Install development dependencies
npm install --save-dev @types/node @types/vscode typescript esbuild

# Create directory structure
mkdir -p src/analyzer src/webview src/game

# Copy source files from provided bundle
# (8 TypeScript files + package.json + tsconfig.json)

# Build the extension
npm run build
```

#### Run

**In VS Code:**

```bash
# Open the project folder
code .

# Press Ctrl+Shift+D (or Cmd+Shift+D on Mac)
# Click "Run Extension" button
# A new VS Code window opens with the extension loaded

# In the new window:
# 1. Open a Git repository folder
# 2. Press Ctrl+Shift+P (or Cmd+Shift+P)
# 3. Type "CodeQuest: Enter Repository"
# 4. Game launches in a webview panel
```

**Development Mode (with auto-rebuild):**

```bash
# Terminal 1: Watch extension code
npm run esbuild-watch

# Terminal 2: Watch game code
npm run build-game-watch

# Changes automatically rebuild on save
# Reload extension: Ctrl+Shift+P → "Developer: Reload Window"
```

**Production Build:**

```bash
npm run vscode:prepublish
```

---

# Screenshots (Add at least 3)
<img width="1920" height="836" alt="Image" src="https://github.com/user-attachments/assets/d3437294-dffa-430b-8304-df8bfe755e89" />
landing page

<img width="1399" height="679" alt="Image" src="https://github.com/user-attachments/assets/a224f441-ebc6-40db-b5a3-8a7f4e70d1d6" />
*Add caption explaining what this shows*

<img width="1402" height="679" alt="Image" src="https://github.com/user-attachments/assets/758c743b-0d3e-4222-9374-33b5bb30ddb8" />
*Add caption explaining what this shows*

<img width="1395" height="679" alt="Image" src="https://github.com/user-attachments/assets/003d2ba3-6a2d-46cc-b28c-1b832e83a4ba" />
dsd

<img width="1401" height="679" alt="Image" src="https://github.com/user-attachments/assets/80f50755-bfed-4e70-9314-412f61acf369" />
fsfs

<img width="1396" height="678" alt="Image" src="https://github.com/user-attachments/assets/ba08f300-7810-4e59-ba0d-d6849fa8ddaa" />
dsdsd

<img width="1399" height="679" alt="Image" src="https://github.com/user-attachments/assets/ffa58a0d-e0ce-4aa9-a2ff-87b4744c55ac" />
dsds

<img width="1404" height="679" alt="Image" src="https://github.com/user-attachments/assets/d6aa9a1b-a824-4cec-a00c-fe2ffd1db79f" />
fsdsds

# Diagrams
```
                    ┌──────────────────────┐
                    │      CODEQUEST       │
                    │    React Frontend    │
                    └──────────┬───────────┘
                               │
                    GitHub OAuth / API
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Express Server    │
                    │      Node.js         │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
       │ GitHub API  │  │ Local Git   │  │ Repository   │
       │             │  │   Engine    │  │    Parser    │
       └──────┬──────┘  └──────┬──────┘  └──────┬───────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │   World Generator    │
                    │                      │
                    │ Repo → Game World   │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │   HTML5 Canvas Game  │
                    │                      │
                    │ Player / NPCs / Map  │
                    │ Quests / Collisions  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Git Actions       │
                    │                      │
                    │ Commit / Branch      │
                    │ Stash / Sync / Merge │
                    └──────────────────────┘
```
                    
CODEQUEST Architecture

### Project Demo
# Video
[![Watch the CodeQuest Demo](https://youtube.com)](https://youtu.be/bV-efmlelcM)
walkthrough

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)



