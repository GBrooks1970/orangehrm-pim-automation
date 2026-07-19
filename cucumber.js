// Cucumber profile. Discovers feature files and the step definitions that satisfy
// them, compiles TypeScript on the fly via ts-node, and wires Serenity/JS as the
// reporting and Screenplay layer.
//
// The `default` profile runs the active suite. The `smoke` profile runs the demo-safe
// subset intended for a shared, non-resettable target (the public demo): it excludes
// quarantined scenarios, any that change state (@changesState), any confined to the
// local target (@localOnly), and any whose Background seeds data via an API write
// (@seedsData). This currently narrows smoke to exactly one scenario (employee search)
// — see docs/backlog.md #4 for that scenario's own remaining Background-seed caveat,
// which this profile does not resolve, only documents.

const common = [
  'features/**/*.feature',
  '--require-module ts-node/register',
  '--require src/serenity.config.ts',
  '--require src/hooks/**/*.ts',
  '--require src/step-definitions/**/*.ts',
  '--format @serenity-js/cucumber',
].join(' ');

module.exports = {
  default: `${common} --tags "not @deferred"`,
  smoke: `${common} --tags "not @deferred and not @changesState and not @localOnly and not @seedsData"`,
};
