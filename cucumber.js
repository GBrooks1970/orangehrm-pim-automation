// Cucumber profile. Discovers feature files and the step definitions that satisfy
// them, compiles TypeScript on the fly via ts-node, and wires Serenity/JS as the
// reporting and Screenplay layer.
//
// The `default` profile runs the active suite. The `smoke` profile runs a read-only
// subset safe against a shared, non-resettable target (the public demo): it excludes
// quarantined scenarios and any that change state.

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
  smoke: `${common} --tags "not @deferred and not @changesState"`,
};
