@p0 @roi @roi-table @authenticated
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

    @add-roi-table @p0
    Scenario: Add new ROI from table menu
        When I click the sidebar table menu
        And I filter plots by status "Vacant" in Plots tab
        And I get the first plot name from the filtered table
        And I click the ROIs tab
        And I click the Add ROI button from table
        Then I should see the Add ROI form
        When I search and select the saved vacant plot for ROI
        And I fill ROI form from table with following details
            | rightType         | <TEST_ROI_TABLE_RIGHT_TYPE> |
            | termOfRight       | <TEST_ROI_TABLE_TERM>       |
            | fee               | <TEST_ROI_TABLE_FEE>        |
            | certificateNumber | <TEST_ROI_TABLE_CERT>       |
        And I save the ROI from table
        Then I should see toast message "Data saved successfully."
        And I should see ROI in the table

    @edit-roi-table @p0
    Scenario: Edit ROI from table menu
        When I click the sidebar table menu
        And I click the ROIs tab
        And I click edit on the first ROI row
        Then I should see the Edit ROI form
        When I fill ROI form from table with following details
            | fee | 2500 |
        And I save the ROI from table
        Then I should see updated ROI in the table

    # PRE-CONDITION: plot <TEST_ROI_REPLACE_PLOT_ID> must be a reserved plot with any existing holder.
    # New holder name is generated randomly each run — no hardcoded existing person required.
    @remove-replace-holder @smoke @roi-remove-replace
    Scenario: Replace ROI holder with a new person and verify activity log
        When I click the sidebar table menu
        And I click the ROIs tab
        And I open the ROI edit form for plot "<TEST_ROI_REPLACE_PLOT_ID>"
        Then I should see the Edit ROI form

        # Replace current holder by creating a brand-new person (random name each run)
        When I replace ROI holder with new person "<TEST_ROI_NEW_HOLDER_FIRSTNAME>" "<TEST_ROI_NEW_HOLDER_LASTNAME>"

        # Verify the new holder appears in the form
        Then I should see ROI holder "<TEST_ROI_NEW_HOLDER_FIRSTNAME> <TEST_ROI_NEW_HOLDER_LASTNAME>" in the edit form

        # Save from the table-edit view — redirects to advance-table?tab=rois
        When I save the ROI from table edit view
        Then I should see the tables page

        # Navigate back and validate activity log under Changes filter
        When I click the ROIs tab
        And I open the ROI edit form for plot "<TEST_ROI_REPLACE_PLOT_ID>"
        And I switch activity filter to "Changes"
        Then I should see activity log entry containing "<TEST_ROI_NEW_HOLDER_FIRSTNAME>"
