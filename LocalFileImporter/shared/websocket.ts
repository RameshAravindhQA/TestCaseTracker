
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

export class ChatWebSocketServer {
  private io: SocketIOServer;

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io'
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }
}
