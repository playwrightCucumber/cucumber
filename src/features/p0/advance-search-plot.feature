@p0 @advance-search
Feature: Advanced Search Plot public access
  As a public user
  I want to search for plots using advanced search without logging in
  So that I can find plot information publicly

  Background:
    Given I am on the Chronicle home page

  @advance-search-public @smoke @p0
  Scenario: Advanced search plot by Section, Row, and Number without login
    When I click Advanced search button without login
    And I select cemetery "Astana Tegal Gundul" in advanced search
    And I select Plot tab in advanced search
    And I select section "A" in advanced search without login
    And I select row "B" in advanced search without login
    And I enter plot number "2" in advanced search without login
    And I click Search button in advanced search without login
    Then I should be navigated to advance search results page
    And I should see search results information

  @advance-search-public @p0
  Scenario: Advanced search plot with different section without login
    When I click Advanced search button without login
    And I select cemetery "Astana Tegal Gundul" in advanced search
    And I select Plot tab in advanced search
    And I select section "A" in advanced search without login
    And I select row "B" in advanced search without login
    And I enter plot number "2" in advanced search without login
    And I click Search button in advanced search without login
    Then I should be navigated to advance search results page
    And I should see search results information

  @advance-search-public @p0
  Scenario: Close advanced search results without login
    When I click Advanced search button without login
    And I select cemetery "Astana Tegal Gundul" in advanced search
    And I select Plot tab in advanced search
    And I select section "A" in advanced search without login
    And I select row "A" in advanced search without login
    And I enter plot number "1" in advanced search without login
    And I click Search button in advanced search without login
    And I click close advance search button
    Then I should be on the home page
    And I should see cemeteries list
