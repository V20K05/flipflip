# PROJECT_PROMPT.md

# Adaptive Flashcard Learning SaaS --- Product & Implementation Specification

## 1. Project Overview

Build a polished, responsive, cloud-ready web application for students
preparing for competitive examinations such as TANCET, TNPSC, UPSC, SSC,
RRB, and similar exams.

The product helps students improve recall, accuracy, familiarity with
recurring question patterns, and solving speed through repeated practice
of flashcard decks. Its central interaction is a question card that
users classify by difficulty. Hard questions should return more
frequently; Easy questions should return less frequently; Medium
questions can be positioned more precisely using a five-star rating.

The product also includes: - User-created flashcard decks - Importing
and sharing decks - A community/discovery marketplace for decks -
Following creators and receiving notifications - Private direct messages
for sharing decks - A useful student dashboard with progress analytics -
An administrator dashboard for platform management - Cloud-hosted
persistence and file storage

This is initially a **web-first application optimised for laptop and
desktop**, with responsive layouts and interaction patterns that can
later support mobile devices. Do not build a separate native mobile app
in the initial version.

## 2. Primary Goals

1.  Make repeated practice easy and engaging.
2.  Help users focus on weak or difficult questions without manually
    organising everything.
3.  Let users create, import, copy, customise, and share flashcard
    decks.
4.  Build a community where students discover useful decks and follow
    creators.
5.  Show meaningful learning progress rather than vanity statistics
    alone.
6.  Demonstrate cloud computing through deployed frontend/backend
    services, a managed database, cloud file storage, authentication,
    and reliable persistent data.
7.  Keep the initial implementation practical for a postgraduate
    academic project while structuring it so it can grow into a SaaS
    product.

## 3. Product Principles

-   **Learning first:** Practice must be quick, clear, and
    distraction-free.
-   **User control:** Ratings are suggestions from the user, not an
    inflexible judgement of ability.
-   **Persistent progress:** User activity must be saved and restored
    across sessions and devices.
-   **Transparent scheduling:** Explain why a question is appearing
    again when appropriate.
-   **Accessible interaction:** Do not rely only on colour, animation,
    drag-and-drop, or gestures.
-   **Community trust:** Show attribution, provide reporting, and
    moderate public content.
-   **Honest analytics:** Clearly distinguish measured data from
    estimates and avoid inventing statistics.
-   **Privacy by default:** Private decks, messages, and personal
    learning history must not be exposed publicly.

## 4. User Roles and Permissions

### 4.1 Student / Registered User

A registered user can: - Sign up and log in using email/password or
Google login. - Manage their profile and preferences. - Create, edit,
delete, import, and organise their own decks. - Practise decks and rate
questions. - Bookmark questions. - View practice history and
analytics. - Share decks using a link or in-app direct message. - Import
a deck as an independent copy. - Follow creators and receive
notifications. - Publish decks to the community after meeting publishing
requirements/approval. - Rate, review, and report public decks. -
Control profile and deck privacy. - Undo recent ratings within the
defined undo window.

### 4.2 Creator / Publisher

Any registered user may request publishing privileges. An authorised
audit/moderation team or administrator approves publishing access.
Depending on the chosen moderation configuration, new community decks
may also require review before becoming public.

Creators can: - Publish public decks with a required cover image. - Edit
their own published decks. - See basic deck performance statistics, such
as views, opens, imports, ratings, and engagement. - Respond to feedback
where this feature is implemented. - Report misuse of their content.

### 4.3 Administrator / Moderator

Administrators have a separate protected dashboard and can: - Manage
users and publishing permissions. - Review creator/publisher requests. -
Create and manage official platform decks. - Review, approve, reject,
hide, or remove community decks. - Review reports and moderate
inappropriate content. - Manage subject/topic tags and official
content. - View platform usage and engagement statistics. - Inspect
audit events for important moderation/admin actions. - Configure
platform-wide settings where practical.

Use role-based access control. Never rely on frontend hiding alone to
protect administrative operations.

## 5. Authentication and Onboarding

-   Authentication is compulsory; no guest mode.
-   Support email/password registration and login.
-   Support Google OAuth login.
-   Validate email/password input and display understandable errors.
-   Provide logout and a secure password-reset flow.
-   Protect authenticated routes.
-   After first login, guide the user through a concise onboarding flow:
    1.  Set display name and optional profile image.
    2.  Select target exam(s), subjects, and preferred language if
        available.
    3.  Optionally set a daily practice goal.
    4.  Offer to create a deck, import a shared deck, or explore the
        community.
