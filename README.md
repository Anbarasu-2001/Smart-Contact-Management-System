# Smart Contact Management System

A production-ready generic Smart Contact Management System with Privacy Control built using the MERN stack (MongoDB, Express, React, Node.js).

## Features

- **User Authentication**: Secure Login/Registration using JWT and bcrypt.
- **Contact Management**: Add, Edit, Delete, View contacts.
- **Relationship Context**: Track interactions and calculate relationship scores.
- **Interaction History**: Log calls, messages, and meetings.
- **Privacy Control**: Share contacts temporarily via secure, time-limited links.
- **Dashboard Insights**: View active/inactive contacts and reconnect suggestions.
- **Responsive Design**: Mobile-friendly interface.

## Tech Stack

- **Frontend**: React.js (Vite), Context API, CSS Modules.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Authentication**: JSON Web Tokens (JWT).

## Prerequisites

- Node.js (v14+)
- MongoDB (Running locally or Atlas URI)

## Setup Instructions

### 1. Clone/Download the Repository
If you haven't already, navigate to the project folder:
```bash
cd miniproject
```

### 2. Backend Setup
Navigate to the `server` directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory (already created) with:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/contactmanager
JWT_SECRET=your_secret_key
```
*Note: Make sure your MongoDB instance is running.*

Start the backend server:
```bash
npm run server
# or
node index.js
```
The server will run on `http://localhost:5000`.

### 3. Frontend Setup
Open a new terminal, navigate to the `client` directory and install dependencies:
```bash
cd client
npm install
```

Start the React development server:
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`.

## Usage

1.  **Register**: Create a new account.
2.  **Dashboard**: See your insights and contacts.
3.  **Add Contact**: Click "Add Contact" to save a new person.
4.  **Log Interaction**: Click "View Details" on a contact card, then log a call/message. Watch the Relationship Score increase!
5.  **Share**: Click "Generate Link" in Contact Details to create a temporary shareable link. Open the link in a new incognito window to test.

## Project Structure

- `server/`: Backend API code.
  - `config/`: Database connection.
  - `models/`: Mongoose schemas (User, Contact, Interaction, ShareLink).
  - `routes/`: API endpoints.
  - `middleware/`: Auth verification.
- `client/`: Frontend React code.
  - `src/context/`: Global state (Auth, Contact, Alert).
  - `src/components/`: UI Components (Pages, Auth, Contacts, Dashboard).

## License
MIT
