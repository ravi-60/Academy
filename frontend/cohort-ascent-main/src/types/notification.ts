export type NotificationType =
    | 'COHORT_ASSIGNMENT'
    | 'REPORT_SUBMITTED'
    | 'ROLE_UPDATE'
    | 'SYSTEM_ALERT'
    | 'COHORT_CREATED'
    | 'COHORT_COMPLETED'
    | 'COMPLIANCE_DEADLINE'
    | 'ADMIN_BROADCAST';

export interface Notification {
    id: string;
    recipientId: string;
    role: 'ADMIN' | 'COACH' | 'LOCATION_LEAD' | 'ALL';
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    entityId?: string;
    isRead: boolean;
    createdAt: string;
}
