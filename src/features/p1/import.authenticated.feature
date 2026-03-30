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

  @navigate-to-import @smoke @p1
  Scenario: Navigate to import page via More menu
    When I open the More menu
    And I click Import from the menu
    Then I should be on the import page
    And I should see the import page title "Import data"

  @verify-import-categories @p1
  Scenario: Verify all data categories are visible on import page
    When I navigate to the import page
    Then I should see the following data categories on the import page
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

  # @verify-import-button-state @p1
  # Scenario: Verify Import button is disabled without file upload
  #   When I navigate to the import page
  #   Then the Import button should be disabled

  @back-to-cemetery @p1
  Scenario: Navigate back to cemetery from import page
    When I navigate to the import page
    When I click Back to the Cemetery
    Then I should be back on the cemetery page

  # @upload-geojson @p1
  # Scenario: Upload Sections geojson file to import page
  #   When I navigate to the import page
  #   And I upload "geojson" file "Section_AUS_GEOJSON_Astana_Tegal_Gundul.geojson" to category "Sections"
  #   Then the file "Section_AUS_GEOJSON_Astana_Tegal_Gundul.geojson" should be visible in the "Sections" "geojson" section
  #   And the Import button should be enabled

  # @upload-csv @p1
  # Scenario: Upload Plots CSV file to import page
  #   When I navigate to the import page
  #   And I upload "csv" file "Plots_tanpa_image.csv" to category "Plots"
  #   Then the file "Plots_tanpa_image.csv" should be visible in the "Plots" "csv" section
  #   And the Import button should be enabled

  @upload-all-files @p1
  Scenario: Upload all import files for all categories
    When I navigate to the import page
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

  @wipe-and-import @p1
  Scenario: Wipe data then upload all files and submit import
    When I navigate to the import page
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
    And I click the Import button
    Then the import should be submitted successfully
    And I should see the import progress bar in the cemetery sidebar
    And the import should complete successfully via API
# Upload order matters after wipe (count=0):
# 1. Sections, Plots (geojson+csv), Persons → always available
# 2. ROIs, Interments, Stories, Events → unlocked after Plots+Persons are uploaded
# 3. LOT, Notes → always available
