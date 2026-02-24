"use client"

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Application } from "@/lib/types";
import { dbService } from "@/lib/db-service";
import { Loader2, Download, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { OfferLetterTemplate } from "@/components/offer-letter-template";
import { generateOfferPdf } from "@/lib/generate-offer-pdf";
import Link from "next/link";

export default function AcceptancePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [application, setApplication] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirmingEnroll, setConfirmingEnroll] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const offerLetterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;
        const fetchApp = async () => {
            setLoading(true);
            try {
                const app = await dbService.getMyApplication(user.uid);
                setApplication(app as Application);
            } catch (error) {
                console.error("Failed to fetch application:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchApp();
    }, [user]);

    // Fire confetti on load if accepted
    useEffect(() => {
        if (!application || application.status !== 'accepted') return;
        let timer: ReturnType<typeof setTimeout>;
        const fireConfetti = async () => {
            try {
                const confetti = (await import('canvas-confetti')).default;
                // Initial burst
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                // Second burst
                timer = setTimeout(() => {
                    confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
                    confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
                }, 500);
            } catch (e) {
                console.log("Confetti not available");
            }
        };
        fireConfetti();
        return () => clearTimeout(timer);
    }, [application]);

    const handleConfirmEnrollment = async () => {
        if (!user) return;
        setConfirmingEnroll(true);
        try {
            await dbService.confirmEnrollment(user.uid);
            const app = await dbService.getMyApplication(user.uid);
            setApplication(app as Application);
        } catch (error) {
            console.error("Failed to confirm enrollment:", error);
            alert("Failed to confirm enrollment. Please try again.");
        } finally {
            setConfirmingEnroll(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!offerLetterRef.current || !application) return;
        setDownloadingPdf(true);
        try {
            const name = [application.personalInfo?.firstName, application.personalInfo?.lastName].filter(Boolean).join(' ') || "Applicant";
            await generateOfferPdf(offerLetterRef.current, name);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setDownloadingPdf(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!application) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-slate-500 mb-4">No application found.</p>
                <Link href="/dashboard" className="text-primary hover:underline">← Back to Dashboard</Link>
            </div>
        );
    }

    const status = application.status;
    const isAccepted = (status === 'accepted' || status === 'enrolled');
    const isRejected = (status === 'rejected');
    const isWaitlisted = (status === 'waitlisted');
    const isEnrolled = (status === 'enrolled');

    // If application hasn't been decided yet, redirect to dashboard
    if (!['accepted', 'rejected', 'waitlisted', 'enrolled'].includes(status)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-slate-500 mb-4">Your application decision has not been released yet.</p>
                <Link href="/dashboard" className="text-primary hover:underline">← Back to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f3f0ec 100%)" }}>
            {/* Back Link */}
            <div className="max-w-4xl mx-auto px-4 pt-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Accepted */}
                {isAccepted && (
                    <div className="space-y-8">
                        {/* Hero Card */}
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 overflow-hidden">
                            <div className="p-8 sm:p-12 text-center" style={{ background: "linear-gradient(135deg, #1f495b 0%, #2a6377 100%)" }}>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: "rgba(225, 177, 104, 0.2)", color: "#E1B168" }}>
                                    <CheckCircle className="w-4 h-4" />
                                    {isEnrolled ? "Enrollment Confirmed" : "Congratulations!"}
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                    {isEnrolled
                                        ? "Welcome to the Team!"
                                        : "You've Been Accepted!"
                                    }
                                </h1>
                                <p className="text-white/80 text-lg max-w-2xl mx-auto">
                                    {isEnrolled
                                        ? "Your enrollment has been confirmed. We look forward to working with you this summer."
                                        : "We are thrilled to offer you a position as a Cambridge Tutor at the Jianshan Summer Program."
                                    }
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="p-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                                {!isEnrolled && (
                                    <button
                                        onClick={handleConfirmEnrollment}
                                        disabled={confirmingEnroll}
                                        className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {confirmingEnroll ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Confirming...</>
                                        ) : (
                                            <><CheckCircle className="w-5 h-5" /> Confirm Enrollment</>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={handleDownloadPdf}
                                    disabled={downloadingPdf}
                                    className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-slate-200 hover:border-primary hover:bg-primary/5 text-slate-700 rounded-xl font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {downloadingPdf ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Generating PDF...</>
                                    ) : (
                                        <><Download className="w-5 h-5" /> Download Offer Letter</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Offer Letter Preview */}
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Your Offer Letter</h2>
                            <div className="flex justify-center overflow-auto">
                                <div style={{ transform: "scale(0.7)", transformOrigin: "top center" }}>
                                    <OfferLetterTemplate ref={offerLetterRef} application={application} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rejected */}
                {isRejected && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 p-8 sm:p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-6">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">Application Decision</h1>
                        <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-8">
                            Thank you for your time and interest in the Jianshan Summer Program. After careful review, we regret to inform you that we are unable to offer you a position at this time. We wish you the very best in your future endeavours.
                        </p>
                        <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Return to Dashboard
                        </Link>
                    </div>
                )}

                {/* Waitlisted */}
                {isWaitlisted && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 p-8 sm:p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-full mb-6">
                            <Clock className="w-8 h-8 text-amber-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">You&apos;ve Been Waitlisted</h1>
                        <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-8">
                            Thank you for applying to the Jianshan Summer Program. Your application has been placed on our waitlist. We will contact you if a position becomes available. Please check back for updates.
                        </p>
                        <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Return to Dashboard
                        </Link>
                    </div>
                )}
            </div>

            {/* Hidden full-size offer letter for PDF generation */}
            {isAccepted && (
                <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                    <OfferLetterTemplate ref={offerLetterRef} application={application} />
                </div>
            )}
        </div>
    );
}
