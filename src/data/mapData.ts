import { GameLocation } from '../types';

export const WORLD_WIDTH = 1400;
export const WORLD_HEIGHT = 1000;
export const VIEWPORT_WIDTH = 960;
export const VIEWPORT_HEIGHT = 640;

export const LOCATIONS: GameLocation[] = [
  {
    id: 'elder',
    name: "THE ELDER'S CHAMBER",
    subtitle: 'Keeper of the Git Scrolls',
    type: 'npc',
    x: 700,
    y: 195,
    width: 150,
    height: 140,
    interactionRadius: 90,
    promptQuote: 'Seek issues. Move forward. Solve wisdom.',
    dialogue: [
      'Seek issues. Move forward. Solve wisdom.',
      'A true master commits with intent, branches with courage, and merges without conflict.',
      'The tree of code branches infinitely, yet all stems from the ancient root commit.'
    ]
  },
  {
    id: 'git_shrine',
    name: 'GIT SHRINE (.git)',
    subtitle: 'The Sacred Repository Cavern',
    type: 'shrine',
    x: 1230,
    y: 175,
    width: 150,
    height: 140,
    interactionRadius: 95,
    promptQuote: 'Glowing with the eternal fire of HEAD -> refs/heads/main',
    dialogue: [
      'The ancient .git chamber burns with the red fire of history.',
      'Every snapshot since epoch 0 is etched into these obsidian stones.',
      'Dare you gaze into the reflog or invoke the sacred reset?'
    ]
  },
  {
    id: 'docs',
    name: 'DOCS LIBRARY',
    subtitle: 'Waterfall of Knowledge',
    type: 'facility',
    x: 120,
    y: 360,
    width: 140,
    height: 120,
    interactionRadius: 90,
    promptQuote: 'Knowledge flows like fresh mountain water.',
    dialogue: [
      'Welcome to the Docs Library beside the falls.',
      'Here you can read documentation, branch architectures, and git survival guides.'
    ]
  },
  {
    id: 'commit_station',
    name: 'COMMIT STATION',
    subtitle: 'Anvil of Staged Changes',
    type: 'facility',
    x: 480,
    y: 690,
    width: 130,
    height: 110,
    interactionRadius: 85,
    promptQuote: "git add . && git commit -m 'your message'",
    dialogue: [
      'Welcome to the Commit Station!',
      'Here you can package your working changes into permanent snapshots.'
    ]
  },
  {
    id: 'branch_npc',
    name: 'CHRONOMANCER ELENA',
    subtitle: 'Mistress of Parallel Branches',
    type: 'npc',
    x: 270,
    y: 430,
    width: 120,
    height: 120,
    interactionRadius: 85,
    promptQuote: 'git checkout <branch> - Travel across dimensions.',
    dialogue: [
      'I am Chronomancer Elena. I weave parallel timelines of our codebase.',
      'Switch between branches or spin up new features with courage.'
    ]
  },
  {
    id: 'merge_boss',
    name: 'MERGE CONFLICT BOSS',
    subtitle: 'Reality Distortion Anomaly',
    type: 'boss',
    x: 700,
    y: 470,
    width: 160,
    height: 140,
    interactionRadius: 100,
    promptQuote: 'REALITY HAS COLLAPSED! Resolve conflict!',
    dialogue: [
      'Reality has collapsed! Conflicting timelines have torn the repository apart!',
      'You must choose how to resolve each conflicting line to restore peace!'
    ]
  },
  {
    id: 'plaza',
    name: 'MAIN PLAZA',
    subtitle: 'Default Branch Sanctuary',
    type: 'landmark',
    x: 700,
    y: 588,
    width: 150,
    height: 140,
    interactionRadius: 85,
    promptQuote: 'refs/heads/main - The sacred trunk from which all features branch.',
    dialogue: [
      'You stand in the center of the Main Plaza under the Great Commit Tree.',
      'All paths through the village radiate from this trunk branch.'
    ]
  },
  {
    id: 'house_green',
    name: 'src/ COTTAGE',
    subtitle: 'Source Logic & Components',
    type: 'house',
    roofColor: '#15803d',
    fileRepresentation: 'src/',
    x: 338,
    y: 618,
    width: 140,
    height: 120,
    interactionRadius: 85,
    promptQuote: 'Home of the algorithms, React trees, and state loops.',
    dialogue: [
      'Welcome to src/! This is where all living functions reside.',
      'Always keep your components modular and your hooks pure!'
    ]
  },
  {
    id: 'house_red',
    name: 'README.md MANOR',
    subtitle: 'The Gateway to the Project',
    type: 'house',
    roofColor: '#b91c1c',
    fileRepresentation: 'README.md',
    x: 939,
    y: 369,
    width: 140,
    height: 120,
    interactionRadius: 85,
    promptQuote: 'First impressions are eternal in the open-source realm.',
    dialogue: [
      'Greetings! I am README.md, the welcoming lantern of this repository.',
      'A project without a clear README is like a map without legends. Tell travelers how to run your magic!'
    ]
  },
  {
    id: 'house_brown',
    name: 'package.json TAVERN',
    subtitle: 'Dependencies & Run Scripts',
    type: 'house',
    roofColor: '#78350f',
    fileRepresentation: 'package.json',
    x: 531,
    y: 838,
    width: 140,
    height: 120,
    interactionRadius: 85,
    promptQuote: 'The manifest that binds libraries and build scripts together.',
    dialogue: [
      'Clink your glasses! In package.json, dependencies gather from npm realms far and wide.',
      'Treat your semver with care, or the dragons of breaking changes will awaken!'
    ]
  },
  {
    id: 'house_dark',
    name: '.gitignore FORTRESS',
    subtitle: 'Keeper of Secrets & Cleanliness',
    type: 'house',
    roofColor: '#1e293b',
    fileRepresentation: '.gitignore',
    x: 869,
    y: 838,
    width: 140,
    height: 120,
    interactionRadius: 85,
    promptQuote: 'Banish node_modules and .env secrets from public sight!',
    dialogue: [
      'HALT! I am the silent guardian: .gitignore.',
      'I keep node_modules from devouring your disk, and stop confidential API keys from leaking into the public wild.'
    ]
  },
  {
    id: 'house_blue',
    name: 'tests/ SANCTUARY',
    subtitle: 'Blue Roof Testing Chamber',
    type: 'house',
    roofColor: '#1d4ed8',
    fileRepresentation: 'tests/',
    x: 461,
    y: 369,
    width: 140,
    height: 120,
    interactionRadius: 85,
    promptQuote: 'Green checkmarks bring peace to the soul.',
    dialogue: [
      'Here in tests/, every assertion is tested against the crucible of edge cases.',
      'Never deploy without passing unit tests!'
    ]
  },
  {
    id: 'house_purple',
    name: 'assets/ WORKSHOP',
    subtitle: 'Purple Roof Art Studio',
    type: 'house',
    roofColor: '#6b21a8',
    fileRepresentation: 'assets/',
    x: 1062,
    y: 618,
    width: 140,
    height: 120,
    interactionRadius: 85,
    promptQuote: 'Sprites, audio chimes, and pixel palettes are crafted here.',
    dialogue: [
      'Welcome to assets/! We craft 16x16 pixel sprites and retro waveforms.',
      'Charming art is the soul of any indie quest.'
    ]
  },
  {
    id: 'remote_origin',
    name: 'REMOTE ORIGIN',
    subtitle: 'Cloud Storage & Upstream Dock',
    type: 'facility',
    x: 1272,
    y: 862,
    width: 140,
    height: 120,
    interactionRadius: 95,
    promptQuote: 'git push origin main - Ships your commits across the cosmic cloud.',
    dialogue: [
      'You have arrived at the Remote Origin dock.',
      'From here, vessels carry git packs to GitHub and GitLab constellations across the sea.'
    ]
  }
];

