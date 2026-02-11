import { motion, AnimatePresence } from 'framer-motion';
import {
    History,
    Search,
    Filter,
    Download,
    Clock,
    User,
    Tag,
    ArrowLeft,
    Calendar,
    Layers,
    Zap,
    CheckCircle2,
    FileText,
    AlertTriangle,
    ChevronRight,
    ShieldCheck,
    Activity as ActivityIcon,
    RefreshCw,
    ChevronLeft,
    ChevronDown
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 }
};

export const Activity = () => {
    const navigate = useNavigate();
    const { notifications } = useNotificationStore();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const filteredNotifications = useMemo(() => {
        return notifications
            .filter(n => {
                const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
                    n.message.toLowerCase().includes(search.toLowerCase()) ||
                    n.entityId?.toLowerCase().includes(search.toLowerCase());
                const matchesFilter = filter === 'ALL' || n.type === filter;
                return matchesSearch && matchesFilter;
            });
    }, [notifications, search, filter]);

    const sortedNotifications = useMemo(() => {
        return [...filteredNotifications].sort((a: any, b: any) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredNotifications, sortBy, sortOrder]);

    const totalPages = Math.ceil(sortedNotifications.length / itemsPerPage);
    const paginatedNotifications = useMemo(() => {
        return sortedNotifications.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [sortedNotifications, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filter, sortBy, sortOrder]);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'COHORT_ASSIGNMENT': return ShieldCheck;
            case 'REPORT_SUBMITTED': return FileText;
            case 'ROLE_UPDATE': return Zap;
            case 'SYSTEM_ALERT': return AlertTriangle;
            case 'COHORT_CREATED': return Layers;
            default: return History;
        }
    };

    const getStatusStyle = (type: string) => {
        switch (type) {
            case 'SYSTEM_ALERT': return 'text-destructive bg-destructive/10 border-destructive/20 neon-glow-destructive';
            case 'COHORT_CREATED': return 'text-success bg-success/10 border-success/20 neon-glow-success';
            case 'ROLE_UPDATE': return 'text-secondary bg-secondary/10 border-secondary/20 neon-glow-secondary';
            default: return 'text-primary bg-primary/10 border-primary/20 neon-glow-primary';
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[120px]" />
            </div>

            {/* Premium Hero Section */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 lg:p-12 shadow-2xl">
                <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
                <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-secondary/20 blur-[100px]" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05, x: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(-1)}
                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl text-white/50 transition-all hover:bg-white/10 hover:text-white"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </motion.button>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                                <ShieldCheck className="h-3 w-3" />
                                Governance & Compliance
                            </div>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-white">
                            Audit <span className="text-gradient">Command Center</span>
                        </h1>
                        <p className="max-w-xl text-lg text-slate-400 font-medium leading-relaxed">
                            Real-time synchronization of mission-critical platform events. Every modification is cryptographically tracked for operational transparency.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <GradientButton
                            variant="outline"
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                            onClick={handleRefresh}
                            icon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                        >
                            Sync Now
                        </GradientButton>
                        <GradientButton
                            variant="primary"
                            icon={<Download className="h-4 w-4" />}
                        >
                            Export Audit
                        </GradientButton>
                    </div>
                </div>
            </section>

            {/* Control Panel */}
            <div className="relative z-10 grid gap-4 lg:grid-cols-4">
                <div className="lg:col-span-3">
                    <GlassCard className="p-2 bg-card/30 border-border/30 rounded-2xl">
                        <div className="flex flex-col md:flex-row items-center gap-2">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search by operation, entity ID, or compliance subject..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-transparent border-none focus:ring-0 pl-12 h-12 text-sm font-medium text-foreground placeholder:text-muted-foreground/50"
                                />
                            </div>
                            <div className="flex items-center gap-4 px-2">
                                <div className="relative group">
                                    <select
                                        value={`${sortBy}-${sortOrder}`}
                                        onChange={(e) => {
                                            const [key, order] = e.target.value.split('-');
                                            setSortBy(key);
                                            setSortOrder(order as 'asc' | 'desc');
                                        }}
                                        className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest text-muted-foreground focus:ring-0 appearance-none pr-8 cursor-pointer hover:text-primary transition-colors"
                                    >
                                        <option value="createdAt-desc">Newest</option>
                                        <option value="createdAt-asc">Oldest</option>
                                        <option value="title-asc">Title</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                </div>
                                <div className="h-4 w-px bg-border/40" />
                                <div className="flex items-center gap-1.5 p-1 bg-background/40 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                                    {['ALL', 'COHORT_CREATED', 'REPORT_SUBMITTED', 'ROLE_UPDATE', 'SYSTEM_ALERT'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setFilter(t)}
                                            className={`
                                                whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-bold transition-all duration-300 uppercase tracking-widest
                                                ${filter === t
                                                    ? 'bg-primary text-primary-foreground shadow-glow-cyan'
                                                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                                                }
                                            `}
                                        >
                                            {t === 'ALL' ? 'Everything' : t.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
                <GlassCard className="p-4 flex items-center justify-between bg-card/30 border-border/30 rounded-2xl">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Stream</p>
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-glow-cyan" />
                            {filteredNotifications.length} Events Logged
                        </div>
                    </div>
                    <ActivityIcon className="h-6 w-6 text-primary/50" />
                </GlassCard>
            </div>

            {/* Main Stream */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="relative z-10 space-y-8 pl-8 sm:pl-12"
            >
                {/* Timeline Line */}
                <div className="absolute left-4 sm:left-6 top-4 bottom-4 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />

                <AnimatePresence mode="popLayout">
                    {paginatedNotifications.length > 0 ? (
                        paginatedNotifications.map((n) => {
                            const Icon = getActivityIcon(n.type);
                            const statusStyle = getStatusStyle(n.type);

                            return (
                                <motion.div
                                    key={n.id}
                                    variants={item}
                                    layout
                                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                    className="group relative"
                                >
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-8 sm:-left-12 top-8 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-primary/50 shadow-[0_0_10px_rgba(34,211,238,0.3)] z-10">
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    </div>

                                    {/* Connector to Card */}
                                    <div className="absolute -left-8 sm:-left-12 top-10 w-8 sm:w-12 h-px bg-primary/20" />

                                    <div className="relative rounded-3xl border border-white/5 bg-card/40 backdrop-blur-2xl p-6 transition-all duration-500 hover:bg-card/60 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] overflow-hidden">
                                        {/* Background Glow */}
                                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />

                                        <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6">
                                            {/* Event Badge */}
                                            <div className={`flex flex-shrink-0 h-14 w-14 items-center justify-center rounded-2xl border bg-background/50 backdrop-blur-md transition-all duration-500 group-hover:rotate-12 ${statusStyle}`}>
                                                <Icon className="h-7 w-7" />
                                            </div>

                                            {/* Content Area */}
                                            <div className="flex-1 space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                                                            {n.title}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                                                            <span className="flex items-center gap-1.5 text-muted-foreground bg-muted/20 px-2 py-1 rounded-md">
                                                                <Clock className="h-3.5 w-3.5 text-primary/70" />
                                                                {format(new Date(n.createdAt), 'HH:mm')} <span className="text-muted-foreground/40">|</span> {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 text-muted-foreground bg-muted/20 px-2 py-1 rounded-md">
                                                                <Tag className="h-3.5 w-3.5 text-secondary/70" />
                                                                ID: <span className="font-mono text-foreground/80">{n.entityId || 'SYS-AUTO'}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!n.isRead && (
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                            </span>
                                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">LIVE</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-muted-foreground leading-relaxed text-sm font-medium border-l-2 border-primary/10 pl-4 py-1 group-hover:border-primary/30 transition-colors">
                                                    {n.message}
                                                </p>
                                            </div>

                                            {/* Action Zone */}
                                            <div className="flex items-center gap-2 pt-2 md:pt-0">
                                                {n.link && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.05, x: 5 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => navigate(n.link!)}
                                                        className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 text-xs font-bold transition-all text-primary"
                                                    >
                                                        Details
                                                        <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                                    </motion.button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-32 flex flex-col items-center justify-center text-center space-y-4"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 blur-xl" />
                                <div className="relative h-24 w-24 rounded-full bg-card/40 border border-border/50 flex items-center justify-center">
                                    <ActivityIcon className="h-12 w-12 text-muted-foreground/30" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-foreground">Operational Silence</h3>
                                <p className="text-muted-foreground max-w-sm font-medium">
                                    No audit logs detected in the current stream. The platform is synchronized and stable.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-border/10 ml-4 sm:ml-8">
                        <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                            Showing <span className="text-foreground">{paginatedNotifications.length}</span> of <span className="text-foreground">{sortedNotifications.length}</span> atomic events
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border/40 hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="flex gap-2">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={cn(
                                            "h-10 w-10 rounded-xl border font-bold text-xs transition-all",
                                            currentPage === i + 1
                                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
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
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border/40 hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
