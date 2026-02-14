import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  Users,
  UserCheck,
  Calendar,
  BarChart3,
  MapPin,
  Mail,
  Phone,
  Plus,
  UserPlus,
  Upload,
  Download,
  Search,
  Edit2,
  Trash2,
  MessageSquare,
  Share2,
  ExternalLink,
  Copy,
  LayoutDashboard,
  Zap,
  Star,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  useCohorts,
  useCohort,
  useAdditionalTrainers,
  useAdditionalMentors
} from '@/hooks/useCohortsBackend';
import { useSubmitWeeklyEffort, useWeeklySummaries, useEffortsByCohortAndRange, useEffortsByCohort } from '@/hooks/useEffortsBackend';
import { useCohortFeedbackRequests, useCohortFeedbackAnalytics, useCreateFeedbackRequest, useDeactivateRequest } from '@/hooks/useFeedback';
import { Cohort } from '@/integrations/backend/cohortApi';
import { useCohortStore } from '@/stores/cohortStore';
import { useTrainers, useCreateTrainer, useAssignTrainer, useUpdateTrainer, useDeleteTrainer, useUnassignTrainer, Trainer } from '@/hooks/useTrainers';
import { useMentors, useCreateMentor, useAssignMentor, useUpdateMentor, useDeleteMentor, useUnassignMentor, Mentor } from '@/hooks/useMentors';
import { useCandidates, useCreateCandidate, useUpdateCandidate, useDeleteCandidate, useBulkCreateCandidates, Candidate } from '@/hooks/useCandidates';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { AddTrainerModal } from '@/components/modals/AddTrainerModal';
import { AddMentorModal } from '@/components/modals/AddMentorModal';
import { AssignStakeholderModal } from '@/components/modals/AssignStakeholderModal';
import { AddCandidateModal } from '@/components/modals/AddCandidateModal';
import { CSVUploadModal } from '@/components/modals/CSVUploadModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TabType = 'overview' | 'candidates' | 'stakeholders' | 'efforts' | 'reports' | 'feedback';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: GraduationCap },
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'stakeholders', label: 'Trainers & Mentors', icon: UserCheck },
  { id: 'efforts', label: 'Daily Efforts', icon: Calendar },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'feedback', label: 'Feedback Matrix', icon: MessageSquare },
];

export const CohortDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['overview', 'candidates', 'stakeholders', 'efforts', 'reports', 'feedback'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const { data: cohort, isLoading: loading, error } = useCohort(id ? parseInt(id) : 0);
  const { data: candidates = [] } = useCandidates(id ? id : '');

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Loading cohort details...</p>
      </div>
    );
  }

  if (!cohort) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Cohort not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button & Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 lg:p-12 shadow-2xl">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-secondary/20 blur-[100px]" />

          <div className="relative z-10">
            <button
              onClick={() => navigate('/cohorts')}
              className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-white group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Cohorts
            </button>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <GraduationCap className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-white">
                      {cohort.code}
                    </h1>
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-[10px] font-black text-primary border border-primary/20 uppercase tracking-[0.2em]">
                      Active Stream
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-400">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary/60" />
                      {cohort.trainingLocation}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-600" />
                    <span>{cohort.skill}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-600" />
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-secondary/60" />
                      {candidates.filter((c: any) => c.status === 'ACTIVE' || c.status === 'COMPLETED').length} Nodes Connected
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mission Progression</p>
                  <p className="text-3xl font-black text-white">
                    {(() => {
                      const now = new Date();
                      const start = new Date(cohort.startDate);
                      const end = new Date(cohort.endDate);
                      const totalDuration = end.getTime() - start.getTime();
                      const elapsed = now.getTime() - start.getTime();
                      const progress = totalDuration > 0 ? Math.max(0, Math.min(100, (elapsed / totalDuration) * 100)) : 0;
                      return Math.round(progress);
                    })()}%
                  </p>
                </div>
                <div className="relative h-16 w-16">
                  <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className="stroke-white/10"
                      strokeWidth="3"
                    />
                    <motion.circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className="stroke-primary"
                      strokeWidth="3"
                      strokeDasharray="100 100"
                      initial={{ strokeDashoffset: 100 }}
                      animate={{
                        strokeDashoffset: 100 - (() => {
                          const now = new Date();
                          const start = new Date(cohort.startDate);
                          const end = new Date(cohort.endDate);
                          const totalDuration = end.getTime() - start.getTime();
                          const elapsed = now.getTime() - start.getTime();
                          const progress = totalDuration > 0 ? Math.max(0, Math.min(100, (elapsed / totalDuration) * 100)) : 0;
                          return Math.round(progress);
                        })()
                      }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary shadow-glow-cyan animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && <OverviewTab cohortId={cohort.id.toString()} cohort={cohort} />}
        {activeTab === 'stakeholders' && <StakeholdersTab cohortId={cohort.id.toString()} cohort={cohort} />}
        {activeTab === 'candidates' && <CandidatesTab cohortId={cohort.id.toString()} cohort={cohort} />}
        {activeTab === 'efforts' && <EffortsTab cohortId={cohort.id.toString()} />}
        {activeTab === 'reports' && <ReportsTab cohortId={cohort.id.toString()} />}
        {activeTab === 'feedback' && <FeedbackTab cohortId={cohort.id.toString()} cohort={cohort} />}
      </motion.div>
    </div>
  );
};

