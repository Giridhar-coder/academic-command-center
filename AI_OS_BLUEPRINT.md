# AI Life OS - Technical Specification, Architecture Blueprint & SRS
*Designed for B.Tech CS Students & Budding Full-Stack Engineers*

Welcome to **AI Life OS** (Jarvis for Students). This document serves as your complete Software Requirements Specification (SRS), Architectural Blueprint, API Playbook, and Database Schema guide. As a 3rd Year B.Tech student, this blueprint will teach you how to translate high-level product desires ("Build a student Jarvis") into production-ready software components.

---

## 1. Software Requirements Specification (SRS)

### 1.1 Product Vision & Scope
Students face a massive cognitive load: balancing lectures, homework code deadlines, exams study tracks, calorie deficits, and finite financial budgets. Present-day apps are fragmented (e.g., Notion for notes, Google Calendar for schedules, MyFitnessPal for food, Splitwise for budgets). 
**AI Life OS** solves this by unifying all dimensions of student life into a single digital nervous system. Using the **Google Gemini 3.5 Flash API** as the centralized orchestrator ("Jarvis"), the system can ingest files (syllabi, notes) and answer open-ended directives like: *"Prepare me for tomorrow"*—instantly outputting tailored hourly schedules, revision task lists, meal suggestions, and financial alerts.

### 1.2 User Personas
* **Alex Carter (B.Tech Computer Science Junior)**:
  * *Needs*: Fast scheduling around lab assignments, exam preparation paths that read syllabus PDFs directly, calorie-tracking for gym workouts, and a clear "safe-to-spend" budget balance so he doesn't run out of money.
  * *Tech Literacy*: High, but values automated assistance so he can focus on coding.

### 1.3 Functional Requirements (FRs)
* **FR-1 [Command Center]**: A centralized bento-grid dashboard displaying real-time metrics (next class, upcoming exams countdown, calorie & water budgets, finance trends, and quick AI prompts).
* **FR-2 [Jarvis Assistant]**: A real-time chat interface connecting to Gemini AI, pre-injected with the user's complete state (schedules, file texts, expenses, goals) to provide context-aware planning.
* **FR-3 [Academic Tracker]**: Custom weekly class slot schedule and upcoming exams preparation monitor.
* **FR-4 [Student Ledger]**: Financial tracker that tracks allowance and displays "Safe-to-Spend" math.
* **FR-5 [Fuel & Gym Log]**: Integrated hydration clicker (ml) and calories intake vs goal calculator.
* **FR-6 [Projects & Document Indexer]**: Section to organize lab tasks and upload syllabus/notes text directly to Jarvis's long-term context memory.

### 1.4 Non-Functional Requirements (NFRs)
* **NFR-1 (Security)**: Private keys and API tokens are processed exclusively on the secure backend via environment variables (`process.env.GEMINI_API_KEY`).
* **NFR-2 (Persistence)**: System states are fully persistent on the backend via Express API file-based synchronization (`db.json` serving as local persistent state).
* **NFR-3 (Speed)**: AI responses utilize Gemini 3.5 Flash for <1.5s streaming and latency-optimized generation.

---

## 2. System Architecture & Project Roadmap

```
                          +---------------------------------------+
                          |        React Client App (Vite)        |
                          |  - Command Center Bento Dashboard     |
                          |  - Jarvis Assistant (Chat Shell)      |
                          |  - Tracker Modules (Calendar, Gym...) |
                          +-------------------+-------------------+
                                              |
                                              | HTTPS REST Requests
                                              v
                          +-------------------+-------------------+
                          |     Node.js Express Backend Service   |
                          |  - State Synchronization (/api/state) |
                          |  - AI Proxy Endpoints (/api/jarvis/*) |
                          +-------------------+-------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v (State Storage)                                 v (Cognitive Core)
         +-----------+-----------+                         +-----------+-----------+
         | File-System DB (JSON) |                         |  Google Gemini API    |
         |       `db.json`       |                         |  (gemini-3.5-flash)   |
         +-----------------------+                         +-----------------------+
```

