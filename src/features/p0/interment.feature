@p0 @interment
Feature: Interment Management
  As a cemetery administrator
  I want to add Interments through multiple entry points
  So that I can record deceased persons in the cemetery

  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully

  # ─────────────────────────────────────────────────────────────────────────────
  # FLOW 1: Add Interment via Advance Table → PLOTS tab
  #
  # Entry: Tables sidebar → PLOTS tab → filter status Vacant → get plot name
  #        → switch to INTERMENTS tab → click ADD INTERMENTS → select saved plot
  #
  # Note: Plot selection on the Add Interment form (from table) uses a search
  #       combobox. We save the vacant plot name from the PLOTS tab first,
  #       then use it to search and select the correct plot in the form.
  #
  # URL pattern: /advance-table/manage/add/interment-table/{cemeteryId}
  # ─────────────────────────────────────────────────────────────────────────────

  @add-interment @add-interment-from-table @smoke @p0
  Scenario: Add Interment from Advance Table INTERMENTS tab and verify in list
    When I click the sidebar table menu
    And I filter plots by status "Vacant" in Plots tab
    And I get the first plot name from the filtered table
    And I click the Interments tab in advance table
    And I click Add Interments button from advance table
    Then I should see the Add Interment form
    When I search and select the saved vacant plot for Interment
    And I fill interment form with following details
      | firstName     | <TEST_INTERMENT_FIRSTNAME> |
      | lastName      | <TEST_INTERMENT_LASTNAME>  |
      | intermentType | <TEST_INTERMENT_TYPE>      |
    And I save the Interment from table
    Then I should be redirected to advance table interments list
    And I should see the saved plot name in the interments list
    And I should see deceased first name "<TEST_INTERMENT_FIRSTNAME>" in the interments list

  # ─────────────────────────────────────────────────────────────────────────────
  # FLOW 2: Add Interment via Plot Detail page (from Map sidebar or Plots list)
  #
  # Entry A: Map view → "See all Plots" → filter Vacant → select plot
  #          → plot detail sidebar shows "Add interment" button → click it
  # Entry B: Advance Table PLOTS tab → click Plot ID link (navigate to edit)
  #          → NOT this flow (edit leads to edit plot form, not detail)
  #
  # In automation we use the Map/Plot list approach (same as existing scenario):
  # Navigate to all plots → filter Vacant → select first vacant plot
  # → plot detail loads → click "Add interment" button on detail page
  #
  # URL pattern: /customer-organization/{org}/{plotId}/manage/add/interment
  # ─────────────────────────────────────────────────────────────────────────────

  @add-interment @add-interment-from-plot @smoke @p0
  Scenario: Add Interment from plot detail page and verify deceased appears in INTERMENTS tab
    When I navigate to all plots page
    And I open the filter dialog
    And I select vacant filter
    And I apply the filter plot
    And I expand the first section
    And I select the first vacant plot
    When I click Add Interment button from plot detail
    And I fill interment form with following details
      | firstName     | <TEST_INTERMENT_FIRSTNAME> |
      | lastName      | <TEST_INTERMENT_LASTNAME>  |
      | intermentType | <TEST_INTERMENT_TYPE>      |
    And I save the Interment
    Then I should see deceased "<TEST_INTERMENT_FIRSTNAME> <TEST_INTERMENT_LASTNAME>" in the Interment tab
    And I should see interment type "<TEST_INTERMENT_TYPE>"

  # ─────────────────────────────────────────────────────────────────────────────
  # FLOW 3: Edit Interment via Plot Detail page
  #
  # Entry: Select an occupied plot → INTERMENTS tab → Edit button
  # ─────────────────────────────────────────────────────────────────────────────

  @edit-interment @smoke @p0
  Scenario: Edit existing Interment from plot detail and verify changes
    When I navigate to all plots page
    And I open the filter dialog
    And I select occupied filter
    And I apply the filter plot
    And I expand the first section
    And I select the first occupied plot
    And I click on Interments tab
    When I click Edit Interment button
    And I update interment form with following details
      | firstName     | <TEST_INTERMENT_EDIT_FIRSTNAME> |
      | lastName      | <TEST_INTERMENT_EDIT_LASTNAME>  |
      | intermentType | <TEST_INTERMENT_EDIT_TYPE>      |
    And I save the Interment
    Then I should see deceased "<TEST_INTERMENT_EDIT_FIRSTNAME> <TEST_INTERMENT_EDIT_LASTNAME>" in the Interment tab
    And I should see interment type "<TEST_INTERMENT_EDIT_TYPE>"
