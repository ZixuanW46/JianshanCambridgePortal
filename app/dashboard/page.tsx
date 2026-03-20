"use client"

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Application } from "@/lib/types";
import { dbService } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import { Check, FileText, Calendar, Mail, Loader2, ArrowRight, Flag, User, Eye, FilePen, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeApplicationStatus } from "@/lib/application-status";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { SCHOLARSHIP_FAQ_URL } from "@/lib/constants";
import {
    formatOfferAcceptanceDeadline,
    isAcceptedPaid,
    isAcceptedPendingPayment,
} from "@/lib/offer-acceptance";

// --- Components ---

// Helper for formatting dates
function formatDate(dateStr?: string) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// Helper for relative time
function getRelativeTime(dateStr?: string) {
    if (!dateStr) return '';
    const now = new Date();
    const updated = new Date(dateStr);
    const diff = now.getTime() - updated.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
        return `Updated ${Math.max(1, minutes)} mins ago`;
    }

    if (hours < 24) {
        return `Updated ${Math.max(1, hours)} hours ago`;
    }

    if (days < 7) {
        return `Updated ${days} days ago`;
    }

    if (days < 30) {
        const weeks = Math.floor(days / 7);
        return `Updated ${weeks} weeks ago`;
    }

    const months = Math.floor(days / 30);
    return `Updated ${months} months ago`;
}

// Helper for expected decision date
function getExpectedDecisionDateText(dateStr?: string) {
    if (!dateStr) return 'within 1 month of submission';

    const date = new Date(dateStr);
    date.setDate(date.getDate() + 15);
    date.setMonth(date.getMonth() + 1);

    return 'by ' + date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
    });
}

type TimelineVisualState = 'completed' | 'current' | 'pending';

function getTimelineStepState(currentStage: number, stepStage: number): TimelineVisualState {
    if (currentStage > stepStage) return 'completed';
    if (currentStage === stepStage) return 'current';
    return 'pending';
}

function getTimelineStage(app: Application) {
    switch (normalizeApplicationStatus(app.status)) {
        case 'draft':
            return 2;
        case 'under_review':
            return 4;
        case 'shortlisted':
            return 5;
        case 'round_2_under_review':
            return 6;
        case 'accepted':
        case 'accepted_pending_payment':
        case 'accepted_paid':
        case 'payment_received':
        case 'offer_declined':
        case 'rejected':
        case 'waitlisted':
            return 7;
        default:
            return 2;
    }
}

