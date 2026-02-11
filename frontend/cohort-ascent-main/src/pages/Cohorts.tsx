import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Search as SearchIcon,
  Plus,
  MapPin,
  Users,
  Calendar,
  ArrowUpRight,
  ChevronDown,
  ArrowUpDown,
  Upload,
  User,
  Activity,
  Box,
  Target,
  TrendingUp,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCohortStore, Cohort } from '@/stores/cohortStore';
import { useAuthStore } from '@/stores/authStore';
import { useCohorts, useCreateCohort, useDeleteCohort, useCreateCohorts, useUpdateCohort } from '@/hooks/useCohortsBackend';
import { useActiveCoaches } from '@/hooks/useCoachesBackend';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { AddCohortModal } from '@/components/modals/AddCohortModal';
import { CSVUploadModal } from '@/components/modals/CSVUploadModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusConfig = {
  active: { label: 'Active', class: 'badge-active' },
  completed: { label: 'Completed', class: 'bg-muted text-muted-foreground' },
  upcoming: { label: 'Upcoming', class: 'badge-pending' },
};

export const Cohorts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showAddCohort, setShowAddCohort] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: dbCohorts = [], isLoading: isLoadingCohorts } = useCohorts();
  const createCohort = useCreateCohort();
  const createCohorts = useCreateCohorts();
  const updateCohort = useUpdateCohort();
  const deleteCohort = useDeleteCohort();

  const { cohorts: mockCohorts } = useCohortStore();
  const isAdmin = user?.role === 'ADMIN';

  // Use DB cohorts if available, otherwise mock
  const [sortBy, setSortBy] = useState<string>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const cohorts = (dbCohorts && dbCohorts.length > 0) || !isLoadingCohorts
    ? dbCohorts.map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.code,
      bu: c.bu,
      skill: c.skill,
      location: c.trainingLocation,
      startDate: c.startDate,
      endDate: c.endDate,
      status: 'active' as 'active' | 'upcoming' | 'completed',
      candidateCount: c.totalGencCount || c.activeGencCount || 0,
      progress: c.progress || 0,
      coachId: c.coach?.id?.toString() || '',
      coachName: c.coach?.name || 'Unassigned',
      trainers: [],
      mentors: [],
    }))
    : mockCohorts;

  const locations = [...new Set((cohorts || []).map((c: any) => c.location))];

  const {
    data: activeCoaches = [],
    isLoading: loadingCoaches,
    isError: coachError
  } = useActiveCoaches();
  if (coachError) {
    toast.error('Failed to load active coaches');
  }


  const filteredCohorts = cohorts.filter((cohort) => {
    const matchesSearch =
      cohort.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cohort.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cohort.skill.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cohort.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || cohort.location === locationFilter;
    const matchesRole = isAdmin || cohort.coachId === user?.id?.toString();
    return matchesSearch && matchesStatus && matchesLocation && matchesRole;
  });

  const sortedCohorts = [...filteredCohorts].sort((a, b) => {
    const aVal = a[sortBy as keyof typeof a];
    const bVal = b[sortBy as keyof typeof b];

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedCohorts.length / itemsPerPage);
  const paginatedCohorts = sortedCohorts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 on filter/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, locationFilter, sortBy, sortOrder]);

  const handleCreateCohort = (data: any) => {
    console.log('Submitting cohort:', data);

    if (isEditing && selectedCohort) {
      updateCohort.mutate({
        id: Number(selectedCohort.id),
        data: data
      }, {
        onSuccess: () => {
          setShowAddCohort(false);
          setSelectedCohort(null);
          setIsEditing(false);
        },
      });
    } else {
      createCohort.mutate({
        code: data.code,
        bu: data.bu,
        skill: data.skill,
        activeGencCount: 0,
        trainingLocation: data.trainingLocation,
        startDate: data.startDate,
        endDate: data.endDate || null,
        coachId: data.coachId,
        primaryTrainerId: null,
      }, {
        onSuccess: () => {
          setShowAddCohort(false);
        },
      });
    }
  };

  const handleBulkUpload = (data: Record<string, string>[]) => {
    const cohortsToCreate = data.map((row) => ({
      code: row.cohort_code || row.code,
      name: row.cohort_name || row.name,
      bu: row.business_unit || row.bu,
      skill: row.skill_technology || row.skill,
      activeGencCount: parseInt(row.active_genc_count || '0', 10),
      trainingLocation: row.location || row.training_location,
      startDate: row.start_date,
      endDate: row.end_date || null,
      coachEmail: row.coach_email,
      primaryTrainerEmail: row.primary_trainer_email,
    }));

    createCohorts.mutate(cohortsToCreate, {
      onSuccess: () => {
        setShowCSVUpload(false);
      }
    });
  };

  const handleEditCohort = (cohort: any) => {
    setSelectedCohort(cohort);
    setIsEditing(true);
    setShowAddCohort(true);
  };

  const handleDeleteCohort = (cohort: any) => {
    if (window.confirm(`Are you sure you want to delete ${cohort.name}?`)) {
      if (dbCohorts.length > 0) {
        deleteCohort.mutate(Number(cohort.id));
      } else {
        toast.info('Cannot delete mock data');
      }
    }
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
              <Activity className="h-3 w-3" />
              Operational Flux • Live Streams
            </motion.div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-white leading-tight">
              Training <span className="text-gradient">Cohorts</span>
            </h1>
            <p className="max-w-xl text-base text-slate-400 font-medium leading-relaxed">
              {isAdmin
                ? 'Master control for high-bandwidth training missions across the global talent nodes.'
                : 'Monitor your assigned learning trajectories and synchronize with elite cohorts.'}
            </p>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap gap-4">
              <GradientButton
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                icon={<Upload className="h-5 w-5" />}
                onClick={() => setShowCSVUpload(true)}
              >
                Import CSV
              </GradientButton>
              <GradientButton
                variant="primary"
                icon={<Plus className="h-5 w-5" />}
                onClick={() => {
                  setIsEditing(false);
                  setSelectedCohort(null);
                  setShowAddCohort(true);
                }}
              >
                Initialize Cohort
              </GradientButton>
            </div>
          )}
        </div>
      </section>

      {/* Synchronized Metrics Hub */}
      <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard variant="hover" glow="cyan" className="p-8 relative overflow-hidden group border-border/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Box className="h-16 w-16" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Total Streams</p>
            <p className="text-3xl font-extrabold text-foreground">{cohorts.length}</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-bold text-success">Active Deployment</span>
          </div>
        </GlassCard>

        <GlassCard variant="hover" glow="violet" className="p-8 relative overflow-hidden group border-border/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="h-16 w-16" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Total GenCs</p>
            <p className="text-3xl font-extrabold text-foreground">{cohorts.reduce((acc, c) => acc + (c.candidateCount || 0), 0)}</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-secondary" />
            <span className="text-xs font-bold text-secondary">High Flux Potential</span>
          </div>
        </GlassCard>

        <GlassCard variant="hover" glow="violet" className="p-8 relative overflow-hidden group border-border/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Target className="h-16 w-16" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Locations</p>
            <p className="text-3xl font-extrabold text-foreground">{locations.length}</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <MapPin className="h-3 w-3 text-primary" />
            <span className="text-xs font-bold text-primary">Global Distribution</span>
          </div>
        </GlassCard>

        <GlassCard variant="hover" glow="cyan" className="p-8 relative overflow-hidden group border-border/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Activity className="h-16 w-16" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Operational</p>
            <p className="text-3xl font-bold text-foreground">{cohorts.filter(c => c.status === 'active').length}</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Zap className="h-3 w-3 text-success" />
            <span className="text-xs font-bold text-success italic">STABLE_SYNC</span>
          </div>
        </GlassCard>
      </motion.div>

      {/* Intelligence Filtering */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between pt-6 border-t border-border/10"
      >
        <div className="relative group flex-1 max-w-xl">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 to-secondary/30 blur opacity-40 group-hover:opacity-70 transition-opacity" />
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query Mission Node (Name, Code, Skill)..."
              className="input-premium w-full pl-12 pr-4 py-4 backdrop-blur-2xl"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [key, order] = e.target.value.split('-');
                setSortBy(key);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="relative input-premium appearance-none pr-12 py-4 bg-background/80"
            >
              <option value="startDate-desc">Newest First</option>
              <option value="startDate-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="candidateCount-desc">Most Personnel</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="relative input-premium appearance-none pr-12 py-4 bg-background/80"
            >
              <option value="all">Global Status</option>
              <option value="active">Operational</option>
              <option value="upcoming">Scheduled</option>
              <option value="completed">Archived</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="relative input-premium appearance-none pr-12 py-4 bg-background/80"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </motion.div>

      {/* Cohorts Grid */}
      <motion.div variants={itemVariants} className="grid gap-8 md:grid-cols-2 xl:grid-cols-3 pt-6">
        <AnimatePresence mode="popLayout">
          {paginatedCohorts.map((cohort, index) => (
            <motion.div
              key={cohort.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: index * 0.04 }}
            >
              <CohortCard
                cohort={cohort}
                index={index}
                onClick={() => navigate(`/cohorts/${cohort.id}`)}
                onEdit={() => handleEditCohort(cohort)}
                onDelete={() => handleDeleteCohort(cohort)}
                isAdmin={isAdmin}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-border/10">
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
            Showing <span className="text-foreground">{paginatedCohorts.length}</span> of <span className="text-foreground">{filteredCohorts.length}</span> mission nodes
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="h-12 w-12 flex items-center justify-center rounded-xl bg-card border border-border/40 hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "h-12 w-12 rounded-xl border font-bold text-sm transition-all",
                    currentPage === i + 1
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-card border-border/40 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="h-12 w-12 flex items-center justify-center rounded-xl bg-card border border-border/40 hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {filteredCohorts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center"
        >
          <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No cohorts found</h3>
          <p className="mt-2 text-muted-foreground">
            {isAdmin ? 'Create a new cohort to get started' : 'No cohorts assigned to you yet'}
          </p>
          {isAdmin && (
            <GradientButton
              variant="primary"
              className="mt-4"
              onClick={() => setShowAddCohort(true)}
            >
              Create First Cohort
            </GradientButton>
          )}
        </motion.div>
      )}

      {/* Add Cohort Modal */}
      <AddCohortModal
        isOpen={showAddCohort}
        onClose={() => {
          setShowAddCohort(false);
          setSelectedCohort(null);
          setIsEditing(false);
        }}
        onSubmit={handleCreateCohort}
        coaches={activeCoaches
          .filter((c: any) => c.role === 'COACH')
          .map((c: any) => ({
            id: c.id.toString(),
            name: c.name,
            email: c.email,
          }))}
        isLoading={createCohort.isPending || updateCohort.isPending || loadingCoaches}
        initialData={selectedCohort}
        isEdit={isEditing}
      />

      <CSVUploadModal
        isOpen={showCSVUpload}
        onClose={() => setShowCSVUpload(false)}
        onUpload={handleBulkUpload}
        title="Import Cohorts"
        requiredColumns={['Cohort Code', 'Cohort Name', 'Business Unit', 'Skill', 'Location', 'Start Date', 'End Date']}
      />
    </motion.div>
  );
};