-   Users can edit these preferences later.
-   Do not require a user to provide unnecessary personal data.

## 6. Core Data Model

Use a relational database such as PostgreSQL or MySQL. The final choice
should fit the selected deployment platform. Use migrations and
constraints rather than relying on manual database setup.

Suggested entities/tables:

-   `users`: id, display_name, email, auth_provider, profile_image_url,
    bio, role, publishing_status, created_at, updated_at.
-   `user_preferences`: user_id, target_exams, preferred_language,
    daily_goal_type, daily_goal_value, notification_preferences,
    theme_preference.
-   `subjects`: id, name, slug, description, is_active.
-   `topics`: id, subject_id, name, slug, parent_topic_id (optional).
-   `decks`: id, owner_id, title, description, subject_id,
    cover_image_url, visibility, publication_status, source_deck_id
    (nullable), created_at, updated_at, published_at.
-   `deck_topics`: deck_id, topic_id.
-   `questions`: id, deck_id, prompt, answer, explanation (optional),
    question_type, position, created_at, updated_at.
-   `question_options`: id, question_id, option_text, option_order,
    is_correct.
-   `question_assets`: id, question_id, asset_url, asset_type, alt_text.
-   `deck_imports`: id, source_deck_id, imported_deck_id, importer_id,
    imported_at.
-   `question_progress`: id, user_id, question_id, difficulty_category,
    medium_star_rating, times_seen, times_correct, times_incorrect,
    last_answered_at, last_response_time_ms, next_review_position (if
    needed), created_at, updated_at.
-   `review_events`: id, user_id, question_id, deck_id,
    selected_answer_id (nullable), answer_correct (nullable),
    response_time_ms (nullable), rating_before, rating_after,
    event_type, reviewed_at.
-   `bookmarks`: user_id, question_id, created_at.
-   `follows`: follower_id, followed_user_id, created_at.
-   `community_reviews`: id, deck_id, user_id, rating, review_text,
    created_at, updated_at.
-   `content_reports`: id, reporter_id, target_type, target_id, reason,
    details, status, reviewed_by, reviewed_at, created_at.
-   `notifications`: id, recipient_id, actor_id (nullable), type,
    entity_type, entity_id, message, read_at, created_at.
-   `conversations`: id, created_at, updated_at.
-   `conversation_members`: conversation_id, user_id, joined_at.
-   `messages`: id, conversation_id, sender_id, message_text (nullable),
    shared_deck_id (nullable), created_at, read_at.
-   `creator_requests`: id, user_id, status, requested_at, reviewed_by,
    reviewed_at, review_notes.
-   `deck_analytics_events`: id, deck_id, user_id (nullable),
    event_type, occurred_at, session_id (nullable).
-   `admin_audit_logs`: id, admin_id, action, target_type, target_id,
    metadata, created_at.

Adjust the schema to the chosen framework and avoid duplicating derived
values when they can be calculated reliably. Add appropriate indexes,
foreign keys, uniqueness constraints, deletion policies, and timestamps.
A user's progress must be per-user, not shared across accounts. Imported
copies must have their own question records and independent review
history.

## 7. Flashcard and Deck Management

### 7.1 Creating a Deck

Required fields: - Deck title - Subject and topic/tag selection -
Questions and answers

Optional fields: - Description - Multiple-choice options -
Explanation/solution - Cover image for private/personal decks

A cover image is **mandatory when publishing a deck to the community**.
Show validation before publishing and explain what is missing.

A deck can contain multiple questions. Provide a clear editor for
adding, editing, reordering, and removing questions. Support plain text
initially; structure the code so image-based questions and mathematical
content can be added cleanly. Validate empty questions, empty answers,
malformed options, file types, and file sizes.

### 7.2 Question Modes

Provide two practice modes controlled by a clear setting:

**Mode A --- Multiple-choice mode** - When "Show options" is enabled,
display the question and its available answer options. - The user
selects an option. - Clearly show whether the answer is correct and
reveal the correct answer and explanation if available. - The user can
classify difficulty before answering, after answering, or after
revealing the answer.

**Mode B --- Flip-card mode** - When "Show options" is disabled, display
the question on the front of the card. - The user activates a "Reveal
answer" interaction to flip the card and display the
answer/explanation. - Provide an explicit reveal button as an accessible
alternative to tapping/clicking the card. - The user can rate the
question before or after revealing the answer. - Do not make users lose
their rating if they reveal the answer first.

Persist the selected mode as a user preference and allow it to be
changed.

### 7.3 Importing Decks

