Feature: PIM add-employee validation
  As an HR administrator
  I want the add-employee form to reject incomplete or conflicting input
  So that the directory does not fill with bad records

  Background:
    Given I am logged in as an HR administrator

  @localOnly
  Scenario: Reject an employee with a missing last name
    When I try to add an employee with first name "Nina" and no last name
    Then the add-employee form should reject the submission
    And I should see a required-field message on the last name

  @localOnly @seedsData
  Scenario: Reject a duplicate employee id
    Given an employee with employee id "0001" exists
    When I try to add an employee named "Cole" "Frey" with employee id "0001"
    Then the add-employee form should reject the submission
    And I should see a message that the employee id is already in use
