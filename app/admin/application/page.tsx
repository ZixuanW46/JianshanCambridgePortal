"use client"

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { Application } from "@/lib/types";
import { dbService } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function AdminApplicationDetailContent() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();
    const [application, setApplication] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [decision, setDecision] = useState('');
    const [updating, setUpdating] = useState(false);
    const [note, setNote] = useState('');
    const [addingNote, setAddingNote] = useState(false);

    const searchParams = useSearchParams();
    const applicationId = searchParams.get('id');

    const fetchApplication = async () => {
        if (!applicationId) return;
        try {
            const token = await user?.getIdToken();
            const res = await fetch('/api/admin', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { data } = await res.json();
            const found = data?.find((a: any) => a.id === applicationId);
            if (found) setApplication(found);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/');
            return;
        }
        if (isAdmin && applicationId) {
            fetchApplication();
        } else if (isAdmin && !applicationId) {
            setLoading(false);
        }
    }, [authLoading, isAdmin, applicationId]);

    const handleUpdateStatus = async (newStatus: string) => {
        if (!application || !user) return;
        setUpdating(true);
        try {
            await dbService.updateApplicationStatus(application.id, newStatus);
            await fetchApplication();
        } catch (err) {
            console.error("Update failed:", err);
        } finally {
            setUpdating(false);
        }
    };

    const handleAddNote = async () => {
        if (!application || !user || !note.trim()) return;
        setAddingNote(true);
        try {
            await dbService.addAdminNote(application.id, note.trim(), user.displayName || user.email || 'Admin');
            setNote('');
            await fetchApplication();
        } catch (err) {
            console.error("Note add failed:", err);
        } finally {
            setAddingNote(false);
        }
    };

    if (authLoading || (isAdmin && loading)) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
    }

    if (!application) {
        return (
            <div className="p-8">
                <p>Application not found or no ID provided.</p>
                <Link href="/admin/dashboard"><Button variant="link">Back to Dashboard</Button></Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-8">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="mb-6">
                    <Link href="/admin/dashboard" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                    <div className="flex justify-between items-start mt-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                {application.personalInfo?.firstName} {application.personalInfo?.lastName}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-slate-500">{application.personalInfo?.university}</span>
                                <StatusBadge status={application.status} />
                            </div>
                        </div>
                        <div className="text-right text-sm text-slate-500">
                            <p>ID: {application.id}</p>
                            <p>Email: {application.personalInfo?.email}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Application Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-slate-500">Name:</span> <span className="font-medium">{application.personalInfo?.firstName} {application.personalInfo?.lastName}</span></div>
                                <div><span className="text-slate-500">Email:</span> <span className="font-medium">{application.personalInfo?.email}</span></div>
                                <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{application.personalInfo?.phone || 'N/A'}</span></div>
                                <div><span className="text-slate-500">Nationality:</span> <span className="font-medium">{application.personalInfo?.nationality || 'N/A'}</span></div>
                                <div><span className="text-slate-500">University:</span> <span className="font-medium">{application.personalInfo?.university}</span></div>
                                <div><span className="text-slate-500">College:</span> <span className="font-medium">{application.personalInfo?.college || 'N/A'}</span></div>
                                <div><span className="text-slate-500">Programme:</span> <span className="font-medium">{application.personalInfo?.programme || 'N/A'}</span></div>
                                <div><span className="text-slate-500">Year:</span> <span className="font-medium">{application.personalInfo?.yearOfStudy || 'N/A'}</span></div>
                                <div className="col-span-2"><span className="text-slate-500">Subjects:</span> <span className="font-medium">{application.personalInfo?.subjects?.join(', ') || 'N/A'}</span></div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Motivation Essay</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{application.essays?.motivation || 'Not provided'}</p>
                            </CardContent>
                        </Card>

                        {application.essays?.experience && (
                            <Card>
                                <CardHeader><CardTitle>Teaching Experience</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{application.essays.experience}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right: Admin Actions */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Decision</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-slate-500 mb-2">Current status: <StatusBadge status={application.status} /></p>
                                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus('accepted')} disabled={updating}>
                                    Accept
                                </Button>
                                <Button className="w-full" variant="outline" onClick={() => handleUpdateStatus('waitlisted')} disabled={updating}>
                                    Waitlist
                                </Button>
                                <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => handleUpdateStatus('rejected')} disabled={updating}>
                                    Reject
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Admin Notes</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {application.adminData?.notes?.map((n: any, i: number) => (
                                    <div key={i} className="text-sm border-b pb-2 last:border-0">
                                        <p className="text-slate-700">{n.content}</p>
                                        <p className="text-xs text-slate-400 mt-1">{n.author} · {new Date(n.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                                <div className="flex gap-2 mt-4">
                                    <input
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="Add a note..."
                                        className="flex-1 text-sm border rounded-lg px-3 py-2"
                                    />
                                    <Button size="sm" onClick={handleAddNote} disabled={addingNote || !note.trim()}>
                                        {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminApplicationDetailPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
            <AdminApplicationDetailContent />
        </Suspense>
    );
}