Support: - Importing from a shareable in-app deck link. - Importing a
deck shared directly in a message. - Importing supported structured
files, with CSV as a practical first format and JSON as a useful
option. - Design the import service so additional formats can be added
later. Do not promise PDF/Excel parsing unless implemented and tested.

For file imports: - Provide a sample template and field
mapping/preview. - Validate the file and show row-level errors. - Let
users confirm before creating the deck. - Do not silently discard
invalid rows.

### 7.4 Independent Copies and Attribution

-   Importing always creates an independent copy in the user's account.
-   Subsequent changes to the original deck must not automatically alter
    the imported copy.
-   Imported decks can be edited by the importer.
-   Retain "Created by \[original creator\]" attribution initially, with
    a link to the source deck/creator when available.
-   If the importer modifies **more than 50% of the deck's original
    questions**, remove the original creator attribution from the copied
    deck as specified by the product owner. Track this using stable
    source-question IDs or a reliable comparison mechanism, and document
    how additions, deletions, and edits are counted. Do not remove
    attribution simply because the deck title or cover image changes.
-   Where practical, retain internal provenance records for moderation
    and copyright handling even if the visible attribution is removed.
-   Make attribution behaviour transparent in the interface.

## 8. Practice Experience and Interaction Design

### 8.1 Desktop Layout

Build a polished desktop-first interface with: - A left
navigation/sidebar for Dashboard, Practice, My Decks/Library, Community,
Bookmarks, Messages, Notifications, Profile, and Settings. - A central
question card during practice. - Difficulty controls visually positioned
on the left, centre/below, and right of the card as appropriate. - A
compact header with search, notifications, profile, and current
deck/session context. - Responsive behaviour for smaller screens.

### 8.2 Difficulty Controls

-   **Hard:** a distinctive friendly/cute icon or emoji to the left of
    the central card.
-   **Easy:** a friendly/cute icon or emoji to the right.
-   **Medium:** a five-star rating control below or near the card.
-   Display accessible text labels and tooltips; emojis/icons must not
    be the only indication of meaning.
-   Clicking the Hard icon classifies the current question as Hard.
-   Clicking the Easy icon classifies the current question as Easy.
-   The five-star control classifies the question as Medium and sets its
    position within the Medium range:
    -   1 star = near the Easy end.
    -   5 stars = near the Hard end.
    -   Intermediate ratings are ordered between those ends.
-   Explain the meaning of the five-star scale in a short tooltip/help
    text.
-   The user can rate before answering, after answering, or after
    revealing the answer.

### 8.3 Animation

-   On Hard, animate the card towards and into the Hard icon.
-   On Easy, animate the card towards and into the Easy icon.
-   Use a polished "window minimises into an icon" or genie-like
    compression effect inspired by desktop operating-system animations,
    without copying another product's exact assets.
-   On Medium, use a distinct, shorter confirmation animation.
-   Then display the next question smoothly, without a full-page reload.
-   Respect `prefers-reduced-motion`; provide a reduced-motion
    alternative.
-   Animations must not delay practice or make the controls hard to use.
-   Show a short confirmation state when useful and avoid excessive
    effects.

### 8.4 Keyboard and Accessibility

-   Provide keyboard shortcuts for Hard, Medium, and Easy, with the
    exact keys documented in the UI.
-   Suggested default: Left Arrow = Hard, Down Arrow or a dedicated key
    = Medium, Right Arrow = Easy. Avoid hijacking arrow keys when the
    user is navigating answer options or interacting with a form.
-   Always provide clickable buttons as alternatives to shortcuts.
-   Ensure visible focus states, semantic HTML, accessible labels,
    reasonable contrast, and screen-reader support.
-   Support touch gestures on mobile-sized screens as a progressive
    enhancement: swipe left = Hard, swipe right = Easy. Buttons must
    remain available.
-   Avoid accidental ratings when a user scrolls or interacts with the
    card.

### 8.5 Queue and Review Logic

Use a transparent, configurable queue model for the initial version: -
Hard questions are prioritised and appear more frequently. - Medium
questions appear at a moderate frequency, ordered by star rating: 1 star
near Easy; 5 stars near Hard. - Easy questions appear less frequently
and tend towards the end of the queue. - Avoid repeating a question
immediately without a clear reason; allow other questions to appear
between repetitions. - Use a queue/session scheduler rather than a fixed
global order. - Persist ratings and review history so queue behaviour
remains consistent across sessions. - Keep the scheduling algorithm
modular so a more advanced spaced-repetition algorithm can replace or
extend it later. - Do not claim the app implements a scientifically
validated spaced-repetition algorithm unless one is actually
implemented.

