import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { storage } from "./storage";

interface Client {
  ws: WebSocket;
  userId?: number;
  role?: string;
  subscriptions: Set<string>;
}

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients: Map<WebSocket, Client> = new Map();

  wss.on('connection', (ws) => {
    // Initialize client
    const client: Client = {
      ws,
      subscriptions: new Set()
    };
    clients.set(ws, client);

    // Setup heartbeat
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    // Send initial ping
    (ws as any).isAlive = true;
    ws.ping();

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      ws.terminate();
    });

    // Handle messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'subscribe':
            client.subscriptions.add(data.channel);
            break;
            
          case 'unsubscribe':
            client.subscriptions.delete(data.channel);
            break;
            
          case 'location_update':
            if (data.assignmentId && data.latitude && data.longitude) {
              const update = await storage.createLocationUpdate({
                assignmentId: data.assignmentId,
                latitude: data.latitude,
                longitude: data.longitude,
                speed: data.speed,
                heading: data.heading,
                status: data.status || 'on-time'
              });
              
              broadcastToChannel(`assignment_${data.assignmentId}`, {
                type: 'location_update',
                data: update
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'auth') {
          const { userId, role } = data;
          client.userId = userId;
          client.role = role;
        }
        
        // Handle subscription to events
        else if (data.type === 'subscribe') {
          const { channel } = data;
          client.subscriptions.add(channel);
        }
        
        // Handle unsubscription from events
        else if (data.type === 'unsubscribe') {
          const { channel } = data;
          client.subscriptions.delete(channel);
        }
        
        // Handle location updates from drivers
        else if (data.type === 'location_update' && client.role === 'driver') {
          const { assignmentId, latitude, longitude, status } = data;
          
          // Create location update in the database
          const locationUpdate = await storage.createLocationUpdate({
            assignmentId,
            latitude,
            longitude,
            status,
            speed: data.speed,
            heading: data.heading
          });
          
          // Broadcast to all clients subscribed to this assignment
          const assignmentChannel = `assignment:${assignmentId}`;
          broadcastToChannel(assignmentChannel, {
            type: 'location_update',
            data: locationUpdate
          });
          
          // Also broadcast to route channel
          const assignment = await storage.getAssignment(assignmentId);
          if (assignment) {
            const routeChannel = `route:${assignment.routeId}`;
            broadcastToChannel(routeChannel, {
              type: 'location_update',
              data: {
                ...locationUpdate,
                assignmentId,
                routeId: assignment.routeId
              }
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      clients.delete(ws);
    });

    // Send welcome message
    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to transit management system' }));
  });

  // Function to broadcast message to a specific channel
  function broadcastToChannel(channel: string, message: any) {
    const messageStr = JSON.stringify(message);
    
    clients.forEach((client) => {
      if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  // Administrative broadcast function (exported for use in routes)
  function broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    
    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  // Return functions that might be useful elsewhere
  return {
    broadcast,
    broadcastToChannel
  };
}
