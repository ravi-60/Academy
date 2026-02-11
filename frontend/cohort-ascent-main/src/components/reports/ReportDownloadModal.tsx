import { useState, useEffect } from 'react';
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
    AlertCircle
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

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/40 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-2xl"
                >
                    <GlassCard className="relative overflow-hidden border-primary/20 shadow-2xl">
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
                                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Layout className="h-3 w-3" /> Select Target Cohort
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {cohorts.map((cohort) => (
                                            <button
                                                key={cohort.id}
                                                onClick={() => setSelectedCohortId(cohort.id)}
                                                className={cn(
                                                    "flex flex-col items-start p-4 rounded-2xl border transition-all text-left group",
                                                    selectedCohortId === cohort.id
                                                        ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] ring-1 ring-primary/20"
                                                        : "bg-muted/5 border-border/40 hover:border-primary/40 hover:bg-muted/10"
                                                )}
                                            >
                                                <span className={cn(
                                                    "text-xs font-black uppercase tracking-widest mb-1",
                                                    selectedCohortId === cohort.id ? "text-primary" : "text-muted-foreground"
                                                )}>
                                                    {cohort.skill}
                                                </span>
                                                <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{cohort.code}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Date Range */}
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Calendar className="h-3 w-3" /> Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-background/40 border border-border/40 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Calendar className="h-3 w-3" /> End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-background/40 border border-border/40 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                        />
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
        </AnimatePresence>
    );
};