const OverviewTab = ({ cohortId, cohort }: { cohortId: string; cohort: Cohort }) => {
  const { data: trainers = [] } = useTrainers(cohortId);
  const { data: mentors = [] } = useMentors(cohortId);
  const { data: candidates = [] } = useCandidates(cohortId);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <GlassCard className="p-6 lg:col-span-2">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Cohort Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Business Unit</p>
            <p className="font-medium text-foreground">{cohort.bu}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Skill/Technology</p>
            <p className="font-medium text-foreground">{cohort.skill}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Start Date</p>
            <p className="font-medium text-foreground">
              {new Date(cohort.startDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">End Date</p>
            <p className="font-medium text-foreground">
              {new Date(cohort.endDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <span className="badge-active mt-1 inline-block capitalize">
              {(() => {
                const now = new Date();
                const start = new Date(cohort.startDate);
                const end = new Date(cohort.endDate);
                if (now < start) return 'upcoming';
                if (now > end) return 'completed';
                return 'active';
              })()}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Coach</p>
            <p className="font-medium text-foreground">{cohort.coach?.name || 'Not assigned'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="font-medium text-foreground">{cohort.trainingLocation}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Quick Stats</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Candidates</span>
            <span className="font-semibold text-foreground">{candidates.filter((c: any) => c.status === 'ACTIVE' || c.status === 'COMPLETED').length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Trainers</span>
            <span className="font-semibold text-foreground">{trainers.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Mentors</span>
            <span className="font-semibold text-foreground">{mentors.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-semibold text-primary">
              {(() => {
                const now = new Date();
                const start = new Date(cohort.startDate);
                const end = new Date(cohort.endDate);
                const totalDuration = end.getTime() - start.getTime();
                const elapsed = now.getTime() - start.getTime();
                const progress = totalDuration > 0 ? Math.max(0, Math.min(100, (elapsed / totalDuration) * 100)) : 0;
                return Math.round(progress);
              })()}%
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

interface StakeholdersTabProps {
  cohortId: string;
  cohort: Cohort;
}

const StakeholdersTab = ({ cohortId, cohort }: StakeholdersTabProps) => {
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [showAssignTrainer, setShowAssignTrainer] = useState(false);
  const [showAddMentor, setShowAddMentor] = useState(false);
  const [showAssignMentor, setShowAssignMentor] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [trainerModalMode, setTrainerModalMode] = useState<'add' | 'edit'>('add');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [mentorModalMode, setMentorModalMode] = useState<'add' | 'edit'>('add');

  const { data: trainers = [], isLoading: loadingTrainers } = useTrainers(cohortId);
  const { data: mentors = [], isLoading: loadingMentors } = useMentors(cohortId);
  const createTrainer = useCreateTrainer();
  const assignTrainer = useAssignTrainer();
  const createMentor = useCreateMentor();
  const assignMentor = useAssignMentor();
  const updateTrainer = useUpdateTrainer();
  const updateMentor = useUpdateMentor();
  const unassignTrainer = useUnassignTrainer();
  const unassignMentor = useUnassignMentor();
  const deleteTrainer = useDeleteTrainer();
  const deleteMentor = useDeleteMentor();

  const handleEditTrainer = (data: any) => {
    if (!selectedTrainer) return;
    updateTrainer.mutate({ id: selectedTrainer.id, ...data }, {
      onSuccess: () => {
        setShowAddTrainer(false);
        setSelectedTrainer(null);
        setTrainerModalMode('add');
        toast.success('Trainer updated successfully');
      },
    });
  };

  const handleEditMentor = (data: any) => {
    if (!selectedMentor) return;
    updateMentor.mutate({ id: selectedMentor.id, ...data }, {
      onSuccess: () => {
        setShowAddMentor(false);
        setSelectedMentor(null);
        setMentorModalMode('add');
        toast.success('Mentor updated successfully');
      },
    });
  };


  // Use DB data
  const displayTrainers = trainers;

  const displayMentors = mentors;

  const handleAddTrainer = (data: any) => {
    createTrainer.mutate({
      trainer: {
        ...data,
        emp_id: data.emp_id || `EMP${Date.now()}`,
      },
      cohortId: cohortId,
    }, {
      onSuccess: () => setShowAddTrainer(false),
    });
  };

  const handleAssignTrainer = (trainerId: number) => {
    assignTrainer.mutate({ trainerId, cohortId }, {
      onSuccess: () => setShowAssignTrainer(false),
    });
  };

  const handleAddMentor = (data: any) => {
    createMentor.mutate({
      mentor: {
        ...data,
        emp_id: data.emp_id || `EMP${Date.now()}`,
      },
      cohortId: cohortId,
    }, {
      onSuccess: () => setShowAddMentor(false),
    });
  };

  const handleAssignMentor = (mentorId: number) => {
    assignMentor.mutate({ mentorId, cohortId }, {
      onSuccess: () => setShowAssignMentor(false),
    });
  };

  return (
    <div className="space-y-8">
      {/* Trainers */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Trainers</h3>
          <div className="flex gap-2">
            <GradientButton
              variant="ghost"
              size="sm"
              icon={<UserPlus className="h-4 w-4" />}
              onClick={() => setShowAssignTrainer(true)}
            >
              Assign Existing
            </GradientButton>
            <GradientButton
              variant="outline"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowAddTrainer(true)}
            >
              Add New
            </GradientButton>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayTrainers.map((trainer) => (
            <GlassCard key={trainer.id} variant="hover" glow="cyan" className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/30 to-neon-blue/30 text-lg font-semibold text-primary">
                    {trainer.avatar_url ? (
                      <img src={trainer.avatar_url} alt={trainer.name} className="h-full w-full object-cover" />
                    ) : (
                      trainer.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{trainer.name}</h4>
                    <p className="text-sm capitalize text-muted-foreground">{trainer.type} Trainer</p>
                  </div>
                </div>
                <ActionMenu
                  onEdit={() => {
                    setSelectedTrainer(trainer);
                    setTrainerModalMode('edit');
                    setShowAddTrainer(true);
                  }}
                  onDelete={() => unassignTrainer.mutate({ trainerId: trainer.id, cohortId })}
                />
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {trainer.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserCheck className="h-4 w-4" />
                  {trainer.emp_id}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  {trainer.skill}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <span className={`badge-status ${trainer.is_internal ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                  {trainer.is_internal ? 'Internal' : 'External'}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Mentors */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Mentors</h3>
          <div className="flex gap-2">
            <GradientButton
              variant="ghost"
              size="sm"
              icon={<UserPlus className="h-4 w-4" />}
              onClick={() => setShowAssignMentor(true)}
            >
              Assign Existing
            </GradientButton>
            <GradientButton
              variant="outline"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowAddMentor(true)}
            >
              Add New
            </GradientButton>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayMentors.map((mentor) => (
            <GlassCard key={mentor.id} variant="hover" glow="violet" className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-secondary/30 to-neon-purple/30 text-lg font-semibold text-secondary">
                    {mentor.avatar_url ? (
                      <img src={mentor.avatar_url} alt={mentor.name} className="h-full w-full object-cover" />
                    ) : (
                      mentor.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{mentor.name}</h4>
                    <p className="text-sm capitalize text-muted-foreground">{mentor.type} Mentor</p>
                  </div>
                </div>
                <ActionMenu
                  onEdit={() => {
                    setSelectedMentor(mentor);
                    setMentorModalMode('edit');
                    setShowAddMentor(true);
                  }}
                  onDelete={() => unassignMentor.mutate({ mentorId: mentor.id, cohortId })}
                />
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {mentor.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserCheck className="h-4 w-4" />
                  {mentor.emp_id}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  {mentor.skill}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AddTrainerModal
        isOpen={showAddTrainer}
        onClose={() => {
          setShowAddTrainer(false);
          setSelectedTrainer(null);
          setTrainerModalMode('add');
        }}
        onSubmit={trainerModalMode === 'add' ? handleAddTrainer : handleEditTrainer}
        cohortId={cohortId}
        isLoading={createTrainer.isPending || updateTrainer.isPending}
        mode={trainerModalMode}
        initialData={selectedTrainer}
      />
      <AssignStakeholderModal
        isOpen={showAssignTrainer}
        onClose={() => setShowAssignTrainer(false)}
        onAssign={handleAssignTrainer}
        type="trainer"
        isLoading={assignTrainer.isPending}
        excludeIds={displayTrainers.map(t => t.id)}
      />
      <AddMentorModal
        isOpen={showAddMentor}
        onClose={() => {
          setShowAddMentor(false);
          setSelectedMentor(null);
          setMentorModalMode('add');
        }}
        onSubmit={mentorModalMode === 'add' ? handleAddMentor : handleEditMentor}
        cohortId={cohortId}
        isLoading={createMentor.isPending || updateMentor.isPending}
        mode={mentorModalMode}
        initialData={selectedMentor}
      />
      <AssignStakeholderModal
        isOpen={showAssignMentor}
        onClose={() => setShowAssignMentor(false)}
        onAssign={handleAssignMentor}
        type="mentor"
        isLoading={assignMentor.isPending}
        excludeIds={displayMentors.map(m => m.id)}
      />
    </div>
  );
};

interface CandidatesTabProps {
  cohortId: string;
  cohort: Cohort;
}

const CandidatesTab = ({ cohortId, cohort }: CandidatesTabProps) => {
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showEditCandidate, setShowEditCandidate] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: candidates = [], isLoading } = useCandidates(cohortId);
  const createCandidate = useCreateCandidate();
  const updateCandidate = useUpdateCandidate();
  const deleteCandidate = useDeleteCandidate();
  const bulkCreate = useBulkCreateCandidates();

  const filteredCandidates = candidates.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.candidateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusConfig: Record<string, { label: string; class: string }> = {
    ACTIVE: { label: 'Active', class: 'badge-active' },
    INACTIVE: { label: 'Inactive', class: 'badge-inactive' },
    COMPLETED: { label: 'Completed', class: 'bg-info/20 text-info' },
  };

  const handleAddCandidate = (data: any) => {
    createCandidate.mutate({
      candidateId: data.associate_id,
      name: data.name,
      email: data.cognizant_email_id || null,
      cohort: cohort,
      status: data.status.toUpperCase() as any,
      joinDate: data.join_date || cohort.startDate,
      endDate: data.end_date || cohort.endDate,
    }, {
      onSuccess: () => setShowAddCandidate(false),
    });
  };

  const handleEditCandidate = (data: any) => {
    if (!selectedCandidate) return;

    updateCandidate.mutate({
      id: selectedCandidate.id,
      candidateId: data.associate_id,
      name: data.name,
      email: data.cognizant_email_id || null,
      cohort: cohort,
      status: data.status.toUpperCase() as any,
      joinDate: data.join_date || selectedCandidate.joinDate,
      endDate: data.end_date || selectedCandidate.endDate,
    }, {
      onSuccess: () => {
        setShowEditCandidate(false);
        setSelectedCandidate(null);
      },
    });
  };

  const handleCSVUpload = (data: Record<string, string>[]) => {
    // Expected headers: Associate Id, Name, Cohort code, Cognizant Email ID
    // Filter by current cohort code
    const validData = data.filter(row => {
      // Handle various possible header names (case insensitive, spaces -> underscores)
      const rowCohortCode = row.cohort_code || row.cohortcode;
      if (!rowCohortCode) return false;
      return rowCohortCode.trim().toLowerCase() === cohort.code.toLowerCase();
    });

    if (validData.length === 0) {
      toast.error(`No candidates found for cohort ${cohort.code} in the uploaded file.`);
      return;
    }

    const timestamp = Date.now();
    const candidates = validData.map((row, index) => ({
      candidateId: row.associate_id || row.associateid || `GC-${timestamp}-${index}`,
      name: row.name,
      email: row.cognizant_email_id || row.cognizantemailid || null, // Map from new header
      cohort: cohort,
      status: 'ACTIVE' as const,
      joinDate: cohort.startDate, // Auto-fill from Cohort
      endDate: cohort.endDate // Auto-fill from Cohort
    }));

    bulkCreate.mutate(candidates, {
      onSuccess: () => {
        setShowCSVUpload(false);
        toast.success(`Imported ${candidates.length} candidates for ${cohort.code}`);
      },
    });
  };

  const handleExport = () => {
    const csvContent = [
      ['Candidate ID', 'Name', 'Email', 'Status', 'Join Date', 'End Date'],
      ...candidates.map((c) => [
        c.candidateId,
        c.name,
        c.email || '',
        c.status,
        c.joinDate,
        c.endDate || ''
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates-${cohort.code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Candidates exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates..."
            className="input-premium w-full pl-12"
          />
        </div>
        <div className="flex gap-3">
          <GradientButton
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={handleExport}
          >
            Export
          </GradientButton>
          <CSVUploadModal
            isOpen={showCSVUpload}
            onClose={() => setShowCSVUpload(false)}
            onUpload={handleCSVUpload}
            title="Import Candidates"
            requiredColumns={['Associate Id', 'Name', 'Cohort code', 'Cognizant Email ID']}
          />
          <GradientButton
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddCandidate(true)}
          >
            Add Candidate
          </GradientButton>
        </div>
      </div>

      {isLoading ? (
        <GlassCard className="p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading candidates...</p>
        </GlassCard>
      ) : filteredCandidates.length > 0 ? (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>End Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="group">
                    <td className="font-mono text-sm">{candidate.candidateId}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-neon-blue/20 text-sm font-semibold text-primary">
                          {candidate.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground">{candidate.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge-status ${statusConfig[candidate.status]?.class || 'bg-muted'}`}>
                        {statusConfig[candidate.status]?.label || candidate.status}
                      </span>
                    </td>
                    <td className="text-muted-foreground">
                      {new Date(candidate.joinDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="text-muted-foreground">
                      {candidate.endDate ? new Date(candidate.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }) : '-'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setShowEditCandidate(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteCandidate.mutate(candidate.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="p-6 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No candidates yet</h3>
            <p className="mt-2 text-muted-foreground">
              Upload a CSV file or add candidates manually
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <GradientButton
                variant="outline"
                size="sm"
                onClick={() => setShowCSVUpload(true)}
              >
                Upload CSV
              </GradientButton>
              <GradientButton
                variant="primary"
                size="sm"
                onClick={() => setShowAddCandidate(true)}
              >
                Add Manually
              </GradientButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Modals */}
      <AddCandidateModal
        isOpen={showAddCandidate}
        onClose={() => setShowAddCandidate(false)}
        onSubmit={handleAddCandidate}
        cohortId={cohortId}
        initialData={{
          cohort_code: cohort.code,
          join_date: cohort.startDate ? new Date(cohort.startDate).toISOString().split('T')[0] : '',
          end_date: cohort.endDate ? new Date(cohort.endDate).toISOString().split('T')[0] : '',
          status: 'active'
        }}
        isLoading={createCandidate.isPending}
      />

      <AddCandidateModal
        isOpen={showEditCandidate}
        onClose={() => {
          setShowEditCandidate(false);
          setSelectedCandidate(null);
        }}
        onSubmit={handleEditCandidate}
        cohortId={cohortId}
        isLoading={updateCandidate.isPending}
        initialData={selectedCandidate ? {
          associate_id: selectedCandidate.candidateId,
          name: selectedCandidate.name,
          cognizant_email_id: selectedCandidate.email || '',
          cohort_code: cohort.code,
          join_date: selectedCandidate.joinDate ? new Date(selectedCandidate.joinDate).toISOString().split('T')[0] : '',
          end_date: selectedCandidate.endDate ? new Date(selectedCandidate.endDate).toISOString().split('T')[0] : '',
          status: selectedCandidate.status.toLowerCase() as any
        } : { cohort_code: cohort.code, status: 'active' }}
        mode="edit"
      />
    </div>
  );
};

interface EffortsTabProps {
  cohortId: string;
}

const EffortsTab = ({ cohortId }: EffortsTabProps) => {
  const navigate = useNavigate();
  const idNum = parseInt(cohortId);
  const { data: efforts = [], isLoading } = useEffortsByCohort(idNum);
  const { data: mappingTrainers = [] } = useAdditionalTrainers(idNum);
  const { data: mappingMentors = [] } = useAdditionalMentors(idNum);
  const { data: cohort } = useCohort(idNum);

  const getStakeholderName = (effort: any) => {
    if (effort.trainerMentor?.name) return effort.trainerMentor.name;

    // Fallback to mappings based on role
    if (effort.role === 'TRAINER') {
      const tech = mappingTrainers.filter((m: any) => m.role === 'TRAINER');
      if (tech.length > 0) return tech.map((m: any) => m.trainer.name).join(', ');
      return cohort?.primaryTrainer?.name || 'Unassigned';
    }
    if (effort.role === 'BH_TRAINER') {
      const bh = mappingTrainers.filter((m: any) => m.role === 'BH_TRAINER');
      if (bh.length > 0) return bh.map((m: any) => m.trainer.name).join(', ');
      return cohort?.behavioralTrainer?.name || 'Unassigned';
    }
    if (effort.role === 'MENTOR') {
      const mentors = mappingMentors.filter((m: any) => m.role === 'MENTOR');
      if (mentors.length > 0) return mentors.map((m: any) => m.mentor.name).join(', ');
      return cohort?.primaryMentor?.name || 'Unassigned';
    }
    if (effort.role === 'BUDDY_MENTOR') {
      const buddies = mappingMentors.filter((m: any) => m.role === 'BUDDY_MENTOR');
      if (buddies.length > 0) return buddies.map((m: any) => m.mentor.name).join(', ');
      return cohort?.buddyMentor?.name || 'Unassigned';
    }

    return 'Unassigned';
  };

  const groupedByDate = efforts.reduce((acc, effort) => {
    const date = effort.effortDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(effort);
    return acc;
  }, {} as Record<string, typeof efforts>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Daily Efforts Log</h3>
        <GradientButton
          variant="primary"
          onClick={() => navigate('/efforts')}
        >
          Log Daily Effort
        </GradientButton>
      </div>

      {isLoading ? (
        <GlassCard className="p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </GlassCard>
      ) : Object.keys(groupedByDate).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByDate)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dayEfforts]) => (
              <GlassCard key={date} className="p-6">
                <h4 className="mb-4 font-semibold text-foreground">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h4>
                <div className="space-y-3">
                  {dayEfforts.map((effort) => (
                    <div
                      key={effort.id}
                      className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{getStakeholderName(effort)}</p>
                          <p className="text-sm text-muted-foreground">
                            {effort.role} • {effort.areaOfWork}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{effort.effortHours} hrs</p>
                        <p className="text-sm text-muted-foreground capitalize">{effort.mode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
        </div>
      ) : (
        <GlassCard className="p-6">
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No efforts logged yet</h3>
            <p className="mt-2 text-muted-foreground">
              Start logging daily training efforts for this cohort
            </p>
            <GradientButton
              variant="primary"
              className="mt-6"
              onClick={() => navigate('/efforts')}
            >
              Log Daily Effort
            </GradientButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

interface ReportsTabProps {
  cohortId: string;
}

const ReportsTab = ({ cohortId }: ReportsTabProps) => {
  const { data: efforts = [] } = useEffortsByCohort(parseInt(cohortId));

  const totalHours = efforts.reduce((sum, e) => sum + Number(e.effortHours), 0);
  const uniqueDays = new Set(efforts.map((e) => e.effortDate)).size;

  const handleGenerateReport = () => {
    // Generate a simple report
    const reportContent = [
      ['Daily Effort Report'],
      [''],
      ['Summary'],
      [`Total Effort Hours: ${totalHours}`],
      [`Days Logged: ${uniqueDays}`],
      [''],
      ['Detailed Entries'],
      ['Date', 'Stakeholder', 'Type', 'Area of Work', 'Hours', 'Mode'],
      ...efforts.map((e) => [
        e.effortDate,
        e.trainerMentor?.name || 'Unassigned',
        e.role,
        e.areaOfWork,
        e.effortHours.toString(),
        e.mode,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([reportContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `effort-report-${cohortId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report generated successfully');
  };

  return (
    <GlassCard className="p-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-border/30 bg-muted/20 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalHours}</p>
          <p className="text-sm text-muted-foreground">Total Effort Hours</p>
        </div>
        <div className="rounded-lg border border-border/30 bg-muted/20 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{uniqueDays}</p>
          <p className="text-sm text-muted-foreground">Days Logged</p>
        </div>
        <div className="rounded-lg border border-border/30 bg-muted/20 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{efforts.length}</p>
          <p className="text-sm text-muted-foreground">Total Entries</p>
        </div>
      </div>
      <div className="mt-6 text-center">
        <GradientButton variant="primary" onClick={handleGenerateReport}>
          Generate Report
        </GradientButton>
      </div>
    </GlassCard>
  );
};

const FeedbackTab = ({ cohortId, cohort }: { cohortId: string; cohort: Cohort }) => {
  const { data: trainers = [] } = useTrainers(cohortId);
  const { data: mentors = [] } = useMentors(cohortId);
  const [weekNumber, setWeekNumber] = useState(1);
  const [expiryDays, setExpiryDays] = useState(7);
  const createRequest = useCreateFeedbackRequest();
  const { data: requests = [] } = useCohortFeedbackRequests(parseInt(cohortId));
  const { data: analytics } = useCohortFeedbackAnalytics(parseInt(cohortId));
  const deactivateRequest = useDeactivateRequest(parseInt(cohortId));

  const hasActiveRequestForWeek = requests.some(req => req.weekNumber === weekNumber && req.active);

  const handleCreateRequest = () => {
    createRequest.mutate({
      cohortId: parseInt(cohortId),
      weekNumber,
      expiryDays
    });
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/feedback/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Feedback link copied to clipboard');
  };

  const openLink = (token: string) => {
    window.open(`/feedback/${token}`, '_blank');
  };

  const handleStakeholderExport = (type: 'tech' | 'mentor' | 'coach' | 'buddy' | 'behavioral') => {
    if (!analytics || analytics.responses.length === 0) {
      toast.error('No data available to export');
      return;
    }

    let headers: string[] = [];
    let rows: any[] = [];
    const filename = `${cohort.code}_${type}_feedback_${new Date().toISOString().split('T')[0]}.csv`;

    const commonHeaders = [
      'Feedback Provider (Associate Name)', 'Feedback Receiver (Name)', 'Cohort Name',
      'Location', 'SL', 'BU', 'SBU', 'Feedback Date'
    ];

    const getCommonData = (resp: any, receiverName: string) => [
      'Feedback Provider', // Header placeholder
      resp.candidateName || 'Anonymous',
      'Feedback Receiver', // Header placeholder
      receiverName,
      cohort.code,
      cohort.trainingLocation,
      cohort.bu, // SL (using BU as placeholder)
      cohort.bu, // BU
      cohort.bu, // SBU (using BU as placeholder)
      new Date(resp.createdAt).toLocaleDateString()
    ];

    switch (type) {
      case 'tech':
        headers = [
          'Feedback Provider', 'Associate Name', 'Feedback Receiver', 'Receiver Name', 'Cohort Name',
          'Location', 'SL', 'BU', 'SBU', 'Feedback Date',
          'Was the technical session held this week?',
          'On a scale of 1 to 5, how likely are you to agree with the statement "The course content was delivered in an effective way for me to learn"',
          'On a scale of 1 to 5, how would you rate the trainer\'s technical knowledge of the topic, ability to address your doubts, and provide additional help on complex topics?',
          'On a scale of 1 to 5, how effective was the trainer in connecting with you during all the scheduled trainer connect sessions?',
          'On a scale of 1 to 5, how likely are you to agree with the statement "The trainer covered all the concepts within the scheduled time without any delays"',
          'On a scale of 1 to 5, how likely are you to agree with the statement "The trainer provided a recap of the Udemy learning sessions"?',
          'On a scale of 1 to 5, how would you rate the trainer\'s provision of additional scenarios for skill application?',
          'Please give your feedback if you have scored below 3 for any of the above questions',
          'Aggregated Score'
        ];
        rows = analytics.responses.map(r => {
          const avg = ((r.courseContentRating || 0) + (r.technicalKnowledgeRating || 0) + (r.trainerEngagementRating || 0) + (r.conceptsScheduleRating || 0) + (r.udemyRecapRating || 0) + (r.additionalScenarioRating || 0)) / 6;
          return [
            'Feedback Provider', // Static
            r.candidateName || 'Anonymous',
            'Feedback Receiver', // Static
            cohort.primaryTrainer?.name || 'Technical Trainer',
            cohort.code,
            cohort.trainingLocation,
            cohort.bu, // SL
            cohort.bu, // BU
            cohort.bu, // SBU
            new Date(r.createdAt).toLocaleDateString(),
            r.isTechnicalSessionHeld ? 'Yes' : 'No',
            r.courseContentRating || '',
            r.technicalKnowledgeRating || '',
            r.trainerEngagementRating || '',
            r.conceptsScheduleRating || '',
            r.udemyRecapRating || '',
            r.additionalScenarioRating || '',
            r.technicalLowScoreExplanation || '',
            avg.toFixed(2)
          ];
        });
        break;
      case 'mentor':
        headers = [...commonHeaders, 'Was the Mentor session held this week?', 'Mentor guidance & practical input quality', 'Low score explanation feedback', 'Aggregated Score'];
        rows = analytics.responses.map(r => [
          ...getCommonData(r, cohort.primaryMentor?.name || 'Mentor'),
          r.isMentorSessionHeld ? 'Yes' : 'No',
          r.mentorGuidanceRating || '',
          r.mentorLowScoreExplanation || '',
          r.mentorGuidanceRating || ''
        ]);
        break;
      case 'coach':
        headers = [...commonHeaders, 'Coach effectiveness in guiding learning schedules & support', 'Low score explanation feedback', 'Aggregated Score'];
        rows = analytics.responses.map(r => [
          ...getCommonData(r, cohort.coach?.name || 'Coach'),
          r.coachEffectivenessRating || '',
          r.coachLowScoreExplanation || '',
          r.coachEffectivenessRating || ''
        ]);
        break;
      case 'buddy':
        headers = [...commonHeaders, 'Did Buddy Mentor connect this week?', 'Were doubts clarified?', 'Buddy Mentor guidance effectiveness', 'Concerns or suggestions', 'Aggregated Score'];
        rows = analytics.responses.map(r => [
          ...getCommonData(r, cohort.buddyMentor?.name || 'Buddy Mentor'),
          r.didBuddyMentorConnect ? 'Yes' : 'No',
          r.wereDoubtsClarified ? 'Yes' : 'No',
          r.buddyMentorGuidanceRating || '',
          r.buddyMentorSuggestions || '',
          r.buddyMentorGuidanceRating || ''
        ]);
        break;
      case 'behavioral':
        headers = [...commonHeaders, 'Was behavioral session held this week?', 'Behavioral trainer delivery effectiveness', 'Low score explanation feedback', 'Aggregated Score'];
        rows = analytics.responses.map(r => [
          ...getCommonData(r, cohort.behavioralTrainer?.name || 'Behavioral Trainer'),
          r.isBehavioralSessionHeld ? 'Yes' : 'No',
          r.behavioralDeliveryRating || '',
          r.behavioralLowScoreExplanation || '',
          r.behavioralDeliveryRating || ''
        ]);
        break;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Management Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-8 lg:col-span-1 border-primary/20 bg-primary/5">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Initiate Session</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Feedback Node Deployment</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Week Sequence</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(parseInt(e.target.value))}
                  className="input-premium w-full bg-white/5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Expiry (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  className="input-premium w-full bg-white/5"
                />
              </div>
              {!hasActiveRequestForWeek ? (
                <GradientButton
                  variant="primary"
                  className="w-full h-12 mt-4"
                  onClick={handleCreateRequest}
                  isLoading={createRequest.isPending}
                  icon={<Share2 className="h-4 w-4" />}
                >
                  Generate Link
                </GradientButton>
              ) : (
                <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Active Node Detected</p>
                  <p className="text-[8px] text-slate-400 mt-1">Deactivate the existing Week {weekNumber} link to regenerate.</p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 lg:col-span-2 border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/20 text-muted-foreground shadow-inner">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Active Matrices</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Deployed Feedback Links</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
            {requests.filter(r => r.active).length > 0 ? (
              requests.filter(r => r.active).sort((a, b) => b.weekNumber - a.weekNumber).map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                      W{req.weekNumber}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Week {req.weekNumber} Feedback</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                        Token: {req.token.substring(0, 8)}... • {req.active ? 'Active' : 'Expired'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(req.token)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary transition-all"
                      title="Copy Link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openLink(req.token)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary transition-all"
                      title="Open Link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    {req.active && (
                      <button
                        onClick={() => deactivateRequest.mutate(req.id)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                        title="Deactivate Link"
                        disabled={deactivateRequest.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground">No feedback sessions initiated yet.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Export Section */}
      <GlassCard className="p-8 border-white/5 bg-slate-900/20">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground">Export Analytical Matrices</h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Generate client-requested CSV reports</p>
          </div>
          <Download className="h-6 w-6 text-primary animate-bounce" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { id: 'tech', label: 'Tech Trainer', icon: Zap, color: 'hover:bg-primary/20 hover:border-primary/50', check: !!cohort.primaryTrainer || trainers.some((t: any) => t.type?.toLowerCase() === 'technical') },
            { id: 'mentor', label: 'Mentor', icon: Users, color: 'hover:bg-secondary/20 hover:border-secondary/50', check: !!cohort.primaryMentor || mentors.some((m: any) => m.type?.toLowerCase() === 'mentor') },
            { id: 'coach', label: 'Academy Coach', icon: ShieldCheck, color: 'hover:bg-neon-blue/20 hover:border-neon-blue/50', check: !!cohort.coach },
            { id: 'buddy', label: 'Buddy Mentor', icon: MessageSquare, color: 'hover:bg-amber-500/20 hover:border-amber-500/50', check: !!cohort.buddyMentor || mentors.some((m: any) => m.type?.toLowerCase() === 'buddy' || m.type?.toLowerCase() === 'buddy_mentor') },
            { id: 'behavioral', label: 'Soft Skills', icon: Sparkles, color: 'hover:bg-success/20 hover:border-success/50', check: !!cohort.behavioralTrainer || trainers.some((t: any) => t.type?.toLowerCase() === 'behavioral' || t.type?.toLowerCase() === 'bh_trainer') },
          ].filter(t => t.check).map((type) => (
            <button
              key={type.id}
              onClick={() => handleStakeholderExport(type.id as any)}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-[2rem] bg-white/5 border border-white/10 transition-all group",
                type.color
              )}
            >
              <type.icon className="h-8 w-8 mb-3 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">{type.label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Analytics Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-primary shadow-glow-cyan" />
              Intelligence Dashboard
            </h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] ml-4.5">Synchronized Feedback Analytics</p>
          </div>
          {analytics && (
            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase text-primary tracking-widest backdrop-blur-md">
              Total Responses: {analytics.totalResponses}
            </div>
          )}
        </div>

        {!analytics || analytics.totalResponses === 0 ? (
          <GlassCard className="p-20 text-center border-dashed border-white/10">
            <LayoutDashboard className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-400">Telemetry Data Insufficient</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
              Insufficient response volume to generate meaningful analytical matrices.
              Initiate a feedback session to start data collection.
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Rating Matrix */}
            <GlassCard className="p-8 border-white/10">
              <h3 className="text-lg font-bold text-foreground mb-8 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Rating Vector Analysis
              </h3>
              <div className="space-y-8">
                {[
                  { label: 'Technical Trainer', value: analytics.averages.trainer, color: 'from-primary/40 to-primary' },
                  { label: 'Mentor Support', value: analytics.averages.mentor, color: 'from-secondary/40 to-secondary' },
                  { label: 'Coach Interaction', value: analytics.averages.coach, color: 'from-neon-blue/40 to-neon-blue' },
                  { label: 'Overall Satisfaction', value: analytics.averages.overall, color: 'from-success/40 to-success' },
                ].map((stat, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-slate-400">{stat.label}</span>
                      <span className="text-white">{stat.value.toFixed(1)} / 5.0</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stat.value / 5) * 100}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={cn("h-full bg-gradient-to-r rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]", stat.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Insights Terminal */}
            <GlassCard className="p-8 border-white/10">
              <h3 className="text-lg font-bold text-foreground mb-8 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-secondary" />
                Raw Insights Terminal
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                {analytics.responses.slice().reverse().map((resp) => (
                  <div key={resp.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3 hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-secondary/10 flex items-center justify-center text-[10px] font-bold text-secondary">
                            W{resp.weekNumber}
                          </div>
                          <span className="text-[10px] font-black uppercase text-slate-500">{new Date(resp.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            {resp.candidateName?.charAt(0) || '?'}
                          </div>
                          <span className="text-xs font-bold text-white leading-none">{resp.candidateName || 'Anonymous'}</span>
                          <span className="text-[9px] text-slate-500 font-mono leading-none">({resp.employeeId || 'ID: NA'})</span>
                        </div>
                      </div>
                      <div className="flex gap-1 self-start pt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("h-2.5 w-2.5", s <= resp.overallSatisfaction ? "text-primary fill-primary" : "text-slate-700")} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-300 italic leading-relaxed">
                        "{resp.technicalLowScoreExplanation || 'No specific technical feedback provided.'}"
                      </p>
                      {resp.buddyMentorSuggestions && (
                        <div className="pt-2 border-t border-white/5">
                          <p className="text-[10px] font-bold uppercase text-primary mb-1">Buddy Mentor Suggestions:</p>
                          <p className="text-xs text-slate-400">{resp.buddyMentorSuggestions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};