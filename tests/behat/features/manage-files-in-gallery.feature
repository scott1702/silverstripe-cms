@javascript @assets
Feature: Manage files in gallery
  As a cms author
  I want to upload and manage files within the CMS
  So that I can insert them into my content efficiently

  Background:
    Given a "image" "assets/folder1/file1.jpg" was created "2012-01-01 12:00:00"
    And a "image" "assets/folder1/folder1-1/file2.jpg" was created "2010-01-01 12:00:00"
    And a "folder" "assets/folder2"
    And I am logged in with "ADMIN" permissions
    And I go to "/admin/assets"
    And I follow "Gallery View"

  @modal
  Scenario: I can add a new folder in the gallery view
    Given I press the "Add folder" button
    And I type "newfolder" into the dialog
    And I confirm the dialog
    Then I should see "newfolder"

  Scenario: I can list files in a folder in the gallery view
    Given I double click "folder1" in the ".gallery" element
    Then I should see "file1"
    And I should not see "file1-1"

  Scenario: I can upload a file to a folder in the gallery view
    Given I double click on "folder1" in the ".gallery" element
    And I attach the file "testfile.jpg" to "AssetUploadField" with HTML5
    And I wait for 5 seconds
    Then the "folder1" table should contain "testfile"

  Scenario: I can edit a file in the gallery view
    Given I double click "folder1" in the ".gallery" element
    And I double click "folder1-1" in the ".gallery" element
    Then I should see "file2"
    And I press "Edit"
    And I fill in "renamedfile" for "Title"
    And I press the "Save" button
    Then I should not see "file2"
    And I should see "renamedfile"

  Scenario: I can delete a file in the gallery view
    Given I double click "folder1" in the ".gallery" element
    And I double click "folder1-1" in the ".gallery" element
    Then I should see "file2"
    And I press the "Delete" button, confirming the dialog
    Then I should not see "file2"

  Scenario: I can see allowed extensions help in the gallery view
    Given I click "Show allowed extensions" in the ".ss-uploadfield-view-allowed-extensions" element
    Then I should see "png,"

  Scenario: I can filter the files list view using name in the gallery view
    Given I expand the content filters
    And I fill in "Name" with "file1"
    And I press the "Search" button
    And I follow "Gallery View"
    Then I should see "file1"
    And I should not see "file2"

  Scenario: I can filter the files list view using filetype in the gallery view
    Given a "file" "assets/document.pdf"
    And I expand the content filters
    And I select "Image" from "File type" with javascript
    And I press the "Search" button
    And I follow "Gallery View"
    Then I should see "file1"
    And I should not see "document"

  Scenario: I can filter out files that don't match the date range in the gallery view
    Given I expand the content filters
    And I fill in "From" with "2003-01-01"
    And I fill in "To" with "2011-01-01"
    And I press the "Search" button
    And I follow "Gallery View"
    And I should see "file2"
    And I should not see "file1"

  Scenario: I can delete multiple items with one action
    Given I double click "folder1" in the ".gallery" element
    And I double click "folder1-1" in the ".gallery" element
    And I should see "file2"
    And I press "Select"
    And I click "Select an action..." in the ".gallery__bulk" element
    And I click "Delete" in the ".chzn-results" element, confirming the dialog
    And I should not see "file2"
