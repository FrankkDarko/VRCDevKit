/** Udon sync simulator strings, including diagnostic issues. */
export const simulator = {
  'sim.title': 'Udon sync simulator',
  'sim.subtitle':
    'Describe your synced variables and script behavior, pick a scenario, and watch what every client perceives tick by tick.',
  'sim.variables': 'Synced variables',
  'sim.var.name': 'Name',
  'sim.var.type': 'Type',
  'sim.var.sync': 'Sync',
  'sim.var.initial': 'Initial value',
  'sim.sync.manual': 'Manual',
  'sim.sync.continuous': 'Continuous',
  'sim.addVariable': 'Add variable',
  'sim.ownership': 'Ownership model',
  'sim.ownership.master': 'Master authoritative',
  'sim.ownership.master.desc': 'Only the master writes; SetOwner from others is denied.',
  'sim.ownership.perObject': 'Owner per object',
  'sim.ownership.perObject.desc': 'The object owner writes; ownership can transfer.',
  'sim.ownership.anyone': 'Anyone',
  'sim.ownership.anyone.desc': 'Everyone writes locally — only the owner’s copy replicates.',
  'sim.behavior': 'Script behavior',
  'sim.behavior.serializeOnPlayerJoined': 'RequestSerialization in OnPlayerJoined',
  'sim.behavior.applyOnDeserialization': 'Applies received state (OnDeserialization)',
  'sim.behavior.handleOwnershipTransferred': 'Re-serializes in OnOwnershipTransferred',
  'sim.behavior.setOwnerBeforeWrite': 'Networking.SetOwner before every write',
  'sim.behavior.customEvents': 'Custom events (comma separated)',
  'sim.clients': 'Virtual clients',
  'sim.seed': 'Seed',
  'sim.scenarios': 'Scenarios',
  'sim.scenario.lateJoiner': 'Late joiner arrival',
  'sim.scenario.lateJoiner.desc': 'The owner writes, then a player joins the instance.',
  'sim.scenario.masterLeave': 'Master leave and migration',
  'sim.scenario.masterLeave.desc': 'The master leaves with unserialized state.',
  'sim.scenario.ownershipSteal': 'Ownership steal during a write',
  'sim.scenario.ownershipSteal.desc': 'A client grabs ownership between write and serialization.',
  'sim.scenario.concurrentWrite': 'Concurrent write by two clients',
  'sim.scenario.concurrentWrite.desc': 'Two clients write the same variable on the same tick.',
  'sim.scenario.serializationBurst': 'RequestSerialization burst',
  'sim.scenario.serializationBurst.desc': 'The owner serializes faster than the rate limit.',
  'sim.scenario.instanceOwnerLeave': 'Instance owner leave',
  'sim.scenario.instanceOwnerLeave.desc': 'The first player leaves early; everything must migrate.',
  'sim.actions': 'Manual composition',
  'sim.actions.hint':
    'The selected scenario is expanded below; edit, add or remove actions freely.',
  'sim.action.tick': 'Tick',
  'sim.action.client': 'Client',
  'sim.action.type': 'Action',
  'sim.action.variable': 'Variable',
  'sim.action.value': 'Value',
  'sim.action.event': 'Event',
  'sim.action.join': 'Join',
  'sim.action.leave': 'Leave',
  'sim.action.write': 'Write',
  'sim.action.requestSerialization': 'RequestSerialization',
  'sim.action.takeOwnership': 'SetOwner',
  'sim.action.custom': 'Custom event',
  'sim.addAction': 'Add action',
  'sim.ticks': 'Duration (ticks)',
  'sim.results': 'Results',
  'sim.timeline': 'Per-client timeline',
  'sim.timeline.empty': 'Run the simulation to see the timeline.',
  'sim.legend.owner': 'owner',
  'sim.legend.master': 'master',
  'sim.legend.divergence': 'divergence',
  'sim.legend.absent': 'absent',
  'sim.client': 'Client {n}',
  'sim.issues': 'Detected problems',
  'sim.issues.none': 'No problems detected: this design converges on this scenario.',
  'sim.severity.error': 'error',
  'sim.severity.warning': 'warning',
  'sim.severity.info': 'info',
  'sim.cause': 'Cause',
  'sim.fix': 'Suggested fix',
  'sim.importError': 'Invalid JSON: configuration ignored.',
  'sim.urlError': 'Unreadable share link: default configuration loaded.',

  'issue.late-joiner-missed-state.title': 'Late joiner out of sync',
  'issue.late-joiner-missed-state.cause':
    'Client {client} (joined at tick {tick}) never received the current value of {vars}, because it was never serialized after being changed.',
  'issue.late-joiner-missed-state.fix':
    'In OnPlayerJoined (owner side), call RequestSerialization() — or switch the variable to Continuous sync if it rarely changes.',
  'issue.missing-ondeserialization.title': 'Received state never applied',
  'issue.missing-ondeserialization.cause':
    '{count} received packet(s) were ignored: the script does not apply state in OnDeserialization.',
  'issue.missing-ondeserialization.fix':
    'Implement OnDeserialization() and push the synced variables into visible state (animations, UI, transforms).',
  'issue.write-without-ownership.title': 'Write without ownership',
  'issue.write-without-ownership.cause':
    'Client(s) {clients} wrote {vars} without owning the object: the change stays local and never replicates.',
  'issue.write-without-ownership.fix':
    'Call Networking.SetOwner(Networking.LocalPlayer, gameObject) before writing, then RequestSerialization().',
  'issue.write-without-ownership-master.title': 'Write outside the master',
  'issue.write-without-ownership-master.cause':
    'In a master-authoritative model, client(s) {clients} wrote {vars} without being master: local change only.',
  'issue.write-without-ownership-master.fix':
    'Send a SendCustomNetworkEvent to the master (owner) and let it perform the write and the serialization.',
  'issue.concurrent-write.title': 'Concurrent write',
  'issue.concurrent-write.cause':
    'Clients {clients} wrote {variable} on the same tick {tick}: the outcome depends on who owns the object at serialization time.',
  'issue.concurrent-write.fix':
    'Serialize intents (event to the owner) rather than state, or guard the write with a synced "busy" flag.',
  'issue.serialization-rate-limited.title': 'Serialization rate limited',
  'issue.serialization-rate-limited.cause':
    '{count} RequestSerialization call(s) were dropped: the network throttles the send rate.',
  'issue.serialization-rate-limited.fix':
    'Batch changes: set a dirty flag and call RequestSerialization only once per frame/tick.',
  'issue.request-serialization-non-owner.title': 'RequestSerialization with no effect',
  'issue.request-serialization-non-owner.cause':
    'Client(s) {clients} called RequestSerialization without being owner: the call is silently ignored.',
  'issue.request-serialization-non-owner.fix':
    'Check Networking.IsOwner before calling RequestSerialization, or transfer ownership first.',
  'issue.state-lost-on-leave.title': 'State lost when owner left',
  'issue.state-lost-on-leave.cause':
    'Client {client} left at tick {tick} with never-serialized changes to {vars}: they are gone for good.',
  'issue.state-lost-on-leave.fix':
    'Serialize right after every write, and re-serialize in OnOwnershipTransferred on the new owner.',
  'issue.ownership-transfer-during-write.title': 'Ownership stolen during a write',
  'issue.ownership-transfer-during-write.cause':
    'Ownership moved from {from} to {to} at tick {tick} while changes were not yet serialized: they get overwritten by the new owner’s state.',
  'issue.ownership-transfer-during-write.fix':
    'Deny transfers during a write via OnOwnershipRequest, or make writes atomic (write then RequestSerialization in the same frame).',
  'issue.final-desync.title': 'Persistent divergence',
  'issue.final-desync.cause':
    'At the end of the scenario, clients disagree on: {vars}. This design does not converge.',
  'issue.final-desync.fix':
    'Make a single client authoritative (master or single owner) and ensure every change is followed by a serialization.',
  'issue.no-serialization-manual.title': 'Manual variables never serialized',
  'issue.no-serialization-manual.cause':
    'Manual-sync variables ({vars}) were modified but RequestSerialization never went through: nobody else sees those changes.',
  'issue.no-serialization-manual.fix':
    'Call RequestSerialization() after every owner-side write, or switch to Continuous sync.',
} as const;
