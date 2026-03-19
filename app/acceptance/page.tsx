"use client"

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { Application } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Calendar, MapPin, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import {
    formatHumanDate,
    formatOfferAcceptanceDeadline,
    getFirstName,
    isAcceptedFlowStatus,
} from "@/lib/offer-acceptance";

export default function AcceptancePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [app, setApp] = useState<Application | null>(null);

    useEffect(() => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: ReturnType<typeof setInterval> = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 100 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchApp = async () => {
            if (!user) return;
            const uid = user.uid;
            try {
                const myApp = await dbService.getMyApplication(uid);
                setApp(myApp as Application);
            } catch (err) {
                console.error("Failed to fetch application:", err);
            }
        };
        fetchApp();
    }, [user]);

    const handleConfirm = async () => {
        if (!user) return;
        const uid = user.uid;
        setLoading(true);
        try {
            await dbService.startOfferAcceptance(uid);
            router.push('/acceptance/next-step');
        } catch (err) {
            console.error("Failed to confirm enrollment:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    if (app && !isAcceptedFlowStatus(app.status)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <p className="text-slate-500 mb-4">You do not have a pending offer at this time.</p>
                <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
            </div>
        );
    }

    const firstName = getFirstName(app?.section1_personal?.full_name);
    const decisionDate = formatHumanDate(app?.decisionReleasedAt);
    const deadline = formatOfferAcceptanceDeadline(app?.decisionReleasedAt);

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background font-sans overflow-x-hidden text-primary selection:bg-accent/30">
            {/* Confetti Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full z-0 opacity-60">
                {[...Array(25)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full w-2 h-2 opacity-70 blur-[0.5px]"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            backgroundColor: i % 2 === 0 ? '#1f495b' : '#E1B168',
                            animation: `float ${3 + Math.random() * 5}s ease-in-out infinite`
                        }}
                    />
                ))}
            </div>

            <main className="relative z-10 flex flex-1 flex-col sm:flex-row max-w-7xl mx-auto w-full p-0 sm:p-6 lg:p-8">
                <div className="hidden sm:flex flex-1 min-h-full rounded-l-xl overflow-hidden shadow-lg ring-1 ring-black/5 relative">
                    <img
                        alt="Inspiring Summer Camp Scenery"
                        className="object-cover w-full h-full absolute inset-0"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCuUqwmHBGdIOg3WSt4FwDAVaXjhnBxr-mAef67xD8dKtAaL3X3a1palYLDGX4hKk9q9R69KSx69I2t5j8VDH06QlJHDT1M-Y4x-EKN2ulnwGk3RIBjHV6VPHIil1LlWSSigayFCQ923eTMP1-o8eXB9cIkbakUkUa6VkX2PAsEODLtUybj1KUwWNUK6r0iLh8GTyeBnzw76wy5NixuhBE3GfeDB1IheV9hy_daQWv-aXiEYGmUyDD4uj2OXhKuhkOMCmEF-DpB0Eb"
                    />
                </div>

                <div className="flex-1 w-full bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-l-none p-8 sm:p-12 md:p-16 shadow-lg ring-1 ring-black/5 flex flex-col justify-between">
                    <div className="w-full pb-8 mb-8 border-b border-primary/10 flex items-center justify-between">
                        <div className="flex items-center text-left">
                            <Image
                                src="/email/email_logo.png"
                                alt="Jianshan Scholarship"
                                width={220}
                                height={56}
                                className="h-auto w-[180px] sm:w-[220px]"
                                priority
                            />
                        </div>
                        <div className="flex-shrink-0 text-accent text-5xl opacity-20">
                            <span className="font-serif font-black">2026</span>
                        </div>
                    </div>

                    <div className="flex-grow space-y-8 text-center sm:text-left">
                        <h2 className="font-serif text-5xl font-extrabold text-primary sm:text-6xl lg:text-7xl leading-tight mb-6">
                            Congratulations!
                        </h2>
                        <div className="prose prose-lg font-serif text-primary/80 leading-relaxed max-w-full [&_p]:mb-6">
                            <p className="font-sans text-sm font-bold uppercase tracking-wide text-accent mb-4">Official Scholarship Decision</p>
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
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col gap-4 pt-8 sm:flex-row sm:items-end sm:justify-between max-w-full">
                        <div className="flex flex-col gap-1 text-center sm:text-left">
                            <p className="text-base font-semibold text-primary">Jianshan Scholarship Committee</p>
                            <p className="text-sm text-primary/60">{decisionDate}</p>
                        </div>
                        <div className="hidden sm:block opacity-20 rotate-12">
                            <CheckCircle className="h-24 w-24 text-primary" />
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col items-center gap-4 border-t border-primary/10 pt-8 sm:flex-row sm:justify-center">
                        <Button
                            variant="ghost"
                            className="h-auto w-auto min-w-0 p-0 border-0 bg-transparent hover:bg-transparent text-primary hover:text-primary shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            onClick={() => router.push('/dashboard')}
                        >
                            Decline Offer
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="h-12 w-full min-w-[200px] text-base font-bold shadow-md sm:w-auto border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Enrollment and Next Step
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </main>

            <footer className="mt-auto w-full py-6 text-center relative z-10 opacity-50">
                <p className="text-xs text-primary">© 2026 Jianshan Scholarship. All rights reserved.</p>
            </footer>
        </div>
    );
}
