@p1 @import @authenticated
Feature: Cemetery Data Import
  As a support admin
  I want to navigate to the import page from cemetery admin
  So that I can import cemetery data

  Background:
    Given I am logged in as support admin on the Chronicle login page
    When I select the AUS server region
    And I search for cemetery "Astana tegal gundul"
    And I click on cemetery "Astana tegal gundul" in the sidebar

  # ===========================
  # UI Validation
  # ===========================

  @navigate-to-import @smoke @p1
  Scenario: Navigate to import page via More menu
    When I open the More menu
    And I click Import from the menu
    Then I should be on the import page
    And I should see the import page title "Import data"
    And the Import button should be disabled
    And I should see the following data categories on the import page
      | Category   |
      | Sections   |
      | Plots      |
      | Persons    |
      | ROIs       |
      | Interments |
      | Stories    |
      | Events     |
      | LOT        |
      | Notes      |
      | Invoices   |

  @back-to-cemetery @p1
  Scenario: Navigate back to cemetery from import page
    When I navigate to the import page
    And I click Back to the Cemetery
    Then I should be back on the cemetery page

  # ===========================
  # Full Import Flow
  # ===========================

  @wipe-and-import @p1
  Scenario: Full import flow - wipe, upload all files, submit and verify completion
    When I navigate to the import page
    And I wipe the cemetery data and confirm
    And I upload the following files to the import page
      | Category   | FileType | FileName                                        |
      | Sections   | geojson  | Section_AUS_GEOJSON_Astana_Tegal_Gundul.geojson |
      | Plots      | geojson  | Plots_AUS_GEOJSON_Astana_Tegal_Gundul.geojson   |
      | Plots      | csv      | Plots_tanpa_image.csv                           |
      | Persons    | csv      | Persons_Astana_Tegal_Gundul.csv                 |
      | ROIs       | csv      | Rois_Astana_Tegal_Gundul.csv                    |
      | Interments | csv      | Interments_Astana_Tegal_Gundul.csv              |
      | Stories    | csv      | Stories_Astana_Tegal_Gundul.csv                 |
      | Events     | csv      | Events_Astana_Tegal_Gundul.csv                  |
      | LOT        | geojson  | Lot_AUS_GEOJSON_Astana_Tegal_Gundul.geojson     |
      | Notes      | csv      | Notes_AUS_Astana_Tegal_Gundul.csv               |
    Then the Import button should be enabled
    And I click the Import button
    And the import should be submitted successfully
    And I should see the import progress bar in the cemetery sidebar
    And the import should complete successfully via API

# Upload order matters after wipe (count=0):
# 1. Sections, Plots (geojson+csv), Persons → always available
# 2. ROIs, Interments, Stories, Events → unlocked after Plots+Persons are uploaded
# 3. LOT, Notes → always available
