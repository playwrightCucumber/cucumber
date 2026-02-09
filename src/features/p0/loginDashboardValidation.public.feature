@p0 @public
Feature: login dashboard validation

  Scenario: login url
    Given I navigate to "https://staging.chronicle.rip/login"
    When I click on "data-testid="toolbar-a-mat-focus-indicator""
    Then I wait for URL to contain "/login"
    And I wait for network to be idle
    And I should see "data-testid="login-login-screen-button-mat-focus-indicator""