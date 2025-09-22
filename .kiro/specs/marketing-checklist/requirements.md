# Requirements Document

## Introduction

This feature involves creating a mobile iOS application that allows users to maintain and manage a checklist of individuals for marketing material distribution. The app will provide secure, personal data management with authentication to ensure privacy. Users can track their marketing outreach progress by checking off completed contacts, editing their lists, and adding contextual comments throughout their marketing campaigns.

## Requirements

### Requirement 1

**User Story:** As a marketing professional, I want to securely authenticate into the app, so that my contact lists and progress remain private and protected.

#### Acceptance Criteria

1. WHEN a user opens the app for the first time THEN the system SHALL display authentication options (sign up/sign in)
2. WHEN a user provides valid credentials THEN the system SHALL authenticate them using Firebase Auth
3. WHEN a user provides invalid credentials THEN the system SHALL display appropriate error messages
4. WHEN a user is authenticated THEN the system SHALL maintain their session until they log out
5. WHEN a user logs out THEN the system SHALL clear their session and return to the authentication screen

### Requirement 2

**User Story:** As a marketing professional, I want to add, update, and delete years in my marketing campaign history, so that I can manage my yearly contact lists effectively.

#### Acceptance Criteria

1. WHEN a user wants to create a new year THEN the system SHALL provide an interface to add a new year to their campaign history
2. WHEN a user creates a new year THEN the system SHALL initialize it with an empty contact list
3. WHEN a user wants to delete a year THEN the system SHALL provide confirmation and remove the year and all associated contacts
4. WHEN a user deletes a year THEN the system SHALL switch to displaying another available year or create the current year if none exist
5. WHEN a user wants to rename a year THEN the system SHALL allow updating the year label while preserving all associated contact data
6. WHEN managing years THEN the system SHALL prevent deletion of the last remaining year

### Requirement 3

**User Story:** As a marketing professional, I want to manage separate contact lists for different years, so that I can reuse the app annually and maintain historical records of my marketing campaigns.

#### Acceptance Criteria

1. WHEN a user creates a new contact THEN the system SHALL associate it with the currently selected year
2. WHEN a user has contacts from multiple years THEN the system SHALL display a year dropdown selector
3. WHEN a user has contacts from only one year THEN the system SHALL hide the year dropdown selector
4. WHEN a user selects a different year from the dropdown THEN the system SHALL display only contacts from that year
5. WHEN the app loads THEN the system SHALL default to displaying the last viewed year if available, otherwise the current year
6. WHEN a user switches between years THEN the system SHALL maintain separate delivery statuses and comments for each year's contacts
7. WHEN a user switches to a different year THEN the system SHALL remember this selection for future app launches

### Requirement 4

**User Story:** As a marketing professional, I want to create and maintain a list of Improving Inc. employees from different enterprises, so that I can organize my marketing outreach efforts.

#### Acceptance Criteria

1. WHEN an authenticated user accesses the main screen THEN the system SHALL display their contact checklist for the selected year
2. WHEN a user wants to add a new contact THEN the system SHALL provide an interface to enter First Name, Last Name, and Enterprise Name
3. WHEN a user enters valid contact information THEN the system SHALL save the contact with all required fields to their Firebase database for the selected year
4. WHEN a user wants to edit an existing contact THEN the system SHALL allow modification of First Name, Last Name, Enterprise Name, and Comments
5. WHEN a user deletes a contact THEN the system SHALL remove it from their database and update the display
6. WHEN the app loads THEN the system SHALL retrieve and display the user's contacts from Firebase for the selected year
7. WHEN displaying contacts THEN the system SHALL show First Name, Last Name, Enterprise Name, and delivery status

### Requirement 5

**User Story:** As a marketing professional, I want to mark individuals as "Delivered" when I hand out marketing materials, so that I can track my progress and avoid duplicate outreach with timestamp records.

#### Acceptance Criteria

1. WHEN a user views their contact list THEN the system SHALL display each contact with a "Delivered" checkbox
2. WHEN a user taps the "Delivered" checkbox for an undelivered contact THEN the system SHALL mark it as delivered and record the current date/time
3. WHEN a user taps the "Delivered" checkbox for a delivered contact THEN the system SHALL mark it as undelivered and clear the delivery timestamp
4. WHEN a contact's delivery status changes THEN the system SHALL immediately save the change and timestamp to Firebase
5. WHEN the list loads THEN the system SHALL display the current delivery status for each contact
6. WHEN a contact is marked as delivered THEN the system SHALL display the delivery date/time information

### Requirement 6

**User Story:** As a marketing professional, I want to add comments to Improving Inc. employee contacts, so that I can record important notes about my interactions and follow-up requirements.

#### Acceptance Criteria

1. WHEN a user views a contact THEN the system SHALL provide an option to add or edit comments for that contact
2. WHEN a user enters a comment THEN the system SHALL save it to the contact's record in Firebase
3. WHEN a contact has comments THEN the system SHALL display an indicator or preview on the main list
4. WHEN a user wants to view full comments THEN the system SHALL display them in a readable format
5. WHEN a user edits existing comments THEN the system SHALL update the stored comment data
6. WHEN a contact has no comments THEN the system SHALL allow the user to add new comments

### Requirement 7

**User Story:** As a marketing professional, I want the app to work reliably on my iOS device, so that I can use it effectively during marketing events and meetings.

#### Acceptance Criteria

1. WHEN the app is installed on an iOS device THEN the system SHALL function properly on iOS 14 and later
2. WHEN the user has no internet connection THEN the system SHALL display appropriate offline messaging
3. WHEN internet connection is restored THEN the system SHALL sync any pending changes to Firebase
4. WHEN the app encounters errors THEN the system SHALL display user-friendly error messages
5. WHEN the app is backgrounded and reopened THEN the system SHALL maintain the user's session and current state
