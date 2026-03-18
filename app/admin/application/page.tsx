"use client"

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { Application } from "@/lib/types";
import { dbService } from "@/lib/db-service";
import { Loader2, ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DecisionCard } from "@/components/admin/decision-card";
import { NotesSection } from "@/components/admin/notes-section";
import Link from "next/link";

function AdminApplicationDetailContent() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const applicationId = searchParams.get("id");

    const [application, setApplication] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) { router.push("/login"); return; }
            if (!isAdmin) { router.push("/dashboard"); return; }
        }
    }, [user, authLoading, isAdmin, router]);

    const fetchApplication = async (silent = false) => {
        if (!applicationId) return;
        if (!silent) setLoading(true);
        try {
            const app = await dbService.getMyApplication(applicationId);
            setApplication(app as Application);
        } catch (error) {
            console.error("Failed to fetch application:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || !isAdmin || !applicationId) return;
        fetchApplication();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isAdmin, applicationId]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!application) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-slate-500 mb-4">Application not found.</p>
                <Link href="/admin/dashboard" className="text-primary hover:underline">← Back to Dashboard</Link>
            </div>
        );
    }

    const personalInfo = {
        fullName: application.section1_personal?.full_name || 'No Name',
        email: application.section1_personal?.personal_email || '',
        phone: application.section1_personal?.phone_number || '',
        dateOfBirth: application.section1_personal?.date_of_birth || '',
        gender: (application.section1_personal?.gender === 'Other' && application.section1_personal?.gender_other)
            ? application.section1_personal.gender_other
            : (application.section1_personal?.gender || ''),
        nationality: application.section1_personal?.nationality || '',
        college: application.section1_personal?.college || '',
        yearOfStudy: application.section1_personal?.year_of_study || '',
        subjects: application.section1_personal?.subject ? [application.section1_personal.subject] : [],
    };
    const essays = {
        aboutYou: application.section2_about_you?.tell_us_about_yourself || '',
        subjectPassion: application.section3_teaching?.subject_passion || '',
        academyMotivation: application.section3_teaching?.academy_motivation || '',
    };

    const travel = {
        excitement: application.section4_travel?.excitement_about_china || '',
        dynamics: application.section4_travel?.group_dynamics || '',
    };

    const availability = {
        dietary: application.section5_availability?.dietary_restrictions || [],
        dietaryOther: application.section5_availability?.dietary_other || '',
        additionalNotes: application.section5_availability?.additional_notes || '',
        confirmsProgramDates: application.section5_availability?.confirms_program_dates || false,
        confirmsFlightCosts: application.section5_availability?.confirms_flight_costs || false,
        confirmsVisaResponsibility: application.section5_availability?.confirms_visa_responsibility || false,
    };

    const round2 = application.section6_round_2;
    const hasRound2ConfirmationData = !!round2 && [
        round2.confirms_theme_preparation,
        round2.confirms_ab_session_delivery,
        round2.confirms_student_facing_role,
        round2.confirms_workload_readiness,
        round2.confirms_deposit_terms,
        round2.confirms_flight_costs,
        round2.confirms_visa_responsibility,
    ].some(value => value !== undefined);
    const round2Confirmations = hasRound2ConfirmationData ? [
        {
            label: "Theme Preparation",
            description: "Understands they will prepare teaching around the Jianshan model and the Future City theme.",
            confirmed: !!round2.confirms_theme_preparation,
        },
        {
            label: "A/B Session Delivery",
            description: "Understands they must prepare one Type A and one Type B session and deliver them to different student groups.",
            confirmed: !!round2.confirms_ab_session_delivery,
        },
        {
            label: "Student-Facing Role",
            description: "Understands the role includes engagement, clarity, accessibility, and participation, not only content delivery.",
            confirmed: !!round2.confirms_student_facing_role,
        },
        {
            label: "Teaching Workload",
            description: "Confirms readiness for around 3-4 hours of teaching per day during camp.",
            confirmed: !!round2.confirms_workload_readiness,
        },
        {
            label: "Deposit Terms",
            description: "Understands the GBP 350 place-holding deposit, withdrawal terms, and post-camp return.",
            confirmed: !!round2.confirms_deposit_terms,
        },
        {
            label: "Flight Costs",
            description: "Understands international return flights are self-arranged and self-funded.",
            confirmed: !!round2.confirms_flight_costs,
        },
        {
            label: "Visa Responsibility",
            description: "Understands they must arrange their own visa and cover the cost if visa-free entry is unavailable.",
            confirmed: !!round2.confirms_visa_responsibility,
        },
    ] : [];

    const fullName = application.section1_personal?.full_name || "No Name";
    const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?';

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header / Profile Banner */}
            <div className="bg-white border-b border-slate-200 pt-8 pb-12 mb-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/admin/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to applications
                    </Link>
                    
                    <div className="flex flex-col md:flex-row md:items-end gap-6 justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 text-3xl font-semibold border-2 border-white shadow-sm shrink-0">
                                {initials}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{fullName}</h1>
                                <div className="flex flex-wrap items-center gap-3 text-slate-500 text-sm">
                                    <span>{personalInfo.email || "No Email"}</span>
                                    {personalInfo.phone && (
                                        <>
                                            <span className="text-slate-300">•</span>
                                            <span>{personalInfo.phone}</span>
                                        </>
                                    )}
                                    <span className="text-slate-300">•</span>
                                    <span>ID: {applicationId}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                            <StatusBadge status={application.status} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    
                    {/* Left Column: Application Data */}
                    <div className="lg:col-span-2 space-y-12">
                        
                        {/* Personal Details Section */}
                        <section>
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-200 pb-2">Profile</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-8 gap-x-6">
                                <InfoRow label="Gender" value={personalInfo.gender} />
                                <InfoRow label="Date of Birth" value={personalInfo.dateOfBirth} />
                                <InfoRow label="Nationality" value={personalInfo.nationality} />
                                <InfoRow label="University / College" value={personalInfo.college} />
                                <InfoRow label="Year of Study" value={personalInfo.yearOfStudy} />
                                <InfoRow label="Primary Subjects" value={personalInfo.subjects?.join(', ')} />
                            </div>
                        </section>

                        {/* Essays Section */}
                        {essays && Object.keys(essays).length > 0 && (
                            <section>
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-200 pb-2">Written Answers</h3>
                                <div className="space-y-10">
                                    {essays.aboutYou && (
                                        <EssayBlock title="About Yourself" content={essays.aboutYou} />
                                    )}
                                    {essays.subjectPassion && (
                                        <EssayBlock title="Passion for Subject" content={essays.subjectPassion} />
                                    )}
                                    {essays.academyMotivation && (
                                        <EssayBlock title="Motivation for Jianshan Academy" content={essays.academyMotivation} />
                                    )}
                                    {travel.excitement && (
                                        <EssayBlock title="Excitement about China" content={travel.excitement} />
                                    )}
                                    {travel.dynamics && (
                                        <EssayBlock title="Group Dynamics Experience" content={travel.dynamics} />
                                    )}
                                </div>
                            </section>
                        )}
                        
                        {/* Round 2 Submission */}
                        {round2 && Object.keys(round2).length > 0 && (
                            <section>
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-200 pb-2 text-accent">Final Round Submission</h3>
                                <div className="space-y-8 bg-accent/5 p-6 rounded-xl border border-accent/20">
                                    {(round2.type_a_session_thoughts || round2.session_design_thoughts) && (
                                        <div className="space-y-3">
                                            {round2.type_a_session_title && (
                                                <InfoRow label="Type A Session Title" value={round2.type_a_session_title} />
                                            )}
                                            <EssayBlock title="Type A Session Idea" content={round2.type_a_session_thoughts || round2.session_design_thoughts || ""} />
                                        </div>
                                    )}
                                    {round2.type_b_session_thoughts && (
                                        <div className="space-y-3">
                                            {round2.type_b_session_title && (
                                                <InfoRow label="Type B Session Title" value={round2.type_b_session_title} />
                                            )}
                                            <EssayBlock title="Type B Session Idea" content={round2.type_b_session_thoughts} />
                                        </div>
                                    )}
                                    {round2.video_url && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-900 mb-2">Video Introduction</h4>
                                            <a href={round2.video_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 font-medium hover:underline flex items-center gap-1 break-all">
                                                {round2.video_url}
                                            </a>
                                        </div>
                                    )}
                                    {round2Confirmations.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-medium text-slate-900">Final Round Confirmations</h4>
                                            <div className="rounded-xl border border-accent/20 bg-white/70 overflow-hidden">
                                                {round2Confirmations.map((item, index) => (
                                                    <div key={item.label} className={index === round2Confirmations.length - 1 ? "p-4 flex justify-between items-start gap-4" : "p-4 border-b border-slate-200 flex justify-between items-start gap-4"}>
                                                        <div>
                                                            <div className="font-medium text-slate-900">{item.label}</div>
                                                            <div className="text-slate-500 mt-1">{item.description}</div>
                                                        </div>
                                                        <ConfirmationBadge confirmed={item.confirmed} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {round2.final_round_concerns && (
                                        <EssayBlock title="Participation / Delivery Concerns" content={round2.final_round_concerns} />
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Logistics */}
                        <section>
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-200 pb-2">Logistics & Confirmations</h3>
                            <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-5 border-b border-slate-100 flex justify-between items-start gap-4">
                                    <div>
                                        <div className="font-medium text-slate-900">Dates & Availability</div>
                                        <div className="text-slate-500 mt-1">Confirmed attendance for Academy (Aug 2-8) and Trip (Aug 8-18).</div>
                                    </div>
                                    <ConfirmationBadge confirmed={availability.confirmsProgramDates} />
                                </div>
                                <div className="p-5 border-b border-slate-100 flex justify-between items-start gap-4">
                                    <div>
                                        <div className="font-medium text-slate-900">Flight Costs</div>
                                        <div className="text-slate-500 mt-1">Understands they must arrange and pay for international return flights.</div>
                                    </div>
                                    <ConfirmationBadge confirmed={availability.confirmsFlightCosts} />
                                </div>
                                <div className="p-5 border-b border-slate-100 flex justify-between items-start gap-4">
                                    <div>
                                        <div className="font-medium text-slate-900">Visa Responsibility</div>
                                        <div className="text-slate-500 mt-1">Understands responsibility to check visa requirements and apply if needed.</div>
                                    </div>
                                    <ConfirmationBadge confirmed={availability.confirmsVisaResponsibility} />
                                </div>
                                <div className="p-5 bg-slate-50">
                                    <div className="font-medium text-slate-900 mb-3">Dietary & Additional Requirements</div>
                                    <InfoRow label="Dietary Restrictions" value={availability.dietary.join(', ') + (availability.dietaryOther ? ` (${availability.dietaryOther})` : '')} />
                                    {availability.additionalNotes && (
                                        <div className="mt-4">
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Additional Notes</h4>
                                            <p className="text-slate-700 whitespace-pre-wrap">{availability.additionalNotes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* Right Column: Decision + Notes + Timeline */}
                    <div className="space-y-8">
                        <DecisionCard
                            applicationId={applicationId!}
                            currentInternalDecision={application.adminData?.internalDecision}
                            currentPublicStatus={application.status}
                            onUpdate={() => fetchApplication(true)}
                        />

                        <NotesSection
                            applicationId={applicationId!}
                            notes={application.adminData?.notes || []}
                            onNoteAdded={() => fetchApplication(true)}
                        />
                        
                        {/* Timeline Sidebar Style */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Timeline</h3>
                            <div className="space-y-4 text-sm">
                                <TimelineRow label="Started" date={application.createdAt} />
                                <TimelineRow label="Submitted" date={application.submittedAt} />
                                <TimelineRow label="Updated" date={application.lastUpdatedAt} />
                                <TimelineRow label="Decision" date={application.decisionReleasedAt} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</dt>
            <dd className="text-slate-900 font-medium">{value && value !== '' ? value : <span className="text-slate-400 font-normal italic">None</span>}</dd>
        </div>
    );
}

function EssayBlock({ title, content }: { title: string; content: string }) {
    return (
        <div>
            <h4 className="text-base font-semibold text-slate-900 mb-3">{title}</h4>
            <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed font-serif text-[15px]">
                {content.split('\n').map((paragraph, idx) => (
                    paragraph.trim() ? <p key={idx} className="mb-4">{paragraph}</p> : <br key={idx} />
                ))}
            </div>
        </div>
    );
}

function ConfirmationBadge({ confirmed }: { confirmed: boolean }) {
    return confirmed ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 shrink-0">
            Confirmed
        </span>
    ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
            Pending
        </span>
    );
}

function TimelineRow({ label, date }: { label: string; date?: number | string | Date | null }) {
    if (!date) return null;
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 last:pb-0">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-900 font-medium">{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
    );
}

export default function AdminApplicationDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <AdminApplicationDetailContent />
        </Suspense>
    );
}
