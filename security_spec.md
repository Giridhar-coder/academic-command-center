# Security Specification for AI Life OS Firestore Database

## 1. Data Invariants
* **User Profile Identity**: A user can only read, create, or update their own user profile document (`/users/{userId}`). The profile's `userId` must equal the authenticated user's ID.
* **Sub-collection Isolation**: All sub-resources (goals, exams, expenses, workouts, meals, projects, calendar events, emails, files, chat history) are placed underneath `/users/{userId}/` and are strictly owner-accessible. A user can only access their own resources.
* **Immutability of IDs and Timestamps**: `id` field must match the path's document identifier and is immutable once created.
* **No Client Claims**: All role checks are relational; no administrative privileges can be set by the client on creation or update.

## 2. The "Dirty Dozen" Payloads (Identity & Integrity Breaking)

### Payload 1: Unauthorized Profile Hijack (Identity Spoofing)
* **Goal**: Attack attempts to write a user profile for a different user.
* **Path**: `/users/attacker_user_id` (by user with `uid: external_attacker_id`)
* **Payload**: `{ "name": "Fake Name", "college": "Hacker Uni", "major": "Malware", "gpaGoal": 4.0, "dailyCalorieGoal": 2000, "dailyWaterGoal": 2500, "waterIntake": 0, "budget": { "allowance": 1000 } }`
* **Expected Result**: `PERMISSION_DENIED`

### Payload 2: Ghost Field Injection (Shadow Update)
* **Goal**: Attacker tries to inject un-blueprint-approved properties like `isAdmin` or `isVerified` into their profile.
* **Path**: `/users/student_user_1`
* **Payload**: `{ "name": "Alex Carter", "college": "State Uni", "major": "CS", "gpaGoal": 3.8, "dailyCalorieGoal": 2000, "dailyWaterGoal": 2500, "waterIntake": 1200, "budget": { "allowance": 500 }, "isAdmin": true, "isVerified": true }`
* **Expected Result**: `PERMISSION_DENIED`

### Payload 3: Invalid Type Injection (Value Poisoning)
* **Goal**: Attacker injects a huge string or a boolean into a number property to crash the parsing engine.
* **Path**: `/users/student_user_1`
* **Payload**: `{ "name": "Alex Carter", "college": "State Uni", "major": "CS", "gpaGoal": "FOUR_POINT_ZERO", "dailyCalorieGoal": true, "dailyWaterGoal": 2500, "waterIntake": 0, "budget": { "allowance": 500 } }`
* **Expected Result**: `PERMISSION_DENIED`

### Payload 4: Invalid Sub-resource Ingress (Cross-user read/write)
* **Goal**: Access or write to another user's goals.
* **Path**: `/users/victim_user_1/goals/victim_goal_1` (by user with `uid: attacker_user_1`)
* **Payload**: `{ "id": "victim_goal_1", "title": "Stolen Goal", "category": "academic", "targetDate": "2026-07-30", "completed": false }`
* **Expected Result**: `PERMISSION_DENIED`

### Payload 5: Deny-Of-Wallet ID Poisoning
* **Goal**: Inject a massive, 1MB junk ID string as a goal ID to poison indices.
* **Path**: `/users/student_user_1/goals/SOME_HUGE_JUNK_ID_STRING_REPEATED_TEN_THOUSAND_TIMES_ABC`
* **Payload**: `{ "id": "SOME_HUGE_JUNK_ID_STRING_REPEATED_TEN_THOUSAND_TIMES_ABC", "title": "Large ID Goal", "category": "personal", "targetDate": "2026-07-20", "completed": false }`
* **Expected Result**: `PERMISSION_DENIED`

### Payload 6: Size Boundary Evasion
* **Goal**: Write a goal title that is 5000 characters long.
* **Path**: `/users/student_user_1/goals/g_1`
* **Payload**: `{ "id": "g_1", "title": "A".repeat(5000), "category": "personal", "targetDate": "2026-07-20", "completed": false }`
* **Expected Result**: `PERMISSION_DENIED`

### Payload 7: Terminal State Lock Evasion
* **Goal**: Attempt to modify a completed goal or a terminal item if restricted (e.g. historical logged workout/meal states).
* **Path**: `/users/student_user_1/goals/g_done`
* **Payload**: `{ "id": "g_done", "title": "New Title", "category": "personal", "targetDate": "2026-07-20", "completed": false }` (assuming completed status is terminal/immutable)
* **Expected Result**: `PERMISSION_DENIED`

### Payload 8: Null Object Reference (Missing required fields)
* **Goal**: Create a meal without the `calories` property.
* **Path**: `/users/student_user_1/meals/m_1`
* **Payload**: `{ "id": "m_1", "name": "Salad", "type": "lunch" }`
* **Expected Result**: `PERMISSION_DENIED`

### Payload 9: Unauthorized Expense Ledger Influx
* **Goal**: Modify the expense amount of a logged expense to a negative number to spoof financial balances.
* **Path**: `/users/student_user_1/expenses/exp_1`
* **Payload**: `{ "id": "exp_1", "title": "Rebate", "amount": -1000.00, "category": "other", "date": "2026-07-06" }`
* **Expected Result**: `PERMISSION_DENIED`

### Payload 10: Invalid Enum Ingress
* **Goal**: Write an invalid workout category like `couch_potato`.
* **Path**: `/users/student_user_1/workouts/w_1`
* **Payload**: `{ "id": "w_1", "title": "Resting", "category": "couch_potato", "completed": false, "date": "2026-07-06" }`
* **Expected Result**: `PERMISSION_DENIED`

### Payload 11: File Size Resource Exhaustion
* **Goal**: Upload a huge syllabus text snippet (> 500KB) into a simple metadata field.
* **Path**: `/users/student_user_1/files/f_1`
* **Payload**: `{ "id": "f_1", "name": "CS401.pdf", "size": "10MB", "type": "pdf", "contentSnippet": "A".repeat(600000) }`
* **Expected Result**: `PERMISSION_DENIED`

### Payload 12: Calendar Day Format Invalidation
* **Goal**: Set calendar day to "Funday" instead of the strictly mandated weekly enum.
* **Path**: `/users/student_user_1/calendar/event_1`
* **Payload**: `{ "id": "event_1", "title": "Hackathon", "startTime": "00:00", "endTime": "23:59", "day": "Funday", "type": "social" }`
* **Expected Result**: `PERMISSION_DENIED`

## 3. Test Runner
We use standard Firestore Emulator assertions or client-side mock tests to verify permission rejection. Since our applet compiles as a web frontend with Node server proxying, we will encapsulate these rules in `firestore.rules`.
