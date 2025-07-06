// socketTest.js (or socketTest.mjs if you use .mjs)

import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("✅ Connected to socket:", socket.id);

  const userId = "68612341c102a6966e31e5cf"; // Replace with real user ID
  console.log("🟢 Registering user:", userId);
  socket.emit("register", userId);
});

socket.on("new_notification", (data) => {
  console.log("📥 New Notification received:", data);
});

socket.on("disconnect", () => {
  console.log("🔴 Disconnected");
});
