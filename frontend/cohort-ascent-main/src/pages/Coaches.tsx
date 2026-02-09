import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Shield,
  Edit2,
  Trash2,
  UserPlus,
  User,
  Award,
  Upload,
  GraduationCap,
  Activity,
  Zap,
  Box,
  Target,
  ChevronRight,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { AddUserModal } from '@/components/modals/AddUserModal';
import { CSVUploadModal } from '@/components/modals/CSVUploadModal';
import { useUsers, useCreateUser, useDeleteUser, useUpdateUser, useCreateUsers } from '@/hooks/useUsers';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export const Coaches = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'coaches' | 'admins'>('coaches');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [addUserType, setAddUserType] = useState<'coach' | 'admin'>('coach');
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { data: users = [], isLoading: loadingUsers } = useUsers();
  const createUser = useCreateUser();
  const createUsers = useCreateUsers();
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();

  const coaches = users.filter(u => u.role === 'COACH');
  const admins = users.filter(u => u.role === 'ADMIN');

  const filteredCoaches = coaches.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.empId && c.empId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.empId && a.empId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleBulkUpload = (data: Record<string, string>[]) => {
    const usersToCreate = data.map((row) => ({
      empId: row.employee_id || row.id || row.emp_id,
      name: row.full_name || row.name,
      email: row.email,
      role: row.role ? row.role.toUpperCase() : 'COACH',
      employeeType: row.employee_type ? row.employee_type.toUpperCase() : 'INTERNAL',
      location: row.location || 'Bangalore',
      password: row.initial_password || row.password || 'Welcome@123',
      skill: row.skill,
    }));

    createUsers.mutate(usersToCreate, {
      onSuccess: () => {
        setShowCSVUpload(false);
      }
    });
  };

  const handleAddUser = (data: any) => {
    createUser.mutate({
      empId: data.empId,
      name: data.name,
      email: data.email,
      role: addUserType === 'coach' ? 'COACH' : 'ADMIN',
      employeeType: data.employeeType,
      location: data.location,
      password: data.password,
      skill: data.skill,
    }, {
      onSuccess: () => {
        setShowAddUser(false);
        toast.success(`${addUserType === 'coach' ? 'Coach' : 'Admin'} added successfully`);
      },
    });
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setAddUserType(user.role === 'ADMIN' ? 'admin' : 'coach');
    setShowAddUser(true);
  };

  const handleDelete = (user: any) => {
    if (confirm(`Are you sure you want to remove ${user.name}?`)) {
      deleteUser.mutate(user.id);
    }
  };

  const handleUpdateUser = (data: any) => {
    updateUser.mutate(
      {
        id: editingUser.id,
        ...data,
      },
      {
        onSuccess: () => {
          setShowAddUser(false);
          setEditingUser(null);
          toast.success('User updated successfully');
        },
      }
    );
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
              <Shield className="h-3 w-3" />
              Personnel Hierarchy • Operations
            </motion.div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-white">
              Global <span className="text-gradient">Registry</span>
            </h1>
            <p className="max-w-xl text-lg text-slate-400 font-medium leading-relaxed">
              {isAdmin
                ? 'Orchestrate your elite network of training coaches and system administrators across global nodes.'
                : 'Interface with the dedicated personnel managing your instructional environment.'}
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
                Sync Manifest
              </GradientButton>
              <GradientButton
                variant="primary"
                icon={<UserPlus className="h-5 w-5" />}
                onClick={() => {
                  setEditingUser(null);
                  setAddUserType('coach');
                  setShowAddUser(true);
                }}
              >
                Access New Node
              </GradientButton>
            </div>
          )}
        </div>
      </section>

      {/* Resource Metrics */}
      <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Coaches', value: coaches.length, icon: Users, color: 'cyan' },
          { label: 'Administrators', value: admins.length, icon: Shield, color: 'violet' },
          { label: 'System Load', value: 'High', icon: Activity, color: 'success' },
          { label: 'Active Nodes', value: [...new Set(users.map(u => u.location || 'Bangalore'))].length, icon: Target, color: 'blue' },
        ].map((stat, i) => (
          <GlassCard key={i} variant="hover" glow={stat.color as any} className="p-6 border-border/10">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                stat.color === 'success' ? 'bg-green-500/10 text-green-500' :
                  stat.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-500' :
                    stat.color === 'violet' ? 'bg-violet-500/10 text-violet-500' :
                      'bg-blue-500/10 text-blue-500'
              )}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{stat.label}</p>
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </motion.div>

      {/* Control Nodes Filter */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between pt-6 border-t border-border/10"
      >
        <div className="flex bg-muted/30 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('coaches')}
            className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold tracking-widest uppercase transition-all ${activeTab === 'coaches'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
          >
            <Users className="h-4 w-4" />
            Field Coaches
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold tracking-widest uppercase transition-all ${activeTab === 'admins'
              ? 'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
          >
            <Shield className="h-4 w-4" />
            Control Ops
          </button>
        </div>

        <div className="relative group w-full lg:w-96">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-30 group-hover:opacity-60 transition-opacity" />
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query Personnel ID or Name..."
              className="input-premium w-full pl-12 pr-4 py-4 bg-background/50 backdrop-blur-xl"
            />
          </div>
        </div>
      </motion.div>

      {/* Personnel Grid */}
      <motion.div variants={itemVariants} className="grid gap-8 md:grid-cols-2 xl:grid-cols-3 pt-6">
        <AnimatePresence mode="popLayout">
          {(activeTab === 'coaches' ? filteredCoaches : filteredAdmins).map((userItem, index) => (
            <motion.div
              key={userItem.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
            >
              <GlassCard
                variant="hover"
                glow={activeTab === 'coaches' ? 'cyan' : 'violet'}
                className="group relative overflow-hidden p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />

                {/* Profile Header */}
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner transition-transform group-hover:scale-105 group-hover:rotate-2",
                      activeTab === 'coaches' ? 'from-primary/20 to-neon-blue/20 text-primary' : 'from-secondary/20 to-neon-purple/20 text-secondary'
                    )}>
                      <User className="h-8 w-8" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          activeTab === 'coaches' ? 'text-primary/70' : 'text-secondary/70'
                        )}>
                          {userItem.empId}
                        </span>
                        {userItem.status === 'ACTIVE' && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                        )}
                      </div>
                      <h3 className="truncate text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                        {userItem.name}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Shield className={cn("h-3 w-3", activeTab === 'coaches' ? 'text-primary/60' : 'text-secondary/60')} />
                        {userItem.role} • {userItem.employeeType}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <ActionMenu
                      onEdit={() => handleEdit(userItem)}
                      onDelete={() => handleDelete(userItem)}
                    />
                  )}
                </div>

                {/* Secure Contact Info */}
                <div className="mt-6 grid grid-cols-1 gap-4 overflow-hidden">
                  <div className="flex items-center gap-3 rounded-xl border border-border/10 bg-muted/30 p-2.5 transition-all hover:bg-muted/50 dark:bg-muted/10 dark:hover:bg-muted/20">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm text-muted-foreground dark:bg-background/50">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="truncate text-sm font-medium text-foreground/80">{userItem.email}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm text-muted-foreground dark:bg-background/50">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-foreground/70">{userItem.location || 'Bangalore'}</span>
                    </div>
                    {userItem.skill && (
                      <div className="flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 transition-all group-hover:bg-primary/20 dark:bg-primary/5 dark:group-hover:bg-primary/10">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-bold uppercase text-primary">{userItem.skill}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Capacity Analytics - Dynamic Management Load */}
                <div className="mt-6 flex items-center justify-between border-t border-border/20 pt-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60 leading-none">Management Load</span>
                    <span className="mt-1 text-sm font-bold text-foreground">
                      {userItem.assignedCohorts || 0} Assigned Cohorts
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-2.5">
                      {Array.from({ length: Math.min(userItem.assignedCohorts || 0, 4) }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className={cn(
                            "h-8 w-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold shadow-lg transition-all hover:z-10 hover:scale-110",
                            activeTab === 'coaches'
                              ? "bg-gradient-to-br from-primary to-neon-blue text-primary-foreground"
                              : "bg-gradient-to-br from-secondary to-neon-purple text-secondary-foreground"
                          )}
                        >
                          <GraduationCap className="h-3.5 w-3.5" />
                        </motion.div>
                      ))}
                      {(userItem.assignedCohorts || 0) > 4 && (
                        <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-lg">
                          +{(userItem.assignedCohorts || 0) - 4}
                        </div>
                      )}
                      {(userItem.assignedCohorts || 0) === 0 && (
                        <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center text-[10px] font-bold text-muted-foreground/40">
                          <Plus className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {(activeTab === 'coaches' ? filteredCoaches : filteredAdmins).length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/10 text-muted-foreground/30 ring-1 ring-border/20">
            <User className="h-10 w-10" />
          </div>
          <h3 className="mt-6 text-xl font-bold text-foreground">No personnel records found</h3>
          <p className="mt-2 max-w-xs text-muted-foreground">
            We couldn't find any {activeTab} matching your search criteria. Try refining your filters or add a new record.
          </p>
          {isAdmin && (
            <GradientButton
              variant="primary"
              className="mt-8"
              onClick={() => {
                setAddUserType(activeTab === 'coaches' ? 'coach' : 'admin');
                setEditingUser(null);
                setShowAddUser(true);
              }}
            >
              Add New {activeTab === 'coaches' ? 'Coach' : 'Admin'}
            </GradientButton>
          )}
        </motion.div>
      )}

      {/* Modals */}
      <AddUserModal
        isOpen={showAddUser}
        onClose={() => {
          setShowAddUser(false);
          setEditingUser(null);
        }}
        onSubmit={editingUser ? handleUpdateUser : handleAddUser}
        userType={addUserType}
        isLoading={createUser.isPending || updateUser.isPending}
        defaultValues={editingUser}
        isEdit={!!editingUser}
      />

      <CSVUploadModal
        isOpen={showCSVUpload}
        onClose={() => setShowCSVUpload(false)}
        onUpload={handleBulkUpload}
        title={`Import ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Registry`}
        requiredColumns={['Employee ID', 'Full Name', 'Email', 'Employee Type']}
      />
    </motion.div>
  );
};