Initial suggested policy (make values configurable): 1. Hard: high
priority; reinsert after a small number of other questions or later in
the current session. 2. Medium: priority based on 1--5 stars, with
higher stars scheduled sooner. 3. Easy: low priority; place near the end
and reduce repeat frequency. 4. If the user changes a rating, update
future queue placement. 5. If the user answers incorrectly, record the
result. Do not silently overwrite their manual rating; optionally
recommend a harder rating and let the user accept or ignore it. 6. As a
later enhancement, adjust intervals based on correctness, response time,
and prior review history.

Use the same underlying scheduling logic regardless of whether a user
uses buttons, keyboard shortcuts, or mobile swipes.

### 8.6 Undo and Review History

-   Let the user undo or change ratings for the most recent **10
    question actions** within the current practice flow.
-   Keep a short history of the last 10 actions, with the ability to
    navigate back and change a rating.
-   When an item is revisited during a later review, show its current
    classification and allow the user to change it.
-   For older items outside the recent undo window, provide a way to
    open the relevant deck/library and edit the question's rating or
    review state.
-   A rating change must update the queue consistently and be recorded
    in review history.
-   Avoid deleting historical review events when a rating is changed;
    record a new event or correction so analytics remain auditable.

### 8.7 Bookmarks

-   Users can bookmark/unbookmark questions independently of difficulty.
-   Provide a Bookmarks page and a practice mode for bookmarked
    questions.
-   Bookmarks and progress must persist across sessions.

### 8.8 Session Completion

When a user completes a planned session or reaches the end of the
available queue: - Show a positive completion animation and concise
congratulatory message. - Use light haptic vibration only on supported
mobile devices and only where browser/platform permissions permit; never
assume vibration is available on desktop. - Provide a graceful desktop
equivalent, such as a subtle animation and sound-off-by-default visual
celebration. - Show a session summary: questions reviewed, answers
correct/incorrect where applicable, time spent, average response time,
and rating changes. - Offer actions to review Hard questions, continue
practising, return to the deck, or go to the dashboard. - Do not make
the celebration obstruct the summary or force the user to continue.

## 9. Practice Entry Points and Filters

-   If the user starts from a specific deck, practise questions from
    that deck by default.
-   If the user starts from the home dashboard, offer a mixed practice
    session across their available decks and due/priority questions.
-   Topic/subject cards and tags should navigate to relevant decks or
    filtered practice.
-   Let users filter a deck/session by subject, topic, difficulty
    category, and bookmarks.
-   Include options for Hard-only, Medium-only, Easy-only, and
    incorrect-question practice.
-   Provide clear empty states if no questions match the selected
    filters.
-   Do not mix questions from private decks into any public feed.

## 10. Dashboard Requirements

Create a dedicated, useful student dashboard. Keep it clean and
actionable; do not overload it with every metric at once. Use cards,
compact charts, progress indicators, and clear links to the relevant
action. All figures must be derived from real stored data.

### 10.1 Dashboard Header

-   Greeting using the user's display name.
-   Current date or relevant study-day context.
-   Primary "Continue Practice" / "Start Practice" button.
-   Quick action to create a deck or import a deck.
-   Optional daily goal progress.

### 10.2 Today's Practice

Show: - Questions reviewed today. - Daily target progress, if the user
has configured a target. - Time spent practising today. - Current streak
and best streak. - A clear next action, such as "Review Hard Questions"
or "Continue where you left off."

Do not shame users for missed days. If no goal is configured, offer a
simple way to set one.

### 10.3 Review Queue Summary

Show counts for: - Hard questions - Medium questions, with star
distribution where useful - Easy questions - Questions due/available for
review - Bookmarked questions

Each count should be clickable and start a matching filtered practice
session.

### 10.4 Learning Performance

Show: - Total questions reviewed - Correct and incorrect answers for
question types where an answer can be checked - Accuracy percentage
where meaningful - Average response time - Change in response time over
time - Recent activity trend - Questions practised by subject/topic

Do not calculate accuracy for flip-card sessions where the app has no
recorded correctness result. Clearly distinguish "rated/reviewed" from
"answered and checked."

### 10.5 Weak Topics and Recommendations

-   Identify topics with lower accuracy, slower response times, or a
    high concentration of Hard ratings.
-   Explain briefly why a topic is recommended, for example "Frequently
    marked Hard" or "Accuracy is lower than your other topics."
-   Recommend a next action: practise the topic, review Hard questions,
    or explore a related deck.
-   Avoid making strong conclusions when the user has too little data;
    display an onboarding/insufficient-data state.

