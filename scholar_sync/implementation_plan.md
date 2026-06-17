Mission 1: Core Architecture & Scholar Authentication (Where we start)

Agent Task: Initialize the MERN boilerplate (Vite + React frontend, Node/Express backend).

Database: Set up the MongoDB connection and the User Mongoose schema (handling roles: SCHOLAR, SUPERVISOR, HOD, ADMIN).

UI: Build the global Homepage and the specific Login/Registration page for the SCHOLAR role.

Verification: Instruct the agent's browser subagent to test the login flow and verify JWT token generation in local storage.

Mission 2: Scholar Dashboard & Registration Flow (Phase 1)

Agent Task: Create the JWT-protected Scholar Dashboard route.

Database: Create the Thesis schema with a default status of REGISTRATION_PENDING.

UI: Build a multi-step form for the Scholar to enter their university enrollment details, department, and tentative research topic.

Mission 3: Admin Workspace & Guide Allocation

Agent Task: Build the Admin protected dashboard.

UI: Create a data table for Admins to view pending scholars and a dropdown UI to assign a SUPERVISOR from the existing faculty list.

Action: Create the backend controller to update the Thesis document with the assigned supervisor's ID.

Mission 4: Coursework & Synopsis (Phase 2)

Agent Task: Build the Supervisor and HOD dashboards.

UI/Backend: Implement the file upload system (using Multer for local storage or AWS S3) for the Scholar to submit the Synopsis PDF.

Action: Build the review loop UI (Supervisor toggling REVISION_REQUIRED vs APPROVED) and the HOD "DRC Approved" trigger that transitions the thesis status to ACTIVE_RESEARCH.

Mission 5: The Grind & Final Defense (Phases 3, 4, 5)

Agent Task: Implement the logic to generate the 6-month progress report milestones.

UI: Build the Pre-Submission seminar checklist, the final document upload portal, and the system lock mechanism that prevents further uploads once the status hits SUBMITTED.

Step 1: Your First Antigravity Prompt
To get started, open Antigravity's Agent Manager and paste this exact prompt to kick off Mission 1:

Prompt for Agent: "I am building a SaaS called ScholarSync using the MERN stack (MongoDB, Express, React with Vite, Node.js). First, generate an Implementation Plan to set up the monolithic folder structure with a client and server directory. Second, set up an Express server with Mongoose connected to a local MongoDB instance. Third, create a User model with fields for name, email, passwordHash, and an enum role (SCHOLAR, SUPERVISOR, HOD, ADMIN). Finally, build a basic React Homepage and a functional Registration/Login UI for the SCHOLAR role using JWT for authentication. Do not write the code until I review your Implementation Plan."