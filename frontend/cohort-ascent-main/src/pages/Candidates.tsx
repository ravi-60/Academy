import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Upload,
  Plus,
  Download,
  Edit2,
  Trash2,
  ChevronDown,
  Activity,
  Zap,
  Box,
  Target,
  ChevronRight,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useCandidates, useCreateCandidate, useUpdateCandidate, useDeleteCandidate, useBulkCreateCandidates } from '@/hooks/useCandidates';
import { useCohorts } from '@/hooks/useCohortsBackend';
import { AddCandidateModal } from '@/components/modals/AddCandidateModal';
import { CSVUploadModal } from '@/components/modals/CSVUploadModal';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

const statusConfig = {
  active: { label: 'Active', class: 'badge-active' },
  inactive: { label: 'Inactive', class: 'badge-inactive' },
  completed: { label: 'Completed', class: 'bg-info/20 text-info' },
};

export const Candidates = () => {
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cohortFilter, setCohortFilter] = useState('all');
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: candidates = [], isLoading } = useCandidates(undefined, user?.email);
  const { data: cohorts = [] } = useCohorts();
  const createCandidate = useCreateCandidate();
  const updateCandidate = useUpdateCandidate();
  const deleteCandidate = useDeleteCandidate();
  const bulkCreate = useBulkCreateCandidates();

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCohort = cohortFilter === 'all' || c.cohort.id.toString() === cohortFilter.toString();
    return matchesSearch && matchesStatus && matchesCohort;
  });

  const handleAddCandidate = (data: any) => {
    if (editingCandidate) {
      updateCandidate.mutate({
        id: editingCandidate.id,
        candidateId: data.associate_id,
        name: data.name,
        email: data.cognizant_email_id || null,
        status: data.status.toUpperCase() as any,
        joinDate: data.join_date,
        endDate: data.end_date,
        cohort: cohorts.find(c => c.id.toString() === data.cohort_id?.toString()) || editingCandidate.cohort,
      }, {
        onSuccess: () => {
          setShowAddCandidate(false);
          setEditingCandidate(null);
        },
      });
    } else {
      const selectedCohort = cohorts.find(c => c.id.toString() === data.cohort_id?.toString()) || cohorts[0];
      createCandidate.mutate({
        candidateId: data.associate_id,
        name: data.name,
        email: data.cognizant_email_id || null,
        status: data.status?.toUpperCase() as any || 'ACTIVE',
        joinDate: data.join_date || selectedCohort?.startDate,
        endDate: data.end_date || selectedCohort?.endDate,
        cohort: selectedCohort,
      } as any, {
        onSuccess: () => setShowAddCandidate(false),
      });
    }
  };

  const handleCSVUpload = (data: Record<string, string>[]) => {
    const candidatesToCreate = data.map((row, index) => {
      const cohortCode = row.cohort_code || row.cohortcode;
      const targetCohort = cohorts.find(c => c.code.toLowerCase() === cohortCode?.toLowerCase());

      if (!targetCohort) {
        console.warn(`Skipping row ${index + 1}: Cohort code "${cohortCode}" not found.`);
        return null;
      }

      return {
        candidateId: row.associate_id || row.associateid || `GC-${Date.now()}-${index}`,
        name: row.name,
        email: row.cognizant_email_id || row.cognizantemailid || null,
        cohort: targetCohort,
        status: 'ACTIVE' as const,
        joinDate: row.join_date || row.joindate || targetCohort.startDate,
        endDate: row.end_date || row.enddate || targetCohort.endDate,
      };
    }).filter(Boolean) as any[];

    if (candidatesToCreate.length === 0) {
      toast.error('No valid candidates found in CSV. Ensure Cohort Codes are correct.');
      return;
    }

    bulkCreate.mutate(candidatesToCreate, {
      onSuccess: () => {
        setShowCSVUpload(false);
        toast.success(`Successfully imported ${candidatesToCreate.length} candidates across cohorts.`);
      },
    });
  };

  const handleExport = () => {
    if (filteredCandidates.length === 0) {
      toast.error('No candidates to export');
      return;
    }

    const csvContent = [
      ['Candidate ID', 'Name', 'Email', 'Status', 'Join Date', 'Cohort'],
      ...filteredCandidates.map((c) => [
        c.candidateId,
        c.name,
        c.email || '',
        c.status,
        c.joinDate,
        c.cohort.code,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Candidates exported successfully');
  };

  const handleEdit = (candidate: any) => {
    setEditingCandidate({
      ...candidate,
      associate_id: candidate.candidateId,
      cognizant_email_id: candidate.email || '',
      cohort_code: candidate.cohort.code,
      cohort_id: candidate.cohort.id.toString(),
      join_date: candidate.joinDate ? new Date(candidate.joinDate).toISOString().split('T')[0] : '',
      end_date: candidate.endDate ? new Date(candidate.endDate).toISOString().split('T')[0] : '',
      status: candidate.status.toLowerCase() as 'active' | 'inactive' | 'completed',
    });
    setShowAddCandidate(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this candidate?')) {
      deleteCandidate.mutate(id);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setPendingFile(file);
      setShowCSVUpload(true);
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
              Talent Matrix • Global Sourcing
            </motion.div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-white">
              GenC <span className="text-gradient">Personnel</span>
            </h1>
            <p className="max-w-xl text-lg text-slate-400 font-medium leading-relaxed">
              Orchestrate the high-potential talent pool. Synchronize associates across mission-critical learning streams with precision.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <GradientButton
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              icon={<Download className="h-5 w-5" />}
              onClick={handleExport}
            >
              Export
            </GradientButton>
            <GradientButton
              variant="primary"
              icon={<Plus className="h-5 w-5" />}
              onClick={() => {
                setEditingCandidate(null);
                setShowAddCandidate(true);
              }}
            >
              Add Personnel
            </GradientButton>
          </div>
        </div>
      </section>

      {/* Metrics Overlays */}
      <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Pool', value: candidates.length, icon: Users, color: 'cyan' },
          { label: 'Active Node', value: candidates.filter(c => c.status === 'ACTIVE').length, icon: Activity, color: 'success' },
          { label: 'Completed', value: candidates.filter(c => c.status === 'COMPLETED').length, icon: Zap, color: 'violet' },
          { label: 'Archived', value: candidates.filter(c => c.status === 'INACTIVE').length, icon: Box, color: 'muted' },
        ].map((stat, i) => (
          <GlassCard key={i} variant="hover" glow={stat.color as any} className="p-6 border-border/10">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-${stat.color === 'muted' ? 'muted' : stat.color === 'success' ? 'green-500' : stat.color}/10 text-${stat.color === 'muted' ? 'muted-foreground' : stat.color === 'success' ? 'green-500' : stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </motion.div>

      {/* Data Ingestion Zone */}
      <motion.div variants={itemVariants}>
        <GlassCard
          variant={isDragOver ? 'elevated' : 'hover'}
          glow="cyan"
          className={`relative overflow-hidden border-2 border-dashed p-10 text-center transition-all group ${isDragOver ? 'border-primary bg-primary/5' : 'border-border/40'
            }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleFileDrop}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Upload className={`mx-auto h-12 w-12 ${isDragOver ? 'text-primary' : 'text-muted-foreground/40'} group-hover:scale-110 group-hover:text-primary transition-all`} />
          <h3 className="mt-4 text-xl font-bold text-foreground">
            Multi-Node Data Ingestion
          </h3>
          <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
            Drop your CSV or Excel manifest here to batch-load associate telemetry into the global matrix.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) {
                setPendingFile(selectedFile);
                setShowCSVUpload(true);
              }
            }}
          />
          <GradientButton
            variant="outline"
            size="sm"
            className="mt-6 font-bold"
            onClick={() => fileInputRef.current?.click()}
          >
            Open File Buffer
          </GradientButton>
        </GlassCard>
      </motion.div>

      {/* Intelligence Filters */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between pt-6 border-t border-border/10"
      >
        <div className="relative group flex-1 max-w-xl">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-30 group-hover:opacity-60 transition-opacity" />
          <div className="relative flex items-center">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query Personnel Registry (Name, ID, Email)..."
              className="input-premium w-full pl-12 pr-4 py-4 bg-background/50 backdrop-blur-xl"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="relative input-premium appearance-none pr-12 py-4 bg-background/80"
            >
              <option value="all">Global Lifecycle</option>
              <option value="active">Operational</option>
              <option value="inactive">Suspended</option>
              <option value="completed">Qualified</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="relative input-premium appearance-none pr-12 py-4 bg-background/80"
            >
              <option value="all">Synchronize Cohort</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>{cohort.code}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </motion.div>

      {/* Personnel Manifest */}
      <motion.div variants={itemVariants}>
        {isLoading ? (
          <GlassCard className="p-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-4 text-muted-foreground">Loading candidates...</p>
          </GlassCard>
        ) : (
          <GlassCard className="overflow-hidden">
            {filteredCandidates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Associate ID</th>
                      <th>Name</th>
                      <th>Cohort</th>
                      <th>Status</th>
                      <th>Join Date</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((candidate, index) => (
                      <motion.tr
                        key={candidate.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.03 }}
                        className="group"
                      >
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
                        <td className="text-sm font-medium text-primary/80">{candidate.cohort.code}</td>
                        <td>
                          <span className={`badge-status ${statusConfig[candidate.status.toLowerCase() as keyof typeof statusConfig]?.class || 'bg-muted'}`}>
                            {statusConfig[candidate.status.toLowerCase() as keyof typeof statusConfig]?.label || candidate.status}
                          </span>
                        </td>
                        <td className="text-muted-foreground">
                          {candidate.joinDate ? new Date(candidate.joinDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }) : '-'}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                              onClick={() => handleEdit(candidate)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(candidate.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No candidates found</h3>
                <p className="mt-2 text-muted-foreground">
                  {candidates.length === 0
                    ? 'Upload a CSV or add candidates manually to get started'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {candidates.length === 0 && (
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
                )}
              </div>
            )}
          </GlassCard>
        )}
      </motion.div>

      {/* Modals */}
      <AddCandidateModal
        isOpen={showAddCandidate}
        onClose={() => {
          setShowAddCandidate(false);
          setEditingCandidate(null);
        }}
        onSubmit={handleAddCandidate}
        cohortId={cohortFilter !== 'all' ? cohortFilter.toString() : (cohorts[0]?.id?.toString() || '')}
        isLoading={createCandidate.isPending || updateCandidate.isPending}
        initialData={editingCandidate}
        mode={editingCandidate ? 'edit' : 'add'}
      />
      <CSVUploadModal
        isOpen={showCSVUpload}
        onClose={() => {
          setShowCSVUpload(false);
          setPendingFile(null);
        }}
        onUpload={handleCSVUpload}
        title="Import Candidates"
        requiredColumns={['name', 'associate_id', 'cohort_code']}
        initialFile={pendingFile}
      />
    </motion.div>
  );
};