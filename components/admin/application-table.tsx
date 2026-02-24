"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Filter, ArrowUpDown, ArrowUp, ArrowDown, Search, Eye, Loader2, CheckCircle, RefreshCcw, Play, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { dbService } from "@/lib/db-service";
import { Application } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

interface AdminApplicationTableProps {
    applications: Application[];
}

const decisionOptions = [
    { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { value: 'waitlisted', label: 'Waitlist', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
];

const getDecisionColor = (decision: string | null | undefined) => {
    if (!decision) return 'bg-slate-100 text-slate-700';
    const option = decisionOptions.find(opt => opt.value === decision);
    return option ? option.color : 'bg-slate-100 text-slate-700';
};

export function AdminApplicationTable({ applications }: AdminApplicationTableProps) {
    const router = useRouter();
    const [localApps, setLocalApps] = useState<Application[]>(applications);

    useEffect(() => { setLocalApps(applications); }, [applications]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [decisionFilter, setDecisionFilter] = useState("all");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [updatingParams, setUpdatingParams] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const safeApps = localApps || [];
    const filteredApps = safeApps.filter(app => {
        const searchTerm = search.toLowerCase();
        const fullName = [app.personalInfo?.firstName, app.personalInfo?.lastName].filter(Boolean).join(' ').toLowerCase();
        const email = (app.personalInfo?.email || "").toLowerCase();
        const searchMatch = fullName.includes(searchTerm) || email.includes(searchTerm);
        const statusMatch = statusFilter === "all" || app.status === statusFilter;
        let decisionMatch = true;
        if (decisionFilter === "all") decisionMatch = true;
        else if (decisionFilter === "undecided") decisionMatch = !app.adminData?.internalDecision;
        else decisionMatch = app.adminData?.internalDecision === decisionFilter;
        return searchMatch && statusMatch && decisionMatch;
    });

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'lastUpdated', direction: 'desc' });

    const sortedApps = [...filteredApps].sort((a, b) => {
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        if (sortConfig.key === 'name') {
            const nameA = [a.personalInfo?.firstName, a.personalInfo?.lastName].filter(Boolean).join(' ');
            const nameB = [b.personalInfo?.firstName, b.personalInfo?.lastName].filter(Boolean).join(' ');
            return nameA.localeCompare(nameB) * direction;
        }
        if (sortConfig.key === 'submitted') {
            const timeA = new Date(a.timeline?.submittedAt || 0).getTime();
            const timeB = new Date(b.timeline?.submittedAt || 0).getTime();
            return (timeA - timeB) * direction;
        }
        if (sortConfig.key === 'lastUpdated') {
            const timeA = new Date(a.lastUpdatedAt || 0).getTime();
            const timeB = new Date(b.lastUpdatedAt || 0).getTime();
            return (timeA - timeB) * direction;
        }
        return 0;
    });

    const totalPages = Math.ceil(sortedApps.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedApps = sortedApps.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };
    const handleSort = (key: string) => {
        setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }));
    };

    const handleDecisionUpdate = async (userId: string, decision: string | null) => {
        const previousApps = [...localApps];
        setLocalApps(current => current.map(app => {
            if (app.id === userId) {
                return { ...app, adminData: { ...app.adminData, internalDecision: decision as any } };
            }
            return app;
        }));
        setUpdatingParams(userId);
        try {
            if (decision === null || ['accepted', 'rejected', 'waitlisted'].includes(decision!)) {
                await dbService.setInternalDecision(userId, decision as any);
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to update decision:", error);
            alert("Failed to update decision.");
            setLocalApps(previousApps);
        } finally {
            setUpdatingParams(null);
        }
    };

    const isEligibleForRelease = (app: Application) => {
        return app.status === 'under_review' && !!app.adminData?.internalDecision;
    };

    const eligibleApps = filteredApps.filter(isEligibleForRelease);
    const isAllSelected = eligibleApps.length > 0 && eligibleApps.every(app => selectedIds.has(app.id!));

    const toggleSelectAll = () => {
        if (isAllSelected) { setSelectedIds(new Set()); }
        else {
            const newSet = new Set<string>();
            eligibleApps.forEach(app => newSet.add(app.id!));
            setSelectedIds(newSet);
        }
    };
    const toggleSelectRow = (userId: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(userId)) newSet.delete(userId); else newSet.add(userId);
        setSelectedIds(newSet);
    };

    const [releaseStage, setReleaseStage] = useState<'idle' | 'confirming' | 'releasing' | 'success' | 'error'>('idle');
    const [releaseError, setReleaseError] = useState<string>("");

    const handleBatchReleaseClick = () => { if (selectedIds.size === 0) return; setReleaseStage('confirming'); };

    const confirmRelease = async () => {
        setReleaseStage('releasing');
        try {
            const results = await Promise.allSettled(Array.from(selectedIds).map(id => dbService.releaseResult(id)));
            const errors = results.filter(r => r.status === 'rejected');
            if (errors.length > 0) {
                setReleaseError(`Released with ${errors.length} errors.`);
                setReleaseStage('error');
            } else {
                setReleaseStage('success');
            }
        } catch {
            setReleaseError("Batch release failed.");
            setReleaseStage('error');
        }
    };

    const handleReleaseComplete = () => { setSelectedIds(new Set()); window.location.reload(); };
    const handleCloseRelease = () => { setReleaseStage('idle'); setReleaseError(""); };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />;
    };

    const [confirmAction, setConfirmAction] = useState<{ type: 'reset' | 'progress' | 'delete', userId: string } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const confirmActionHandler = async () => {
        if (!confirmAction) return;
        setActionLoading(true);
        try {
            if (confirmAction.type === 'progress') await dbService.progressApplication(confirmAction.userId);
            else if (confirmAction.type === 'reset') await dbService.resetApplication(confirmAction.userId);
            else if (confirmAction.type === 'delete') await dbService.deleteApplication(confirmAction.userId);
            if (confirmAction.type === 'delete') {
                setLocalApps(prev => prev.filter(a => a.id !== confirmAction.userId));
            } else {
                window.location.reload();
            }
        } catch (e) {
            console.error("Action failed", e);
            alert("Action failed");
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text" placeholder="Filter by name or email..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-sm hover:shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleBatchReleaseClick}
                        disabled={selectedIds.size === 0 || releaseStage === 'releasing'}
                    >
                        {releaseStage === 'releasing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        <span>Release Decision{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-slate-200 hover:bg-transparent">
                            <TableHead className="w-12 px-6 py-3 text-left">
                                <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} disabled={eligibleApps.length === 0} className="border-slate-300 rounded w-4 h-4" />
                            </TableHead>
                            <TableHead className="px-6 py-3">
                                <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs uppercase tracking-wider group font-medium" onClick={() => handleSort('name')}>
                                    APPLICANT <span className="w-3 h-3 flex items-center justify-center"><SortIcon column="name" /></span>
                                </button>
                            </TableHead>
                            <TableHead className="px-6 py-3">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs uppercase tracking-wider group font-medium">STATUS <Filter className="ml-1 h-3 w-3" /></button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {['all', 'draft', 'submitted', 'under_review', 'accepted', 'enrolled', 'rejected', 'waitlisted'].map(s => (
                                            <DropdownMenuCheckboxItem key={s} checked={statusFilter === s} onCheckedChange={() => setStatusFilter(s)}>
                                                {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableHead>
                            <TableHead className="px-6 py-3">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs uppercase tracking-wider group font-medium">INTERNAL DECISION <Filter className="ml-1 h-3 w-3" /></button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuLabel>Filter Decision</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {[{ v: 'all', l: 'All' }, { v: 'undecided', l: 'Undecided' }, { v: 'accepted', l: 'Accepted' }, { v: 'rejected', l: 'Rejected' }, { v: 'waitlisted', l: 'Waitlisted' }].map(d => (
                                            <DropdownMenuCheckboxItem key={d.v} checked={decisionFilter === d.v} onCheckedChange={() => setDecisionFilter(d.v)}>{d.l}</DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableHead>
                            <TableHead className="px-6 py-3">
                                <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs uppercase tracking-wider group font-medium" onClick={() => handleSort('submitted')}>
                                    SUBMITTED <span className="w-3 h-3 flex items-center justify-center"><SortIcon column="submitted" /></span>
                                </button>
                            </TableHead>
                            <TableHead className="px-6 py-3">
                                <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs uppercase tracking-wider group font-medium" onClick={() => handleSort('lastUpdated')}>
                                    LAST UPDATED <span className="w-3 h-3 flex items-center justify-center"><SortIcon column="lastUpdated" /></span>
                                </button>
                            </TableHead>
                            <TableHead className="px-6 py-3 text-center text-slate-500 text-xs uppercase tracking-wider font-medium">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedApps.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">No results found.</TableCell></TableRow>
                        ) : (
                            paginatedApps.map((app) => (
                                <TableRow key={app.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <TableCell className="px-6 py-4">
                                        <Checkbox checked={selectedIds.has(app.id!)} onCheckedChange={() => toggleSelectRow(app.id!)} disabled={!isEligibleForRelease(app)} className="border-slate-300 rounded w-4 h-4" />
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <div>
                                            <div className="text-slate-900 font-medium">{[app.personalInfo?.firstName, app.personalInfo?.lastName].filter(Boolean).join(' ') || "No Name"}</div>
                                            <div className="text-slate-500 text-sm">{app.personalInfo?.email || "No Email"}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4"><StatusBadge status={app.status} /></TableCell>
                                    <TableCell className="px-6 py-4">
                                        {app.status === 'draft' ? (
                                            <span className="text-slate-400">-</span>
                                        ) : ['submitted', 'under_review'].includes(app.status) ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors font-medium outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getDecisionColor(app.adminData?.internalDecision)} ${updatingParams === app.id ? 'opacity-50 cursor-wait' : ''}`} disabled={updatingParams === app.id}>
                                                        {decisionOptions.find(opt => opt.value === app.adminData?.internalDecision)?.label || 'Pending'}
                                                        {updatingParams === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuItem onClick={() => handleDecisionUpdate(app.id!, null)} className="cursor-pointer">
                                                        <span className="inline-block w-2 h-2 rounded-full mr-2 bg-slate-300"></span> Undecided
                                                    </DropdownMenuItem>
                                                    {decisionOptions.map(option => (
                                                        <DropdownMenuItem key={option.value} onClick={() => handleDecisionUpdate(app.id!, option.value)} className="cursor-pointer">
                                                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${option.color.split(' ')[0]}`}></span> {option.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <button className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium opacity-50 cursor-not-allowed ${getDecisionColor(app.adminData?.internalDecision)}`} disabled>
                                                {decisionOptions.find(opt => opt.value === app.adminData?.internalDecision)?.label || 'Pending'}
                                            </button>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <span className="text-sm text-slate-700">{app.timeline?.submittedAt ? new Date(app.timeline.submittedAt).toLocaleDateString() : "-"}</span>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <span className="text-sm text-slate-700">{new Date(app.lastUpdatedAt || "").toLocaleDateString()}</span>
                                    </TableCell>
                                    <TableCell className="px-2 py-4">
                                        <div className="flex justify-end gap-1">
                                            <Link href={`/admin/application?id=${app.id}`}><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700 hover:text-slate-900 hover:bg-slate-100" title="View"><Eye className="h-4 w-4" /></Button></Link>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Reset to Draft" onClick={() => setConfirmAction({ type: 'reset', userId: app.id! })}><RefreshCcw className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" title="Progress to Review" disabled={['accepted', 'enrolled', 'under_review', 'rejected', 'waitlisted'].includes(app.status)} onClick={() => setConfirmAction({ type: 'progress', userId: app.id! })}><Play className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete" onClick={() => setConfirmAction({ type: 'delete', userId: app.id! })}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white">
                <div className="text-slate-600 text-sm">
                    Showing {sortedApps.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, sortedApps.length)} of {sortedApps.length} applications
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>Next</button>
                </div>
            </div>

            {/* Action Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
                        {actionLoading ? (
                            <div className="flex flex-col items-center justify-center py-4">
                                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                <p className="text-slate-500">Processing...</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 capitalize">{confirmAction.type} Application?</h3>
                                <p className="text-slate-600 mb-6 text-sm">
                                    {confirmAction.type === 'reset' && "This will revert the application status to 'Draft'."}
                                    {confirmAction.type === 'progress' && "This will move the application status to 'Under Review'."}
                                    {confirmAction.type === 'delete' && "Are you sure? This action cannot be undone."}
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setConfirmAction(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm">Cancel</button>
                                    <button onClick={confirmActionHandler} className={`px-4 py-2 text-white rounded-lg font-medium shadow-sm text-sm ${confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : confirmAction.type === 'reset' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>Confirm</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Release Status Modal */}
            {releaseStage !== 'idle' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        {releaseStage === 'confirming' && (
                            <>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Release</h3>
                                <p className="text-slate-600 mb-6">
                                    Are you sure you want to release decisions for <span className="font-semibold text-slate-900">{selectedIds.size}</span> applicants? Email notifications will be sent.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button onClick={handleCloseRelease} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Cancel</button>
                                    <button onClick={confirmRelease} className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium shadow-sm">Yes, Release</button>
                                </div>
                            </>
                        )}
                        {releaseStage === 'releasing' && (
                            <div className="flex flex-col items-center justify-center py-8">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">Releasing Decisions...</h3>
                                <p className="text-slate-500 mt-2">Please do not close this window.</p>
                            </div>
                        )}
                        {releaseStage === 'success' && (
                            <div className="flex flex-col items-center justify-center py-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Success!</h3>
                                <p className="text-slate-600 text-center mb-6">Decisions have been successfully released.</p>
                                <button onClick={handleReleaseComplete} className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium w-full">Close & Refresh</button>
                            </div>
                        )}
                        {releaseStage === 'error' && (
                            <div className="flex flex-col items-center justify-center py-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4"><div className="text-red-600 font-bold text-xl">!</div></div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h3>
                                <p className="text-red-500 text-center mb-6 text-sm">{releaseError}</p>
                                <button onClick={handleCloseRelease} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-medium w-full">Close</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
