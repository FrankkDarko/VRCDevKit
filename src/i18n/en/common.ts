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

  'pd.title': 'PlayerData schema generator',
  'pd.subtitle':
    "Describe your world's save keys: the tool generates the full UdonSharp class (typed accessors, OnPlayerRestored, defaults) and, if you load a previous version, the migration code.",
  'pd.schema': 'Current schema',
  'pd.className': 'Class name',
  'pd.keyPrefix': 'Key prefix',
  'pd.version': 'Schema version',
  'pd.field.key': 'Key',
  'pd.field.type': 'Type',
  'pd.field.default': 'Default value',
  'pd.addField': 'Add key',
  'pd.migration': 'Migration',
  'pd.baseline.none':
    'No migration baseline: the code is generated without a migration path. Load a previous version’s JSON, or take the current schema as the baseline before editing it.',
  'pd.baseline.active':
    'Baseline: v{v}. Edit rows freely (rename, type, removal) — each row is tracked individually, a rename is never mistaken for a removal.',
  'pd.baseline.load': 'Load previous version (JSON)',
  'pd.baseline.snapshot': 'Take current schema as baseline',
  'pd.baseline.clear': 'Remove baseline',
  'pd.steps': 'Migration path',
  'pd.steps.none': 'No difference with the baseline: no migration needed.',
  'pd.step.add': 'Added: {key} ({type}) — existing players will start from the default value.',
  'pd.step.remove': 'Removed: {key} ({type})',
  'pd.step.rename': 'Renamed: {from} → {to} ({type})',
  'pd.step.retype': 'Type changed: {key} ({from} → {to})',
  'pd.step.rename-retype': 'Renamed + type changed: {from} → {to} ({fromType} → {toType})',
  'pd.warn.lossy-conversion':
    'Lossy conversion for {key} ({from} → {to}): truncation or parse failure possible; on failure the default value applies.',
  'pd.warn.non-migratable':
    'Not automatically migratable: {key} ({from} → {to}). The old value is abandoned, players restart from the default.',
  'pd.warn.removed-key-persists':
    'PlayerData never deletes a key: "{key}" will stay orphaned in player data (harmless, simply no longer read).',
  'pd.warn.version-not-bumped':
    'The schema changed but the version did not increase (v{old} → v{new}): the migration will not trigger. Bump the version.',
  'pd.warn.duplicate-key': 'Duplicate key: "{key}".',
  'pd.warn.invalid-key': 'Invalid key: "{key}" (letters, digits and _ only, no leading digit).',
  'pd.warn.no-fields': 'The schema contains no keys.',
  'pd.code': 'Generated UdonSharp class',
  'pd.copyCode': 'Copy code',
  'pd.downloadCs': 'Download .cs',
  'pd.importError': 'Invalid JSON: schema ignored.',

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
