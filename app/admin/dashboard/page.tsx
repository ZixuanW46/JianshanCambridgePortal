"use client"

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Application } from "@/lib/types";
import { Loader2, Users, FileText, CheckCircle, Clock, XCircle, Search, Eye } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function AdminDashboardPage() {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/');
        }
    }, [loading, isAdmin, router]);

    useEffect(() => {
        async function fetchApps() {
            if (!isAdmin || !user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/admin', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const { data } = await res.json();
                setApplications(data || []);
            } catch (e) {
                console.error("Failed to fetch applications", e);
            } finally {
                setFetching(false);
            }
        }
        if (isAdmin) fetchApps();
    }, [isAdmin, user]);

    const filteredApps = useMemo(() => {
        let filtered = applications;

        if (statusFilter !== 'all') {
            filtered = filtered.filter(a => a.status === statusFilter);
        }

        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(a =>
                (a.personalInfo?.firstName?.toLowerCase().includes(q)) ||
                (a.personalInfo?.lastName?.toLowerCase().includes(q)) ||
                (a.personalInfo?.email?.toLowerCase().includes(q)) ||
                (a.personalInfo?.university?.toLowerCase().includes(q))
            );
        }

        return filtered;
    }, [applications, statusFilter, search]);

    const stats = useMemo(() => ({
        total: applications.length,
        submitted: applications.filter(a => a.status === 'submitted').length,
        underReview: applications.filter(a => a.status === 'under_review').length,
        accepted: applications.filter(a => a.status === 'accepted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        waitlisted: applications.filter(a => a.status === 'waitlisted').length,
        drafts: applications.filter(a => a.status === 'draft').length,
    }), [applications]);

    if (loading || (isAdmin && fetching)) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b py-8">
                <div className="container mx-auto max-w-7xl px-4 md:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
                    <p className="text-slate-500 mt-2">Manage tutor applications and track progress</p>
                </div>
            </div>

            <div className="container mx-auto max-w-7xl px-4 md:px-8 py-8 space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {[
                        { label: 'Total', value: stats.total, icon: Users, color: 'text-slate-700' },
                        { label: 'Drafts', value: stats.drafts, icon: FileText, color: 'text-gray-500' },
                        { label: 'Submitted', value: stats.submitted, icon: FileText, color: 'text-blue-600' },
                        { label: 'Review', value: stats.underReview, icon: Clock, color: 'text-amber-600' },
                        { label: 'Accepted', value: stats.accepted, icon: CheckCircle, color: 'text-green-600' },
                        { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600' },
                        { label: 'Waitlisted', value: stats.waitlisted, icon: Clock, color: 'text-orange-600' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <s.icon className={cn("w-4 h-4", s.color)} />
                                <span className="text-xs text-slate-500 font-medium uppercase">{s.label}</span>
                            </div>
                            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border shadow-sm p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name, email, or university..."
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'submitted', 'under_review', 'accepted', 'rejected', 'waitlisted', 'draft'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                        statusFilter === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    )}
                                >
                                    {s === 'all' ? 'All' : s === 'under_review' ? 'Under Review' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b">
                                    <th className="text-left p-4 font-semibold text-slate-600">Applicant</th>
                                    <th className="text-left p-4 font-semibold text-slate-600">University</th>
                                    <th className="text-left p-4 font-semibold text-slate-600">Subjects</th>
                                    <th className="text-left p-4 font-semibold text-slate-600">Status</th>
                                    <th className="text-left p-4 font-semibold text-slate-600">Submitted</th>
                                    <th className="text-right p-4 font-semibold text-slate-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApps.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">No applications found</td></tr>
                                ) : (
                                    filteredApps.map(app => (
                                        <tr key={app.id} className="border-b hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-slate-900">
                                                    {app.personalInfo?.firstName} {app.personalInfo?.lastName}
                                                </div>
                                                <div className="text-xs text-slate-500">{app.personalInfo?.email}</div>
                                            </td>
                                            <td className="p-4 text-slate-600">{app.personalInfo?.university || '-'}</td>
                                            <td className="p-4 text-slate-600 max-w-[200px] truncate">{app.personalInfo?.subjects?.slice(0, 3).join(', ') || '-'}</td>
                                            <td className="p-4"><StatusBadge status={app.status} /></td>
                                            <td className="p-4 text-slate-500">
                                                {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-GB') : '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button size="sm" variant="ghost" asChild>
                                                    <Link href={`/admin/application?id=${app.id}`}>
                                                        <Eye className="w-4 h-4 mr-1" /> View
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
