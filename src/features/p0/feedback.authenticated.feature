@p0 @feedback
Feature: Feedback Submission
  As a logged-in cemetery user
  I want to submit feedback via the REQUESTS menu
  So that I can provide feedback to cemetery administration

  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully
    When I navigate to organization home page

  @smoke
  Scenario: Submit feedback with required fields only
    When I navigate to Feedback page
    Then I should see the Feedback form
    When I continue past the Insights section
    And I fill the applicant form with the following details:
      | First Name | Test              |
      | Last Name  | Automation        |
      | Email      | test@example.com  |
    And I continue past the Applicant section
    And I select feedback type "General Inquiry"
    And I continue past the Category section
    And I fill feedback details with "Automated test feedback - required fields only"
    And I continue past the Details section
    And I continue past the Thanks section
    Then the feedback submit button should be enabled
    When I click the feedback submit button

  Scenario: Submit feedback with all applicant fields
    When I navigate to Feedback page
    Then I should see the Feedback form
    When I continue past the Insights section
    And I fill the applicant form with the following details:
      | First Name   | Test              |
      | Last Name    | Automation        |
      | Middle Name  | QA                |
      | Title        | Mr                |
      | Email        | test@example.com  |
      | Phone Mobile | 0412345678        |
      | Phone Home   | 0298765432        |
      | Phone Office | 0287654321        |
      | Address      | 123 Test Street   |
      | Suburb       | Testville         |
      | State        | NSW               |
      | Country      | Australia         |
      | Postcode     | 2000              |
    And I continue past the Applicant section
    And I select feedback type "Report an Issue"
    And I continue past the Category section
    And I fill feedback details with "Automated test feedback - all applicant fields filled"
    And I continue past the Details section
    And I continue past the Thanks section
    Then the feedback submit button should be enabled
    When I click the feedback submit button
