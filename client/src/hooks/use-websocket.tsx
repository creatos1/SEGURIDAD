import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./use-auth";

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

export function useWebSocket() {
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback(() => {
    // Close any existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      console.log('Connecting to WebSocket:', wsUrl);
      const socket = new WebSocket(wsUrl);

      socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        setTimeout(connect, 3000);
      });

      // Set up event handlers
      socket.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected");
        setReconnectAttempts(0); // Reset reconnect attempts on successful connection

        // If user is authenticated, send auth message
        if (user) {
          socket.send(JSON.stringify({
            type: "auth",
            userId: user.id,
            role: user.role
          }));
        }

        // Resubscribe to previous channels
        subscriptionsRef.current.forEach(channel => {
          socket.send(JSON.stringify({
            type: "subscribe",
            channel
          }));
        });
      };

      socket.onclose = (event) => {
        setIsConnected(false);
        console.log("WebSocket disconnected", event.code, event.reason);

        // Only attempt to reconnect if the connection wasn't closed intentionally
        if (event.code !== 1000) {
          const reconnectDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Attempting to reconnect in ${reconnectDelay/1000}s...`);
          setTimeout(connect, reconnectDelay);
          setReconnectAttempts(prev => prev + 1);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        socket.close(); //Explicitly close the socket on error
      };


      socket.onmessage = (event) => {
        try {
          if (typeof event.data === 'string') {
            const data = JSON.parse(event.data);
            setLastMessage(data);
          } else {
            console.warn("Received non-string message:", event.data);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error, "Raw data:", event.data);
        }
      };

      socketRef.current = socket;
    } catch (error) {
      console.error("Failed to establish WebSocket connection:", error);
      setTimeout(connect, 3000);
    }
  }, [user, reconnectAttempts]);

  // Subscribe to a channel
  const subscribe = useCallback((channel: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      // Add to pending subscriptions
      subscriptionsRef.current.add(channel);
      return;
    }

    socketRef.current.send(JSON.stringify({
      type: "subscribe",
      channel
    }));
    subscriptionsRef.current.add(channel);
  }, []);

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channel: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      subscriptionsRef.current.delete(channel);
      return;
    }

    socketRef.current.send(JSON.stringify({
      type: "unsubscribe",
      channel
    }));
    subscriptionsRef.current.delete(channel);
  }, []);

  // Send a message through the WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket not connected");
    }
  }, []);

  // Send a location update (for drivers)
  const sendLocationUpdate = useCallback((assignmentId: number, latitude: number, longitude: number, status: string, speed?: number, heading?: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "location_update",
        assignmentId,
        latitude,
        longitude,
        status,
        speed,
        heading
      }));
    } else {
      console.error("WebSocket not connected");
    }
  }, []);

  // Connect on mount and reconnect if user changes
  useEffect(() => {
    connect();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    lastMessage,
    subscribe,
    unsubscribe,
    sendMessage,
    sendLocationUpdate
  };
}