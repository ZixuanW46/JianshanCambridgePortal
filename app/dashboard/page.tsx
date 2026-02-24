"use client"

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Application } from "@/lib/types";
import { dbService } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import { Check, Clock, FileText, Calendar, Mail, Loader2, ArrowRight, CreditCard, Download, Flag, PenTool, User, Eye, FilePen, X, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";
import { OfferLetterTemplate } from "@/components/offer-letter-template";
import { generateOfferPdf } from "@/lib/generate-offer-pdf";

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

function ProgressTimeline({ app }: { app: Application }) {
    const { status, submittedAt, createdAt, decisionReleasedAt } = app;

    const isSubmitted = status !== 'draft';
    const isUnderReview = ['under_review', 'accepted', 'rejected', 'waitlisted', 'enrolled'].includes(status);
    const isDecisionReleased = ['accepted', 'rejected', 'waitlisted', 'enrolled'].includes(status);
    const isEnrolled = ['enrolled'].includes(status);

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
                    {isSubmitted ? (
                        <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10">
                            <Check size={20} className="text-white" strokeWidth={3} />
                        </div>
                    ) : (
                        <div className="size-8 rounded-full border-[3px] border-accent bg-white relative z-10 shadow-[0_0_15px_rgba(225,177,104,0.4)] flex items-center justify-center">
                            <div className="size-2.5 bg-accent rounded-full animate-pulse"></div>
                        </div>
                    )}
                    <div className={cn(
                        "w-[2px] h-full min-h-[40px]",
                        isSubmitted ? "bg-primary" : "bg-muted"
                    )}></div>
                </div>
                {/* Text Column */}
                <div className="flex flex-col pb-8 pt-1">
                    <p className={cn("text-base font-bold leading-normal")}>
                        Complete Application
                    </p>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">
                        {isSubmitted ? "Completed" : "In Progress..."}
                    </p>
                </div>

                {/* --- Step 3: Application Submitted --- */}
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                    {isSubmitted ? (
                        <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10">
                            <Check size={20} className="text-white" strokeWidth={3} />
                        </div>
                    ) : (
                        <div className="size-8 rounded-full bg-muted border-2 border-border flex items-center justify-center text-muted-foreground z-10">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/30"></div>
                        </div>
                    )}
                    <div className={cn(
                        "w-[2px] h-full min-h-[40px]",
                        isUnderReview ? "bg-primary" : "bg-muted"
                    )}></div>
                </div>
                {/* Text Column */}
                <div className="flex flex-col pb-8 pt-1">
                    <p className={cn("text-base font-bold leading-normal", !isSubmitted && "text-muted-foreground")}>Application Submitted</p>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">
                        {isSubmitted ? `Submitted on ${formatDate(submittedAt)}` : "Pending Submission"}
                    </p>
                </div>

                {/* --- Step 4: Under Review --- */}
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                    {isDecisionReleased ? (
                        <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10">
                            <Check size={20} className="text-white" strokeWidth={3} />
                        </div>
                    ) : isUnderReview ? (
                        <div className="size-8 rounded-full border-[3px] border-accent bg-white relative z-10 shadow-[0_0_15px_rgba(225,177,104,0.4)] flex items-center justify-center">
                            <div className="size-2.5 bg-accent rounded-full animate-pulse"></div>
                        </div>
                    ) : (
                        <div className="size-8 rounded-full bg-muted border-2 border-border flex items-center justify-center text-muted-foreground z-10">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/30"></div>
                        </div>
                    )}

                    <div className={cn(
                        "w-[2px] h-full min-h-[40px]",
                        isDecisionReleased ? "bg-primary" : "bg-muted"
                    )}></div>
                </div>
                {/* Text Column */}
                <div className="flex flex-col pb-8 pt-1">
                    <p className={cn(
                        "text-base font-bold leading-normal",
                        isUnderReview && !isDecisionReleased ? "text-primary dark:text-accent" :
                            !isUnderReview ? "text-muted-foreground" : "text-foreground"
                    )}>
                        Under Review
                    </p>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">
                        {isUnderReview && !isDecisionReleased ? "Our team is reviewing your application" :
                            isDecisionReleased ? "Review Completed" : "Awaiting Review"}
                    </p>
                </div>

                {/* --- Step 5: Final Decision --- */}
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                    {isDecisionReleased ? (
                        isEnrolled ? (
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

                    {isEnrolled && <div className="w-[2px] bg-primary h-full min-h-[40px]"></div>}
                </div>
                {/* Text Column */}
                <div className={cn("flex flex-col pt-1", isEnrolled ? "pb-8" : "pb-0")}>
                    <p className={cn(
                        "text-base font-bold leading-normal",
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
                {isEnrolled && (
                    <>
                        <div className="flex flex-col items-center gap-1 pt-0">
                            <div className="size-8 rounded-full bg-green-50 border-[3px] border-green-600 relative z-10 shadow-[0_0_15px_rgba(22,163,74,0.6)] flex items-center justify-center text-green-600">
                                <Check size={20} className="text-green-600" strokeWidth={3} />
                            </div>
                        </div>
                        <div className="flex flex-col pb-0 pt-1">
                            <p className="text-base font-bold leading-normal text-green-700">
                                Offer Accepted
                            </p>
                            <p className="text-sm text-muted-foreground font-normal leading-normal">
                                Completed
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
                        <p className="text-sm font-medium">{[app.personalInfo?.firstName, app.personalInfo?.lastName].filter(Boolean).join(' ') || <span className="italic text-muted-foreground">Not Filled</span>}</p>
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

export default function DashboardPage() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const offerLetterRef = useRef<HTMLDivElement>(null);

    const handleDownloadPdf = async () => {
        if (!offerLetterRef.current || !app) return;
        setDownloading(true);
        try {
            const fullName = [app.personalInfo?.firstName, app.personalInfo?.lastName].filter(Boolean).join(' ');
            await generateOfferPdf(offerLetterRef.current, fullName || "Applicant");
        } catch (err) {
            console.error("PDF generation failed:", err);
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login");
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
                let myApp = await dbService.getMyApplication(uid);
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

    return (
        <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Hidden Offer Letter Template for PDF generation */}
            {app && (app.status === 'accepted' || app.status === 'enrolled') && (
                <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                    <OfferLetterTemplate ref={offerLetterRef} application={app} />
                </div>
            )}

            {/* Header Area */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black text-foreground">Application Status</h1>
                    <p className="text-muted-foreground text-lg">Track your Cambridge Tutor application progress.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Main Content */}
                <div className="lg:col-span-8 flex flex-col gap-8">

                    <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border relative overflow-hidden group">
                        {/* Dynamic Backgrounds based on status */}
                        <div className={cn(
                            "absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl transition-all duration-700",
                            (app.status === 'enrolled') ? "bg-green-500/10" : "bg-accent/10"
                        )} />

                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                {app.status === 'enrolled' ? (
                                    <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-bold uppercase">Offer Accepted</span>
                                ) : ['accepted', 'rejected', 'waitlisted'].includes(app.status) ? (
                                    <span className="px-3 py-1 rounded-full bg-accent text-primary text-xs font-bold uppercase">Update Received</span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-accent text-xs font-bold uppercase">In Progress</span>
                                )}
                                <span className="text-xs text-muted-foreground">{getRelativeTime(app.lastUpdatedAt)}</span>
                            </div>

                            {/* MAIN STATUS TEXT */}
                            {app.status === 'enrolled' ? (
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">Enrollment Confirmed! 🎉</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Congratulations! You have accepted our offer. We are extremely excited to have you join our team this summer.
                                    </p>
                                    <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row gap-4">
                                        <Button variant="outline" size="lg" onClick={handleDownloadPdf} disabled={downloading}>
                                            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Download Offer Letter <Download className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                </>
                            ) : ['accepted', 'rejected', 'waitlisted'].includes(app.status) ? (
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">Application Result Released 🔔</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        The admissions team has finished reviewing your application. Please click below to view your decision.
                                    </p>
                                    <div className="mt-4 pt-4 border-t flex gap-4">
                                        <Button size="lg" asChild>
                                            <Link href="/acceptance">
                                                View Application Result <ArrowRight className="ml-2 h-5 w-5" strokeWidth={3} />
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            ) : app.status === 'draft' ? (
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
                    <ApplicationDetails app={app} />

                    {/* Contact Card */}
                    <div className="bg-primary rounded-xl p-6 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                            <p className="text-sm text-white/80 mb-4 opacity-90">Please check the <Link href="/faq" className="mx-1 font-bold hover:underline cursor-pointer">FAQ</Link> first; if your issue is not resolved, feel free to contact our team.</p>
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
                                            <a href="mailto:info@jianshanacademy.cn">
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
