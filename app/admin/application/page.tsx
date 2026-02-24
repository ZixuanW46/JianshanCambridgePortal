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

    const personalInfo = application.personalInfo || {} as Application['personalInfo'];
    const essays = application.essays || {};
    const fullName = [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(' ') || "No Name";

    return (
        <div className="min-h-screen bg-slate-50">
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
                                    <InfoRow label="University" value={personalInfo.university} />
                                    <InfoRow label="College" value={personalInfo.college} />
                                    <InfoRow label="Department" value={personalInfo.department} />
                                    <InfoRow label="Programme" value={personalInfo.programme} />
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
                                    {essays.motivation && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Motivation</h4>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">{essays.motivation}</p>
                                        </div>
                                    )}
                                    {essays.experience && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Teaching Experience</h4>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">{essays.experience}</p>
                                        </div>
                                    )}
                                    {essays.additionalInfo && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Additional Information</h4>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">{essays.additionalInfo}</p>
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
        </div>
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
