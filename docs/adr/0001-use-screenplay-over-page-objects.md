# ADR-0001: Use the Screenplay pattern over Page Objects

**Status:** Accepted

## Context

The PIM add-employee journey spans several screens (login, add-employee form,
personal-details record, employee list) and several related operations (search, edit,
delete). Page Objects tend to grow into large, low-cohesion classes as a journey widens, and
they mix element location with behaviour. The suite needs to read as intent and compose small
actions across screens.

## Decision

Use the Screenplay pattern: an Actor with Abilities performs Tasks and asks Questions.
Behaviour lives in intent-named Tasks (`AddEmployee`, `SearchForEmployee`); element location
lives in Interactions; assertions are Questions. Serenity/JS provides the implementation and
the living-documentation reporting.

## Trade-off

Screenplay has more moving parts than a Page Object for a trivial single-page test, and a
small learning curve. For a multi-screen journey that doubles as a portfolio piece, the
composition, readability and narrative reporting outweigh that cost. For a one-screen smoke
check, a Page Object would be the lighter fit.

## Concrete example

`<to fill once implemented: the AddEmployee Task composing Interactions across the form and
the personal-details record>`
