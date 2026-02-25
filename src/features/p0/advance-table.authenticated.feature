@p0 @advance-table @authenticated
Feature: Advance Table - Plot Management
  As an authenticated user
  I want to filter and manage plots in the advance table
  So that I can find specific plots quickly

  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully

  @filter @plot-filter
  Scenario: Filter plots by section, row, and number
    When I navigate to the advance table page
    And I am on the PLOTS tab
    And I click the filter button
    Then I should see the filter modal form
    When I fill in the plot filter with section "A" row "A" and number "1"
    And I click the apply filter button
    Then the first row should display plot ID "A A 1"
    And the first row section should be "A"
    And the first row row should be "A"
    And the first row number should be "1"
