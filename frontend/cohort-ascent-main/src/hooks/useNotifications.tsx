import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import { Notification } from '@/types/notification';
import { toast } from 'sonner';
import { connectSocket, disconnectSocket, EffortActivity } from "@/integrations/realtime/socket";
import { Zap } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api';

const mapEffortToNotification = (effort: EffortActivity): Notification => {
    return {
        id: `effort-${effort.id}-${Date.now()}`,
        recipientId: 'ALL',
        role: 'ALL',
        type: effort.type === 'EFFORT_SUBMITTED' ? 'REPORT_SUBMITTED' : 'ROLE_UPDATE',
        title: effort.type === 'EFFORT_SUBMITTED' ? 'Intelligence Report: Effort Logged' : 'Weekly Operations Summary',
        message: effort.type === 'EFFORT_SUBMITTED'
            ? `${effort.trainerMentorName} submitted ${effort.effortHours}h of technical training for ${effort.cohortCode}`
            : `System generated weekly brief for ${effort.cohortCode}: ${effort.effortHours}h cumulative engagement.`,
        link: `/cohorts/${effort.cohortCode}`,
        entityId: effort.cohortCode,
        isRead: false,
        createdAt: effort.timestamp,
    };
};

export const useNotifications = () => {
    const { user } = useAuthStore();
    const { addNotification, setNotifications } = useNotificationStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        const fetchRealData = async () => {
            try {
                // Fetch from Spring Boot Backend (The Real Source of Truth)
                const response = await api.get(`/notifications/${user.id}`);

                if (response.data && Array.isArray(response.data)) {
                    // Normalize data
                    const notifications = response.data.map((n: any) => ({
                        ...n,
                        id: n.id.toString(),
                        recipientId: n.recipientId?.toString() || '0',
                    }));

                    // Sort descending by ID
                    const sorted = notifications.sort((a: any, b: any) => Number(b.id) - Number(a.id));
                    setNotifications(sorted);
                }
            } catch (err) {
                console.error('Failed to fetch real notification data from backend', err);
            }
        };

        fetchRealData();

        // WebSocket (Backend App Events) - Realtime Channel
        try {
            connectSocket(
                user.id.toString(),
                // Legacy Activity Events
                (activity: EffortActivity) => {
                    const notification = mapEffortToNotification(activity);
                    addNotification(notification);
                    toast(notification.title, {
                        description: notification.message,
                        icon: <Zap className="h-4 w-4 text-primary" />,
                    });
                },
                // New Direct Notification Events
                (notification: Notification) => {
                    addNotification(notification);
                    toast(notification.title, {
                        description: notification.message,
                        icon: <Zap className="h-4 w-4 text-primary" />,
                    });
                }
            );
        } catch (err) {
            console.warn('Realtime backend socket connection failed', err);
        }

        return () => {
            disconnectSocket();
        };
    }, [user, addNotification, setNotifications, navigate]);
};
