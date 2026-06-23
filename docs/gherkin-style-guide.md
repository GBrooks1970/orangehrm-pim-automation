# Gherkin style guide

The feature files are the specification. They are read by people deciding whether the
behaviour is right, not only by the machine that runs them. Treat the Gherkin as if it were
code: atomic, high cohesion, low coupling, business domain language only.

## Principles

Scenarios are declarative. They describe what the HR administrator is trying to achieve, not
which fields get typed into. UI mechanics belong in the Tasks and Interactions.

Steps are reusable and phrased consistently. `the employee "X" should appear in the employee
list` is written the same way everywhere, so one step definition serves add, search and
delete. Near-duplicate steps are a defect.

Background carries setup, resolved through the API. Login and any pre-existing employee are
arranged in the Background through the REST ability, never by clicking through the form.

Assert the persisted record, not the transient signal. After a save OrangeHRM flashes a
success toast that fades on a timer. Asserting on it is fragile. Assert instead on the
stable facts: the employee's name and Employee Id on the personal-details page and the list
row. This is the PIM analogue of the reference project's "assert the subtotal, never the
grand total".

## Composite versus granular steps

Use granular steps when the steps are the subject of the test, for example the validation
scenarios that turn on the add-employee form's behaviour. A composite step (one step for the
whole add) is justified only where adding is pure setup for a later assertion. This suite
keeps the add granular because adding is itself the behaviour under test; it does not carry a
speculative composite "an employee exists via the UI" step, because the API Background covers
setup. Reintroduce a composite only when a scenario genuinely needs one.

## A bad scenario refactored

Below is the add-employee happy path written badly, then as it appears in
`features/pim-add-employee.feature`.

### Before

```gherkin
Feature: PIM

  Scenario: add a person
    Given I open "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login"
    And I type "Admin" into "#username"
    And I type "admin123" into "#password"
    And I click ".oxd-button"
    And I wait 5 seconds
    And I click "a[href*='viewPimModule']"
    And I click "Add Employee"
    And I type "Aurora" into "input[name='firstName']"
    And I type "Vega" into "input[name='lastName']"
    And I wait 2 seconds
    And I click "button[type='submit']"
    Then the page should contain "Successfully Saved"
```

### After

```gherkin
Feature: Add an employee to PIM
  As an HR administrator
  I want to add a new employee to the system
  So that their records can be managed in PIM

  Background:
    Given I am logged in as an HR administrator

  @changesState
  Scenario: Add a new employee with valid personal details
    When I add an employee named "Aurora" "Vega"
    Then the employee "Aurora Vega" should appear in the employee list
    And the employee record should show the name "Aurora Vega"
```

### What changed, and why it matters

**Declarative, not imperative.** The `before` is a transcript of selectors and keystrokes; a
reviewer cannot tell whether the behaviour is right, only whether the script is faithful. The
`after` states intent, and the field names and the Vue routing move into the Tasks and
Interactions. When OrangeHRM restyles the form, only an Interaction changes.

**No hard waits.** `I wait 5 seconds` and `I wait 2 seconds` are the worst lines: too slow
when the SPA is ready sooner, too flaky when it is not. They vanish in the `after`; waiting is
`Wait.until(element, isVisible())` inside the Tasks. A feature file never mentions time.

**Login and setup belong in the Background, through the API.** The `before` logs in by
clicking, incidental detail that breaks whenever the login page changes. The `after` declares
`I am logged in as an HR administrator` once and the API ability arranges the session.

**Assert the persisted record, not the toast.** The `before` checks `Successfully Saved`, a
toast that fades and races the assertion. The `after` asserts the employee appears in the
list and the record shows the name, both stable and durable.

**One name per intent.** The `before` mixes `I type … into …` and `I click …` across two
real actions. The `after` reuses a small vocabulary (`I add an employee named …`, `the
employee … should appear in the employee list`) that also serves the management and
validation features.

**A title that describes behaviour.** `add a person` names an action; `Add a new employee
with valid personal details` names the behaviour and reads as a sentence in the living
documentation.
