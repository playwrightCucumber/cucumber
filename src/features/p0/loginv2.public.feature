@p0 @public
Feature: loginv2

  Scenario: login with valid credential
    Given I navigate to "https://staging.chronicle.rip/"
    When I click on "[data-testid='toolbar-a-mat-focus-indicator']"
    Then I wait for network to be idle