import api from './api';

export interface FeedbackRequest {
    id: number;
    token: string;
    weekNumber: number;
    active: boolean;
    createdAt: string;
    expiresAt?: string;
    cohort?: {
        id: number;
        code: string;
        trainingLocation: string;
        bu: string;
        primaryTrainer?: { name: string };
        primaryMentor?: { name: string };
        coach?: { name: string };
        buddyMentor?: { name: string };
        behavioralTrainer?: { name: string };
    };
}

export interface Feedback {
    id: number;
    weekNumber: number;

    // Technical Trainer
    isTechnicalSessionHeld?: boolean;
    courseContentRating?: number;
    technicalKnowledgeRating?: number;
    trainerEngagementRating?: number;
    conceptsScheduleRating?: number;
    udemyRecapRating?: number;
    additionalScenarioRating?: number;
    technicalLowScoreExplanation?: string;

    // Mentor
    isMentorSessionHeld?: boolean;
    mentorGuidanceRating?: number;
    mentorLowScoreExplanation?: string;

    // Coach
    coachEffectivenessRating?: number;
    coachLowScoreExplanation?: string;

    // Buddy Mentor
    didBuddyMentorConnect?: boolean;
    wereDoubtsClarified?: boolean;
    buddyMentorGuidanceRating?: number;
    buddyMentorSuggestions?: string;

    // Behavioral Trainer
    isBehavioralSessionHeld?: boolean;
    behavioralDeliveryRating?: number;
    behavioralLowScoreExplanation?: string;

    overallSatisfaction: number;
    createdAt: string;
    candidateName?: string;
    employeeId?: string;
}

export interface FeedbackSubmission {
    token: string;
    candidateName: string;
    employeeId: string;

    // Technical Trainer
    isTechnicalSessionHeld: boolean;
    courseContentRating: number;
    technicalKnowledgeRating: number;
    trainerEngagementRating: number;
    conceptsScheduleRating: number;
    udemyRecapRating: number;
    additionalScenarioRating: number;
    technicalLowScoreExplanation: string;

    // Mentor
    isMentorSessionHeld: boolean;
    mentorGuidanceRating: number;
    mentorLowScoreExplanation: string;

    // Coach
    coachEffectivenessRating: number;
    coachLowScoreExplanation: string;

    // Buddy Mentor
    didBuddyMentorConnect: boolean;
    wereDoubtsClarified: boolean;
    buddyMentorGuidanceRating: number;
    buddyMentorSuggestions: string;

    // Behavioral Trainer
    isBehavioralSessionHeld: boolean;
    behavioralDeliveryRating: number;
    behavioralLowScoreExplanation: string;

    overallSatisfaction: number;
}

export interface FeedbackAnalytics {
    totalResponses: number;
    averages: {
        trainer: number;
        mentor: number;
        coach: number;
        overall: number;
    };
    responses: Feedback[];
}

export interface FeedbackSession {
    request: FeedbackRequest;
    trainerHours?: number;
    mentorHours?: number;
    coachHours?: number;
    totalHours?: number;
}

export const feedbackApi = {
    // Admin
    createRequest: (data: { cohortId: number; weekNumber: number; expiryDays?: number }) =>
        api.post<FeedbackRequest>('/feedback/request', data),

    getCohortRequests: (cohortId: number) =>
        api.get<FeedbackRequest[]>(`/feedback/cohort/${cohortId}/requests`),

    getAnalytics: (cohortId: number) =>
        api.get<FeedbackAnalytics>(`/feedback/cohort/${cohortId}/analytics`),

    // Public
    getSession: (token: string) =>
        api.get<FeedbackSession>(`/feedback/public/session/${token}`),

    submitFeedback: (data: FeedbackSubmission) =>
        api.post<Feedback>('/feedback/public/submit', data),
};
