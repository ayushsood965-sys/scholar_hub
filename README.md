# ScholarHub - HPU Ph.D. Lifecycle & Student Management Portal

**ScholarHub** is a unified digital ecosystem designed specifically for the students, faculty, and administrators of **HPU (Himachal Pradesh University)**. It acts as a central monorepo gateway connecting various university administration modules, sharing a common database, credentials, and transferable candidate records.

---

## 📂 Repository Structure

The workspace is organized as a clean, modular monorepo-style structure:

```
scholar_hub/
├── gateway/             # Central HPU Student Services Gateway (Vite + React) - Port 3000
├── scholar_sync/        # Ph.D. Candidate Lifecycle Tracker (Vite + React) - Port 5173
├── scholar_track/       # Attendance & Leave Management System (Vite + React) - Port 5174
├── server/              # Shared MERN Express REST API Backend (Node.js) - Port 5000
└── package.json         # Workspace root manager scripts
```

---

## 🛠️ Modules Overview

### 1. HPU Student Gateway (`/gateway`)
The entry point of the application. It features a premium, responsive glassmorphic design styled with HPU university aesthetics and logos. It displays available portals and acts as a central hub where users are redirected to their specific tracking modules.
* **Port**: `http://localhost:3000/`

### 2. ScholarSync Portal (`/scholar_sync`)
A complete lifecycle management tracking system designed specifically for Ph.D. candidates.
* **Student Dashboard**: Profiles general details, qualifications, and automatically generates a unique 9-digit **SH no. (ScholarHub Number)**. Tracks DRC synopsis approvals, RAC reviews, research publications/chapters, and digital thesis uploads.
* **Faculty Dashboard**: Allows assigned supervisors to verify coursework, approve publications/chapters, upload RAC reviews, and manage assigned candidates.
* **HOD/Admin Dashboard**: Provides HODs and administrators full control to verify candidate enrollment, allocate research supervisors, schedule DRC meetings, record Viva-Voce defenses, award degrees, and execute global department transfers.
* **Port**: `http://localhost:5173/`

### 3. ScholarTrack Portal (`/scholar_track`)
An integrated tracking portal to manage student and staff attendance, leaves, and notifications. It utilizes the same centralized database as ScholarSync to resolve user roles dynamically.
* **Port**: `http://localhost:5174/`

### 4. Central Backend API Server (`/server`)
A robust Node.js and Express backend connecting to MongoDB.
* **Shared Authentication**: Centralized register, login, and profile update controllers.
* **SH no. Migration**: Startup script (`backfillSHNos()`) that dynamically checks student profiles and backfills any missing candidates with a unique 9-digit SH number.
* **Document Services**: Secure digital asset uploads for certificates, drafts, and research outputs.
* **Port**: `http://localhost:5000/`

---

## 💻 Tech Stack

* **Frontend**: React (Vite, React Router DOM, Axios, Context API, Lucide icons, JSPDF, HTML2Canvas)
* **Backend**: Node.js, Express.js
* **Database**: MongoDB (Mongoose ODM)
* **Design Theme**: Premium glassmorphic interface, dark modes, HSL tailored forest-greens, Outfit typography, and custom micro-animations.

---

## 🚀 Installation & Running Locally

### 1. Clone the repository
```bash
git clone https://github.com/ayushsood965-sys/scholar_sync.git scholar_hub
cd scholar_hub
```

### 2. Centralized Run Commands
Centralized workspace development runner scripts are configured in the root `package.json`. You can launch any module or start everything concurrently directly from the root of the project:

* **Start All Modules Concurrently**:
  ```bash
  npm run dev
  ```

* **Individual Module Runs**:
  * **Start Gateway Portal**:
    ```bash
    npm run dev:gateway
    ```
  * **Start ScholarSync (Ph.D. Lifecycle)**:
    ```bash
    npm run dev:sync
    ```
  * **Start ScholarTrack (Attendance/Leave)**:
    ```bash
    npm run dev:track
    ```
  * **Start Backend API Server**:
    ```bash
    npm run dev:server
    ```

### 3. Database Migration & Backfill
On launch, the backend will connect to MongoDB and automatically detect student candidates missing their identifier, backfilling them with a unique **SH no.** identifier. No manual database migrations are required.
