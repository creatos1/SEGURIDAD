import { useAuth } from "./use-auth";

export function useWebSocket() {
  return {
    isConnected: false,
    lastMessage: null,
    subscribe: () => {},
    unsubscribe: () => {},
    sendMessage: () => {},
    sendLocationUpdate: () => {}
  };
}