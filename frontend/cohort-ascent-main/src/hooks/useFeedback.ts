import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackApi, FeedbackSubmission } from '@/feedbackApi';
import { toast } from 'sonner';

export const useCohortFeedbackRequests = (cohortId: number) => {
    return useQuery({
        queryKey: ['feedback_requests', cohortId],
        queryFn: async () => {
            const response = await feedbackApi.getCohortRequests(cohortId);
            return response.data;
        },
        enabled: !!cohortId,
    });
};

export const useCohortFeedbackAnalytics = (cohortId: number) => {
    return useQuery({
        queryKey: ['feedback_analytics', cohortId],
        queryFn: async () => {
            const response = await feedbackApi.getAnalytics(cohortId);
            return response.data;
        },
        enabled: !!cohortId,
    });
};

export const useCreateFeedbackRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { cohortId: number; weekNumber: number; expiryDays?: number }) =>
            feedbackApi.createRequest(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['feedback_requests', variables.cohortId] });
            toast.success('Feedback request generated and sent to candidates');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create feedback request');
        },
    });
};

export const useFeedbackSession = (token: string) => {
    return useQuery({
        queryKey: ['feedback_session', token],
        queryFn: async () => {
            const response = await feedbackApi.getSession(token);
            return response.data;
        },
        enabled: !!token,
        retry: false,
    });
};

export const useSubmitFeedback = () => {
    return useMutation({
        mutationFn: (data: FeedbackSubmission) => feedbackApi.submitFeedback(data),
        onSuccess: () => {
            toast.success('Thank you! Your feedback has been recorded safely.');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit feedback');
        },
    });
};

export const useDeactivateRequest = (cohortId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (requestId: number) => feedbackApi.deactivateRequest(requestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feedback_requests', cohortId] });
            toast.success('Feedback link has been deactivated');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to deactivate link');
        },
    });
};
