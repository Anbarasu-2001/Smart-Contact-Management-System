const express = require("express");
const http = require("http");
const setupSocket = require("./index"); // your socket file

const app = express();
const server = http.createServer(app);

// setup socket
setupSocket(server);

// basic route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// IMPORTANT: use dynamic port for Render
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});