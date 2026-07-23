/** Shell, navigation, home, categories, tool metadata, shared actions. */
export const common = {
  'app.title': 'VRC DevKit',
  'app.tagline': 'Network tools for VRChat creators — 100% client-side.',
  'nav.home': 'Home',
  'nav.tools': 'Tools',
  'nav.soon': 'soon',
  'lang.label': 'Language',
  'theme.toLight': 'Switch to light theme',
  'theme.toDark': 'Switch to dark theme',
  'footer.note': 'No server, no tracking. Your scripts never leave your browser.',
  'footer.source': 'Source code',
  'footer.discord': 'Discord',

  'category.network': 'Network & persistence',
  'category.distribution': 'Distribution',
  'category.content': 'Content',
  'category.diagnostic': 'Diagnostics',

  'tool.simulator.title': 'Udon sync simulator',
  'tool.simulator.desc':
    'Replay a late joiner, a master leave or an ownership steal without launching VRChat or juggling three accounts. Per-client timeline, highlighted divergences, suggested fixes.',
  'tool.docgen.title': 'Documentation generator',
  'tool.docgen.desc':
    'Drop your UdonSharp scripts: the parser extracts fields, tooltips and synced variables, and produces an installation guide in Markdown (FR, EN, JP).',
  'tool.playerdata.title': 'PlayerData schema generator',
  'tool.playerdata.desc':
    'Describe your save schema: the tool generates the full UdonSharp class — typed getters/setters, OnPlayerRestored, defaults — and the migration code between versions.',
  'tool.statemachine.title': 'UdonSharp state machine',
  'tool.statemachine.desc':
    'Visually edit states and transitions, then generate UdonSharp code with the right network guards. Testable in one click in the sync simulator.',
  'tool.vpm.title': 'VPM package generator',
  'tool.vpm.desc':
    'Name, identifier, version, dependencies: get a validated package.json, repo listing, publish workflow and VCC install README, downloadable as one archive.',
  'tool.quest-triage.title': 'Quest porting triage',
  'tool.quest-triage.desc':
    'A guided decision tree by symptom — black screen, missing textures, broken lightmaps… — leading to a sheet: probable cause, check to run, step-by-step fix.',
  'tool.localization.title': 'World localization',
  'tool.localization.desc':
    'Editable translation table with CSV and JSON import/export, detection of missing or overflowing keys, and a ready-to-wire UdonSharp runtime script.',

  'home.title': 'Tools to make your worlds reliable.',
  'home.intro':
    'VRC DevKit bundles standalone tools for VRChat creators: network, persistence, distribution, content and diagnostics. Everything runs in your browser: nothing is uploaded, nothing is stored anywhere but on your machine.',
  'home.open': 'Open tool',

  'cta.text':
    'A question about this tool, a bug to report, a feature to suggest? The community is on Discord.',
  'cta.button': 'Join the Discord',

  'qt.title': 'Quest porting triage',
  'qt.subtitle':
    'A guided diagnosis, one question at a time: start from the symptom you see on Quest and land on a fix sheet. Every sheet has a shareable URL.',
  'qt.question': 'Question',
  'qt.sheet': 'Fix sheet',
  'qt.cause': 'Probable cause',
  'qt.check': 'Check to run',
  'qt.fix': 'Step-by-step fix',
  'qt.doc': 'Official documentation',
  'qt.back': 'Previous question',
  'qt.restart': 'Restart the diagnosis',
  'qt.shareSheet': 'Copy the link to this sheet',

  'common.run': 'Run simulation',
  'common.add': 'Add',
  'common.remove': 'Remove',
  'common.copy': 'Copy',
  'common.copied': 'Copied!',
  'common.download': 'Download',
  'common.export': 'Export JSON',
  'common.import': 'Import JSON',
  'common.share': 'Copy share link',
  'common.reset': 'Reset',
  'common.loadExample': 'Load an example',
} as const;
