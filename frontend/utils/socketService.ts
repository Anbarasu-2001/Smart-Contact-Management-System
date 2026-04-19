import { io, Socket } from "socket.io-client";

export type SocketHandler<T = any> = (payload: T) => void;

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private token: string | null = null;
  private listeners: { [event: string]: SocketHandler[] } = {};

  connect(userId: string, token: string) {
    const sameSession = this.userId === userId && this.token === token;

    if (this.socket && sameSession) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.userId = userId;
    this.token = token;

    const isBrowser = typeof window !== "undefined";
    const hostname = isBrowser ? window.location.hostname : "localhost";
    const defaultUrl = `http://${hostname}:5000`;
    const socketUrl = (
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      defaultUrl
    ).replace(/\/api$/, "");

    this.socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 800,
      auth: { userId, token },
    });

    this.socket.on("connect", () => {
      if (!this.socket || !this.userId) return;
      console.info("[Socket] Connected - Flushing listeners...");
      this.socket.emit("join", this.userId);

      // Important: Flush and re-attach all registered listeners whenever we connect
      Object.keys(this.listeners).forEach((event) => {
        this.listeners[event].forEach((handler) => {
          this.socket!.off(event, handler); // Prevent double-attach
          this.socket!.on(event, handler);
        });
      });
    });

    this.socket.on("disconnect", () => {
      console.info("[Socket] Disconnected");
    });

    return this.socket;
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.userId = null;
    this.token = null;
    // We keep this.listeners so they persist across re-auth if needed
  }

  get instance() {
    return this.socket;
  }

  on(event: string, handler: SocketHandler) {
    // 1. Add to our local registry so we can re-attach on reconnect or late connect
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    // Avoid duplicate handler registrations in our local list
    if (!this.listeners[event].includes(handler)) {
      this.listeners[event].push(handler);
    }

    // 2. If the socket is already live, attach it immediately
    if (this.socket) {
      this.socket.off(event, handler); // Safety
      this.socket.on(event, handler);
    }
  }

  off(event: string, handler?: SocketHandler) {
    if (handler) {
      // Remove specific handler from registry
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter(h => h !== handler);
      }
      // Remove specific handler from socket
      if (this.socket) {
        this.socket.off(event, handler);
      }
    } else {
      // CLEAR ALL for this event - use with caution
      delete this.listeners[event];
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  emit(event: string, payload?: any) {
    if (!this.socket) {
       console.warn(`[Socket] Attempted to emit '${event}' but socket is not connected.`);
       return;
    }
    console.log(`[Socket] Emitting '${event}'`, payload);
    this.socket.emit(event, payload);
  }
}

const socketService = new SocketService();

export default socketService;
