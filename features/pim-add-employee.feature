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

  @changesState
  Scenario: Add a new employee with login credentials
    When I add an employee named "Marcus" "Hale" with login details
    Then the employee "Marcus Hale" should appear in the employee list
