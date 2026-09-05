<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# [Project Name] 🎯


## Basic Details
### Team Name: [Name]


### Team Members
- Team Lead: [Name] - [College]

### Project Description
CodeQuest is a 2D retro pixel-art RPG that turns mastering Git & GitHub into an immersive, interactive quest. Instead of reading traditional command-line documentation, you explore a fantasy realm where everyday Git operations—staging, committing, branching, stashing, and resolving merge conflicts—are represented as physical world locations and NPC interactions.

### The Problem (that doesn't exist)
[What ridiculous problem are you solving?]

### The Solution (that nobody asked for)
Git is too easy to ignore. You type `git push` and nothing feels like it matters—it's just text on a screen. No ceremony. No stakes. No drama. Meanwhile, what you're actually doing is saving your work permanently, sharing code with the world, potentially breaking production, and collaborating with others, but it feels like typing. So we asked an absurd question: What if Git operations felt like they mattered? What if pushing code required facing a wizard first? What if merge conflicts were actual boss fights? What if your repository was a world you could explore? CodeQuest is the answer to a question nobody asked. We're solving the ridiculous problem of developers being too productive with Git—instead of typing `git push origin main` in 5 seconds, you now have to walk to the Git Shrine, get permission from a wizard, and solve merge conflicts as literal boss fights. Is there a real problem? No. But there is an opportunity: What if the most important tool in development was also the most fun? This project exists to prove that unnecessary things can be beautiful, that over-engineering something ridiculous can result in something genuinely cool, and that Git—which is actually a dramatic narrative of your project's evolution—deserves to feel that way.

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
![Screenshot1](Add screenshot 1 here with proper name)
*Add caption explaining what this shows*

![Screenshot2](Add screenshot 2 here with proper name)
*Add caption explaining what this shows*

![Screenshot3](Add screenshot 3 here with proper name)
*Add caption explaining what this shows*

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



