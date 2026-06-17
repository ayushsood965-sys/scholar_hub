<<<<<<< HEAD
# 🏔️ HPU ScholarSync

**ScholarSync** is a localized, lightning-fast Research & Thesis Tracking System built to operate independently of standard university ERPs. Designed specifically for academic departments, it eliminates paper-based delays by digitizing the entire Ph.D. lifecycle—from candidate enrollment and coursework tracking to thesis submission and final defense.

## 🚀 The Problem It Solves
Traditional academic workflows rely heavily on physical files moving between scholars, guides, and department heads. ScholarSync models this complex offline bureaucracy as a predictable digital State Machine, ensuring strict audit trails, secure document storage, and seamless communication.

## ✨ Core Features
* **Role-Based Access Control (RBAC):** Distinct dashboards and permission levels for `SCHOLAR`, `SUPERVISOR`, `HOD`, and `ADMIN`.
* **Ph.D. Lifecycle State Machine:** Automated tracking of thesis status (`REGISTRATION_PENDING` ➔ `ACTIVE_RESEARCH` ➔ `PRE_SUBMISSION` ➔ `SUBMITTED` ➔ `AWARDED`).
* **Milestone Engine:** Auto-generation of 6-month progress reports and synopsis submission workflows.
* **Review & Feedback Loop:** Dedicated comment threads for supervisors to mark submissions as `APPROVED` or `REVISION_REQUIRED`.
* **Secure Document Vault:** Centralized storage for coursework certificates, plagiarism reports, and thesis drafts.

## 💻 Tech Stack
This project is built purely on the **MERN** stack:
* **Frontend:** React (Vite), Tailwind CSS (Custom Light Green/White HPU Theme), Lucide React Icons.
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB configured with Mongoose ODM.
* **Authentication:** JSON Web Tokens (JWT) with bcrypt password hashing.

## 👥 System Roles
1. **Admin:** Manages user onboarding and assigns faculty guides.
2. **HOD (Head of Department):** Oversees department research and approves critical milestones (e.g., DRC meetings, pre-submission seminars).
3. **Supervisor:** Mentors scholars, reviews documents, and provides digital sign-offs.
4. **Scholar:** Uploads progress reports, manages their research timeline, and responds to guide feedback.

## 🛠️ Local Development Setup

**1. Clone the repository**
\`\`\`bash
git clone [(https://github.com/ayushsood965-sys/scholar_sync)]
cd scholarsync
\`\`\`

**2. Setup the Backend**
\`\`\`bash
cd server
npm install
# Create a .env file with your MONGODB_URI and JWT_SECRET
npm run dev
\`\`\`

**3. Setup the Frontend**
\`\`\`bash
cd ../client
npm install
npm run dev
\`\`\`

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.
=======
# scholar_sync
A lightweight, MERN-stack SaaS designed to digitize and manage the complete Ph.D. research lifecycle—translating offline university bureaucracy into a lightning-fast, role-based digital workflow.
>>>>>>> 519e9eb08c2c98c37814c9ada4b39171305b9aab
