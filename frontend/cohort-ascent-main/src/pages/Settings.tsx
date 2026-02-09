import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Bell,
  Shield,
  Database,
  Save,
  Settings as SettingsIcon,
  Cpu,
  Lock,
  Zap,
  Target,
  Camera,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/api';
import { toast } from 'sonner';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'system';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType; description: string; roles: string[] }[] = [
  { id: 'profile', label: 'Identity Profile', icon: UserIcon, description: 'Manage personal credentials', roles: ['ADMIN', 'COACH', 'LOCATION_LEAD'] },
  { id: 'notifications', label: 'Alert Matrix', icon: Bell, description: 'Configure notification nodes', roles: ['ADMIN', 'COACH', 'LOCATION_LEAD'] },
  { id: 'security', label: 'Firewall & Access', icon: Shield, description: 'Secure access protocols', roles: ['ADMIN', 'COACH', 'LOCATION_LEAD'] },
  { id: 'system', label: 'Core Engine', icon: Database, description: 'System-wide configurations', roles: ['ADMIN'] },
];

const ProfileSettings = () => {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    location: user?.location || '',
    avatar: user?.avatar || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        location: user.location || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await api.put('/users/profile', {
        name: formData.name,
        location: formData.location,
        email: formData.email,
        avatar: formData.avatar,
      });
      updateUser(response.data);
      toast.success('Core profile synchronized successfully.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Synchronization failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Increased to 2MB as we now support more
        toast.error('Avatar payload exceeds volumetric limits (Max 2MB).');
        return;
      }

      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <GlassCard className="p-8 lg:p-10 border-border/10 overflow-hidden relative group">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-center gap-6 mb-10">
        <div className="relative group/avatar">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-secondary blur opacity-30 animate-pulse group-hover/avatar:opacity-60 transition-opacity" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 border-2 border-white/10 text-3xl font-bold text-white shadow-2xl overflow-hidden">
            {formData.avatar ? (
              <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              user?.name?.charAt(0)
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-slate-900 hover:scale-110 active:scale-95 transition-all cursor-pointer">
            <Camera className="h-5 w-5" />
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </label>
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Identity Profile</h2>
          <p className="text-muted-foreground font-medium">Synchronize your authenticated presence.</p>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Full Identity Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-premium w-full bg-white/5 border-white/10 py-4 focus:bg-white/10"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Secure Email Node</label>
          <input
            type="email"
            value={formData.email}
            disabled
            className="input-premium w-full bg-white/5 border-white/10 py-4 opacity-40 cursor-not-allowed"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Assigned Role Level</label>
          <div className="relative">
            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
            <input
              type="text"
              value={user?.role || ''}
              disabled
              className="input-premium w-full pl-12 bg-white/5 border-white/10 py-4 opacity-40 cursor-not-allowed font-bold text-primary/80"
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Geographical Node</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="input-premium w-full bg-white/5 border-white/10 py-4 focus:bg-white/10"
            placeholder="Operational sector..."
          />
        </div>
      </div>

      <div className="flex justify-end mt-12 pt-8 border-t border-white/5">
        <GradientButton
          variant="primary"
          size="lg"
          icon={<Save className="h-5 w-5" />}
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[200px]"
        >
          {isSaving ? 'Synchronizing...' : 'Save Profile'}
        </GradientButton>
      </div>
    </GlassCard>
  );
};

const NotificationSettings = () => (
  <GlassCard className="p-8 lg:p-10 border-border/10">
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-white tracking-tight">Alert Matrix</h2>
      <p className="text-muted-foreground font-medium">Configure real-time telemetry and operational notifications.</p>
    </div>

    <div className="grid gap-6">
      {[
        { label: 'Effort Matrix Reminders', description: 'Real-time telemetry pings to log daily bandwidth.', icon: Zap, color: 'text-primary' },
        { label: 'Sync Threshold Alerts', description: 'Critical notifications for end-of-week effort locking.', icon: Target, color: 'text-secondary' },
        { label: 'Deployment Assignments', description: 'Pings when new cohorts are linked to your profile.', icon: UserIcon, color: 'text-accent' },
        { label: 'Intelligence Reports', description: 'Automated pings when analytics logs are finalized.', icon: Database, color: 'text-primary' },
      ].map((item) => (
        <div key={item.label} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all hover:bg-white/10 group">
          <div className="flex items-center gap-5">
            <div className={cn("h-12 w-12 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110", item.color)}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-white tracking-tight">{item.label}</p>
              <p className="text-xs font-medium text-muted-foreground">{item.description}</p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" defaultChecked className="peer sr-only" />
            <div className="peer h-7 w-12 rounded-full bg-slate-800 border border-white/10 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:bg-slate-400 after:transition-all peer-checked:bg-primary/40 peer-checked:border-primary/50 peer-checked:after:bg-primary peer-checked:after:translate-x-5" />
          </label>
        </div>
      ))}
    </div>
  </GlassCard>
);

const SecuritySettings = () => {
  const { user } = useAuthStore();
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('Cryptographic mismatch. New passwords must be identical.');
      return;
    }
    if (passwords.new.length < 8) {
      toast.error('Security protocol breach. Minimum 8 characters required.');
      return;
    }

    try {
      setIsUpdating(true);
      await api.put('/users/password', {
        currentPassword: passwords.current,
        newPassword: passwords.new,
        email: user?.email,
      });
      toast.success('Access keys updated successfully.');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <GlassCard className="p-8 lg:p-10 border-border/10">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white tracking-tight">Firewall & Access</h2>
        <p className="text-muted-foreground font-medium">Update your cryptographic access keys and session protocols.</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Current Cryptographic Key</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <input
              type="password"
              className="input-premium w-full pl-12 bg-white/5 border-white/10 py-4"
              placeholder="••••••••••••"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">New Access Key</label>
            <input
              type="password"
              className="input-premium w-full bg-white/5 border-white/10 py-4"
              placeholder="••••••••••••"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Confirm Access Key</label>
            <input
              type="password"
              className="input-premium w-full bg-white/5 border-white/10 py-4"
              placeholder="••••••••••••"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-8 border-t border-white/5">
          <GradientButton
            variant="primary"
            size="lg"
            icon={<Shield className="h-5 w-5" />}
            onClick={handleUpdatePassword}
            disabled={isUpdating}
            className="min-w-[200px]"
          >
            {isUpdating ? 'Recalibrating...' : 'Update Keys'}
          </GradientButton>
        </div>
      </div>
    </GlassCard>
  );
};

