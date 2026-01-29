import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import { Notification, NotificationType } from '@/types/notification';
import { toast } from 'sonner';
import { connectSocket, disconnectSocket, EffortActivity } from "@/integrations/realtime/socket";
import { Zap, ShieldCheck } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api';

// Map Java Backend "Activity" entity to Frontend "Notification"
// Dynamic content generation based on WHO is viewing the notification
const mapBackendActivityToNotification = (activity: any, currentUser: any): Notification => {
    let type: NotificationType = 'SYSTEM_ALERT';

    // Infer type from title
    if (activity.title?.includes('Mission') || activity.title?.includes('Assign')) {
        type = 'COHORT_ASSIGNMENT';
    } else if (activity.title?.includes('Report') || activity.title?.includes('Effort')) {
        type = 'REPORT_SUBMITTED';
    }

    // Dynamic Logic: Personalize the message for the recipient
    let displayTitle = activity.title || 'System Activity';
    let displayMessage = activity.description || 'No details provided.';

    // If the logged-in user is the one assigned (and it's a coach assignment)
    if (type === 'COHORT_ASSIGNMENT' && activity.coach?.id && currentUser?.id === activity.coach.id) {
        displayTitle = 'Mission Assignment';
        displayMessage = `You have been officially assigned as Coach for ${activity.cohort?.code || 'a new cohort'}. Access the command center for details.`;
    }

    return {
        id: activity.id?.toString() || Math.random().toString(36),
        recipientId: activity.coach?.id?.toString() || 'ALL',
        role: 'ALL',
        type: type,
        title: displayTitle,
        message: displayMessage,
        link: activity.cohort ? `/cohorts/${activity.cohort.id || activity.cohort.code}` : undefined,
        entityId: activity.cohort?.code || activity.cohort?.id?.toString(),
        isRead: false,
        createdAt: activity.date ? new Date(activity.date).toISOString() : new Date().toISOString(),
    };
};

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
                const response = await api.get('/activities');

                if (response.data && Array.isArray(response.data)) {
                    // Sort descending by ID (proxy for time if date is just YYYY-MM-DD)
                    const sorted = response.data.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));

                    // Filter and map based on Role
                    const filteredAndMapped = sorted
                        .map(activity => mapBackendActivityToNotification(activity, user))
                        .filter(notification => {
                            // Admin sees everything
                            if (user.role === 'ADMIN') return true;
                            // Coaches/Users see only their targeted notifications or global ones
                            return notification.recipientId === 'ALL' || notification.recipientId === user.id?.toString();
                        });

                    setNotifications(filteredAndMapped);
                }
            } catch (err) {
                console.error('Failed to fetch real activity data from backend', err);
            }
        };

        fetchRealData();

        // 1. WebSocket (Backend App Events) - Primary Realtime Channel
        try {
            connectSocket((activity: EffortActivity) => {
                const notification = mapEffortToNotification(activity);
                addNotification(notification);
                toast(notification.title, {
                    description: notification.message,
                    icon: <Zap className="h-4 w-4 text-primary" />,
                });
            });
        } catch (err) {
            console.warn('Realtime backend socket connection failed', err);
        }

        // 2. Keep Supabase as backup for other types of events if needed
        const channel = supabase
            .channel('realtime_activity_notifications_v2')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'activity_log',
                },
                (payload) => {
                    // This is older logic, kept for backward compatibility if Supabase is still used for some logs
                    console.log('Supabase event received:', payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            disconnectSocket();
        };
    }, [user, addNotification, setNotifications, navigate]);
};
