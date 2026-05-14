import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from './env';

let io: Server;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join admin room
    socket.on('join-admin', () => {
      socket.join('admin-room');
      console.log(`👨‍💼 Admin joined: ${socket.id}`);
    });

    // Join customer room (per order)
    socket.on('join-order', (orderId: string) => {
      socket.join(`order-${orderId}`);
      console.log(`👤 Customer tracking order: ${orderId}`);
    });

    // Join table room
    socket.on('join-table', (tableNumber: number) => {
      socket.join(`table-${tableNumber}`);
      console.log(`🪑 Joined table: ${tableNumber}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