const SystemSettings = () => (
  <GlassCard className="p-8 lg:p-10 border-border/10">
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-white tracking-tight">Core Engine</h2>
      <p className="text-muted-foreground font-medium">Global platform parameters and operational sector overrides.</p>
    </div>

    <div className="space-y-10">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Default Operational Sector</label>
          <select className="input-premium w-full bg-white/5 border-white/10 py-4">
            <option>Global HQ • Bangalore</option>
            <option>Operations Node • Chennai</option>
            <option>Tech Hub • Hyderabad</option>
            <option>Logistics Core • Pune</option>
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Temporal Alignment (Timezone)</label>
          <select className="input-premium w-full bg-white/5 border-white/10 py-4">
            <option>Asia/Kolkata (IST • GMT+5:30)</option>
            <option>America/New_York (EST • GMT-5:00)</option>
            <option>Europe/London (GMT • GMT+0:00)</option>
          </select>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 rounded-2xl bg-amber-500/20 blur opacity-30 group-hover:opacity-60 transition-opacity" />
        <div className="relative rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 flex gap-4">
          <Shield className="h-6 w-6 text-amber-500 shrink-0" />
          <p className="text-sm font-medium text-amber-500/80 leading-relaxed">
            CRITICAL OVERRIDE: Altering core engine configurations will synchronize parameters for all active mission nodes. Authorized leads only.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-8 border-t border-white/5">
        <GradientButton variant="primary" size="lg" icon={<Save className="h-5 w-5" />} className="min-w-[200px]">
          Sync Engine
        </GradientButton>
      </div>
    </div>
  </GlassCard>
);

export const Settings = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const filteredTabs = tabs.filter(tab => user?.role ? tab.roles.includes(user.role) : false);

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
              <SettingsIcon className="h-3 w-3" />
              Control Center • System Config
            </motion.div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-white focus:outline-none">
              System <span className="text-gradient">Tuning</span>
            </h1>
            <p className="max-w-xl text-base text-slate-400 font-medium leading-relaxed">
              Recalibrate your operational environment. Fine-tune security protocols, identity credentials, and system-wide engine parameters.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Load</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-1/3 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                </div>
                <span className="text-xs font-black text-white">OPTIMAL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 space-y-3">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "group relative w-full flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 border text-left",
                  activeTab === tab.id
                    ? "bg-primary/10 border-primary/20 text-foreground shadow-lg shadow-primary/5"
                    : "bg-transparent border-transparent text-muted-foreground hover:bg-white/5 hover:border-white/10"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full"
                  />
                )}
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                  activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                )}>
                  <tab.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    "font-bold text-sm tracking-tight transition-colors",
                    activeTab === tab.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}>{tab.label}</p>
                  <p className="text-[10px] font-medium text-muted-foreground/60 leading-tight mt-0.5 truncate">{tab.description}</p>
                </div>
              </button>
            ))}

            <div className="mt-8 p-6 rounded-[2rem] bg-gradient-to-br from-primary/5 to-secondary/5 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">Security Level High</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                All changes require cryptographic session validation.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Workspace */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'system' && <SystemSettings />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};