function getTimelineNode(state: TimelineVisualState, completedIcon: ReactNode) {
    if (state === 'completed') {
        return (
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10">
                {completedIcon}
            </div>
        );
    }

    if (state === 'current') {
        return (
            <div className="size-8 rounded-full border-[3px] border-accent bg-white relative z-10 shadow-[0_0_15px_rgba(225,177,104,0.4)] flex items-center justify-center">
                <div className="size-2.5 bg-accent rounded-full animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="size-8 rounded-full bg-muted border-2 border-border flex items-center justify-center text-muted-foreground z-10">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/30"></div>
        </div>
    );
}

function ProgressTimeline({ app }: { app: Application }) {
    const { status, submittedAt, createdAt, decisionReleasedAt } = app;
    const currentStage = getTimelineStage(app);
    const completeApplicationState = getTimelineStepState(currentStage, 2);
    const applicationSubmittedState = getTimelineStepState(currentStage, 3);
    const initialReviewState = getTimelineStepState(currentStage, 4);
    const finalRoundSubmissionState = getTimelineStepState(currentStage, 5);
    const finalReviewState = getTimelineStepState(currentStage, 6);
    const finalDecisionState = getTimelineStepState(currentStage, 7);

    const isDecisionReleased = finalDecisionState === 'current' || finalDecisionState === 'completed';
    const isOfferAccepted = isAcceptedPendingPayment(status) || isAcceptedPaid(status);
    const showRound2Steps = currentStage >= 5;

    return (
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-foreground mb-6">Application Progress</h3>
            <div className="grid grid-cols-[40px_1fr] gap-x-4">

                {/* --- Step 1: Registration --- */}
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white">
                        <Check size={20} className="text-white" strokeWidth={3} />
                    </div>
                    {/* Vertical Line */}
                    <div className="w-[2px] bg-primary h-full min-h-[40px]"></div>
                </div>
                {/* Text Column */}
                <div className="flex flex-col pb-8">
                    <p className="text-base font-bold leading-normal text-foreground">Registration</p>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">
                        {createdAt ? `Completed on ${formatDate(createdAt)}` : "Completed"}
                    </p>
                </div>

                {/* --- Step 2: Filling Application --- */}
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                    {getTimelineNode(completeApplicationState, <Check size={20} className="text-white" strokeWidth={3} />)}
                    <div className={cn(
                        "w-[2px] h-full min-h-[40px]",
                        applicationSubmittedState === 'completed' || applicationSubmittedState === 'current' ? "bg-primary" : "bg-muted"
                    )}></div>
                </div>
                {/* Text Column */}
                <div className="flex flex-col pb-8 pt-1">
                    <p className={cn(
                        "text-base font-bold leading-normal",
                        completeApplicationState === 'current' ? "text-primary dark:text-accent" : "text-foreground"
                    )}>
                        Complete Application
                    </p>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">
                        {completeApplicationState === 'completed' ? "Completed" : "In Progress..."}
                    </p>
                </div>

                {/* --- Step 3: Application Submitted --- */}
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                    {getTimelineNode(applicationSubmittedState, <Check size={20} className="text-white" strokeWidth={3} />)}
                    <div className={cn(
                        "w-[2px] h-full min-h-[40px]",
                        initialReviewState === 'completed' || initialReviewState === 'current' ? "bg-primary" : "bg-muted"
                    )}></div>
                </div>
                {/* Text Column */}
                <div className="flex flex-col pb-8 pt-1">
                    <p className={cn(
                        "text-base font-bold leading-normal",
                        applicationSubmittedState === 'current' ? "text-primary dark:text-accent" :
                            applicationSubmittedState === 'pending' ? "text-muted-foreground" : "text-foreground"
                    )}>Application Submitted</p>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">
                        {applicationSubmittedState === 'pending' ? "Pending Submission" :
                            submittedAt ? `Submitted on ${formatDate(submittedAt)}` : "Submitted"}
                    </p>
                </div>

                {/* --- Step 4: Initial Review --- */}
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                    {getTimelineNode(initialReviewState, <Check size={20} className="text-white" strokeWidth={3} />)}
                    <div className={cn(
                        "w-[2px] h-full min-h-[40px]",
                        showRound2Steps && (finalRoundSubmissionState === 'completed' || finalRoundSubmissionState === 'current') ? "bg-primary" : "bg-muted"
                    )}></div>
                </div>
                {/* Text Column */}
                <div className="flex flex-col pb-8 pt-1">
                    <p className={cn(
                        "text-base font-bold leading-normal",
                        initialReviewState === 'current' ? "text-primary dark:text-accent" :
                            initialReviewState === 'pending' ? "text-muted-foreground" : "text-foreground"
                    )}>
                        Initial Review
                    </p>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">
                        {initialReviewState === 'current' ? "Reviewing round 1 application" :
                            initialReviewState === 'completed' ? "Review Completed" : "Awaiting Review"}
                    </p>
                </div>

                {/* Conditional Round 2 Steps */}
                {showRound2Steps && (
                    <>
                        {/* --- Step 4.5: Round 2 --- */}
                        {/* Icon Column */}
                        <div className="flex flex-col items-center gap-1 pt-1">
                            {getTimelineNode(finalRoundSubmissionState, <Check size={20} className="text-white" strokeWidth={3} />)}
                            <div className={cn(
                                "w-[2px] h-full min-h-[40px]",
                                finalReviewState === 'completed' || finalReviewState === 'current' ? "bg-primary" : "bg-muted"
                            )}></div>
                        </div>
                        {/* Text Column */}
                        <div className="flex flex-col pb-8 pt-1">
                            <p className={cn(
                                "text-base font-bold leading-normal",
                                finalRoundSubmissionState === 'current' ? "text-primary dark:text-accent" :
                                    finalRoundSubmissionState === 'pending' ? "text-muted-foreground" : "text-foreground"
                            )}>
                                Final Round Submission
                            </p>
                            <p className="text-sm text-muted-foreground font-normal leading-normal">
                                {finalRoundSubmissionState === 'current' ? "Please submit your teaching challenge" :
                                    finalRoundSubmissionState === 'completed' ? "Final Round Submitted" : "Teaching Challenge"}
                            </p>
                        </div>

                        {/* --- Step 4.75: Round 2 Review --- */}
                        <div className="flex flex-col items-center gap-1 pt-1">
                            {getTimelineNode(finalReviewState, <Check size={20} className="text-white" strokeWidth={3} />)}
                            <div className={cn(
                                "w-[2px] h-full min-h-[40px]",
                                finalDecisionState === 'current' || finalDecisionState === 'completed' ? "bg-primary" : "bg-muted"
                            )}></div>
                        </div>
                        <div className="flex flex-col pb-8 pt-1">
                            <p className={cn(
                                "text-base font-bold leading-normal",
                                finalReviewState === 'current' ? "text-primary dark:text-accent" :
                                    finalReviewState === 'pending' ? "text-muted-foreground" : "text-foreground"
                            )}>
                                Final Review
                            </p>
                            <p className="text-sm text-muted-foreground font-normal leading-normal">
                                {finalReviewState === 'current' ? "Reviewing your full application" :
                                    finalReviewState === 'completed' ? "Review Completed" : "Awaiting Round 2"}
                            </p>
                        </div>
                    </>
                )}

                {/* --- Step 5: Final Decision --- */}
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                    {isDecisionReleased ? (
                        isOfferAccepted ? (
                            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10">
                                <Check size={20} className="text-white" strokeWidth={3} />
                            </div>
                        ) : (
                            <div className="size-8 rounded-full bg-[#FFF8E6] border-[3px] border-[#E1B168] relative z-10 shadow-[0_0_15px_rgba(225,177,104,0.6)] flex items-center justify-center text-[#E1B168]">
                                <Flag size={16} className="text-[#E1B168] fill-[#E1B168] animate-pulse" />
                            </div>
                        )
                    ) : (
                        <div className="size-8 rounded-full bg-muted border-2 border-border flex items-center justify-center text-muted-foreground z-10">
                            <Flag size={18} />
                        </div>
                    )}
                    {isOfferAccepted && <div className="w-[2px] bg-primary h-full min-h-[40px]"></div>}
                </div>
                {/* Text Column */}
                <div className={cn("flex flex-col pt-1", isOfferAccepted ? "pb-8" : "pb-0")}>
                    <p className={cn(
                        "text-base font-bold leading-normal",
                        finalDecisionState === 'current' ? "text-primary dark:text-accent" :
                            isDecisionReleased ? "text-foreground" : "text-muted-foreground"
                    )}>
                        Final Decision
                    </p>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">
                        {isDecisionReleased
                            ? (decisionReleasedAt ? `Released on ${formatDate(decisionReleasedAt)}` : "Result Released")
                            : `Expected ${getExpectedDecisionDateText(submittedAt)}`}
                    </p>
                </div>

                {/* --- Step 6: Offer Accepted --- */}
                {isOfferAccepted && (
                    <>
                        <div className="flex flex-col items-center gap-1 pt-0">
                            <div className={cn(
                                "size-8 rounded-full relative z-10 flex items-center justify-center shadow-[0_0_15px_rgba(22,163,74,0.45)]",
                                isAcceptedPaid(status)
                                    ? "bg-green-50 border-[3px] border-green-600 text-green-600"
                                    : "bg-amber-50 border-[3px] border-amber-500 text-amber-600"
                            )}>
                                <Check size={20} className={cn(isAcceptedPaid(status) ? "text-green-600" : "text-amber-600")} strokeWidth={3} />
                            </div>
                        </div>
                        <div className="flex flex-col pb-0 pt-1">
                            <p className={cn(
                                "text-base font-bold leading-normal",
                                isAcceptedPaid(status) ? "text-green-700" : "text-amber-700"
                            )}>
                                {isAcceptedPaid(status) ? "Deposit Submitted" : "Offer Accepted"}
                            </p>
                            <p className="text-sm text-muted-foreground font-normal leading-normal">
                                {isAcceptedPaid(status) ? "Completed" : "Awaiting deposit and passport details"}
                            </p>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}

function ApplicationDetails({ app }: { app: Application }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-[#F9FAFC]">
                <h3 className="text-sm font-bold tracking-wider text-muted-foreground">Application Information</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                        <p className="text-xs uppercase font-bold text-muted-foreground">Name</p>
                        <p className="text-sm font-medium">{app.section1_personal?.full_name || <span className="italic text-muted-foreground">Not Filled</span>}</p>
                    </div>
                </div>
                <div className="h-px bg-border w-full"></div>
                <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                        <p className="text-xs uppercase font-bold text-muted-foreground">Application ID</p>
                        <p className="text-sm font-medium">#{app.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>
                <div className="h-px bg-border w-full"></div>
                <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                        <p className="text-xs uppercase font-bold text-muted-foreground">Submission Date</p>
                        <p className="text-sm font-medium">{app.submittedAt ? formatDate(app.submittedAt) : 'N/A'}</p>
                    </div>
                </div>
            </div>
            <div className="p-4 border-t bg-[#F9FAFC]">
                {app.status === 'draft' ? (
                    <Button variant="outline" className="w-full font-bold" asChild>
                        <Link href="/apply">
                            <FilePen className="mr-2 h-4 w-4" strokeWidth={2.5} />
                            Edit Application
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" className="w-full font-bold" asChild>
                        <Link href="/apply">
                            <Eye className="mr-2 h-4 w-4" strokeWidth={2.5} />
                            View Full Application
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

function PendingPaymentReminder({ app }: { app: Application }) {
    const deadline = formatOfferAcceptanceDeadline(app.decisionReleasedAt);

    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
                <div className="flex-1">
                    <h3 className="text-base font-bold text-amber-900">Complete your deposit and confirmation form</h3>
                    <p className="mt-2 text-sm leading-6 text-amber-900/90">
                        Your place is not secured yet. Please transfer the <strong>GBP 350 deposit</strong> and submit your passport details by <strong>{deadline}</strong>.
                    </p>
                    <div className="mt-4">
                        <Button asChild className="bg-amber-700 text-white hover:bg-amber-800">
                            <Link href="/acceptance/next-step">
                                Complete Next Step
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.replace("/");
            } else if (isAdmin) {
                router.replace("/admin/dashboard");
            }
        }
    }, [authLoading, user, isAdmin, router]);

    useEffect(() => {
        const fetchApp = async () => {
            if (!user) return;
            const uid = user.uid;
            try {
                const myApp = await dbService.getMyApplication(uid);
                setApp(myApp as Application);

                if (!myApp) {
                    router.replace("/welcome");
                    return;
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchApp();
    }, [user, router]);

    if (authLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || !app) return null;

    const isPendingPayment = isAcceptedPendingPayment(app.status);
    const isPaid = isAcceptedPaid(app.status);
    const normalizedStatus = normalizeApplicationStatus(app.status);

    return (
        <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Header Area */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black text-foreground">Application Status</h1>
                    <p className="text-muted-foreground text-lg">Track your Jianshan Scholarship application progress.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Main Content */}
                <div className="lg:col-span-8 flex flex-col gap-8">

                    <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border relative overflow-hidden group">
                        {/* Dynamic Backgrounds based on status */}
                        <div className={cn(
                            "absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl transition-all duration-700",
                            isPaid ? "bg-green-500/10" : isPendingPayment ? "bg-amber-500/10" : "bg-accent/10"
                        )} />

                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                {isPaid ? (
                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase">Offer Secured</span>
                                ) : isPendingPayment ? (
                                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase">Action Required</span>
                                ) : ['accepted', 'rejected', 'waitlisted'].includes(app.status) ? (
                                    <span className="px-3 py-1 rounded-full bg-accent text-primary text-xs font-bold uppercase">Update Received</span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-accent text-xs font-bold uppercase">In Progress</span>
                                )}
                                <span className="text-xs text-muted-foreground">{getRelativeTime(app.lastUpdatedAt)}</span>
                            </div>

                            {/* MAIN STATUS TEXT */}
                            {isPaid ? (
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">Deposit Submitted Successfully 🎉</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Thank you. We have received your confirmation details and transfer confirmation. Your place is marked as secured pending our final administrative review.
                                    </p>
                                </>
                            ) : isPendingPayment ? (
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">Offer Accepted, One Final Step Left</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        You have started the acceptance process, but your place is not secured yet. Please complete the deposit transfer and passport confirmation form before the deadline.
                                    </p>
                                    <div className="mt-4 pt-4 border-t flex gap-4">
                                        <Button size="lg" asChild>
                                            <Link href="/acceptance/next-step">
                                                Complete Deposit Step <ArrowRight className="ml-2 h-5 w-5" strokeWidth={3} />
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            ) : ['accepted', 'offer_declined', 'rejected', 'waitlisted'].includes(normalizedStatus || '') ? (
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">Application Result Released 🔔</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        The scholarship committee has finished reviewing your application. Please click below to view your decision and any required next steps.
                                    </p>
                                    <div className="mt-4 pt-4 border-t flex gap-4">
                                        <Button size="lg" asChild>
                                            <Link href="/result">
                                                View Application Result <ArrowRight className="ml-2 h-5 w-5" strokeWidth={3} />
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            ) : normalizedStatus === 'draft' ? (
                                // Draft State
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">Application In Progress ✍️</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Please complete your application form as soon as possible. We are looking forward to reviewing it!
                                    </p>
                                    <div className="mt-4 pt-4 border-t flex gap-4">
                                        <Button size="lg" asChild>
                                            <Link href="/apply">
                                                Continue Application <ArrowRight className="ml-2 h-5 w-5" strokeWidth={3} />
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            ) : normalizedStatus === 'shortlisted' ? (
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">You&apos;re Shortlisted! ✨</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Congratulations! You have been shortlisted for the final round. Please review the teaching brief and submit your session ideas, video introduction, and final confirmations.
                                    </p>
                                    <div className="mt-4 pt-4 border-t flex gap-4">
                                        <Button size="lg" asChild>
                                            <Link href="/apply-round2">
                                                Complete Final Round <ArrowRight className="ml-2 h-5 w-5" strokeWidth={3} />
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            ) : normalizedStatus === 'round_2_under_review' ? (
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">Final Round Under Review 👀</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        We have received your final round teaching challenge. Our team is reviewing it and we will release the final decision soon.
                                    </p>
                                </>
                            ) : (
                                // Default: Submitted or Under Review
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">Your application is under review 👀</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        We have received all your documents. You can expect to hear back {getExpectedDecisionDateText(app.submittedAt)}.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <ProgressTimeline app={app} />

                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {isPendingPayment && <PendingPaymentReminder app={app} />}
                    <ApplicationDetails app={app} />

                    {/* Contact Card */}
                    <div className="bg-primary rounded-xl p-6 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                            <p className="text-sm text-white/80 mb-4 opacity-90">Please check the <a href={SCHOLARSHIP_FAQ_URL} className="mx-1 font-bold hover:underline cursor-pointer">FAQ</a> first; if your issue is not resolved, feel free to contact our team.</p>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border-0">
                                        <Mail className="mr-1 h-4 w-4" strokeWidth={2.5} />
                                        Contact Us
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-center text-xl font-bold">Contact Team</DialogTitle>
                                        <DialogDescription className="text-center text-slate-500">
                                            Please feel free to reach out to us if you have any questions.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                        <Button className="bg-primary hover:bg-primary/90 text-white font-bold h-10 rounded-lg px-8" asChild>
                                            <a href="mailto:camcapy@cambridgesu.co.uk">
                                                <Mail className="mr-2 h-4 w-4" />
                                                Email Us
                                            </a>
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                        {/* Background Icon Decoration */}
                        <div className="absolute -right-6 -bottom-10 opacity-10 rotate-12 text-white pointer-events-none">
                            <Mail className="h-[120px] w-[120px]" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
