import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

let stompClient: Client | null = null;

export interface EffortActivity {
  id: number;
  cohortCode: string;
  trainerMentorName: string;
  effortHours: number;
  timestamp: string;
  type: 'EFFORT_SUBMITTED' | 'WEEKLY_SUMMARY';
}

import { Notification } from '@/types/notification';

export const connectSocket = (
  userId: string,
  onActivityReceived: (activity: EffortActivity) => void,
  onNotificationReceived: (notification: Notification) => void
) => {
  try {
    const socket = new SockJS('/ws');
    stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        // console.log('WebSocket:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket:', frame);

      // Subscribe to personal notifications
      stompClient?.subscribe(`/topic/notifications/${userId}`, (message) => {
        try {
          const notification: Notification = JSON.parse(message.body);
          // Ensure ID types match frontend expectations
          notification.id = notification.id.toString();
          notification.recipientId = notification.recipientId.toString();
          onNotificationReceived(notification);
        } catch (error) {
          console.error('Error parsing Notification WebSocket message:', error);
        }
      });

      // Subscribe to effort submissions (Legacy/Global)
      stompClient?.subscribe('/topic/efforts', (message) => {
        try {
          const activity: EffortActivity = JSON.parse(message.body);
          onActivityReceived(activity);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Subscribe to weekly summaries (Legacy/Global)
      stompClient?.subscribe('/topic/weekly-summary', (message) => {
        try {
          const activity: EffortActivity = JSON.parse(message.body);
          onActivityReceived(activity);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
    };

    stompClient.onStompError = (frame) => {
      console.error('WebSocket STOMP error:', frame);
    };

    stompClient.onWebSocketError = (error) => {
      console.error('WebSocket error:', error);
    };

    stompClient.onWebSocketClose = (event) => {
      console.log('WebSocket closed:', event);
    };

    stompClient.activate();
  } catch (error) {
    console.error('Failed to initialize WebSocket connection:', error);
  }
};

export const disconnectSocket = () => {
  if (stompClient !== null) {
    stompClient.deactivate();
    stompClient = null;
    console.log('Disconnected from WebSocket');
  }
};

export const isConnected = () => {
  return stompClient?.connected || false;
};
