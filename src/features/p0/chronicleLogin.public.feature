@p0 @public
Feature: Chronicle Login

  Scenario: Navigate to login page
    Given I navigate to "https://staging.chronicle.rip"
    Then I wait for network to be idle