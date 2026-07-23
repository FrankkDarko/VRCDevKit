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

  'loc.title': 'World localization',
  'loc.subtitle':
    'Edit your translations in a table, import/export CSV or JSON, and generate the UdonSharp script that applies the right language to Text / TextMeshPro components.',
  'loc.languages': 'Languages',
  'loc.reference': 'Reference',
  'loc.addLanguage': 'Add',
  'loc.langCode': 'code (e.g. ja)',
  'loc.langExists': 'This language already exists.',
  'loc.table': 'Translation table',
  'loc.key': 'Key',
  'loc.addRow': 'Add key',
  'loc.importCsv': 'Import CSV',
  'loc.exportCsv': 'Export CSV',
  'loc.importError': 'Unreadable file: {detail}',
  'loc.issues': 'Detections',
  'loc.issues.none': 'Nothing to report: the table is clean.',
  'loc.issue.empty-key': 'Row {row}: empty key.',
  'loc.issue.duplicate-key': 'Duplicate key: "{key}".',
  'loc.issue.orphan':
    'Orphan key: "{key}" has no text in the reference language — the other translations will never be served as fallback.',
  'loc.issue.missing': '"{key}": missing translation in {langs}.',
  'loc.issue.overflow':
    '"{key}" ({lang}): {len} characters vs {refLen} in the reference — UI overflow risk.',
  'loc.outputs': 'Outputs',
  'loc.downloadJson': 'Download runtime JSON',
  'loc.copyScript': 'Copy script',
  'loc.downloadScript': 'Download .cs',
  'loc.note': 'Integration note',
  'loc.downloadNote': 'Download the note (.md)',
  'loc.note.md': `## Wiring it into your world

1. Import \`WorldLocalization.cs\` into your Unity project (Worlds SDK + UdonSharp).
2. Put the **WorldLocalization** component on one GameObject in the scene (a single one is enough).
3. In the Inspector, fill the bindings:
   - \`uiTexts\`: the **Text** (Unity UI) components to localize, and \`uiTextKeys\` the key for each entry, in the same order;
   - \`tmpTexts\` / \`tmpTextKeys\`: same for **TextMeshProUGUI** components.
4. On load, the player's language is detected via \`VRCPlayerApi.GetCurrentLanguage()\`; if it is not in the table, the reference language is used.
5. For an in-world language selector, have your buttons call \`SetLanguage("fr")\`. For dynamically built text, call \`Localize("your.key")\` from your other Udon scripts.
6. No-reupload alternative: serve the **runtime JSON** from your site via VRCStringDownloader and parse it with VRCJson — useful to fix texts after publishing (the generated script uses the embedded strings; this variant needs adapting).

Regenerate the \`.cs\` file after each table change rather than editing the string arrays by hand.`,

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
