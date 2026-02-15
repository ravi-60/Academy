import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, MapPin, Users, Send, Network } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useToast } from '@/hooks/use-toast';
import { effortApi, EffortSubmission } from '@/effortApi';
import { cohortApi, Cohort } from '@/cohortApi';
import { generateCalendarWeeks, WeekOption } from '@/utils/weekGenerator';
import { cn } from '@/lib/utils';

const effortSchema = z.object({
  cohortId: z.number().min(1, 'Please select a cohort'),
  trainerMentorId: z.number().min(1, 'Please select a trainer/mentor'),
  role: z.enum(['TRAINER', 'MENTOR', 'BUDDY_MENTOR', 'BH_TRAINER']),
  mode: z.enum(['VIRTUAL', 'IN_PERSON']),
  reasonVirtual: z.string().optional(),
  areaOfWork: z.string().min(1, 'Area of work is required'),
  effortHours: z.number().min(0.5, 'Minimum 0.5 hours').max(24, 'Maximum 24 hours'),
  weekStartDate: z.string().min(1, 'Please select a week'),
});

type EffortFormData = z.infer<typeof effortSchema>;

export const EffortForm = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [weekOptions, setWeekOptions] = useState<WeekOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EffortFormData>({
    resolver: zodResolver(effortSchema),
  });

  const selectedCohortId = watch('cohortId');
  const selectedMode = watch('mode');

  useEffect(() => {
    // Load cohorts
    cohortApi.getAllCohorts()
      .then(response => setCohorts(response.data))
      .catch(error => {
        toast({
          title: 'Error',
          description: 'Failed to load cohorts',
          variant: 'destructive',
        });
      });
  }, []);

  useEffect(() => {
    // Update selected cohort and generate weeks when cohort changes
    if (selectedCohortId) {
      const cohort = cohorts.find(c => c.id === selectedCohortId);
      setSelectedCohort(cohort || null);

      if (cohort) {
        const allWeeks = generateCalendarWeeks(new Date(cohort.startDate), new Date(cohort.endDate));
        setWeekOptions(allWeeks);
      }
    }
  }, [selectedCohortId, cohorts]);

  // Helper to check if a week is locked
  const isWeekLocked = (weekStartDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const currentMonday = new Date(today);
    currentMonday.setDate(diff);

    const previousMonday = new Date(currentMonday);
    previousMonday.setDate(currentMonday.getDate() - 7);

    const wDate = new Date(weekStartDate);
    wDate.setHours(0, 0, 0, 0);

    return wDate.toDateString() !== currentMonday.toDateString() &&
      wDate.toDateString() !== previousMonday.toDateString();
  };

  const onSubmit = async (data: EffortFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const selectedWeek = weekOptions.find(w => w.value === data.weekStartDate);
      if (!selectedWeek) {
        throw new Error('Invalid week selected');
      }

      const effortData: EffortSubmission = {
        cohortId: data.cohortId,
        trainerMentorId: data.trainerMentorId,
        role: data.role,
        mode: data.mode,
        reasonVirtual: data.reasonVirtual,
        areaOfWork: data.areaOfWork,
        effortHours: data.effortHours,
        effortDate: selectedWeek.startDate.toISOString().split('T')[0],
      };

      await effortApi.submitEffort(effortData);

      toast({
        title: 'Success',
        description: 'Effort submitted successfully',
      });

      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit effort',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = user?.role === 'COACH' || user?.role === 'LOCATION_LEAD';

  useEffect(() => {
    if (user) {
      setValue('trainerMentorId', user.id);
    }
  }, [user, setValue]);

  if (!canSubmit) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            Only Coaches and Location Leads can submit efforts.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-10 max-w-4xl mx-auto"
    >
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 lg:p-12 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-secondary/20 blur-[100px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-md border border-white/10">
              <Calendar className="h-3 w-3" />
              Telemetry Log • Real-time
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-white">
              Effort <span className="text-gradient">Submission</span>
            </h1>
            <p className="max-w-xl text-lg text-slate-400 font-medium leading-relaxed">
              Record mission-critical instructional telemetry. Ensure accurate volumetric tracking for resource optimization insights.
            </p>
          </div>
        </div>
      </section>

      <GlassCard className="p-10 border-white/5 bg-slate-950/40 backdrop-blur-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Cohort Selection */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <Users className="h-3 w-3 text-primary" />
                Select Mission Node
              </label>
              <select
                {...register('cohortId', { valueAsNumber: true })}
                className="input-premium w-full bg-slate-900/50"
              >
                <option value="">Query nodes...</option>
                {cohorts.map(cohort => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.code} - {cohort.skill}
                  </option>
                ))}
              </select>
              {errors.cohortId && (
                <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{errors.cohortId.message}</p>
              )}
            </div>

            {/* Week Selection */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <Calendar className="h-3 w-3 text-primary" />
                Synchronize Week
              </label>
              <select
                {...register('weekStartDate')}
                className="input-premium w-full bg-slate-900/50 disabled:opacity-30"
                disabled={!selectedCohort}
              >
                <option value="">Awaiting Node Link...</option>
                {weekOptions.map(week => {
                  const locked = isWeekLocked(week.value);
                  return (
                    <option key={week.value} value={week.value} disabled={locked}>
                      {week.label} {locked ? ' 🔒' : ''}
                    </option>
                  );
                })}
              </select>
              {errors.weekStartDate && (
                <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{errors.weekStartDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <User className="h-3 w-3 text-secondary" />
                Operational Role
              </label>
              <select
                {...register('role')}
                className="input-premium w-full bg-slate-900/50"
              >
                <option value="">Define role...</option>
                <option value="TRAINER">Technical Trainer</option>
                <option value="MENTOR">Mentor Lead</option>
                <option value="BUDDY_MENTOR">Buddy Associate</option>
                <option value="BH_TRAINER">Behavioral Trainer</option>
              </select>
              {errors.role && (
                <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{errors.role.message}</p>
              )}
            </div>

            {/* Mode Selection */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <MapPin className="h-3 w-3 text-secondary" />
                Interaction Mode
              </label>
              <div className="flex gap-4 p-4 rounded-2xl bg-slate-900/50 border border-white/5">
                <label className="flex flex-1 items-center justify-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    value="VIRTUAL"
                    {...register('mode')}
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-center transition-all border",
                    selectedMode === 'VIRTUAL'
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  )}>
                    Virtual Node
                  </div>
                </label>
                <label className="flex flex-1 items-center justify-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    value="IN_PERSON"
                    {...register('mode')}
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-center transition-all border",
                    selectedMode === 'IN_PERSON'
                      ? "bg-secondary/20 border-secondary text-secondary shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  )}>
                    Node Physical
                  </div>
                </label>
              </div>
              {errors.mode && (
                <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{errors.mode.message}</p>
              )}
            </div>
          </div>

          {/* Area of Work & Hours */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Mission Objectives
              </label>
              <input
                type="text"
                {...register('areaOfWork')}
                className="input-premium w-full bg-slate-900/50"
                placeholder="Declare technical scope..."
              />
              {errors.areaOfWork && (
                <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{errors.areaOfWork.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <Clock className="h-3 w-3 text-primary" />
                Volumetric (H)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                {...register('effortHours', { valueAsNumber: true })}
                className="input-premium w-full bg-slate-900/50"
                placeholder="0.0"
              />
              {errors.effortHours && (
                <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{errors.effortHours.message}</p>
              )}
            </div>
          </div>

          {/* Reason for Virtual (conditional) */}
          <AnimatePresence>
            {selectedMode === 'VIRTUAL' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Node Isolation Rationale
                </label>
                <textarea
                  {...register('reasonVirtual')}
                  className="input-premium w-full bg-slate-900/50 min-h-[100px] py-4"
                  placeholder="Justification for remote telemetry link..."
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <GradientButton
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Effort'}
          </GradientButton>
        </form>
      </GlassCard>
    </motion.div>
  );
};