### 10.6 My Library and Recent Activity

Show: - Recently practised decks - Recently imported or created decks -
Continue-practising shortcut for a deck - Recent review activity -
Saved/bookmarked questions - Optional recently viewed community decks

### 10.7 Community Discovery on the Dashboard

Show a compact selection of: - Trending decks - Recently published
decks - Decks from followed creators - Recommended decks based on
selected exam, subjects, topics, and activity

Do not let recommendations displace the main practice action.

### 10.8 Charts and Visualisations

Use only charts that answer a useful question: - Weekly practice
activity (bar or line chart) - Accuracy over time when enough answer
data exists - Average response time over time - Topic-wise
strengths/weaknesses - Hard/Medium/Easy distribution

Provide accessible labels and text summaries. On small screens, charts
should remain readable or be replaced by compact summaries.

### 10.9 Dashboard States

Design polished states for: - First-time user with no decks - User who
has imported decks but not practised - User with practice history - User
with no questions currently due - Loading, network failure, and empty
results

For a new user, guide them to import a deck, explore the community, or
create their first deck. Do not show fake sample statistics as if they
were real user data.

## 11. Dedicated Analytics Page

Provide a detailed analytics page with filters for time range, deck,
subject, and topic where practical.

Include: - Daily/weekly/monthly practice volume - Total reviewed
questions - Answer accuracy based only on checked answers - Average and
median response time where enough data exists - Response-time trends -
Hard/Medium/Easy distribution - Medium star-rating distribution -
Topic-wise performance and difficulty - Review activity
calendar/heatmap - Personal bests and streaks - Deck-level performance -
Comparison with the user's own prior periods

Avoid public ranking/leaderboard features in the MVP unless explicitly
added later. Do not expose a user's detailed learning history to other
users by default.

## 12. Community and Discovery

### 12.1 Community Page

Build a card-based, marketplace-style discovery page inspired by
familiar shopping/catalog layouts, without copying proprietary designs.
Use a grid of square or near-square deck cards with cover images.

Each card should show: - Cover image - Deck title - Creator display
name - Subject/topic tags - Rating and review count when available -
Import count or another clear engagement metric - A clear open/import
action

A cover image is mandatory before publishing a deck to the community.

### 12.2 Filters and Sorting

Include filters or tabs for: - Trending - Recently published - Popular
creators - Subject/topic - Target exam - Rating - Free/premium status if
paid decks are added later

Selecting a filter must update the deck results and active state without
leaving the user uncertain about what is selected. Include search,
pagination or infinite loading, and empty states.

### 12.3 Recommendation and Ranking

Create a documented, maintainable ranking function. Candidate signals
include: - Deck impressions and click-through rate (CTR) - Opens/views -
Import/add-to-library rate - Number of unique users importing the deck -
Ratings and review quality - Recency - Reports or moderation status -
Relevance to the user's selected exams, subjects, and topics -
Engagement from followed creators

Do not rank using raw click counts alone. Use sensible minimum-data
thresholds and normalise metrics so a deck with very few impressions is
not automatically treated as the best. Apply recency weighting and guard
against obvious spam/manipulation. Exclude removed, private, pending, or
rejected decks from public discovery. Document the initial scoring
formula and keep it configurable. For the academic MVP, a transparent
heuristic is sufficient; do not claim to have a machine-learning
recommendation model unless one is actually built.

### 12.4 Creator Profiles and Following

-   Users can follow/unfollow other users.
-   Creator profiles show their public decks and basic public profile
    information.
-   Notify followers when a followed creator publishes a public deck,
    subject to notification preferences.
-   Prevent following oneself and prevent duplicate follow records.
-   Provide pagination for creator decks and follower-related lists.

### 12.5 Reviews and Reports

-   Allow signed-in users to rate a public deck, and optionally leave a
    written review.
-   Prevent duplicate ratings by the same user; allow editing their own
    rating.
-   Allow reporting decks/users/messages for appropriate reasons.
-   Provide confirmation and clear moderation status where appropriate.
-   Do not permit users to review private decks they cannot access.

### 12.6 Monetisation

-   Initial release: all decks are free.
-   Structure the product so paid decks could be introduced in a future
    release, but do not build payments, subscriptions, commissions, or
    checkout in the MVP.
-   Do not display misleading "premium" purchase actions until
    monetisation is implemented.

## 13. Direct Messaging and Notifications

### 13.1 Direct Messages

