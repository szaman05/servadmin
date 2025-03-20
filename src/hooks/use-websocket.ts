
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export function useWebSocket<T>(initialState: T) {
  const [data, setData] = useState<T>(initialState);
  const [isConnected, setIsConnected] = useState(false);
  const { token } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!token) return;
    
    try {
      const socket = new WebSocket(WS_URL);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        // Authenticate with token
        socket.send(JSON.stringify({ type: 'authenticate', token }));
        setIsConnected(true);
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'server-stats') {
            setData(message.data as T);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Reconnect after delay
        setTimeout(() => {
          connect();
        }, 5000);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket.close();
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }, [token]);

  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { data, isConnected };
}