interface CohortCardProps {
  cohort: any;
  index: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

const CohortCard = ({ cohort, index, onClick, onEdit, onDelete, isAdmin }: CohortCardProps) => {
  const status = statusConfig[cohort.status as keyof typeof statusConfig] || statusConfig.active;

  return (
    <GlassCard
      variant="hover"
      glow="cyan"
      className="group relative cursor-pointer overflow-hidden p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10"
      onClick={onClick}
      whileHover={{ y: -6 }}
    >
      {/* Decorative background element */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />

      {/* Header */}
      <div className="relative mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-neon-blue/20 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:from-primary/30 group-hover:to-neon-blue/30">
            <GraduationCap className="h-7 w-7 text-primary shadow-sm" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">{cohort.code}</span>
            <h3 className="truncate text-lg font-bold text-foreground transition-colors group-hover:text-primary">
              {cohort.name}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ActionMenu
            onEdit={isAdmin ? onEdit : undefined}
            onDelete={isAdmin ? onDelete : undefined}
            onView={onClick}
            showEdit={isAdmin}
            showDelete={isAdmin}
            showView={true}
          />
        </div>
      </div>

      {/* Tags Section */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20">
          {cohort.skill}
        </span>
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {cohort.bu}
        </span>
      </div>

      {/* Main Info Grid */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground/80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
            <MapPin className="h-4 w-4 text-primary/70" />
          </div>
          <span className="truncate">{cohort.location}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground/80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
            <Users className="h-4 w-4 text-primary/70" />
          </div>
          <span>{cohort.candidateCount} GenCs</span>
        </div>
      </div>

      {/* Progress & Timeline */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${status.class}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current pulse-subtle" />
            {status.label}
          </span>
          <span className="text-sm font-bold text-foreground">{cohort.progress}%</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${cohort.progress}%` }}
            transition={{ duration: 1.2, ease: "circOut" }}
            className="absolute h-full rounded-full bg-gradient-to-r from-primary via-neon-blue to-cyan-400"
          />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/70">
          <Calendar className="h-3.5 w-3.5" />
          Launched on {new Date(cohort.startDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Footer / Assigned Personnel */}
      <div className="mt-auto flex items-center justify-between border-t border-border/20 pt-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-secondary/40 to-neon-purple/40 text-sm font-bold text-secondary shadow-lg">
              {cohort.coachName?.charAt(0) || 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">Program Coach</span>
            <span className="text-sm font-semibold text-foreground/90">{cohort.coachName || 'Unassigned'}</span>
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 transition-all duration-300 group-hover:bg-primary/20">
          <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </div>
    </GlassCard>
  );
};