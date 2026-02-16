import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Download,
    FileText,
    Table as TableIcon,
    Calendar,
    ChevronRight,
    CheckCircle2,
    Layout,
    Clock,
    ShieldCheck,
    AlertCircle,
    Sparkles,
    ArrowLeft,
    Target,
    Zap
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useCohorts } from '@/hooks/useCohortsBackend';
import { reportApi } from '@/reportApi';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReportDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCohortId?: number | null;
}

export const ReportDownloadModal = ({ isOpen, onClose, initialCohortId }: ReportDownloadModalProps) => {
    const { data: cohorts = [] } = useCohorts();
    const [selectedCohortId, setSelectedCohortId] = useState<number | null>(initialCohortId || null);
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [formatType, setFormatType] = useState<'PDF' | 'EXCEL'>('PDF');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (isOpen && initialCohortId) {
            setSelectedCohortId(initialCohortId);
        }
    }, [isOpen, initialCohortId]);

    const selectedCohort = cohorts.find(c => c.id === selectedCohortId);

    const handleDownload = async () => {
        if (!selectedCohortId) {
            toast.error('Please select a cohort');
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading(`Generating executive ${formatType} report...`);

        try {
            const response = await reportApi.exportReport({
                cohortId: selectedCohortId,
                startDate,
                endDate,
                format: formatType
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const extension = formatType === 'EXCEL' ? 'xlsx' : 'pdf';
            link.setAttribute('download', `Executive_Report_${selectedCohort?.code}_${format(new Date(), 'yyyyMMdd')}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Report downloaded successfully', { id: toastId });
            onClose();
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to generate report. Please verify data exists for selected range.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Unified Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl"
                >
                    <GlassCard className="relative overflow-hidden border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-slate-900/90 backdrop-blur-2xl">
                        {/* Header Gradient */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-neon-blue to-primary opacity-80" />

                        <div className="p-8">
                            {/* Top Navigation */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                                        <Download className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-foreground tracking-tight">Executive Export</h2>
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-70">Boardroom-Ready Governance Reports</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <X className="h-5 w-5 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="grid gap-8">
                                {/* 1. Cohort Selection */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.25em] flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),1)]" />
                                        Intelligence Node
                                    </label>

                                    <AnimatePresence mode="wait">
                                        {selectedCohort && (
                                            <motion.div
                                                key="selected"
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="relative group p-6 rounded-[2rem] bg-slate-950/40 border border-primary/20 shadow-inner"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
                                                        <Layout className="h-8 w-8" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="text-2xl font-black text-white tracking-tighter leading-none">{selectedCohort.code}</h4>
                                                            <Sparkles className="h-3.5 w-3.5 text-primary/40" />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">
                                                                {selectedCohort.skill}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{selectedCohort.bu} NODE</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 2. Date Range */}
                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-primary/60" /> Start Cycle
                                        </label>
                                        <div className="relative group/date">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full bg-background/40 border border-border/40 rounded-[1.25rem] px-5 py-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono"
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-hover/date:opacity-100 transition-opacity">
                                                <Target className="h-4 w-4 text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-primary/60" /> Termination
                                        </label>
                                        <div className="relative group/date">
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full bg-background/40 border border-border/40 rounded-[1.25rem] px-5 py-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono"
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-hover/date:opacity-100 transition-opacity">
                                                <Zap className="h-4 w-4 text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Format Selection */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                        <ShieldCheck className="h-3 w-3" /> Report Format
                                    </label>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setFormatType('PDF')}
                                            className={cn(
                                                "flex-1 flex items-center gap-4 p-5 rounded-2xl border transition-all",
                                                formatType === 'PDF'
                                                    ? "bg-red-500/10 border-red-500/50 shadow-lg ring-1 ring-red-500/20"
                                                    : "bg-muted/5 border-border/40 hover:bg-muted/10 opacity-60"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-3 rounded-xl",
                                                formatType === 'PDF' ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground"
                                            )}>
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-foreground">Premium PDF</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Boardroom Ready</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setFormatType('EXCEL')}
                                            className={cn(
                                                "flex-1 flex items-center gap-4 p-5 rounded-2xl border transition-all",
                                                formatType === 'EXCEL'
                                                    ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg ring-1 ring-emerald-500/20"
                                                    : "bg-muted/5 border-border/40 hover:bg-muted/10 opacity-60"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-3 rounded-xl",
                                                formatType === 'EXCEL' ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"
                                            )}>
                                                <TableIcon className="h-6 w-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-foreground">Styled Excel</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Data Analysis</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Action */}
                            <div className="mt-12 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4 text-muted-foreground">
                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter">
                                        <Clock className="h-3.5 w-3.5" /> Est. Time: ~3s
                                    </div>
                                    <div className="w-px h-3 bg-border/50" />
                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Immutable Log
                                    </div>
                                </div>

                                <GradientButton
                                    variant="primary"
                                    className="w-full sm:w-64 h-14 text-sm font-black tracking-widest shadow-neon-blue"
                                    onClick={handleDownload}
                                    disabled={isGenerating || !selectedCohortId}
                                    icon={isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Download className="h-4 w-4" />}
                                    iconPosition="right"
                                >
                                    {isGenerating ? "GENERATING..." : `GENERATE ${formatType} REPORT`}
                                </GradientButton>
                            </div>
                        </div>

                        {/* Disclaimer Footer */}
                        <div className="px-8 py-4 bg-muted/20 border-t border-border/30 flex items-center gap-2">
                            <AlertCircle className="h-3 w-3 text-muted-foreground/60" />
                            <p className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                This report is intended for internal training governance audits. Unauthorized distribution is prohibited.
                            </p>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};
