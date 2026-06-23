Feature: Manage employees in PIM
  As an HR administrator
  I want to find, update and remove employee records
  So that the directory stays accurate

  Background:
    Given I am logged in as an HR administrator
    And an employee "Odis Adalwin" exists

  Scenario: Find an existing employee by name
    When I search the employee list for "Odis"
    Then the employee "Odis Adalwin" should appear in the employee list

  @changesState
  Scenario: Update an employee's nationality
    When I open the record for "Odis Adalwin"
    And I set the nationality to "British"
    Then the employee record should show the nationality "British"

  @changesState
  Scenario: Remove an employee
    When I delete the employee "Odis Adalwin"
    Then the employee "Odis Adalwin" should not appear in the employee list
