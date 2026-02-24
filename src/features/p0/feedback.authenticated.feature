Feature: Feedback at Cemetery Level
  As a logged-in cemetery user
  I want to submit feedback via the Request menu
  So that I can provide feedback to cemetery administration

  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully
    When I navigate to organization home page

  @p0x @feedback @smoke
  Scenario: Submit feedback successfully via Request menu
    When I navigate to Feedback page via Request menu
    Then I should be on the Feedback page
    When I fill feedback form with following details:
      | subject  | Test Feedback from Automation       |
      | category | General                             |
      | message  | This is an automated test feedback. |
    Then the feedback submit button should be enabled
    When I click the feedback submit button
    Then the feedback should be submitted successfully

  @p0x @feedback
  Scenario: Submit feedback with all fields
    When I navigate to Feedback page via Request menu
    Then I should be on the Feedback page
    When I fill feedback form with following details:
      | subject  | Complete Feedback Test             |
      | category | Suggestion                         |
      | message  | Detailed feedback with all fields. |
      | email    | <TEST_EMAIL>                       |
      | name     | Test User                          |
      | phone    | 1234567890                         |
    Then the feedback submit button should be enabled
    When I click the feedback submit button
    Then the feedback should be submitted successfully
    And I should see feedback success message

  @p0x @feedback @step-by-step
  Scenario: Navigate to feedback page and verify form elements
    When I click on Request button in sidebar
    And I select Feedback from the request menu
    Then I should be on the Feedback page
    When I fill feedback subject with "Manual Test Feedback"
    And I fill feedback message with "Testing individual form steps"
    Then the feedback submit button should be visible
