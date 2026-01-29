import { useNotificationStore } from '@/stores/notificationStore';
import { Notification, NotificationType } from '@/types/notification';

export const createNotification = (
    params: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
): Notification => {
    return {
        ...params,
        id: Math.random().toString(36).substring(2, 9),
        isRead: false,
        createdAt: new Date().toISOString(),
    };
};

export const triggerNotification = (
    params: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
) => {
    const notification = createNotification(params);
    useNotificationStore.getState().addNotification(notification);
    return notification;
};

// Simulation for demo purposes
export const simulateNotifications = (role: string, userId: string) => {
    const events = [
        {
            type: 'COHORT_CREATED' as NotificationType,
            title: 'New Cohort Created',
            message: 'COH-2026-015 has been successfully initialized in the system.',
            role: 'ADMIN',
            link: '/cohorts',
        },
        {
            type: 'REPORT_SUBMITTED' as NotificationType,
            title: 'Attendance Report Due',
            message: 'Compliance deadline: Submit Weekly Attendance for COH-2026-014.',
            role: 'COACH',
            link: '/reports',
        },
        {
            type: 'SYSTEM_ALERT' as NotificationType,
            title: 'Service Maintenance',
            message: 'The platform will undergo scheduled maintenance at 02:00 AM UTC.',
            role: 'ALL',
            link: '/dashboard',
        }
    ];

    let index = 0;
    const interval = setInterval(() => {
        const event = events[index % events.length];
        if (event.role === 'ALL' || event.role === role) {
            triggerNotification({
                recipientId: userId,
                role: event.role as any,
                type: event.type,
                title: event.title,
                message: event.message,
                link: event.link,
            });
        }
        index++;
        if (index >= 10) clearInterval(interval);
    }, 30000); // Trigger every 30 seconds for the demo

    return () => clearInterval(interval);
};
