@p0 @test-v2 @public
Feature: Chronicle Login Test

  Scenario: Navigate and verify staging
    Given I navigate to "https://staging.chronicle.rip"
    Then I wait for network to be idle