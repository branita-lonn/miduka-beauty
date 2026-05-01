// server.socket.ts
// Custom Node.js server to handle Socket.io alongside Next.js.
// Used for real-time order notifications in the seller dashboard.

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.SOCKET_PORT || "3001", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Store owners register themselves to receive notifications
    socket.on("register_owner", () => {
      socket.join("store_owner");
      console.log(`Socket ${socket.id} joined store_owner room`);
    });

    // Internal event to broadcast new order to owners
    // This is triggered by the emitNewOrder logic
    socket.on("internal_new_order", (order) => {
      io.to("store_owner").emit("new_order", order);
      console.log(`Broadcasted new order ${order.orderNumber} to store_owner room`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  server.listen(port, () => {
    console.log(`> Socket & Next.js server ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error("Failed to start socket server", err);
  process.exit(1);
});
