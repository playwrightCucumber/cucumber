@login @authenticated @p0

Feature: Login to Chronicle
  As a cemetery organization user
  I want to login to Chronicle
  So that I can manage cemetery data

  Background:
    Given I am on the Chronicle login page

  @login-valid @smoke
  Scenario: Successful login with valid credentials
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully
    And I should see the organization name "<TEST_ORG_NAME>"
    And I should see my email "<TEST_EMAIL>"

  @login-invalid @negative
  Scenario: Login with invalid credentials
    When I enter email "invalid@chronicle.rip"
    And I enter password "wrongpassword"
    And I click the login button
    Then I should see an error message

  @login-empty-email @negative
  Scenario: Login with empty email
    When I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then the login button should be disabled

  @login-empty-password @negative
  Scenario: Login with empty password
    When I enter email "<TEST_EMAIL>"
    And I click the login button
    Then the login button should be disabled
