import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
    Star,
    CheckCircle2,
    MessageSquare,
    Users,
    User,
    Calendar,
    AlertCircle,
    MousePointer2,
    Sparkles,
    ShieldCheck,
    ArrowRight,
    ArrowLeft,
    Check,
    Zap,
    Cpu,
    BrainCircuit,
    Layers,
    Rocket,
    Globe,
    Activity,
    Lock,
    Trophy
} from 'lucide-react';
import { useFeedbackSession, useSubmitFeedback } from '@/hooks/useFeedback';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { FloatingOrbs } from '@/components/ui/FloatingOrbs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- Atomic UI Library (Defined First for Scope) ---

const LoadingSequence = () => (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center overflow-hidden">
        <div className="relative">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="h-32 w-32 rounded-full border-b-2 border-primary shadow-[0_0_50px_rgba(0,243,255,0.2)]"
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Establishing Secure Uplink</p>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="h-full w-1/2 bg-primary shadow-glow-cyan"
                    />
                </div>
            </div>
        </div>
    </div>
);

const ErrorMatrix = ({ navigate }: { navigate: any }) => (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <GlassCard className="p-12 text-center max-w-sm border-destructive/20 bg-destructive/5 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-destructive/5 blur-3xl" />
            <div className="relative z-10">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-8 animate-bounce" />
                <h2 className="text-3xl font-black text-white mb-3 tracking-tighter">Connection Severed</h2>
                <p className="text-sm text-slate-500 mb-10 leading-relaxed font-medium">
                    The requested feedback synchronization node is currently inaccessible or has expired.
                </p>
                <GradientButton onClick={() => navigate('/')} className="w-full h-16 font-black uppercase tracking-widest">Abort & Exit</GradientButton>
            </div>
        </GlassCard>
    </div>
);

const SparkleSuccess = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
            <motion.div
                key={i}
                initial={{
                    top: "50%",
                    left: "50%",
                    opacity: 1,
                    scale: 0,
                    y: 0
                }}
                animate={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: 0,
                    scale: Math.random() * 2,
                    y: [0, -100, 0]
                }}
                transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    ease: "easeOut"
                }}
                className="absolute"
            >
                <Sparkles className="text-primary h-4 w-4 blur-[1px]" />
            </motion.div>
        ))}
    </div>
);

const FinalSuccessView = ({ navigate, token, cohortCode }: any) => {
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-12 relative min-h-[600px] flex flex-col items-center justify-center"
        >
            <SparkleSuccess />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-full -z-10">
                <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
            </div>

            <motion.div
                animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="h-40 w-40 rounded-[3.5rem] bg-gradient-to-br from-primary via-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_30px_90px_rgba(0,243,255,0.4)] relative z-20 mb-12"
            >
                <Trophy className="h-20 w-20 text-white drop-shadow-lg" />
            </motion.div>

            <div className="space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                    <ShieldCheck className="h-3 w-3" />
                    Protocol Synchronized
                </div>
                <h1 className="text-6xl font-black text-white tracking-tighter lg:text-7xl">Mission <span className="text-gradient">Success</span></h1>
                <p className="text-lg text-slate-400 max-w-md mx-auto font-medium leading-relaxed">
                    Your weekly intelligence report for <span className="text-white font-bold">{cohortCode}</span> has been securely committed and distributed.
                </p>
            </div>

            <div className="mt-16 space-y-8 relative z-10 w-full max-w-sm">
                <GradientButton
                    onClick={() => navigate('/')}
                    className="w-full h-18 text-lg font-black uppercase tracking-widest shadow-glow-cyan"
                >
                    Return to Dashboard
                </GradientButton>

                <div className="pt-8 border-t border-white/5 space-y-4">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">Encryption_Signature</p>
                    <code className="text-[10px] font-mono text-primary/40 break-all bg-white/[0.02] p-4 rounded-2xl block border border-white/5">
                        {token?.toUpperCase()}-{new Date().getTime()}
                    </code>
                </div>
            </div>
        </motion.div>
    );
};

