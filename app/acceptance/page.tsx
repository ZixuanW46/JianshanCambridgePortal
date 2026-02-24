"use client"

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { Application } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowRight, Calendar, MapPin, Users, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { OfferLetterTemplate } from "@/components/offer-letter-template";
import { generateOfferPdf } from "@/lib/generate-offer-pdf";

export default function AcceptancePage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [app, setApp] = useState<Application | null>(null);
    const offerLetterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
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

    // Fetch application data for the offer letter template
    useEffect(() => {
        const fetchApp = async () => {
            if (!user) return;
            const uid = user.uid;
            try {
                const myApp = await dbService.getMyApplication(uid);
                setApp(myApp as Application);
            } catch (err) {
                console.error("Failed to fetch application for offer letter:", err);
            }
        };
        fetchApp();
    }, [user]);

    const handleConfirm = async () => {
        if (!user) return;
        const uid = user.uid;
        setLoading(true);
        try {
            await dbService.confirmEnrollment(uid);
            router.push('/dashboard');
        } catch (err) {
            console.error("Failed to confirm enrollment:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!offerLetterRef.current || !app) return;
        setDownloading(true);
        try {
            const fullName = [app.personalInfo?.firstName, app.personalInfo?.lastName].filter(Boolean).join(' ') || "Applicant";
            await generateOfferPdf(offerLetterRef.current, fullName);
        } catch (err) {
            console.error("PDF generation failed:", err);
        } finally {
            setDownloading(false);
        }
    };

    if (!user) return null;

    if (app && !['accepted', 'enrolled', 'paid'].includes(app.status)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <p className="text-slate-500 mb-4">You do not have a pending offer at this time.</p>
                <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
            </div>
        );
    }

    const fullName = app ? [app.personalInfo?.firstName, app.personalInfo?.lastName].filter(Boolean).join(' ') : "";

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background font-sans overflow-x-hidden text-primary selection:bg-accent/30">
            {/* Hidden Offer Letter Template for PDF generation */}
            {app && (
                <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                    <OfferLetterTemplate ref={offerLetterRef} application={app} />
                </div>
            )}

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
                        <div className="flex flex-col text-left">
                            <h2 className="font-serif text-3xl font-bold text-primary leading-tight">Jianshan Summer Camp</h2>
                            <p className="text-sm text-primary/70">Admissions Office</p>
                            <p className="text-xs text-primary/50">123 Camp Lane, Wilderness, CA 90210</p>
                        </div>
                        <div className="flex-shrink-0 text-accent text-5xl opacity-20">
                            <span className="font-serif font-black">2026</span>
                        </div>
                    </div>

                    <div className="flex-grow space-y-8 text-center sm:text-left">
                        <h2 className="font-serif text-5xl font-extrabold text-primary sm:text-6xl lg:text-7xl leading-tight mb-6">
                            Congratulations!
                        </h2>
                        <div className="prose prose-lg font-serif text-primary/80 leading-relaxed max-w-full">
                            <p className="font-sans text-sm font-bold uppercase tracking-wide text-accent mb-4">Official Admission Decision</p>
                            <p>Dear {fullName || "Applicant"},</p>
                            <p>
                                We are absolutely delighted to inform you that you have been accepted to the <strong className="text-primary font-semibold">Jianshan Summer Camp Class of 2026</strong> as a Cambridge Tutor.
                            </p>
                            <p>
                                Your application stood out among a highly competitive pool of candidates. The admissions committee was deeply impressed by your academic achievements, your passion for leadership, and your compelling personal statement. We believe you will be an outstanding addition to our community.
                            </p>
                            <div className="mt-12 py-6 border-y border-primary/10 flex flex-wrap justify-center gap-6 sm:gap-12 text-center text-sm font-sans">
                                <div className="flex items-center gap-2">
                                    <Calendar className="text-accent h-5 w-5" />
                                    <span className="font-bold text-primary">July 15 - Aug 1</span>
                                    <span className="text-primary/60">(Dates)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="text-accent h-5 w-5" />
                                    <span className="font-bold text-primary">Jianshan Campus</span>
                                    <span className="text-primary/60">(Location)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="text-accent h-5 w-5" />
                                    <span className="font-bold text-primary">Cohort 26</span>
                                    <span className="text-primary/60">(Group)</span>
                                </div>
                            </div>
                            <p className="mt-8">We eagerly await your confirmation and look forward to welcoming you to the Jianshan Summer Camp community!</p>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col gap-4 pt-8 sm:flex-row sm:items-end sm:justify-between max-w-full">
                        <div className="flex flex-col gap-1 text-center sm:text-left">
                            <div className="font-serif text-2xl italic text-primary opacity-80" style={{ fontFamily: 'serif' }}>Admissions Director</div>
                            <p className="text-sm font-bold text-primary">Admissions Director</p>
                            <p className="text-xs text-primary/60">Director of Admissions</p>
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
                            Confirm Enrollment
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDownloadPdf}
                            disabled={downloading || !app}
                            className="h-12 w-full min-w-[200px] text-base font-bold sm:w-auto"
                        >
                            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                            Download Offer Letter
                        </Button>
                    </div>
                </div>
            </main>

            <footer className="mt-auto w-full py-6 text-center relative z-10 opacity-50">
                <p className="text-xs text-primary">© 2026 Jianshan Summer Camp. All rights reserved.</p>
            </footer>
        </div>
    );
}
