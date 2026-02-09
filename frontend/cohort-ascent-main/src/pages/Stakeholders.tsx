import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserCheck,
  Search,
  Plus,
  UserPlus,
  Mail,
  Phone,
  GraduationCap,
  ChevronDown,
  Activity,
  Shield,
  Target,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { AddTrainerModal } from '@/components/modals/AddTrainerModal';
import { AddMentorModal } from '@/components/modals/AddMentorModal';
import { useTrainers, useCreateTrainer, useUpdateTrainer, useDeleteTrainer, useReactivateTrainer, Trainer } from '@/hooks/useTrainers';
import { useMentors, useCreateMentor, useUpdateMentor, useDeleteMentor, useReactivateMentor, Mentor } from '@/hooks/useMentors';
import { useCohorts } from '@/hooks/useCohorts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TabType = 'trainers' | 'mentors';

export const Stakeholders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('trainers');
  const [selectedCohort, setSelectedCohort] = useState<string>('all');
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [showAddMentor, setShowAddMentor] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [trainerModalMode, setTrainerModalMode] = useState<'add' | 'edit'>('add');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [mentorModalMode, setMentorModalMode] = useState<'add' | 'edit'>('add');

  const { data: cohorts = [] } = useCohorts();

  const { data: trainers = [], isLoading: loadingTrainers } = useTrainers(
    selectedCohort !== 'all' ? selectedCohort : undefined
  );
  const { data: mentors = [], isLoading: loadingMentors } = useMentors(
    selectedCohort !== 'all' ? selectedCohort : undefined
  );

  const createTrainer = useCreateTrainer();
  const updateTrainer = useUpdateTrainer();
  const createMentor = useCreateMentor();
  const updateMentor = useUpdateMentor();
  const deleteTrainer = useDeleteTrainer();
  const deleteMentor = useDeleteMentor();
  const reactivateTrainer = useReactivateTrainer();
  const reactivateMentor = useReactivateMentor();

  const filteredTrainers = trainers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.skill.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMentors = mentors.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.skill.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTrainer = (data: any) => {
    createTrainer.mutate({
      trainer: {
        ...data,
        status: 'ACTIVE',
      },
      cohortId: selectedCohort !== 'all' ? selectedCohort : undefined,
    }, {
      onSuccess: () => setShowAddTrainer(false),
    });
  };

  const handleAddMentor = (data: any) => {
    createMentor.mutate({
      mentor: {
        ...data,
        status: 'ACTIVE',
      },
      cohortId: selectedCohort !== 'all' ? selectedCohort : undefined,
    }, {
      onSuccess: () => setShowAddMentor(false),
    });
  };

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 pb-10"
    >
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 lg:p-12 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-secondary/20 blur-[100px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-md border border-white/10"
            >
              <UserCheck className="h-3 w-3" />
              Resource Deployment • Stakeholders
            </motion.div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-white leading-tight">
              Elite <span className="text-gradient">Taskforce</span>
            </h1>
            <p className="max-w-xl text-base text-slate-400 font-medium leading-relaxed">
              Orchestrate your high-performance network of instructional experts and mentorship leads. Every node is synchronized for operational excellence.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <GradientButton
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              icon={<UserPlus className="h-5 w-5" />}
              onClick={() => setShowAddMentor(true)}
            >
              Sync Mentor
            </GradientButton>
            <GradientButton
              variant="primary"
              icon={<Plus className="h-5 w-5" />}
              onClick={() => setShowAddTrainer(true)}
            >
              Deploy Trainer
            </GradientButton>
          </div>
        </div>
      </section>

      {/* Intelligence Control Row */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between pt-6 border-t border-border/10"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex bg-muted/30 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('trainers')}
              className={cn(
                "flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold tracking-widest uppercase transition-all",
                activeTab === 'trainers' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <GraduationCap className="h-4 w-4" />
              Instructional Leads ({filteredTrainers.length})
            </button>
            <button
              onClick={() => setActiveTab('mentors')}
              className={cn(
                "flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold tracking-widest uppercase transition-all",
                activeTab === 'mentors' ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <UserCheck className="h-4 w-4" />
              Strategic Mentors ({filteredMentors.length})
            </button>
          </div>

          <div className="relative group min-w-[200px]">
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="input-premium appearance-none pr-10 w-full py-4 bg-background/50 backdrop-blur-xl border-border/50"
            >
              <option value="all">All Operational Nodes</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.code} - {cohort.skill}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="relative group w-full lg:w-96">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-30 group-hover:opacity-60 transition-opacity" />
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query taskforce identity (Name, Skill)..."
              className="input-premium w-full pl-12 pr-4 py-4 bg-background/50 backdrop-blur-xl"
            />
          </div>
        </div>
      </motion.div>

      {/* Resource Grid */}
      <motion.div variants={itemVariants} className="grid gap-8 md:grid-cols-2 xl:grid-cols-3 pt-6">
        <AnimatePresence mode="popLayout">
          {(activeTab === 'trainers' ? filteredTrainers : filteredMentors).map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
            >
              <GlassCard
                variant="hover"
                glow={activeTab === 'trainers' ? 'cyan' : 'violet'}
                className={cn(
                  "group relative overflow-hidden p-6 transition-all duration-300 hover:shadow-2xl",
                  item.status === 'INACTIVE' && "opacity-40 grayscale-[0.5] hover:opacity-70"
                )}
                onClick={() => {
                  if (item.status === 'INACTIVE') {
                    if (window.confirm(`Reactivate mission node: ${item.name}?`)) {
                      activeTab === 'trainers' ? reactivateTrainer.mutate(item.id) : reactivateMentor.mutate(item.id);
                    }
                  }
                }}
              >
                <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />

                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner transition-transform group-hover:scale-105 group-hover:rotate-2",
                      activeTab === 'trainers' ? 'from-primary/20 to-neon-blue/20 text-primary' : 'from-secondary/20 to-neon-purple/20 text-secondary'
                    )}>
                      {item.avatar_url ? (
                        <img src={item.avatar_url} alt={item.name} className="h-full w-full object-cover rounded-2xl" />
                      ) : (
                        <span className="text-xl font-bold uppercase">{item.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          activeTab === 'trainers' ? 'text-primary/70' : 'text-secondary/70'
                        )}>
                          {(item as any).emp_id || 'ID-PENDING'}
                        </span>
                        {item.status === 'ACTIVE' && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                        )}
                      </div>
                      <h3 className="truncate text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                        {item.name}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Shield className={cn("h-3 w-3", activeTab === 'trainers' ? 'text-primary/60' : 'text-secondary/60')} />
                        {item.type} {activeTab === 'trainers' ? 'Trainer' : 'Mentor'}
                      </p>
                    </div>
                  </div>
                  <ActionMenu
                    showEdit={item.status === 'ACTIVE'}
                    onEdit={() => {
                      if (activeTab === 'trainers') {
                        setSelectedTrainer(item as Trainer);
                        setTrainerModalMode('edit');
                        setShowAddTrainer(true);
                      } else {
                        setSelectedMentor(item as Mentor);
                        setMentorModalMode('edit');
                        setShowAddMentor(true);
                      }
                    }}
                    onDelete={() => activeTab === 'trainers' ? deleteTrainer.mutate(item.id) : deleteMentor.mutate(item.id)}
                  />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3 rounded-xl border border-border/10 bg-muted/30 p-2.5 transition-all hover:bg-muted/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="truncate text-sm font-medium text-foreground/80">{item.email}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 border border-primary/20">
                      <GraduationCap className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] font-bold uppercase text-primary tracking-wider">{item.skill}</span>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border",
                      item.is_internal ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    )}>
                      {item.is_internal ? 'INTERNAL RESOURCE' : 'EXTERNAL EXPERT'}
                    </span>
                  </div>
                </div>

                {/* Performance Context */}
                <div className="mt-6 flex items-center justify-between border-t border-border/10 pt-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60 leading-none">Primary Assignment</span>
                    <span className="mt-1 text-sm font-bold text-foreground">
                      {(item as any).cohort_name || 'Operational Node'}
                    </span>
                  </div>
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 border border-border/50 text-muted-foreground">
                    <Activity className="h-5 w-5 opacity-30" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {(activeTab === 'trainers' ? filteredTrainers : filteredMentors).length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-32 flex flex-col items-center justify-center text-center space-y-4"
        >
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 blur-xl" />
            <div className="relative h-24 w-24 rounded-full bg-card/40 border border-border/50 flex items-center justify-center">
              <Users className="h-12 w-12 text-muted-foreground/30" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Personnel Vacuum</h3>
            <p className="text-muted-foreground max-w-sm font-medium">
              No active mission nodes detected for {activeTab}. The deployment grid is empty.
            </p>
            <GradientButton
              variant="primary"
              className="mt-6"
              onClick={() => activeTab === 'trainers' ? setShowAddTrainer(true) : setShowAddMentor(true)}
            >
              Add {activeTab.slice(0, -1)}
            </GradientButton>
          </div>
        </motion.div>
      )}

      {/* Modals */}
      <AddTrainerModal
        isOpen={showAddTrainer}
        onClose={() => {
          setShowAddTrainer(false);
          setSelectedTrainer(null);
          setTrainerModalMode('add');
        }}
        onSubmit={trainerModalMode === 'add' ? handleAddTrainer : handleEditTrainer}
        cohortId={selectedCohort !== 'all' ? selectedCohort : ''}
        isLoading={createTrainer.isPending || updateTrainer.isPending}
        mode={trainerModalMode}
        initialData={selectedTrainer}
      />
      <AddMentorModal
        isOpen={showAddMentor}
        onClose={() => {
          setShowAddMentor(false);
          setSelectedMentor(null);
          setMentorModalMode('add');
        }}
        onSubmit={mentorModalMode === 'add' ? handleAddMentor : handleEditMentor}
        cohortId={selectedCohort !== 'all' ? selectedCohort : ''}
        isLoading={createMentor.isPending || updateMentor.isPending}
        mode={mentorModalMode}
        initialData={selectedMentor}
      />
    </motion.div>
  );
};