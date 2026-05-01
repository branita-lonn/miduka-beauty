// lib/socket.ts
// Socket.io client singleton and helpers for real-time notifications.

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:3001";

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
    
    socket.on("connect", () => {
      console.log("Connected to socket server as internal client");
    });
    
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });
  }
  return socket;
};

/**
 * Emits a new order event to the socket server, which will broadcast it to all store owners.
 */
export const emitNewOrder = (order: { 
  orderId: string; 
  orderNumber: string; 
  total: number; 
  customerName: string; 
}) => {
  try {
    const s = getSocket();
    s.emit("internal_new_order", order);
  } catch (error) {
    console.error("Failed to emit new order event:", error);
  }
};
