"use client"

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { Application } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Calendar, MapPin, CheckCircle, Clock3, CircleX, ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";
import {
    formatHumanDate,
    formatOfferAcceptanceDeadline,
    getFirstName,
    isAcceptedFlowStatus,
    isOfferDeclined,
} from "@/lib/offer-acceptance";

type ResultStatus = "accepted" | "offer_declined" | "waitlisted" | "rejected" | "unavailable";

function getResultStatus(app: Application | null): ResultStatus {
    if (!app) return "unavailable";
    if (isAcceptedFlowStatus(app.status)) return "accepted";
    if (isOfferDeclined(app.status)) return "offer_declined";
    if (app.status === "waitlisted") return "waitlisted";
    if (app.status === "rejected") return "rejected";
    return "unavailable";
}

function ResultLayout({
    badge,
    title,
    icon,
    children,
    signature,
    decisionDate,
    footer,
}: {
    badge: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    signature: string;
    decisionDate: string;
    footer?: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background font-sans text-primary selection:bg-accent/30">
            <div className="absolute inset-0 z-0 h-full w-full overflow-hidden opacity-60 pointer-events-none">
                {[...Array(25)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute h-2 w-2 rounded-full opacity-70 blur-[0.5px]"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            backgroundColor: i % 2 === 0 ? "#1f495b" : "#E1B168",
                            animation: `float ${3 + Math.random() * 5}s ease-in-out infinite`,
                        }}
                    />
                ))}
            </div>

            <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col p-0 sm:flex-row sm:p-6 lg:p-8">
                <div className="relative hidden min-h-full flex-1 overflow-hidden rounded-l-xl shadow-lg ring-1 ring-black/5 sm:flex">
                    <img
                        alt="Jianshan Scholarship"
                        className="absolute inset-0 h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCuUqwmHBGdIOg3WSt4FwDAVaXjhnBxr-mAef67xD8dKtAaL3X3a1palYLDGX4hKk9q9R69KSx69I2t5j8VDH06QlJHDT1M-Y4x-EKN2ulnwGk3RIBjHV6VPHIil1LlWSSigayFCQ923eTMP1-o8eXB9cIkbakUkUa6VkX2PAsEODLtUybj1KUwWNUK6r0iLh8GTyeBnzw76wy5NixuhBE3GfeDB1IheV9hy_daQWv-aXiEYGmUyDD4uj2OXhKuhkOMCmEF-DpB0Eb"
                    />
                </div>

                <div className="flex w-full flex-1 flex-col justify-between rounded-xl bg-white/90 p-8 shadow-lg ring-1 ring-black/5 backdrop-blur-sm sm:rounded-l-none sm:p-12 md:p-16">
                    <div className="mb-8 flex w-full items-center justify-between border-b border-primary/10 pb-8">
                        <div className="flex flex-col text-left">
                            <Image
                                src="/email/email_logo.png"
                                alt="Jianshan Scholarship"
                                width={220}
                                height={56}
                                className="h-auto w-[180px] sm:w-[220px]"
                                priority
                            />
                        </div>

                        <div className="shrink-0 text-5xl text-accent opacity-20">
                            <span className="font-serif font-black">2026</span>
                        </div>
                    </div>

                    <div className="flex-grow space-y-8 text-center sm:text-left">
                        <div>
                            <p className="mb-4 font-sans text-sm font-bold uppercase tracking-wide text-accent">{badge}</p>
                            <h2 className="mb-10 font-serif text-5xl font-extrabold leading-tight text-primary sm:text-6xl lg:text-7xl">
                                {title}
                            </h2>
                        </div>
                        <div className="prose max-w-full font-serif text-lg leading-relaxed text-primary/80 [&_p]:mb-6">
                            {children}
                        </div>
                    </div>

                    <div className="mt-12 flex max-w-full flex-col gap-4 pt-8 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex flex-col gap-1 text-center sm:text-left">
                            <div className="font-serif text-2xl italic text-primary opacity-80">
                                {signature}
                            </div>
                            <p className="text-sm text-primary/60">
                                {decisionDate}
                            </p>
                        </div>
                        <div className="hidden sm:block opacity-20 rotate-12">
                            {icon}
                        </div>
                    </div>

                    {footer && (
                        <div className="mt-12 flex flex-col items-center gap-4 border-t border-primary/10 pt-8 sm:flex-row sm:justify-center">
                            {footer}
                        </div>
                    )}
                </div>
            </main>

            <footer className="mt-auto w-full py-6 text-center relative z-10 opacity-50">
                <p className="text-xs text-primary">© 2026 Jianshan Scholarship. All rights reserved.</p>
            </footer>
        </div>
    );
}