Provide in-app direct messaging to support sharing decks with existing
users. - A user can select a friend/user and send a message or a deck
share. - Deck sharing in a message should include a preview and an
Import/Open action. - The receiver imports an independent copy. -
Support conversation list, message history, timestamps, unread state,
and reasonable pagination. - Enforce server-side conversation membership
checks. - Do not expose messages to other users or administrators except
where necessary for a documented moderation/safety process. - Real-time
messaging is optional for the MVP; reliable refresh/polling is
acceptable if live infrastructure is too costly.

### 13.2 In-App Notifications

Support notifications for: - New deck from a followed creator - Deck
shared by another user - New follower - Rating/review activity on the
user's deck - New direct message - Publishing request
approved/rejected - Deck approved/rejected or removed - Study milestone
or review reminder, if enabled

Provide a notification centre, unread count, mark-as-read action, and
notification preferences. Browser push and email notifications may be
added if practical, but in-app notifications are required for the
initial version. Do not send unsolicited or excessive notifications.

## 14. Administrator Dashboard

Create a separate, responsive, role-protected admin area.

### 14.1 Overview

Show real aggregate metrics such as: - Registered users - Active users
in a defined period - Total decks and questions - Public/pending/removed
deck counts - Deck imports - Practice/review events - Open reports -
Creator requests awaiting review

Define each metric and date range. Do not fabricate data.

### 14.2 Management Areas

-   Users: search, view, change permitted account status/role,
    suspend/reactivate with confirmation.
-   Creator requests: inspect and approve/reject with notes.
-   Official decks: create, edit, publish, archive, or delete with
    confirmation.
-   Community decks: inspect, approve, reject, hide, remove, and view
    reports.
-   Subjects/topics: create, edit, reorder, deactivate.
-   Reports: review, resolve, dismiss, and document the action.
-   Platform analytics: usage trends, popular decks, imports,
    engagement.
-   Audit logs: view sensitive administrative actions.

### 14.3 Admin Safety

-   Require administrator role checks on the server/API.
-   Log significant moderation and role changes.
-   Confirm destructive actions.
-   Prefer soft deletion/archive where practical.
-   Never expose private user messages or private decks as general admin
    content without a legitimate, explicitly scoped moderation need.

## 15. Cloud Architecture and Technology Choices

Build a cloud-ready web application with a clear separation of frontend,
backend/API, database, and file storage.

### Recommended default stack (unless the developer specifies otherwise)

-   **Frontend:** Next.js with TypeScript and React.
-   **Styling/UI:** Tailwind CSS plus accessible, reusable components.
-   **Animation:** CSS transitions and/or a suitable animation library;
    use it only where it improves interaction.
-   **Backend:** Next.js server routes/actions or a clearly separated
    Node.js API. Prefer a maintainable API boundary for future mobile
    support.
-   **Database:** PostgreSQL.
-   **ORM/migrations:** Prisma or an equivalent well-supported ORM with
    migrations.
-   **Authentication:** A secure authentication library/provider
    supporting email/password and Google OAuth. Never implement unsafe
    custom password storage.
-   **File storage:** Cloud object storage for deck cover images and
    uploaded assets; store file URLs/keys in the database.
-   **Deployment:** Choose a deployment platform compatible with the
    college's cloud requirement and budget. Keep configuration portable.
-   **Charts:** Use a stable chart library with accessible fallbacks.
-   **Testing:** Unit, integration, and end-to-end tests for critical
    workflows.

If the college mandates AWS, Azure, Google Cloud, or Oracle Cloud
Infrastructure, adapt the deployment to that provider. If no provider is
mandated, select a low-cost platform that supports the frontend/API,
managed relational database, and object storage. Document which
components run where and how the deployment demonstrates cloud
computing.

### 15.1 Cloud Requirements

-   Hosted application accessible over HTTPS.
-   Managed or hosted relational database with persistent storage.
-   Cloud object storage for images and assets.
-   Environment-based configuration and secrets.
-   Database migrations and a documented seed process for official demo
    content.
-   Logs and health/error monitoring appropriate to the budget.
-   Backup/export strategy for database data where supported.
-   Clear separation between development and production configuration.
-   Reasonable scaling approach; do not overengineer microservices for
    an academic MVP.
-   Document a simple architecture diagram and deployment instructions.

### 15.2 Environment Variables

Provide an `.env.example` with placeholder names only, such as: -
`DATABASE_URL` - Authentication secret - Google OAuth client ID/secret -
Storage bucket/endpoint and credentials - Application base URL

Never commit real secrets. Validate required environment variables on
startup and document how to configure them.

## 16. Security, Privacy, and Reliability

-   Use secure, established authentication practices.
-   Hash passwords with a suitable password-hashing algorithm if managed
    by the application/auth provider.
