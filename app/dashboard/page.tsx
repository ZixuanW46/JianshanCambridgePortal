"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Application } from "@/lib/types";
import { dbService } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import { Check, Clock, FileText, Calendar, Mail, Loader2, ArrowRight, Flag, PenTool, User, Eye, FilePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function formatDate(dateStr?: string) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function getRelativeTime(dateStr?: string) {
    if (!dateStr) return '';
    const now = new Date();
    const updated = new Date(dateStr);
    const diff = now.getTime() - updated.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `Updated ${Math.max(1, minutes)} min ago`;
    if (hours < 24) return `Updated ${hours}h ago`;
    if (days < 7) return `Updated ${days}d ago`;
    if (days < 30) return `Updated ${Math.floor(days / 7)}w ago`;
    return `Updated ${Math.floor(days / 30)}mo ago`;
}

function ProgressTimeline({ app }: { app: Application }) {
    const { status, submittedAt, createdAt } = app;
    const isSubmitted = status !== 'draft';
    const isUnderReview = ['under_review', 'accepted', 'rejected', 'waitlisted'].includes(status);
    const isDecided = ['accepted', 'rejected', 'waitlisted'].includes(status);

    const steps = [
        { title: "Account Created", completed: true, date: createdAt ? `Completed ${formatDate(createdAt)}` : "Completed", active: false },
        { title: "Application Form", completed: isSubmitted, date: isSubmitted ? "Completed" : "In progress...", active: !isSubmitted },
        { title: "Submitted", completed: isSubmitted, date: isSubmitted ? `Submitted ${formatDate(submittedAt)}` : "Pending", active: false },
        { title: "Under Review", completed: isDecided, date: isDecided ? "Review complete" : isUnderReview ? "Being reviewed..." : "Waiting", active: isUnderReview && !isDecided },
        { title: "Decision", completed: isDecided, date: isDecided ? `Result: ${status}` : "Expected within 15 working days", active: false, isFinal: true },
    ];

    return (
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Application Progress</h3>
            <div className="grid grid-cols-[40px_1fr] gap-x-4">
                {steps.map((step, i) => (
                    <div key={step.title} className="contents">
                        <div className="flex flex-col items-center gap-1 pt-1">
                            {step.completed ? (
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white z-10">
                                    <Check size={18} strokeWidth={3} />
                                </div>
                            ) : step.active ? (
                                <div className="w-8 h-8 rounded-full border-[3px] border-amber-400 bg-white z-10 shadow-[0_0_12px_rgba(225,177,104,0.4)] flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
                                </div>
                            ) : step.isFinal ? (
                                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center z-10">
                                    <Flag size={14} className="text-slate-400" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center z-10">
                                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                                </div>
                            )}
                            {i < steps.length - 1 && (
                                <div className={cn("w-[2px] h-full min-h-[40px]", step.completed ? "bg-blue-600" : "bg-slate-200")} />
                            )}
                        </div>
                        <div className={cn("flex flex-col", i < steps.length - 1 ? "pb-8" : "pb-0", "pt-1")}>
                            <p className={cn("text-base font-semibold", step.active ? "text-amber-600" : step.completed ? "text-slate-900" : "text-slate-400")}>
                                {step.title}
                            </p>
                            <p className="text-sm text-slate-500">{step.date}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ApplicationDetails({ app }: { app: Application }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
                <h3 className="text-sm font-bold tracking-wider text-slate-500 uppercase">Application Info</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                        <p className="text-xs uppercase font-bold text-slate-400">Applicant</p>
                        <p className="text-sm font-medium text-slate-900">
                            {app.personalInfo?.firstName || app.personalInfo?.lastName
                                ? `${app.personalInfo.firstName} ${app.personalInfo.lastName}`.trim()
                                : <span className="italic text-slate-400">Not filled in</span>}
                        </p>
                    </div>
                </div>
                <div className="h-px bg-slate-100 w-full" />
                <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                        <p className="text-xs uppercase font-bold text-slate-400">Application ID</p>
                        <p className="text-sm font-medium font-mono text-slate-900">#{app.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>
                <div className="h-px bg-slate-100 w-full" />
                <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                        <p className="text-xs uppercase font-bold text-slate-400">Submitted</p>
                        <p className="text-sm font-medium text-slate-900">{app.submittedAt ? formatDate(app.submittedAt) : 'N/A'}</p>
                    </div>
                </div>
            </div>
            <div className="p-4 border-t bg-slate-50">
                {app.status === 'draft' ? (
                    <Button variant="outline" className="w-full font-semibold" asChild>
                        <Link href="/apply">
                            <FilePen className="mr-2 h-4 w-4" /> Edit Application
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" className="w-full font-semibold" asChild>
                        <Link href="/apply">
                            <Eye className="mr-2 h-4 w-4" /> View Application
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
            try {
                const myApp = await dbService.getMyApplication(user.uid);
                setApp(myApp);
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
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user || !app) return null;

    const statusConfig: Record<string, { badge: string; badgeClass: string; title: string; description: string }> = {
        draft: { badge: "In Progress", badgeClass: "bg-blue-100 text-blue-700", title: "Your application is in progress ✍️", description: "Please complete and submit your application form as soon as possible." },
        submitted: { badge: "Submitted", badgeClass: "bg-blue-100 text-blue-700", title: "Application submitted! 📤", description: "Thank you for submitting. We'll begin reviewing your application shortly." },
        under_review: { badge: "Under Review", badgeClass: "bg-amber-100 text-amber-700", title: "Your application is being reviewed 👀", description: "Our team is currently reviewing your application. You'll hear from us within 15 working days." },
        accepted: { badge: "Accepted! 🎉", badgeClass: "bg-green-100 text-green-700", title: "Congratulations, you've been accepted! 🎉", description: "Welcome to the Cambridge Tutor Programme. Please check your email for next steps." },
        rejected: { badge: "Not Accepted", badgeClass: "bg-red-100 text-red-700", title: "Application Update", description: "Unfortunately, we are unable to offer you a place this time. We encourage you to apply again in future." },
        waitlisted: { badge: "Waitlisted", badgeClass: "bg-orange-100 text-orange-700", title: "You're on the waitlist", description: "You've been placed on our waitlist. We'll notify you if a position becomes available." },
    };

    const config = statusConfig[app.status] || statusConfig.draft;

    return (
        <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Application Dashboard</h1>
                    <p className="text-slate-500 text-lg mt-1">Track your tutor application progress</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* Status Card */}
                        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-3">
                                <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", config.badgeClass)}>
                                    {config.badge}
                                </span>
                                <span className="text-xs text-slate-400">{getRelativeTime(app.lastUpdatedAt)}</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{config.title}</h2>
                            <p className="text-slate-600 leading-relaxed">{config.description}</p>

                            {app.status === 'draft' && (
                                <div className="mt-6 pt-4 border-t">
                                    <Button size="lg" asChild>
                                        <Link href="/apply">
                                            Continue Application <ArrowRight className="ml-2 h-5 w-5" strokeWidth={2.5} />
                                        </Link>
                                    </Button>
                                </div>
                            )}

                            {app.status === 'accepted' && (
                                <div className="mt-6 pt-4 border-t">
                                    <Button size="lg" className="bg-green-600 hover:bg-green-700" asChild>
                                        <Link href="/acceptance">
                                            View Offer Details <ArrowRight className="ml-2 h-5 w-5" />
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>

                        <ProgressTimeline app={app} />
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <ApplicationDetails app={app} />

                        {/* Contact Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                                <p className="text-sm text-white/80 mb-4">
                                    Check our <Link href="/faq" className="font-bold hover:underline">FAQ page</Link> first,
                                    or reach out to our admissions team.
                                </p>
                                <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" asChild>
                                    <a href="mailto:tutors@jianshanacademy.com">
                                        <Mail className="mr-1.5 h-4 w-4" /> Contact Us
                                    </a>
                                </Button>
                            </div>
                            <div className="absolute -right-6 -bottom-10 opacity-10 rotate-12 pointer-events-none">
                                <Mail className="h-[120px] w-[120px]" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
