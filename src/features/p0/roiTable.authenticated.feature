@p0 @roi-table @authenticated
Feature: ROI Table Menu Management
    As a cemetery administrator
    I want to add ROI from the table menu
    So that I can manage ROIs directly from the tables interface

    Background:
        Given I am on the Chronicle login page
        When I enter email "<TEST_EMAIL>"
        And I enter password "<TEST_PASSWORD>"
        And I click the login button
        Then I should be logged in successfully

    @add-roi-from-table @smoke @p0
    Scenario: Navigate to ROI table and verify Add ROI button
        When I click the sidebar table menu
        Then I should see the tables page
        And I should see the following tabs
            | Plots     |
            | Interment |
            | ROIs      |
            | Persons   |
            | Business  |
        When I click the ROIs tab
        Then I should see the Add ROI button next to Export button
