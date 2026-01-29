import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '@/types/notification';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearHistory: () => void;
    setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            notifications: [],
            unreadCount: 0,
            addNotification: (notification) =>
                set((state) => {
                    const exists = state.notifications.find((n) => n.id === notification.id);
                    if (exists) return state;

                    const newNotifications = [notification, ...state.notifications];
                    return {
                        notifications: newNotifications,
                        unreadCount: newNotifications.filter((n) => !n.isRead).length,
                    };
                }),
            markAsRead: (id) =>
                set((state) => {
                    const newNotifications = state.notifications.map((n) =>
                        n.id === id ? { ...n, isRead: true } : n
                    );
                    return {
                        notifications: newNotifications,
                        unreadCount: newNotifications.filter((n) => !n.isRead).length,
                    };
                }),
            markAllAsRead: () =>
                set((state) => {
                    const newNotifications = state.notifications.map((n) => ({ ...n, isRead: true }));
                    return {
                        notifications: newNotifications,
                        unreadCount: 0,
                    };
                }),
            clearHistory: () =>
                set({
                    notifications: [],
                    unreadCount: 0,
                }),
            setNotifications: (notifications) =>
                set({
                    notifications,
                    unreadCount: notifications.filter((n) => !n.isRead).length,
                }),
        }),
        {
            name: 'notification-storage',
        }
    )
);
