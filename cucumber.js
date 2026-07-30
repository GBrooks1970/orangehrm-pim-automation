// Cucumber profile. Discovers feature files and the step definitions that satisfy
// them, compiles TypeScript on the fly via ts-node, and wires Serenity/JS as the
// reporting and Screenplay layer.
//
// The `default` profile runs the active suite. The `smoke` profile runs a narrower
// LOCAL-ONLY subset: it excludes quarantined scenarios, any that change state
// (@changesState), any explicitly confined to the local target (@localOnly), and
// scenarios tagged for API seeding (@seedsData). It currently selects one employee-
// search scenario whose feature Background creates a unique, scenario-owned fixture
// and whose After hook removes that exact record.
// Every profile loads the fail-fast loopback guard in browser.hooks.ts; `smoke`
// describes selection breadth, never permission to target the shared public demo.

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
