import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { GradientButton } from '@/components/ui/GradientButton';
import { Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { reportApi } from '@/reportApi';

interface GlobalExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export const GlobalExportModal = ({ isOpen, onClose }: GlobalExportModalProps) => {
    const [mode, setMode] = useState<'month' | 'range'>('month');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (mode === 'range' && (!startDate || !endDate)) {
            toast.error('Please select both start and end dates');
            return;
        }

        setIsDownloading(true);
        try {
            const params = mode === 'month'
                ? { month: selectedMonth, year: selectedYear }
                : { startDate, endDate };

            const response = await reportApi.exportGlobalReport(params);

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const filename = mode === 'month'
                ? `Global_Report_${selectedYear}_${selectedMonth.toString().padStart(2, '0')}.xlsx`
                : `Global_Report_${startDate}_to_${endDate}.xlsx`;

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            toast.success('Report downloaded successfully');
            onClose();
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download global report');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md border-border/50 bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                            <Download className="h-5 w-5 text-primary" />
                        </div>
                        Executive Global Export
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                        Aggregate effort logs across all mission nodes for organizational auditing.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex p-1 bg-muted/50 rounded-xl border border-border/50 mb-4 mt-2">
                    <button
                        onClick={() => setMode('month')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === 'month' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'
                            }`}
                    >
                        Monthly Snapshot
                    </button>
                    <button
                        onClick={() => setMode('range')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === 'range' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'
                            }`}
                    >
                        Custom Range
                    </button>
                </div>

                <div className="grid gap-6 py-2">
                    {mode === 'month' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                                    Target Month
                                </label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="input-premium w-full bg-background/50 py-3"
                                >
                                    {months.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                                    Target Year
                                </label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="input-premium w-full bg-background/50 py-3"
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 text-[10px]">
                            <div className="space-y-2">
                                <label className="font-bold uppercase tracking-widest text-muted-foreground/70">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="input-premium w-full bg-background/50 py-3 px-4"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="font-bold uppercase tracking-widest text-muted-foreground/70">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="input-premium w-full bg-background/50 py-3 px-4"
                                />
                            </div>
                        </div>
                    )}

                    <div className="relative group overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-4 transition-all hover:bg-primary/10">
                        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/10 blur-xl group-hover:bg-primary/20" />
                        <div className="relative flex gap-4 text-sm text-foreground/80">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <p className="leading-relaxed">
                                {mode === 'month' ? (
                                    <>
                                        Aggregating global effort data for
                                        <span className="block font-bold text-primary mt-1">
                                            {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        Auditing organizational logs from
                                        <span className="block font-bold text-primary mt-1">
                                            {startDate || '...'} to {endDate || '...'}
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <GradientButton variant="ghost" onClick={onClose} className="font-bold uppercase tracking-widest text-[10px]">
                        Abort
                    </GradientButton>
                    <GradientButton
                        variant="primary"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        icon={!isDownloading && <Download className="h-4 w-4" />}
                    >
                        {isDownloading ? 'Compiling Data...' : 'Download Sheet'}
                    </GradientButton>
                </div>
            </DialogContent>
        </Dialog>
    );
};
