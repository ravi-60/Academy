import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cohortApi, Cohort } from '@/integrations/backend/cohortApi';
import { toast } from 'sonner';
import { CreateCohortRequest } from '@/integrations/backend/cohortApi';

import { useAuthStore } from '@/stores/authStore';

export const useCohorts = () => {
  const user = useAuthStore((state) => state.user);
  console.log('DEBUG: useCohorts hook - Current User:', user);

  return useQuery({
    queryKey: ['cohorts', user?.email],
    queryFn: async () => {
      console.log('DEBUG: Fetching cohorts for email:', user?.email);
      const response = await cohortApi.getAllCohorts(user?.email);
      return response.data as Cohort[];
    },
    enabled: !!user?.email,
  });
};

export const useCohort = (id: number) => {
  return useQuery({
    queryKey: ['cohorts', id],
    queryFn: async () => {
      const response = await cohortApi.getCohortById(id);
      return response.data as Cohort;
    },
    enabled: !!id,
  });
};

export const useCreateCohort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cohortData: CreateCohortRequest) => {
      const response = await cohortApi.createCohort(cohortData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Cohort created successfully');
    },
    onError: (error) => {
      console.error('Failed to create cohort:', error);
      toast.error('Failed to create cohort');
    },
  });
};

export const useCreateCohorts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cohortsData: CreateCohortRequest[]) => {
      const response = await cohortApi.createCohorts(cohortsData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`${data.length} cohorts created successfully`);
    },
    onError: (error) => {
      console.error('Failed to create cohorts:', error);
      toast.error('Failed to create cohorts');
    },
  });
};

export const useUpdateCohort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Cohort> }) => {
      const response = await cohortApi.updateCohort(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Cohort updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update cohort:', error);
      toast.error('Failed to update cohort');
    },
  });
};

export const useDeleteCohort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await cohortApi.deleteCohort(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Cohort deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete cohort:', error);
      toast.error('Failed to delete cohort');
    },
  });
};

export const useAdditionalTrainers = (cohortId: number) => {
  return useQuery({
    queryKey: ['cohorts', cohortId, 'trainers', 'additional'],
    queryFn: async () => {
      const response = await cohortApi.getAdditionalTrainers(cohortId);
      return response.data;
    },
    enabled: !!cohortId,
  });
};

export const useAdditionalMentors = (cohortId: number) => {
  return useQuery({
    queryKey: ['cohorts', cohortId, 'mentors', 'additional'],
    queryFn: async () => {
      const response = await cohortApi.getAdditionalMentors(cohortId);
      return response.data;
    },
    enabled: !!cohortId,
  });
};