-   Protect against common web vulnerabilities, including injection,
    cross-site scripting, cross-site request forgery where relevant,
    insecure direct object references, and broken access control.
-   Validate and sanitise all user input on the server.
-   Restrict uploaded file types, sizes, and content; use safe
    filenames/keys.
-   Rate-limit authentication and abuse-prone endpoints where practical.
-   Apply authorisation checks to every private deck, message, bookmark,
    rating, and user-specific progress endpoint.
-   Ensure users can only modify their own decks and records unless they
    have an explicit administrative permission.
-   Do not expose secrets or sensitive personal data in client-side code
    or logs.
-   Provide clear error messages without exposing stack traces or
    credentials.
-   Use HTTPS in production.
-   Add a privacy policy/terms placeholder if the product is publicly
    deployed.
-   Include a user-facing account deletion/export plan appropriate to
    the scope.
-   Handle network errors and prevent duplicate actions where practical.
-   Ensure critical user actions are idempotent or protected against
    double submission.

## 17. Performance and Responsive Behaviour

-   Use pagination or incremental loading for community decks, messages,
    and large lists.
-   Add indexes for common database filters and joins.
-   Avoid loading all questions/decks at once.
-   Optimise cover images and use appropriate sizes.
-   Keep practice interactions responsive and avoid full-page reloads
    when rating cards.
-   Show loading states and optimistic UI only when rollback/error
    handling is implemented.
-   Ensure the application works on current desktop browsers and adapts
    to tablet/mobile widths.
-   Test empty, loading, error, and long-content states.
-   Respect reduced-motion preferences.
-   Design for multiple users with separate progress records and a clear
    path to scaling, without claiming untested capacity.

## 18. Settings

Provide a settings page where users can manage: - Display name and
profile image - Target exams and subjects - Daily practice goal -
Question mode: multiple-choice or flip-card - Notification preferences -
Profile/deck privacy - Theme preference if themes are implemented -
Account security and password changes/reset - Account data
export/deletion flow where supported

## 19. Scope and Prioritisation

Implement a working MVP before optional advanced features. Do not create
static mockups in place of functional flows.

### MVP --- Required

1.  Email/password and Google authentication.
2.  User profiles and onboarding.
3.  Create, edit, delete, and organise decks/questions.
4.  Multiple-choice and flip-card modes.
5.  Hard/Easy controls and five-star Medium rating.
6.  Persistent question ratings and review history.
7.  Priority queue that places Hard questions more frequently, Medium by
    star level, and Easy less frequently.
8.  Recent undo/change-rating support for the last 10 actions.
9.  Bookmarks and filtered practice.
10. Import decks by share link and at least one structured file format.
11. Independent deck copies with attribution/provenance rules.
12. Community grid with cover images, search, filters, and
    trending/recent sorting.
13. Follow/unfollow creators.
14. In-app notifications for key events.
15. In-app deck sharing/direct messages, at least at a basic reliable
    level.
16. Deck ratings and content reporting.
17. Administrator dashboard with creator requests, official decks,
    community moderation, users, and reports.
18. Student dashboard with real metrics and useful empty states.
19. Dedicated analytics page with meaningful practice statistics.
20. Cloud-hosted database and object storage.
21. Responsive, accessible desktop-first UI with polished card
    animations.
22. Basic tests, error handling, setup documentation, and deployment
    instructions.

### Later Enhancements

-   Paid decks, payments, and subscriptions.
-   AI-generated questions and explanations.
-   PDF/Excel ingestion beyond tested formats.
-   More advanced adaptive spaced-repetition algorithms.
-   Browser push/email reminders.
-   Real-time chat.
-   Advanced personalised recommendations or machine-learning ranking.
-   Public leaderboards and weekly challenges.
-   Native mobile applications.
-   Additional languages and rich mathematical equation support.

Keep the architecture extensible for these additions, but do not let
them block a complete MVP.

## 20. UI/UX Quality Bar

The interface should feel like a modern, polished SaaS product rather
than a generic admin template.

-   Use a consistent spacing scale, typography system, and component
    library.
-   Prefer clean surfaces, restrained colours, strong hierarchy, and
    generous whitespace.
-   Make the question card the focus during practice.
-   Make the Hard/Easy icons immediately understandable, with a clearly
    explained five-star Medium scale.
-   Use purposeful animations, not animation everywhere.
-   Use skeletons or loading indicators where appropriate.
-   Include empty states with actionable next steps.
-   Use confirmation dialogs for destructive operations.
-   Use toast/status messages for successful actions and errors.
-   Maintain consistent navigation and active states.
-   Ensure forms have labels, validation, and clear submit/cancel
    actions.
