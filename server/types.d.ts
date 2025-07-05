
import { ChatWebSocketServer } from './websocket';

declare global {
  var webSocketServer: ChatWebSocketServer | undefined;
}

export {};