// Initial files in working directory
export const INITIAL_GIT_FILES = [
  {
    name: 'App.tsx',
    path: 'src/App.tsx',
    status: 'modified' as const,
    diff: '+ <GitShrine active={true} />\n- <div className="loading" />'
  },
  {
    name: 'elder.ts',
    path: 'src/dialogue/elder.ts',
    status: 'modified' as const,
    diff: '+ "Seek issues. Move forward. Solve wisdom."'
  },
  {
    name: 'character.png',
    path: 'assets/character.png',
    status: 'untracked' as const,
    diff: 'Binary file added (16x16 Gorillaz walking sprite sheet)'
  }
];

export const INITIAL_COMMIT_HISTORY = [
  {
    hash: '7f9a2b1',
    message: 'feat: awaken the Ancient Elder at the stone chamber',
    author: 'CodeQuest Traveler',
    timestamp: '2 hours ago',
    branch: 'main'
  },
  {
    hash: '4c8e1a3',
    message: 'style: ignite torches at Git Shrine with lava glow',
    author: 'CodeQuest Traveler',
    timestamp: '5 hours ago',
    branch: 'main'
  },
  {
    hash: '9d2f7e0',
    message: 'build: construct circular MAIN plaza and 4 village houses',
    author: 'CodeQuest Traveler',
    timestamp: '1 day ago',
    branch: 'main'
  },
  {
    hash: '1a0e34c',
    message: 'initial commit: map landscape, waterfall, and DOCS library',
    author: 'Repository Architect',
    timestamp: '3 days ago',
    branch: 'main'
  }
];
