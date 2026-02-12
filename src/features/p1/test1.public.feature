@p1 @testxx @public
Feature: test1

  Scenario: test loginpage
    Given I navigate to "https://staging.chronicle.rip"
    When I click on '[data-testid="toolbar-a-mat-focus-indicator"]'
    Then I wait for URL to contain "/login"
    And I should see text "Login to your account" in '[data-testid="login-login-screen-h2-sign-in-text"]'