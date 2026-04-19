# Workspace Start Guide: Real-Time Call Setup

## 1. Start the Backend (API + Socket Server)
- Open a terminal.
- Change directory to the backend:
  ```
  cd C:/Users/Anbarasu/OneDrive/Desktop/miniproject/server
  ```
- Start the backend:
  ```
  npm start
  ```
- This runs the Express/Socket.io server on port 5000.

## 2. Start the Frontend (Next.js UI)
- Open a new terminal.
- Change directory to the frontend:
  ```
  cd C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend
  ```
- Start the frontend:
  ```
  npm run dev
  ```
- This runs the Next.js app on port 3000 (default).
- Open http://localhost:3000 in your browser.

## 3. Real-Time Call (Audio/Video)
- Log in as two different users in two browser windows/tabs.
- Use the call option to start a real-time call.
- Both users must be online and logged in for real call to work.

## Troubleshooting
- If you see `EADDRINUSE`, kill the process using the port (e.g., with `npx kill-port 5000`).
- If you see the wrong UI or fake call, make sure you are running the frontend from the `frontend` folder.
- If you see network errors, ensure both servers are running and accessible.

---

**Always start backend and frontend in separate terminals!**

For further help, ask for a workspace script fix or more automation.