function AcceptedResult({
    app,
    loading,
    onConfirm,
    onBack,
}: {
    app: Application;
    loading: boolean;
    onConfirm: () => void;
    onBack: () => void;
}) {
    const firstName = getFirstName(app.section1_personal?.full_name);
    const decisionDate = formatHumanDate(app.decisionReleasedAt);
    const deadline = formatOfferAcceptanceDeadline(app.decisionReleasedAt);

    return (
        <ResultLayout
            badge="Official Scholarship Decision"
            title="Congratulations!"
            icon={<CheckCircle className="h-24 w-24 text-primary" />}
            signature="Jianshan Scholarship Committee"
            decisionDate={decisionDate}
            footer={
                <>
                    <Button
                        variant="ghost"
                        className="h-auto w-auto min-w-0 p-0 border-0 bg-transparent hover:bg-transparent text-primary hover:text-primary shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        onClick={onBack}
                    >
                        Decline Offer
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className="h-12 w-full min-w-[200px] text-base font-bold shadow-md sm:w-auto border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Enrollment and Next Step
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </>
            }
        >
            <p>Dear {firstName},</p>
            <p>
                We are delighted to let you know that you have been selected to join the <strong className="text-primary font-semibold">Jianshan Scholarship 2026</strong>. After careful consideration of your application, the committee is very pleased to offer you a place in this year&apos;s cohort.
            </p>
            <p>
                Your application stood out for the clarity of your thinking, the seriousness of your academic interests, and the thoughtfulness with which you reflected on your experiences, motivations, and future contribution. We were especially encouraged by the intellectual curiosity, sense of initiative, and generosity toward teaching and mentorship that came through across your materials.
            </p>
            <p>
                The China Trip will run from <strong className="text-primary font-semibold">2 August to 18 August 2026</strong>. We ask all participants to arrive in Hangzhou by <strong className="text-primary font-semibold">1 August 2026, Beijing time</strong>, so that the programme can begin smoothly. We will arrange airport pickup for arriving scholars, and our team will follow up with detailed coordination and arrival instructions closer to the date.
            </p>
            <p>
                To accept this offer and secure your place, you will need to complete two steps within <strong className="text-primary font-semibold">five working days of the result release date</strong>, that is by <strong className="text-primary font-semibold">{deadline}</strong>: first, transfer the <strong className="text-primary font-semibold">GBP 350 deposit</strong> to our designated account; second, complete the confirmation form with your passport-related details. If both steps are not completed within this timeframe, we may need to offer the place to another applicant on the waitlist.
            </p>
            <p>
                We very much hope you will join us. It would be a real pleasure to welcome you into a lively, thoughtful, and generous Jianshan community, and to share this journey with you in China.
            </p>
            <div className="mt-12 py-6 border-y border-primary/10 flex flex-wrap justify-center gap-6 sm:gap-12 text-center text-sm font-sans">
                <div className="flex items-center gap-2">
                    <MapPin className="text-accent h-5 w-5" />
                    <span className="font-bold text-primary">Arrive in Hangzhou by 1 Aug</span>
                    <span className="text-primary/60">(Arrival)</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="text-accent h-5 w-5" />
                    <span className="font-bold text-primary">China Trip: 2 Aug - 18 Aug</span>
                    <span className="text-primary/60">(Programme)</span>
                </div>
            </div>
            <p className="mt-8">If you have any questions at any stage, please feel free to contact us. We will be glad to help.</p>
        </ResultLayout>
    );
}

function WaitlistResult({ app, onBack }: { app: Application; onBack: () => void }) {
    const firstName = getFirstName(app.section1_personal?.full_name);
    const decisionDate = formatHumanDate(app.decisionReleasedAt);

    return (
        <ResultLayout
            badge="Official Scholarship Decision"
            title="Waitlist"
            icon={<Clock3 className="h-24 w-24 text-primary" />}
            signature="Jianshan Scholarship Committee"
            decisionDate={decisionDate}
            footer={
                <>
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </>
            }
        >
            <p>Dear {firstName},</p>
            <p>
                Thank you very much for the care and thought you put into your application. After careful review, we would like to let you know that you have been placed on the <strong className="text-primary font-semibold">waitlist</strong> for the Jianshan Scholarship 2026.
            </p>
            <p>
                This means that we are not able to confirm a place for you at the moment, but your application remains under active consideration should a place become available later in the process.
            </p>
            <p>
                There is <strong className="text-primary font-semibold">no action you need to take right now</strong>, and you should not submit any deposit payment at this stage. If a place becomes available, we will contact you again by email and update your portal status with the next steps.
            </p>
            <p>
                We are grateful for your patience and for your continued interest in the programme.
            </p>
        </ResultLayout>
    );
}

