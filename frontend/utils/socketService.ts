import { io, Socket } from 'socket.io-client';

export type SocketHandler<T = any> = (payload: T) => void;

class SocketService {
    private socket: Socket | null = null;
    private userId: string | null = null;
    private token: string | null = null;

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
        const socketUrl = (process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || defaultUrl).replace(/\/api$/, '');

        this.socket = io(socketUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 800,
            auth: {
                userId,
                token,
            },
        });

        this.socket.on('connect', () => {
            if (!this.socket || !this.userId) return;
            console.info('Socket connected');
            this.socket.emit('join', this.userId);
        });

        this.socket.on('disconnect', () => {
            console.info('Disconnected');
        });

        return this.socket;
    }

    disconnect() {
        if (!this.socket) return;
        this.socket.disconnect();
        this.socket = null;
        this.userId = null;
        this.token = null;
    }

    get instance() {
        return this.socket;
    }

    on(event: string, handler: SocketHandler) {
        if (!this.socket) return;
        this.socket.off(event, handler);
        this.socket.on(event, handler);
    }

    off(event: string, handler?: SocketHandler) {
        if (!this.socket) return;
        if (handler) {
            this.socket.off(event, handler);
            return;
        }
        this.socket.off(event);
    }

    emit(event: string, payload?: any) {
        if (!this.socket) return;
        this.socket.emit(event, payload);
    }
}

const socketService = new SocketService();

export default socketService;