### 2.1 The Multi-Phase Roadmap
1. **Phase 1: Foundations & SRS Blueprint** (Completed - This Specification)
2. **Phase 2: Local SQLite/JSON Database & State Engine** (Completed - Live state-synced server REST routes)
3. **Phase 3: Semantic Document Indexing & Core AI Integration** (Completed - Jarvis prompt injector reading files)
4. **Phase 4: Unified Bento UI & Module Implementation** (Completed - React dashboard)
5. **Phase 5: Production Deployment & Scale** (Ready to package)

---

## 3. Production Database Schema Design
For your enterprise systems, we model a relational **PostgreSQL** schema mapped via Drizzle or JPA, paired with **Redis** for real-time memory and **Vector DBs** (like PgVector) for file chunk embeddings.

### 3.1 PostgreSQL Schema (Relational Representation)
```sql
-- Students profile metadata
CREATE TABLE students (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    college VARCHAR(255) NOT NULL,
    major VARCHAR(100) NOT NULL,
    gpa_goal NUMERIC(3, 2) DEFAULT 4.0,
    daily_calorie_goal INTEGER DEFAULT 2000,
    daily_water_goal INTEGER DEFAULT 2500,
    water_intake INTEGER DEFAULT 0
);

-- Academic Calendar Events
CREATE TABLE calendar_events (
    id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(100) REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week VARCHAR(15) NOT NULL,
    category VARCHAR(50) DEFAULT 'class'
);

-- Exams Tracker
CREATE TABLE exams (
    id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(100) REFERENCES students(id) ON DELETE CASCADE,
    course VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    preparation_status VARCHAR(50) DEFAULT 'not_started'
);

-- Financial Ledger
CREATE TABLE expenses (
    id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(100) REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    date_logged DATE NOT NULL
);

-- Indexed Syllabus Files (for RAG context)
CREATE TABLE files (
    id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(100) REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    size VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    content_snippet TEXT NOT NULL
);
```

### 3.2 Redis Cache / Active Session Schema
* **Key**: `student:session:{id}` (Type: Hash)
  * `gpa_goal` -> `3.8`
  * `water_intake` -> `1200`
  * `current_calories` -> `1420`

---

## 4. API Specification & System Contracts

### 4.1 Get Student State
* **Endpoint**: `GET /api/state`
* **Response**:
```json
{
  "profile": { "name": "Alex Carter", "college": "State University", "major": "Computer Science" },
  "goals": [],
  "exams": [],
  "expenses": [],
  "budget": { "allowance": 500 },
  "workouts": [],
  "meals": [],
  "projects": [],
  "calendar": [],
  "emails": [],
  "files": []
}
```

### 4.2 Post Save Student State
* **Endpoint**: `POST /api/state`
* **Request Body**: Complete state JSON schema (used to synchronize edits in real-time).

### 4.3 Consult Jarvis Core (Gemini Orchestrator)
* **Endpoint**: `POST /api/jarvis/chat`
* **Request**: `{ "prompt": "Prepare me for tomorrow." }`
* **Process**: Backend fetches `db.json`, pulls recent calendar, exams, calorie intake, files list, formats a highly contextual System Instruction, and proxies request to Gemini API.
* **Response**:
```json
{
  "reply": "### Morning Agenda\n* **09:00 AM**: CS 401 lecture...\n### Nutrition Advisory\n* Sir, you've consumed 1420kcal..."
}
```

---

## 5. Clean Code Architecture & Modular Implementation
We structured the workspace using high-cohesion, modular React components, separating the database structures, templates, and UI views to avoid file bloat:

1. **`/src/types.ts`**: Declares rigorous static TypeScript structures representing every metric of the student's life.
2. **`/src/initialData.ts`**: Provides realistic initial values customized for a computer science junior.
3. **`/src/components/DashboardOverview.tsx`**: Renders the command center, bento grid widgets, and quick shortcut actions.
4. **`/src/components/JarvisAssistant.tsx`**: Orchestrates state-injected chats with interactive micro-markdown formatting.
5. **`/src/components/CalendarExamsView.tsx`**: Academic coordinator.
6. **`/src/components/FinanceTracker.tsx`**: Allowance ledger.
7. **`/src/components/HealthFitnessView.tsx`**: Diet tracker and gym diary.
8. **`/src/components/ProjectsFilesView.tsx`**: Code projects workflow and Document Indexer.
9. **`/server.ts`**: Node/Express server acting as the secure proxy shielding our Gemini API Secret from the browser.