const StepHeader = ({ title, description, icon: Icon }: any) => (
    <div className="flex items-center gap-6">
        <div className="h-14 w-14 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary shadow-inner shrink-0 group hover:scale-110 transition-transform duration-500">
            <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{description}</p>
        </div>
    </div>
);

const GlassRating = ({ label, value, onChange, description }: any) => (
    <div className="group relative p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300">
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/70">{label}</label>
                    <p className="text-[10px] text-slate-500">{description}</p>
                </div>
                <span className="text-xl font-black text-white/10 group-hover:text-primary transition-colors">{value || '--'}</span>
            </div>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => onChange(s)}
                        className={cn(
                            "h-10 flex-1 rounded-xl border transition-all duration-300",
                            value >= s
                                ? "bg-primary border-primary shadow-glow-cyan text-slate-950"
                                : "bg-white/5 border-white/5 text-slate-600 hover:border-white/10 hover:text-slate-400"
                        )}
                    >
                        <Star className={cn("h-4 w-4 mx-auto", value >= s ? "fill-slate-950" : "fill-transparent")} />
                    </button>
                ))}
            </div>
        </div>
    </div>
);

// --- Main Application ---

export const PublicFeedback = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { data: session, isLoading, error } = useFeedbackSession(token || '');
    const submitFeedback = useSubmitFeedback();

    const [step, setStep] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        candidateName: '',
        employeeId: '',
        isTechnicalSessionHeld: true,
        courseContentRating: 0,
        technicalKnowledgeRating: 0,
        trainerEngagementRating: 0,
        conceptsScheduleRating: 0,
        udemyRecapRating: 0,
        additionalScenarioRating: 0,
        technicalLowScoreExplanation: '',
        isMentorSessionHeld: true,
        mentorGuidanceRating: 0,
        mentorLowScoreExplanation: '',
        coachEffectivenessRating: 0,
        coachLowScoreExplanation: '',
        didBuddyMentorConnect: true,
        wereDoubtsClarified: true,
        buddyMentorGuidanceRating: 0,
        buddyMentorSuggestions: '',
        isBehavioralSessionHeld: true,
        behavioralDeliveryRating: 0,
        behavioralLowScoreExplanation: '',
        overallSatisfaction: 0,
    });

    const steps = [
        { id: 'auth', label: 'Auth', icon: Lock },
        { id: 'tech', label: 'Tech', icon: Zap },
        { id: 'logic', label: 'Logic', icon: BrainCircuit },
        { id: 'coach', label: 'Coach', icon: Activity },
        { id: 'buddy', label: 'Buddy', icon: Users },
        { id: 'flow', label: 'Flow', icon: Sparkles },
        { id: 'final', label: 'Commit', icon: Rocket },
    ];

    const nextStep = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStep(s => s + 1);
    };
    const prevStep = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStep(s => s - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        submitFeedback.mutate({ token, ...formData }, {
            onSuccess: () => {
                setIsSubmitted(true);
                toast.success("Intelligence Synchronization Complete");
            }
        });
    };

    if (isLoading) return <LoadingSequence />;
    if (error || !session) return <ErrorMatrix navigate={navigate} />;

    const cohort = session.request.cohort;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden font-sans selection:bg-primary/30">
            {/* Background Architecture */}
            <div className="fixed inset-0 pointer-events-none">
                <FloatingOrbs variant="landing" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(0,243,255,0.08),transparent_50%)]" />
                <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-primary/5 to-transparent" />
            </div>

            <main className="container relative z-10 mx-auto max-w-2xl px-6 py-12 lg:py-24">
                <AnimatePresence mode="wait">
                    {!isSubmitted ? (
                        <motion.div
                            key="feedback-form"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-12"
                        >
                            {/* Organization Header */}
                            <header className="space-y-6 text-center">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl"
                                >
                                    <Globe className="h-3 w-3 text-primary animate-spin-slow" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Project Ascent • Academy Review</span>
                                </motion.div>

                                <div className="space-y-1">
                                    <h1 className="text-5xl font-black tracking-tighter text-white lg:text-6xl">
                                        Cohort <span className="text-gradient drop-shadow-[0_0_20px_rgba(0,243,255,0.3)]">{cohort?.code}</span>
                                    </h1>
                                    <p className="text-sm text-slate-500 font-medium">Weekly Synchronization Phase {session.request.weekNumber}</p>
                                </div>

                                <nav className="flex items-center justify-center gap-1.5 max-w-xs mx-auto pt-4">
                                    {steps.map((s, i) => (
                                        <div key={s.id} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/5 border border-white/5">
                                            <motion.div
                                                className={cn("h-full", step >= i ? "bg-primary shadow-glow-cyan" : "bg-transparent")}
                                                initial={false}
                                                animate={{ width: step >= i ? "100%" : "0%" }}
                                                transition={{ duration: 0.8 }}
                                            />
                                        </div>
                                    ))}
                                </nav>
                            </header>

                            <form onSubmit={handleSubmit}>
                                <GlassCard className="p-8 lg:p-12 border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        {/* STEP 0: IDENTITY */}
                                        {step === 0 && (
                                            <motion.div key="st0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                                <StepHeader title="Identity Verification" description="Identify your candidate profile to begin sync." icon={Lock} />
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/60 ml-1">Associate Name</label>
                                                        <div className="relative group">
                                                            <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                                            <input
                                                                type="text"
                                                                value={formData.candidateName}
                                                                onChange={e => setFormData(p => ({ ...p, candidateName: e.target.value }))}
                                                                placeholder="Enter Full Name"
                                                                className="w-full h-16 pl-14 pr-6 bg-white/[0.02] border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/60 ml-1">Employee ID Protocol</label>
                                                        <div className="relative group">
                                                            <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                                            <input
                                                                type="text"
                                                                value={formData.employeeId}
                                                                onChange={e => setFormData(p => ({ ...p, employeeId: e.target.value }))}
                                                                placeholder="Enter Protocol ID"
                                                                className="w-full h-16 pl-14 pr-6 bg-white/[0.02] border border-white/5 rounded-2xl text-white font-mono uppercase tracking-widest outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <GradientButton
                                                    type="button"
                                                    onClick={nextStep}
                                                    disabled={!formData.candidateName || !formData.employeeId}
                                                    className="w-full h-18 text-lg font-black uppercase tracking-widest shadow-glow-cyan"
                                                >
                                                    <span className="flex items-center gap-3">Initialize Review <ArrowRight className="h-5 w-5" /></span>
                                                </GradientButton>
                                            </motion.div>
                                        )}

                                        {/* STEP 1: TECHNICAL */}
                                        {step === 1 && (
                                            <motion.div key="st1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                                <StepHeader title="Technical Assessment" description={`Review for ${cohort?.primaryTrainer?.name || 'Technical Trainer'}`} icon={Zap} />
                                                <ToggleControl label="Was a technical session held this week?" value={formData.isTechnicalSessionHeld} onChange={v => setFormData(p => ({ ...p, isTechnicalSessionHeld: v }))} />

                                                {formData.isTechnicalSessionHeld && (
                                                    <div className="grid gap-4">
                                                        <GlassRating label="Instruction Quality" value={formData.courseContentRating} onChange={v => setFormData(p => ({ ...p, courseContentRating: v }))} description="Clarity and depth of content delivered" />
                                                        <GlassRating label="Technical Domain" value={formData.technicalKnowledgeRating} onChange={v => setFormData(p => ({ ...p, technicalKnowledgeRating: v }))} description="Expertise and doubt resolution efficiency" />
                                                        <GlassRating label="Participant Interaction" value={formData.trainerEngagementRating} onChange={v => setFormData(p => ({ ...p, trainerEngagementRating: v }))} description="Engagement and active participation" />
                                                    </div>
                                                )}
                                                <PremiumTextArea label="Deep Feedback" value={formData.technicalLowScoreExplanation} onChange={v => setFormData(p => ({ ...p, technicalLowScoreExplanation: v }))} />
                                                <NavigationButtons onPrev={prevStep} onNext={nextStep} disableNext={formData.isTechnicalSessionHeld && (!formData.courseContentRating || !formData.technicalKnowledgeRating || !formData.trainerEngagementRating)} />
                                            </motion.div>
                                        )}

                                        {/* STEP 2-5: Placeholder logic (implemented fully in actual production code) */}
                                        {/* For the sake of this interactive demo and user request, I'll group mentor/coach/buddy into a streamlined flow if step > 1 and < 6 */}
                                        {step === 2 && (
                                            <motion.div key="st2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                                <StepHeader title="Mentorship Logic" description={`Mentoring review for ${cohort?.primaryMentor?.name || 'Unassigned'}`} icon={BrainCircuit} />
                                                <ToggleControl label="Did mentor sessions happen this week?" value={formData.isMentorSessionHeld} onChange={v => setFormData(p => ({ ...p, isMentorSessionHeld: v }))} />
                                                {formData.isMentorSessionHeld && (
                                                    <GlassRating label="Mentorship Impact" value={formData.mentorGuidanceRating} onChange={v => setFormData(p => ({ ...p, mentorGuidanceRating: v }))} description="Quality of practical inputs" />
                                                )}
                                                <PremiumTextArea label="Mentor Observations" value={formData.mentorLowScoreExplanation} onChange={v => setFormData(p => ({ ...p, mentorLowScoreExplanation: v }))} />
                                                <NavigationButtons onPrev={prevStep} onNext={nextStep} disableNext={formData.isMentorSessionHeld && !formData.mentorGuidanceRating} />
                                            </motion.div>
                                        )}

                                        {step === 3 && (
                                            <motion.div key="st3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                                <StepHeader title="Coach Performance" description={`Academy coaching review for ${cohort?.coach?.name || 'Academy Coach'}`} icon={Activity} />
                                                <GlassRating label="Coach Effectiveness" value={formData.coachEffectivenessRating} onChange={v => setFormData(p => ({ ...p, coachEffectivenessRating: v }))} description="Learning schedule support & methodology" />
                                                <PremiumTextArea label="Coach Interaction Log" value={formData.coachLowScoreExplanation} onChange={v => setFormData(p => ({ ...p, coachLowScoreExplanation: v }))} />
                                                <NavigationButtons onPrev={prevStep} onNext={nextStep} disableNext={!formData.coachEffectivenessRating} />
                                            </motion.div>
                                        )}

                                        {step === 4 && (
                                            <motion.div key="st4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                                <StepHeader title="Buddy Network" description={`Peer connectivity via ${cohort?.buddyMentor?.name || 'Buddy Mentor'}`} icon={Users} />
                                                <ToggleControl label="Did your buddy mentor connect?" value={formData.didBuddyMentorConnect} onChange={v => setFormData(p => ({ ...p, didBuddyMentorConnect: v }))} />
                                                <GlassRating label="Connection Value" value={formData.buddyMentorGuidanceRating} onChange={v => setFormData(p => ({ ...p, buddyMentorGuidanceRating: v }))} description="Impact of peer-to-peer logic clearing" />
                                                <PremiumTextArea label="Peer Suggestions" value={formData.buddyMentorSuggestions} onChange={v => setFormData(p => ({ ...p, buddyMentorSuggestions: v }))} />
                                                <NavigationButtons onPrev={prevStep} onNext={nextStep} disableNext={!formData.buddyMentorGuidanceRating} />
                                            </motion.div>
                                        )}

                                        {step === 5 && (
                                            <motion.div key="st5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                                <StepHeader title="Behavioral Training" description={`Soft skills sync with ${cohort?.behavioralTrainer?.name || 'Behavioral Trainer'}`} icon={Sparkles} />
                                                <ToggleControl label="Was behavioral sync active?" value={formData.isBehavioralSessionHeld} onChange={v => setFormData(p => ({ ...p, isBehavioralSessionHeld: v }))} />
                                                {formData.isBehavioralSessionHeld && (
                                                    <GlassRating label="Soft Skill Flow" value={formData.behavioralDeliveryRating} onChange={v => setFormData(p => ({ ...p, behavioralDeliveryRating: v }))} description="Communication and delivery effectiveness" />
                                                )}
                                                <PremiumTextArea label="Behavioral Notes" value={formData.behavioralLowScoreExplanation} onChange={v => setFormData(p => ({ ...p, behavioralLowScoreExplanation: v }))} />
                                                <NavigationButtons onPrev={prevStep} onNext={nextStep} disableNext={formData.isBehavioralSessionHeld && !formData.behavioralDeliveryRating} />
                                            </motion.div>
                                        )}

                                        {step === 6 && (
                                            <motion.div key="st6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                                                <StepHeader title="Final Synchronization" description="Lock in your overall weekly performance review." icon={Rocket} />

                                                <div className="space-y-8">
                                                    <div className="p-10 rounded-[3.5rem] bg-primary/5 border border-primary/10 text-center space-y-6">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Consolidated Rating</p>
                                                            <div className="text-7xl font-black text-white italic drop-shadow-glow-cyan">{formData.overallSatisfaction || '0'}<span className="text-2xl text-primary/40">/5</span></div>
                                                        </div>
                                                        <div className="flex justify-center gap-3">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <button
                                                                    key={s}
                                                                    type="button"
                                                                    onClick={() => setFormData(p => ({ ...p, overallSatisfaction: s }))}
                                                                    className={cn(
                                                                        "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                                        formData.overallSatisfaction >= s ? "bg-primary text-slate-950 shadow-glow-cyan" : "bg-white/5 text-slate-500"
                                                                    )}
                                                                >
                                                                    <Star className={cn("h-7 w-7", formData.overallSatisfaction >= s ? "fill-slate-950" : "fill-transparent")} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={prevStep}
                                                            className="flex-1 h-18 rounded-3xl border border-white/5 bg-white/5 text-slate-500 font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                                                        >
                                                            Recalibrate
                                                        </button>
                                                        <GradientButton
                                                            type="submit"
                                                            isLoading={submitFeedback.isPending}
                                                            className="flex-[2] h-18 text-lg font-black uppercase tracking-widest shadow-glow-cyan"
                                                        >
                                                            Commit Review
                                                        </GradientButton>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </GlassCard>
                            </form>
                        </motion.div>
                    ) : (
                        <FinalSuccessView navigate={navigate} token={token} cohortCode={cohort?.code || 'Academy Node'} />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

// --- Atomic Helper Components ---

const ToggleControl = ({ label, value, onChange }: any) => (
    <div className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5">
        <span className="text-xs font-black uppercase tracking-widest text-slate-300">{label}</span>
        <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5">
            {[true, false].map((v) => (
                <button
                    key={v.toString()}
                    type="button"
                    onClick={() => onChange(v)}
                    className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        value === v ? "bg-primary text-slate-950 shadow-glow-cyan" : "text-slate-600"
                    )}
                >
                    {v ? 'Yes' : 'No'}
                </button>
            ))}
        </div>
    </div>
);

const NavigationButtons = ({ onPrev, onNext, disableNext }: any) => (
    <div className="flex gap-4 pt-4">
        <button
            type="button"
            onClick={onPrev}
            className="h-16 px-8 rounded-2xl border border-white/5 bg-white/5 text-slate-500 hover:text-white"
        >
            <ArrowLeft className="h-5 w-5" />
        </button>
        <GradientButton
            type="button"
            onClick={onNext}
            disabled={disableNext}
            className="flex-1 h-16 text-lg font-black uppercase tracking-widest"
        >
            <span className="flex items-center justify-center gap-2">Proceed <ArrowRight className="h-4 w-4" /></span>
        </GradientButton>
    </div>
);

const PremiumTextArea = ({ label, value, onChange }: any) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1">{label}</label>
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Document specific observations..."
            className="w-full h-32 p-6 bg-white/[0.02] border border-white/5 rounded-3xl text-sm font-medium text-white outline-none focus:border-primary/50 transition-all resize-none placeholder:text-slate-700"
        />
    </div>
);
