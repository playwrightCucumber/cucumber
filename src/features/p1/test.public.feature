@p1 @testchro @public
Feature: test

  Scenario: logindeden
    Given I navigate to "https://staging.chronicle.rip/"
    When I wait for network to be idle
    Then I click on "[data-testid="toolbar-a-mat-focus-indicator"]"
    And the URL should contain "/login"
    And I should see text "Login to your account" in "[data-testid="login-login-screen-h2-sign-in-text"]"