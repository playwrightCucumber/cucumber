Feature: Login to Chronicle
  As a cemetery organization user
  I want to login to Chronicle
  So that I can manage cemetery data

  Background:
    Given I am on the Chronicle login page

  @p0 @login @smoke
  Scenario: Successful login with valid credentials
    When I enter email "faris+astanaorg@chronicle.rip"
    And I enter password "12345"
    And I click the login button
    Then I should be logged in successfully
    And I should see the organization name "astana tegal gundul"
    And I should see my email "faris+astanaorg@chronicle.rip"

  @p0 @login @negative
  Scenario: Login with invalid credentials
    When I enter email "invalid@chronicle.rip"
    And I enter password "wrongpassword"
    And I click the login button
    Then I should see an error message

  @p0 @login @negative
  Scenario: Login with empty email
    When I enter password "12345"
    And I click the login button
    Then the login button should be disabled

  @p0 @login @negative
  Scenario: Login with empty password
    When I enter email "faris+astanaorg@chronicle.rip"
    And I click the login button
    Then the login button should be disabled
