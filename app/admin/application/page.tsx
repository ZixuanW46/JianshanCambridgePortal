"use client"

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { Application } from "@/lib/types";
import { dbService } from "@/lib/db-service";
import { Loader2, ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { DecisionCard } from "@/components/admin/decision-card";
import { NotesSection } from "@/components/admin/notes-section";
import Link from "next/link";
import { formatNationalityList } from "@/lib/application-form";
import {
    formatRatingValue,
    getApplicationRatingByAdmin,
    getApplicationRatings,
    getAverageApplicationRating,
    getAdminDisplayName,
} from "@/lib/admin-ratings";
import { resolveAdminDisplayName } from "@/lib/admin-profiles";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Download, ExternalLink, FileText } from "lucide-react";
import type { AiReviewResult, ParsedAttachmentResult } from "@/lib/types";

function AdminApplicationDetailContent() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const applicationId = searchParams.get("id");

    const [application, setApplication] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingRating, setUpdatingRating] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user) { router.replace("/"); return; }
            if (!isAdmin) { router.push("/dashboard"); return; }
        }
    }, [user, authLoading, isAdmin, router]);

    const fetchApplication = async (silent = false) => {
        if (!applicationId) return;
        if (!silent) setLoading(true);
        try {
            const app = await dbService.getMyApplication(applicationId);
            setApplication(app as Application);

            if (app) {
                void dbService.ensureAiReviewForApplication(app as Application)
                    .then(async (count) => {
                        if (count === 0) return;
                        const refreshed = await dbService.getMyApplication(applicationId);
                        setApplication(refreshed as Application);
                    })
                    .catch((error) => {
                        console.error("Failed to backfill AI review for application:", error);
                    });
            }
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
        personalEmail: application.section1_personal?.personal_email || '',
        cambridgeEmail: application.section1_personal?.cambridge_email || '',
        phone: application.section1_personal?.phone_number || '',
        dateOfBirth: application.section1_personal?.date_of_birth || '',
        gender: (application.section1_personal?.gender === 'Other' && application.section1_personal?.gender_other)
            ? application.section1_personal.gender_other
            : (application.section1_personal?.gender || ''),
        nationality: formatNationalityList(application.section1_personal?.nationality) || '',
        college: application.section1_personal?.college || '',
        yearOfStudy: application.section1_personal?.year_of_study === 'Other'
            ? application.section1_personal?.year_of_study_other || 'Other'
            : application.section1_personal?.year_of_study || '',
        subject: application.section1_personal?.subject === 'Other'
            ? application.section1_personal?.subject_other || 'Other'
            : application.section1_personal?.subject || '',
    };
    const essays = {
        aboutYou: application.section2_about_you?.tell_us_about_yourself || '',
        supportingFileUrl: application.section2_about_you?.additional_file_url || '',
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
        round2.confirms_workload_readiness,
        round2.confirms_deposit_terms,
        round2.confirms_flight_costs,
        round2.confirms_visa_responsibility,
    ].some(value => value !== undefined);
    const round2Confirmations = hasRound2ConfirmationData ? [
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
    const hasWrittenAnswers = [
        essays.aboutYou,
        essays.supportingFileUrl,
        essays.subjectPassion,
        essays.academyMotivation,
        travel.excitement,
        travel.dynamics,
    ].some(Boolean);

    const fullName = application.section1_personal?.full_name || "No Name";
    const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?';
    const adminRatings = getApplicationRatings(application);
    const averageRating = getAverageApplicationRating(application);
    const myRating = user?.uid ? getApplicationRatingByAdmin(application, user.uid) : null;
    const round1AiReview = application.adminData?.aiReview?.round1;
    const round2AiReview = application.adminData?.aiReview?.round2;

    const handleRatingUpdate = async (score: number) => {
        if (!applicationId || !user?.uid) {
            alert("You must be signed in as an admin to rate applications.");
            return;
        }

        const timestamp = new Date().toISOString();
        const adminName = resolveAdminDisplayName({
            adminUid: user.uid,
            adminName: user.displayName,
            adminEmail: user.email,
        });
        const adminEmail = user.email || "";
        const previousApplication = application;

        setApplication({
            ...application,
            lastUpdatedAt: timestamp,
            adminData: {
                ...application.adminData,
                ratings: {
                    ...(application.adminData?.ratings || {}),
                    [user.uid]: {
                        score,
                        adminName,
                        adminEmail,
                        updatedAt: timestamp,
                    },
                },
            },
        });

        setUpdatingRating(true);
        try {
            await dbService.setApplicationRating(applicationId, {
                adminUid: user.uid,
                adminName,
                adminEmail,
                score,
            });
        } catch (error) {
            console.error("Failed to update rating:", error);
            alert("Failed to update rating.");
            setApplication(previousApplication);
        } finally {
            setUpdatingRating(false);
        }
    };

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
                                    <span>{personalInfo.personalEmail || personalInfo.cambridgeEmail || "No Email"}</span>
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
                                <InfoRow label="Personal Email" value={personalInfo.personalEmail} />
                                <InfoRow label="Cambridge Email" value={personalInfo.cambridgeEmail} />
                                <InfoRow label="Phone Number" value={personalInfo.phone} />
                                <InfoRow label="Gender" value={personalInfo.gender} />
                                <InfoRow label="Date of Birth" value={personalInfo.dateOfBirth} />
                                <InfoRow label="Nationality" value={personalInfo.nationality} />
                                <InfoRow label="University / College" value={personalInfo.college} />
                                <InfoRow label="Year of Study" value={personalInfo.yearOfStudy} />
                                <InfoRow label="Subject / Programme" value={personalInfo.subject} />
                            </div>
                        </section>

                        <AiReviewCard
                            round1={round1AiReview}
                            round2={round2AiReview}
                            parsedAttachment={application.adminData?.parsedAttachment}
                            supportingFileUrl={essays.supportingFileUrl}
                        />

                        {/* Essays Section */}
                        {hasWrittenAnswers && (
                            <section>
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-200 pb-2">Written Answers</h3>
                                <div className="space-y-10">
                                    {essays.aboutYou && (
                                        <EssayBlock title="About Yourself" content={essays.aboutYou} />
                                    )}
                                    <SupportingFileCard url={essays.supportingFileUrl} />
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

                        {application.offerAcceptance && Object.values(application.offerAcceptance).some(value => value !== undefined && value !== "") && (
                            <section>
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-200 pb-2">Offer Acceptance</h3>
                                <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="p-5 border-b border-slate-100">
                                        <InfoRow label="Full Name on Passport" value={application.offerAcceptance.full_name_on_passport || "-"} />
                                    </div>
                                    <div className="p-5 border-b border-slate-100">
                                        <InfoRow label="Nationality" value={application.offerAcceptance.nationality || "-"} />
                                    </div>
                                    <div className="p-5 border-b border-slate-100">
                                        <InfoRow label="Passport Number" value={application.offerAcceptance.passport_number || "-"} />
                                    </div>
                                    <div className="p-5 border-b border-slate-100 flex justify-between items-start gap-4">
                                        <div>
                                            <div className="font-medium text-slate-900">Transfer Confirmed</div>
                                            <div className="text-slate-500 mt-1">Applicant confirmed the GBP 350 transfer on the portal.</div>
                                        </div>
                                        <ConfirmationBadge confirmed={!!application.offerAcceptance.transfer_confirmed} />
                                    </div>
                                    <div className="p-5 bg-slate-50 grid gap-4 md:grid-cols-2">
                                        <InfoRow label="Acceptance Started" value={application.offerAcceptance.startedAt ? new Date(application.offerAcceptance.startedAt).toLocaleString() : "-"} />
                                        <InfoRow label="Acceptance Submitted" value={application.offerAcceptance.submittedAt ? new Date(application.offerAcceptance.submittedAt).toLocaleString() : "-"} />
                                    </div>
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
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Admin Ratings</h3>
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Score</div>
                                            <div className="mt-2 text-2xl font-bold text-slate-900">
                                                {formatRatingValue(averageRating)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your Score</div>
                                            <div className="mt-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={`min-w-[112px] justify-between ${
                                                                myRating
                                                                    ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-700"
                                                                    : ""
                                                            }`}
                                                            disabled={updatingRating || !user?.uid}
                                                        >
                                                            <span>{myRating ? `${myRating.score}/10` : "Rate"}</span>
                                                            {updatingRating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Set Your Rating</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
                                                            <DropdownMenuItem
                                                                key={score}
                                                                onClick={() => handleRatingUpdate(score)}
                                                                className="cursor-pointer"
                                                            >
                                                                {score}/10
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {adminRatings.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {adminRatings.map((rating) => {
                                            const isCurrentUser = user?.uid === rating.adminUid;
                                            return (
                                                <div key={rating.adminUid} className="flex items-start justify-between gap-4 px-5 py-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-slate-900">{getAdminDisplayName(rating)}</span>
                                                            {isCurrentUser && (
                                                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                                                    Your rating
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-1 text-sm text-slate-500">
                                                            {rating.adminEmail || "No email on file"}
                                                        </div>
                                                        <div className="mt-1 text-xs text-slate-400">
                                                            Updated {new Date(rating.updatedAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
                                                        {rating.score}/10
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="px-5 py-6 text-sm text-slate-500">
                                        No admin ratings yet.
                                    </div>
                                )}
                            </div>
                        </div>

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

function AiReviewCard({
    round1,
    round2,
    parsedAttachment,
    supportingFileUrl,
}: {
    round1?: AiReviewResult;
    round2?: AiReviewResult;
    parsedAttachment?: ParsedAttachmentResult;
    supportingFileUrl?: string;
}) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">AI Review</h3>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <AiAttachmentStatus
                    parsedAttachment={parsedAttachment}
                    supportingFileUrl={supportingFileUrl}
                />
                <AiReviewSection
                    title="Round 1 Candidate Fit"
                    subtitle="Background, motivation, profile fit, and standout signals."
                    review={round1}
                />
                <AiReviewSection
                    title="Round 2 Teaching Design"
                    subtitle="Session feasibility, accessibility, originality, and likely delivery quality."
                    review={round2}
                    bordered
                />
            </div>
        </div>
    );
}

function AiAttachmentStatus({
    parsedAttachment,
    supportingFileUrl,
}: {
    parsedAttachment?: ParsedAttachmentResult;
    supportingFileUrl?: string;
}) {
    const currentUrl = supportingFileUrl?.trim() || "";
    const hasSupportingFile = Boolean(currentUrl);
    const isCurrentAttachment = Boolean(
        currentUrl
        && parsedAttachment?.sourceUrl
        && parsedAttachment.sourceUrl === currentUrl,
    );

    if (!hasSupportingFile) {
        return null;
    }

    if (parsedAttachment?.status === "completed" && isCurrentAttachment) {
        return (
            <div className="border-b border-slate-100 bg-emerald-50/80 px-5 py-3 text-sm text-emerald-700">
                AI also used the uploaded {parsedAttachment.fileType?.toUpperCase() || "supporting file"} as supplemental context.
            </div>
        );
    }

    if (parsedAttachment?.status === "failed" && isCurrentAttachment) {
        return (
            <div className="border-b border-slate-100 bg-amber-50/80 px-5 py-3 text-sm text-amber-700">
                Uploaded supporting file could not be parsed for AI review{parsedAttachment.error ? `: ${parsedAttachment.error}` : "."}
            </div>
        );
    }

    if (parsedAttachment?.status === "pending" && isCurrentAttachment) {
        return (
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm text-slate-600">
                Supporting file is being parsed for AI review.
            </div>
        );
    }

    return (
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm text-slate-600">
            Uploaded supporting file is available and will be used by AI review once parsed.
        </div>
    );
}

function AiReviewSection({
    title,
    subtitle,
    review,
    bordered = false,
}: {
    title: string;
    subtitle: string;
    review?: AiReviewResult;
    bordered?: boolean;
}) {
    const statusLabel = review?.status === "completed"
        ? "Ready"
        : review?.status === "failed"
            ? "Failed"
            : review?.status === "pending"
                ? "Generating"
                : "Not generated";

    const statusTone = review?.status === "completed"
        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
        : review?.status === "failed"
            ? "bg-red-100 text-red-700 border-red-200"
            : review?.status === "pending"
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : "bg-slate-100 text-slate-600 border-slate-200";

    return (
        <section className={`${bordered ? "border-t border-slate-100" : ""} px-5 py-5`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-base font-semibold text-slate-900">{title}</div>
                    <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone}`}>
                    {statusLabel}
                </span>
            </div>

            {review?.status === "completed" ? (
                <div className="mt-4 space-y-4">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI Score</div>
                        <div className="mt-1 text-2xl font-bold text-slate-900">{review.score}/10</div>
                    </div>

                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</div>
                        <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{review.summary}</p>
                    </div>

                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {review.tags && review.tags.length > 0 ? review.tags.map((tag) => (
                                <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                    {tag}
                                </span>
                            )) : (
                                <span className="text-sm text-slate-500">No tags returned.</span>
                            )}
                        </div>
                    </div>

                    <div className="text-xs text-slate-400">
                        Generated {review.generatedAt ? new Date(review.generatedAt).toLocaleString() : "just now"} · {review.model} · prompt {review.promptVersion}
                    </div>
                </div>
            ) : review?.status === "failed" ? (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {review.error || "AI review generation failed."}
                </div>
            ) : review?.status === "pending" ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-amber-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI review is being generated.</span>
                </div>
            ) : (
                <div className="mt-4 text-sm text-slate-500">
                    No AI review has been generated for this round yet.
                </div>
            )}
        </section>
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

function SupportingFileCard({ url }: { url?: string }) {
    const trimmedUrl = url?.trim() || "";
    const previewUrl = trimmedUrl ? getPreferredPreviewUrl(trimmedUrl) : "";
    const fileName = trimmedUrl ? getUploadedFileName(trimmedUrl) : "";
    const extension = trimmedUrl ? getFileExtension(trimmedUrl) : "";
    const canPreviewInline = isBrowserPreviewable(extension);

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-2.5 text-slate-600 shadow-sm ring-1 ring-slate-200">
                    <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold text-slate-900">CV / Supporting File</h4>
                    {trimmedUrl ? (
                        <>
                            <p className="mt-1 text-sm text-slate-600">
                                已上传{fileName ? `：${fileName}` : ""}。
                                {canPreviewInline ? " 可直接在浏览器预览。" : " 该格式不保证可在线预览，可能会直接下载。"}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {canPreviewInline && (
                                    <Button asChild size="sm" className="gap-2">
                                        <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                            Preview in Browser
                                        </a>
                                    </Button>
                                )}
                                <Button asChild type="button" variant="outline" size="sm" className="gap-2 border-slate-300">
                                    <a href={trimmedUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4" />
                                        {canPreviewInline ? "Open Original File" : "Open File"}
                                    </a>
                                </Button>
                            </div>
                            <p className="mt-3 break-all text-xs text-slate-500">{trimmedUrl}</p>
                        </>
                    ) : (
                        <p className="mt-1 text-sm italic text-slate-500">没有上传 CV</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function getPreferredPreviewUrl(url: string) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}response-content-disposition=inline`;
}

function isBrowserPreviewable(extension: string) {
    return ["pdf", "png", "jpg", "jpeg", "gif", "webp", "txt"].includes(extension);
}

function getFileExtension(url: string) {
    try {
        const parsed = new URL(url);
        const encodedPath = parsed.pathname.split("/o/")[1] || "";
        const decodedPath = decodeURIComponent(encodedPath);
        const fileName = decodedPath.split("/").pop() || "";
        return fileName.split(".").pop()?.toLowerCase() || "";
    } catch {
        const fileName = url.split("/").pop()?.split("?")[0] || "";
        return decodeURIComponent(fileName).split(".").pop()?.toLowerCase() || "";
    }
}

function getUploadedFileName(url: string) {
    try {
        const parsed = new URL(url);
        const encodedPath = parsed.pathname.split("/o/")[1] || "";
        const decodedPath = decodeURIComponent(encodedPath);
        return (decodedPath.split("/").pop() || "").replace(/^\d+_/, "");
    } catch {
        const fileName = url.split("/").pop()?.split("?")[0] || "";
        return decodeURIComponent(fileName).replace(/^\d+_/, "");
    }
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