function RejectedResult({ app, onBack }: { app: Application; onBack: () => void }) {
    const firstName = getFirstName(app.section1_personal?.full_name);
    const decisionDate = formatHumanDate(app.decisionReleasedAt);
    const reachedFinalRound = !!app.section6_round_2 && Object.keys(app.section6_round_2).length > 0;

    return (
        <ResultLayout
            badge="Official Scholarship Decision"
            title="Thank You"
            icon={null}
            signature="Jianshan Scholarship Committee"
            decisionDate={decisionDate}
            footer={
                <>
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </>
            }
        >
            <p>Dear {firstName},</p>
            <p>
                Thank you very much for the time, effort, and thought you invested in your application to the Jianshan Scholarship 2026.
            </p>
            <p>
                After careful consideration, we regret to let you know that we are not able to offer you a place in this year&apos;s cohort{reachedFinalRound ? " after the final round of review" : ""}.
            </p>
            <p>
                We sincerely appreciate your interest in the programme and the seriousness with which you approached the application process. We are grateful for the opportunity to have read your materials.
            </p>
            <p>
                We wish you all the very best in your future academic and teaching journey.
            </p>
        </ResultLayout>
    );
}

function OfferDeclinedResult({ app, onBack }: { app: Application; onBack: () => void }) {
    const firstName = getFirstName(app.section1_personal?.full_name);
    const decisionDate = formatHumanDate(app.lastUpdatedAt || app.decisionReleasedAt);

    return (
        <ResultLayout
            badge="Offer Response Recorded"
            title="Offer Declined"
            icon={<CircleX className="h-24 w-24 text-primary" />}
            signature="Jianshan Scholarship Committee"
            decisionDate={decisionDate}
            footer={
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            }
        >
            <p>Dear {firstName},</p>
            <p>
                Your decision to decline the Jianshan Scholarship 2026 offer has been recorded.
            </p>
            <p>
                Thank you again for the time and thought you put into your application. We sincerely appreciate your interest in the programme.
            </p>
            <p>
                If this was selected by mistake and you would like our team to review the situation, please contact us as soon as possible.
            </p>
        </ResultLayout>
    );
}

export default function AcceptancePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [app, setApp] = useState<Application | null>(null);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchApp = async () => {
            try {
                const myApp = await dbService.getMyApplication(user.uid);
                setApp(myApp as Application);
            } catch (err) {
                console.error("Failed to fetch application:", err);
            } finally {
                setPageLoading(false);
            }
        };
        fetchApp();
    }, [user]);

    useEffect(() => {
        if (getResultStatus(app) !== "accepted") return;

        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: ReturnType<typeof setInterval> = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }

            const particleCount = 100 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, [app]);

    const handleConfirm = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await dbService.startOfferAcceptance(user.uid);
            router.push("/acceptance/next-step");
        } catch (err) {
            console.error("Failed to confirm enrollment:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = async () => {
        if (!user) return;
        if (!window.confirm("Are you sure you want to decline this offer?")) return;

        setLoading(true);
        try {
            await dbService.declineOffer(user.uid);
            const myApp = await dbService.getMyApplication(user.uid);
            setApp(myApp as Application);
        } catch (err) {
            console.error("Failed to decline offer:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    if (pageLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const resultStatus = getResultStatus(app);

    if (!app || resultStatus === "unavailable") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6 text-center">
                <p className="text-slate-500 mb-4">No released application result is available at this time.</p>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
            </div>
        );
    }

    if (resultStatus === "accepted") {
        return <AcceptedResult app={app} loading={loading} onConfirm={handleConfirm} onBack={handleDecline} />;
    }

    if (resultStatus === "offer_declined") {
        return <OfferDeclinedResult app={app} onBack={() => router.push("/dashboard")} />;
    }

    if (resultStatus === "waitlisted") {
        return <WaitlistResult app={app} onBack={() => router.push("/dashboard")} />;
    }

    return <RejectedResult app={app} onBack={() => router.push("/dashboard")} />;
}
