# Architecture Decision Records

Short notes capturing each load-bearing decision: its context, the decision, and the
trade-off. They exist so a reviewer understands why the suite is shaped as it is.

| ADR | Decision |
|---|---|
| [0001](0001-use-screenplay-over-page-objects.md) | Use the Screenplay pattern over Page Objects |
| [0002](0002-local-docker-target-over-shared-demo.md) | Provision a local Docker target rather than test the shared demo |
| [0003](0003-api-driven-setup.md) | Set up test data through REST API v2, not the UI |

Each ADR carries a concrete-example marker to be filled with the real artifact once the
implementation exists.