-   Do not use placeholder buttons that do nothing.
-   Do not use fake backend data for a feature that is presented as
    working.
-   If any feature is intentionally deferred, label it clearly and
    document it.

## 21. Acceptance Criteria

The project is considered successfully implemented when:

1.  A user can register/login using email/password or Google OAuth.
2.  A user can create a deck with a title, subject/topic, questions,
    answers, and optional multiple-choice options.
3.  A user can switch between multiple-choice and flip-card practice.
4.  A user can classify a question as Hard, Easy, or Medium with a 1--5
    star position.
5.  Rating a question animates the card and advances the session without
    a full-page reload.
6.  Hard questions receive higher review priority; higher Medium stars
    are nearer Hard; Easy questions recur less frequently.
7.  Ratings and review history persist after logout and login on another
    device.
8.  The user can undo/change ratings within the last 10 actions and
    later edit a question's rating from the library.
9.  A user can bookmark a question and practise bookmarks.
10. A user can share a deck link and import a deck as an independent
    copy.
11. The importer can edit the copied deck; attribution follows the
    defined more-than-50%-modified rule.
12. Community-published decks require a cover image.
13. Community search, filters, trending/recent lists, and deck cards
    work against real backend data.
14. A user can follow another user and receive in-app notifications for
    relevant publishing activity.
15. Users can share a deck through in-app messages, with server-side
    access control.
16. Users can rate and report community decks.
17. Administrators can manage users, official decks, creator requests,
    reports, and community moderation.
18. The student dashboard shows real practice data, useful next actions,
    and correct empty states.
19. Analytics distinguish answered questions from flip-card reviews
    without verified correctness.
20. The application is deployed with persistent cloud database storage
    and cloud file storage.
21. Secrets are stored in environment configuration, not committed to
    source control.
22. Setup, testing, architecture, and deployment instructions are
    included in the repository.

## 22. Required Deliverables

Produce: 1. A complete, working application---not just a design mockup.
2. Clean, maintainable source code with meaningful variable and function
names. 3. Database schema and migration files. 4. Seed script with a
small set of clearly labelled demo decks/questions. 5. `.env.example`
containing placeholder variable names only. 6. README with local setup,
authentication configuration, database setup, migrations, seed
instructions, test commands, and deployment steps. 7. Cloud architecture
diagram or a clear architecture section in the README. 8. Tests for
authentication/access control, deck creation/import, rating/scheduling
logic, and key community/admin flows. 9. Clear documentation of
implemented versus deferred features.

## 23. Instructions to the AI Coding Agent

Before implementation: 1. Inspect the existing repository and identify
the framework, conventions, and current state. 2. If code already
exists, preserve working functionality and integrate rather than
overwrite blindly. 3. Summarise the proposed architecture and
implementation milestones. 4. Identify any secrets, credentials, cloud
accounts, or provider settings that must be supplied by the developer.
Never invent credentials. 5. Use sensible defaults for non-blocking
decisions and document them.

During implementation: 1. Build in logical milestones, starting with the
data model, authentication, and core practice loop. 2. Implement real
persistence and server-side authorisation. 3. Keep the scheduling
algorithm in a separately testable module. 4. Build reusable components
and consistent loading/error/empty states. 5. Run type checks, linting,
tests, and builds where available; fix failures. 6. Do not claim a test,
deployment, integration, or feature succeeded unless it has actually
been verified. 7. If a cloud provider requires user credentials or
manual configuration, provide exact setup steps and continue with
locally testable work. 8. Do not leave critical buttons as no-op
placeholders. 9. Avoid unnecessary complexity and paid services unless
approved. 10. Keep a concise progress log and update the README as
implementation changes.

At completion, report: - Features implemented - Features deferred and
why - Architecture and database choices - Commands to run locally -
Required environment variables - Test/build results - Cloud deployment
steps and any manual steps still required

## 24. Final Product Summary

Build a cloud-ready, desktop-first adaptive flashcard SaaS for
competitive-exam preparation. Its defining experience is a central
flashcard that users classify as Hard, Medium (with five-star
positioning), or Easy. The queue prioritises difficult questions and
repeats easy questions less often. The product combines persistent
practice progress, imports and independent copies, a community deck
marketplace, creator following, direct deck sharing, notifications,
analytics, and a protected administration dashboard.

Prioritise a genuinely working, secure, coherent MVP with a polished
practice experience and credible cloud deployment over a large number of
unfinished features.
