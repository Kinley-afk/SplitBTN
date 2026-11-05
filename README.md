# SplitBTN

A cross-platform shared-expense tracker for students in hostels, flatmates and friends in Bhutan. Record who paid, split the cost fairly, see who owes whom, and record settlement payments. All amounts are in Bhutanese Ngultrum (Nu.).

CTE308 Mobile Application Development Project-II, College of Science and Technology, Royal University of Bhutan.
Author: [your name and student number]

## Features

| Area | What it does |
|---|---|
| Authentication | Email and password registration, login, logout, saved session, edit display name, protected screens |
| Groups | Create groups, unique 6-character invite codes, join with a code, member list, leave a group |
| Expenses | Add, edit and delete expenses with title, amount, category, date, payer and participants |
| Splitting | Equal, exact-amount and percentage splits. Shares always add up to the total, to the chetrum |
| Balances | Net balance per member, simplified "who pays whom" suggestions |
| Settle up | Record payments, payment history, balances update automatically |
| Real-time sync | Firestore listeners update groups, expenses, payments and balances on every member's phone |
| Notifications | In-app notifications (new expense, payment received, payment reminder) with local banners |
| Charts | Spending by category, calculated from real expense records |
| History | Sorted expense history with text search, category, payer and date filters |
| Receipts | Attach a photo to an expense (camera or gallery) |
| PDF export | Export the listed expenses, balances and suggested payments as a PDF |
| Offline | Saved data shows without a connection, and changes made offline sync when you reconnect |

## Tech stack

- React Native with Expo (SDK 58), JavaScript
- Firebase Authentication (email/password) and Cloud Firestore (JavaScript SDK)
- React Navigation (stack and bottom tabs)
- expo-notifications (local notifications), expo-print and expo-sharing (PDF), expo-image-picker and expo-image-manipulator (receipts), @react-native-community/netinfo (connection status), AsyncStorage
- Charts and animations use plain React Native Views and the Animated API (no chart library)

## Getting started

Requirements: Node.js (LTS), the Expo Go app on an Android phone, and a Firebase project.

1. Clone the repository and install packages:
   ```
   git clone https://github.com/Kinley-afk/SplitBTN.git
   cd SplitBTN
   npm install
   ```
2. In the Firebase Console create a project, then:
   - Authentication: enable the Email/Password sign-in method
   - Firestore Database: create a database
   - Project settings: register a Web app and copy its config values
   - Firestore, Rules: paste the contents of `firestore.rules` and publish
3. Copy `.env.example` to `.env` and fill in the Firebase values. The `.env` file is ignored by Git and must never be committed.
4. Start the app, then scan the QR code with Expo Go (phone and PC on the same Wi-Fi):
   ```
   npx expo start
   ```
5. Run the unit tests:
   ```
   npm test
   ```

## Project structure

```
src/
  components/   reusable UI (buttons, inputs, cards, chips, chart, banner)
  constants/    colours, spacing, expense categories
  context/      shared state: logged-in user, groups, notifications
  hooks/        live data hooks (expenses, settlements, balances, home summary)
  navigation/   root stack and bottom tabs
  screens/      one file per screen
  services/     all Firebase and device calls (auth, groups, expenses, settlements,
                notifications, receipts, offline cache, PDF export)
  utils/        pure logic: split calculator, balance calculator, spending stats,
                filters, PDF report builder, validation, formatting
tests/          unit tests for the calculations
firestore.rules Firestore security rules
```

Screens never talk to Firebase directly and never contain financial maths. Services handle data, and `utils` holds the tested logic.

## How the key logic works

**Splitting.** Money is converted to whole chetrum (1 Nu. = 100 chetrum) before any division, so decimal errors cannot occur. Equal splits hand the leftover chetrum out one at a time. Percentage splits use the largest-remainder method. Exact splits must add up to the total, and percentages must total 100%.

**Balances.** For each expense the payer is credited the full amount and each participant is debited their share. A settlement credits the sender and debits the receiver. A positive balance means the person should receive money, a negative one means they owe. Balances are never stored. They are recalculated from the expense and settlement records every time, so they cannot drift.

**Debt simplification.** The biggest debtor is repeatedly matched with the biggest creditor for the smaller of the two amounts. This gives at most (members - 1) payments and always clears every balance. It is a valid, small set of payments, not a proven minimum.

## Data model (Firestore)

```
users/{uid}                          displayName, email
users/{uid}/notifications/{id}       type, title, body, groupId, fromUid, read
groups/{groupId}                     name, inviteCode, createdBy, memberIds
groups/{groupId}/expenses/{id}       title, amount, category, date, paidBy,
                                     participantIds, splitMethod, shares,
                                     percentages, hasReceipt, createdBy
groups/{groupId}/settlements/{id}    from, to, amount, date, createdBy
groups/{groupId}/receipts/{expenseId} image (base64 JPEG), createdBy
inviteCodes/{code}                   groupId, createdBy
```

## Security

Security rules (`firestore.rules`) are enforced on the server:
- Only group members can read a group, its expenses, settlements and receipts.
- A user can only add themselves to a group, and only remove themselves.
- Only the creator of an expense can edit or delete it, and its receipt.
- A payment can only be recorded from yourself to another group member, and cannot be edited.
- A notification can only be created by a member of the group, for another member.
- Firebase config values are read from `.env`, which is excluded from Git.

## Testing

`npm test` runs 47 unit tests covering the split calculator, balance calculator, spending statistics, expense filters, PDF report builder and receipt helpers. The app was tested manually on an Android phone with Expo Go, using two accounts for real-time and notification behaviour.

## Known limitations

- **Push notifications:** notifications work inside the app and as banners while the app is running. True push notifications while the app is closed are not implemented, because Expo Go on Android no longer supports remote push (SDK 53 and later). They need a development build.
- **Offline:** saved data shows after a restart without a connection, but only for data opened earlier. Changes made offline are held in memory and are lost if the app is closed before they sync. Creating, joining and leaving groups need a connection.
- **Receipts** are stored as small compressed images inside Firestore, because Firebase Storage needs a paid plan. They are not included in the PDF.
- **Leaving a group** while you owe or are owed money is blocked by the app, but this check is not in the security rules, because rules cannot calculate balances.
- Any signed-in user can read other users' profile (name and email), which is needed to show member names.
- Dates are typed as YYYY-MM-DD (no calendar picker).
- Tested on Android only. iOS has not been tested on a real device.