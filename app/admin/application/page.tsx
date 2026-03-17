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

    const fetchApplication = async () => {
        if (!applicationId) return;
        setLoading(true);
        try {
            const app = await dbService.getMyApplication(applicationId);
            setApplication(app as Application);
        } catch (error) {
            console.error("Failed to fetch application:", error);
        } finally {
            setLoading(false);
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
        firstName: application.section1_personal?.full_name?.split(' ')[0] || '',
        lastName: application.section1_personal?.full_name?.split(' ').slice(1).join(' ') || '',
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

    const fullName = application.section1_personal?.full_name || "No Name";

    return (
        <div className="min-h-screen bg-slate-50" >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/admin/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
                            <StatusBadge status={application.status} />
                        </div>
                        <p className="text-slate-500 text-sm mt-1">
                            {personalInfo.email || "No Email"} · Application ID: {applicationId}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Application Data */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information */}
                        <Card>
                            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <InfoRow label="First Name" value={personalInfo.firstName} />
                                    <InfoRow label="Last Name" value={personalInfo.lastName} />
                                    <InfoRow label="Email" value={personalInfo.email} />
                                    <InfoRow label="Phone" value={personalInfo.phone} />
                                    <InfoRow label="Date of Birth" value={personalInfo.dateOfBirth} />
                                    <InfoRow label="Gender" value={personalInfo.gender} />
                                    <InfoRow label="Nationality" value={personalInfo.nationality} />
                                    <InfoRow label="College" value={personalInfo.college} />
                                    <InfoRow label="Year of Study" value={personalInfo.yearOfStudy} />
                                    <InfoRow label="Subjects" value={personalInfo.subjects?.join(', ')} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Essays */}
                        {essays && Object.keys(essays).length > 0 && (
                            <Card>
                                <CardHeader><CardTitle>Essays</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    {essays.aboutYou && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">About You</h4>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">{essays.aboutYou}</p>
                                        </div>
                                    )}
                                    {essays.subjectPassion && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Subject Passion</h4>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">{essays.subjectPassion}</p>
                                        </div>
                                    )}
                                    {essays.academyMotivation && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Academy Motivation</h4>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">{essays.academyMotivation}</p>
                                        </div>
                                    )}
                                    {travel.excitement && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Excitement about China</h4>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">{travel.excitement}</p>
                                        </div>
                                    )}
                                    {travel.dynamics && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Group Dynamics</h4>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">{travel.dynamics}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader><CardTitle>Logistics &amp; Confirmations</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Programme Dates &amp; Availability</h4>
                                            <p className="text-sm text-slate-600">Academy: August 2 to August 8 in Hangzhou. China Trip: August 8 to August 18, starting in Hangzhou and ending in Beijing.</p>
                                            <p className="text-sm text-slate-600 mt-2">Required arrival: August 1 in Hangzhou, ideally before 17:00 China Time. Return departure: August 18 from Beijing.</p>
                                            <p className="text-sm mt-3 font-medium text-slate-800">Confirmed: {availability.confirmsProgramDates ? "Yes" : "No"}</p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">International Flights</h4>
                                            <p className="text-sm text-slate-600">International return flights are not covered. Applicants must arrange and pay for their own travel to China and back home.</p>
                                            <p className="text-sm text-slate-600 mt-2">Applicants are also asked to check likely flight options and prices before applying.</p>
                                            <p className="text-sm mt-3 font-medium text-slate-800">Confirmed: {availability.confirmsFlightCosts ? "Yes" : "No"}</p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Visa Responsibility</h4>
                                            <p className="text-sm text-slate-600">Applicants must confirm for themselves whether they can enter China visa-free or whether they need to apply for a visa.</p>
                                            <p className="text-sm text-slate-600 mt-2">If a visa is needed, the applicant must complete the application independently and cover any related costs.</p>
                                            <p className="text-sm mt-3 font-medium text-slate-800">Confirmed: {availability.confirmsVisaResponsibility ? "Yes" : "No"}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-100">
                                        <InfoRow label="Dietary Restrictions" value={availability.dietary.join(', ') + (availability.dietaryOther ? ` (${availability.dietaryOther})` : '')} />
                                    </div>
                                </div>
                                {availability.additionalNotes && (
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-700 mb-2">Additional Notes</h4>
                                        <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">{availability.additionalNotes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {round2 && Object.keys(round2).length > 0 && (
                            <Card className="border-accent/30 shadow-sm">
                                <CardHeader className="bg-accent/5"><CardTitle className="text-accent">Round 2 Submission</CardTitle></CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    {round2.session_design_thoughts && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Session Design Thoughts</h4>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">{round2.session_design_thoughts}</p>
                                        </div>
                                    )}
                                    {round2.video_url && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Video Presentation Link</h4>
                                            <a href={round2.video_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all">
                                                {round2.video_url}
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Timeline */}
                        <Card>
                            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <InfoRow label="Created" value={application.createdAt ? new Date(application.createdAt).toLocaleString() : undefined} />
                                    <InfoRow label="Submitted" value={application.submittedAt ? new Date(application.submittedAt).toLocaleString() : undefined} />
                                    <InfoRow label="Last Updated" value={application.lastUpdatedAt ? new Date(application.lastUpdatedAt).toLocaleString() : undefined} />
                                    <InfoRow label="Decision Released" value={application.decisionReleasedAt ? new Date(application.decisionReleasedAt).toLocaleString() : undefined} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Decision + Notes */}
                    <div className="space-y-6">
                        <DecisionCard
                            applicationId={applicationId!}
                            currentInternalDecision={application.adminData?.internalDecision}
                            currentPublicStatus={application.status}
                            onUpdate={fetchApplication}
                        />

                        <NotesSection
                            applicationId={applicationId!}
                            notes={application.adminData?.notes || []}
                            onNoteAdded={fetchApplication}
                        />
                    </div>
                </div>
            </div>
        </div >
    );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <dt className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</dt>
            <dd className="text-slate-900 mt-0.5">{value || <span className="text-slate-400">-</span>}</dd>
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
