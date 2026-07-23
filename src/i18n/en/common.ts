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

  'sm.title': 'UdonSharp state machine',
  'sm.subtitle':
    'Visually edit states and transitions, then generate UdonSharp code with the right network guards — and test the design in the sync simulator in one click.',
  'sm.canvas': 'Canvas',
  'sm.canvas.hint':
    'Drag nodes to move them. Wheel: zoom. Drag the background: pan. Click a node or an arrow to edit it — everything is also keyboard-editable in the panels below.',
  'sm.addState': 'Add state',
  'sm.linkMode': 'Add transition',
  'sm.linkMode.pickSource': 'Click the SOURCE state…',
  'sm.linkMode.pickTarget': 'Click the TARGET state…',
  'sm.deleteSelected': 'Delete selection',
  'sm.test': 'Test in the simulator',
  'sm.machine': 'Machine',
  'sm.className': 'Class name',
  'sm.variables': 'Synced variables',
  'sm.addVariable': 'Add variable',
  'sm.states': 'States',
  'sm.state.name': 'Name',
  'sm.state.authority': 'Allowed trigger',
  'sm.authority.master': 'Master only',
  'sm.authority.owner': 'Owner only',
  'sm.authority.anyone': 'Everyone',
  'sm.state.initial': 'Initial state',
  'sm.state.assignments': 'Writes on state entry',
  'sm.addAssignment': 'Add write',
  'sm.assign.variable': 'Variable',
  'sm.assign.value': 'Value (C# expression)',
  'sm.transitions': 'Transitions',
  'sm.transition.name': 'Name (event)',
  'sm.transition.from': 'From',
  'sm.transition.to': 'To',
  'sm.transition.condition': 'C# condition (optional)',
  'sm.selected.none': 'Click an element on the canvas, or select it in the lists.',
  'sm.validation': 'Validation',
  'sm.validation.ok': 'The machine is valid.',
  'sm.issue.no-states': 'The machine contains no states.',
  'sm.issue.no-initial': 'No initial state set (or the designated state no longer exists).',
  'sm.issue.invalid-state-name':
    'Invalid state name: "{name}" (C# identifier expected: letters, digits, _).',
  'sm.issue.duplicate-state-name': 'Two states share the same name: "{name}".',
  'sm.issue.invalid-transition-name':
    'Invalid transition name: "{name}" (it becomes a public C# method).',
  'sm.issue.dangling-transition': 'Transition "{name}" references a deleted state.',
  'sm.issue.duplicate-trigger':
    'Two transitions named "{name}" leave the same state "{state}": the trigger would be ambiguous.',
  'sm.issue.unreachable-state':
    'State unreachable from the initial state: "{name}" (no transition path leads to it).',
  'sm.issue.unknown-variable': 'State "{state}" writes an unknown variable: "{variable}".',
  'sm.issue.invalid-variable-name': 'Invalid variable name: "{name}".',
  'sm.issue.duplicate-variable': 'Duplicate variable: "{name}".',
  'sm.code': 'Generated UdonSharp code',

  'vpm.title': 'VPM package generator',
  'vpm.subtitle':
    "Describe your package and drop the asset folder: the tool validates the inputs and produces package.json, repo listing, publish workflow and install README — downloadable as one archive.",
  'vpm.package': 'Package',
  'vpm.displayName': 'Display name',
  'vpm.id': 'Reverse-domain id',
  'vpm.id.placeholder': 'com.author.package',
  'vpm.version': 'Version',
  'vpm.description': 'Description',
  'vpm.authorName': 'Author',
  'vpm.authorEmail': 'E-mail (optional)',
  'vpm.authorUrl': 'Website (optional)',
  'vpm.license': 'License',
  'vpm.unity': 'Unity version',
  'vpm.repoUrl': 'GitHub repository',
  'vpm.repoUrl.placeholder': 'https://github.com/You/YourRepo',
  'vpm.deps': 'Dependencies',
  'vpm.deps.worlds': 'VRChat SDK — Worlds',
  'vpm.deps.avatars': 'VRChat SDK — Avatars',
  'vpm.deps.udonsharp': 'UdonSharp (bundled with Worlds SDK >= 3.4)',
  'vpm.tree': 'Asset folder tree',
  'vpm.tree.drop': 'Drop the asset folder here',
  'vpm.tree.browse': 'Pick a folder…',
  'vpm.tree.paste': 'Or type the paths, one per line (e.g. Runtime/Door.cs)',
  'vpm.tree.addPaths': 'Add these paths',
  'vpm.tree.count': '{n} file(s) — {size} KB',
  'vpm.tree.skipped': '{n} file(s) skipped: too large for the browser-generated archive.',
  'vpm.tree.clear': 'Clear',
  'vpm.validation': 'Validation',
  'vpm.validation.ok': 'Inputs are valid: the package is ready to generate.',
  'vpm.issue.invalid-id':
    'Invalid id: "{id}". Expected format: lowercase with at least three segments, e.g. com.author.package.',
  'vpm.issue.invalid-version':
    'Invalid version: "{version}". Semantic versioning expected: MAJOR.MINOR.PATCH (e.g. 1.2.0, 1.0.0-beta.1).',
  'vpm.issue.missing-name': 'The package display name is empty.',
  'vpm.issue.missing-author': 'The author name is empty.',
  'vpm.issue.invalid-repo-url':
    'Invalid repository URL: "{url}". Expected: https://github.com/Owner/Repo — it derives the listing URL and the release zip URLs.',
  'vpm.issue.both-sdks':
    'Worlds and Avatars both selected: a package rarely targets both — make sure this is intended.',
  'vpm.issue.udonsharp-needs-worlds':
    'UdonSharp requires the Worlds SDK: check Worlds or uncheck UdonSharp.',
  'vpm.issue.no-sdk': 'No SDK selected: the package will have no VRChat dependency.',
  'vpm.issue.empty-tree':
    'No asset files: the archive will only contain the skeleton (package.json, listing, workflow, README).',
  'vpm.outputs': 'Generated files',
  'vpm.downloadZip': 'Download the archive (.zip)',
  'vpm.listingUrl': 'Listing URL to add in the VCC',

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
