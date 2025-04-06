import { Server } from "http";

export function setupWebSocketServer(server: Server) {
  return {
    broadcast: () => {},
    broadcastToChannel: () => {}
  };
}