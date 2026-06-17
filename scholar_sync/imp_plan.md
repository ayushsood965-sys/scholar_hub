
Mission 1: Core Architecture & Authentication Setup
Phase 1: Project Initialization & Directory Structure
Root Directory: Create a monolithic wrapper (e.g., scholarsync/).

Backend (/server): Initialize a Node.js project. Set up environment variables (.env) for the MongoDB URI and JWT secret.

Frontend (/client): Scaffold a React application using Vite.

Version Control: Initialize Git in the root directory and configure .gitignore to exclude node_modules and .env files.

Phase 2: Backend Core (Express & MongoDB)
Dependencies: Install express, mongoose, cors, dotenv, bcryptjs (for hashing), and jsonwebtoken (for auth).

Database Connection: Create a config/db.js file to establish a local connection using Mongoose (mongodb://localhost:27017/scholarsync).

Server Entry Point: Configure server.js to use CORS, parse JSON bodies, connect to the database, and listen on a dedicated port (e.g., 5000).

Phase 3: Database Modeling (Mongoose)
User Schema: Create models/User.js.

Schema Definition:

name: String, required.

email: String, required, unique, lowercase.

passwordHash: String, required.

role: String, required, enum: ['SCHOLAR', 'SUPERVISOR', 'HOD', 'ADMIN'], default: 'SCHOLAR'.

Timestamps: Enable automatic createdAt and updatedAt tracking.

Phase 4: Authentication API (Controllers & Routes)
Auth Controller (controllers/authController.js):

register: Accept email, name, password, and role. Hash the password using bcryptjs. Save the new User to MongoDB. Return a JWT.

login: Find the user by email. Compare the provided password with passwordHash. If valid, generate and return a signed JWT containing the user's id and role.

Auth Routes (routes/authRoutes.js): Map POST /api/auth/register and POST /api/auth/login to their respective controller functions.

Phase 5: Frontend Core (React + Vite)
Dependencies: Install react-router-dom for navigation, axios for API calls, and configure Tailwind CSS for styling (using the green/white university theme).

State Management: Create a generic Auth Context (or use a lightweight Zustand store) to hold the JWT and decoded user role globally.

Phase 6: Frontend UI Components
Homepage (src/pages/Home.jsx): Build the public landing page with navigation links to the login portal.

Authentication Forms (src/pages/Auth/):

Register.jsx: Form specifically for the SCHOLAR role to create an account.

Login.jsx: Form to authenticate. On success, save the JWT to local storage/state and redirect the user to a protected dashboard route.