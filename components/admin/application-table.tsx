"use client"

import { useState, useEffect, useMemo } from "react";
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
import { ChevronDown, ChevronUp, Filter, ArrowUpDown, ArrowUp, ArrowDown, Search, Eye, Loader2, CheckCircle, RefreshCcw, Play, Trash2, Banknote, Download } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { dbService } from "@/lib/db-service";
import { Application } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { formatStatusLabel, getNextStatus, getPreviousStatus, InternalDecision } from "@/lib/admin-workflow";
import { downloadApplicationsExcel } from "@/lib/admin-application-export";
import { normalizeApplicationStatus } from "@/lib/application-status";
import { ADMIN_STATUS_FILTER_OPTIONS, type AdminStatusFilter } from "@/lib/admin-dashboard";
import { formatNationalityList } from "@/lib/application-form";
import { useAuth } from "@/lib/auth-context";
import {
    formatRatingValue,
    getAllRatingAdmins,
    getApplicationRatingByAdmin,
    getAverageApplicationRating,
} from "@/lib/admin-ratings";
import { resolveAdminDisplayName } from "@/lib/admin-profiles";
import { getAverageAiReviewScore } from "@/lib/ai-review";

interface AdminApplicationTableProps {
    applications: Application[];
    statusFilter?: AdminStatusFilter;
    onStatusFilterChange?: (status: AdminStatusFilter) => void;
}

type ToggleableColumnId =
    | "myScore"
    | "averageScore"
    | "aiScore"
    | "internalDecision"
    | "gender"
    | "yearOfStudy"
    | "subject"
    | "nationality"
    | "submitted"
    | "lastUpdated"
    | `rating:${string}`;

const allDecisionOptions: Array<{ value: InternalDecision; label: string; color: string }> = [
    { value: 'shortlisted', label: 'Shortlisted', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
    { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { value: 'waitlisted', label: 'Waitlist', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
];

const getDecisionOptions = (status: string) => {
    const normalizedStatus = normalizeApplicationStatus(status as Application["status"]) || status;

    if (normalizedStatus === 'under_review') {
        return allDecisionOptions.filter(o => o.value === 'shortlisted' || o.value === 'rejected');
    }
    if (normalizedStatus === 'round_2_under_review') {
        return allDecisionOptions.filter(o => o.value === 'accepted' || o.value === 'rejected' || o.value === 'waitlisted');
    }
    if (normalizedStatus === 'waitlisted') {
        return allDecisionOptions.filter(o => o.value === 'accepted' || o.value === 'rejected' || o.value === 'waitlisted');
    }
    return allDecisionOptions;
};

const matchesStatusFilter = (status: Application["status"], filter: AdminStatusFilter) => {
    const normalizedStatus = normalizeApplicationStatus(status) || status;
    if (filter === "all") return true;
    if (filter === "offer_open") {
        return normalizedStatus === "accepted" || normalizedStatus === "accepted_pending_payment";
    }
    return normalizedStatus === filter;
};

const formatAdminStatusFilterLabel = (status: AdminStatusFilter) => {
    if (status === "all") return "All Statuses";
    if (status === "offer_open") return "Offer Open";
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
};

const getDecisionColor = (decision: string | null | undefined) => {
    if (!decision) return 'bg-slate-100 text-slate-700';
    const option = allDecisionOptions.find(opt => opt.value === decision);
    return option ? option.color : 'bg-slate-100 text-slate-700';
};

const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getDisplayGender = (app: Application) => {
    const gender = app.section1_personal?.gender;
    if (!gender) return "-";
    if (gender === "Other") {
        return app.section1_personal?.gender_other?.trim() || "Other";
    }
    return gender;
};

const getDisplaySubject = (app: Application) => {
    const subject = app.section1_personal?.subject;
    if (!subject) return "-";
    if (subject === "Other") {
        return app.section1_personal?.subject_other?.trim() || "Other";
    }
    return subject;
};

const getDisplayYearOfStudy = (app: Application) => {
    const yearOfStudy = app.section1_personal?.year_of_study;
    if (!yearOfStudy) return "-";
    if (yearOfStudy === "Other") {
        return app.section1_personal?.year_of_study_other?.trim() || "Other";
    }
    return yearOfStudy;
};

const getDisplayNationality = (app: Application) => {
    return formatNationalityList(app.section1_personal?.nationality) || "-";
};

const getUniqueColumnFilterOptions = (
    apps: Application[],
    getter: (app: Application) => string,
) => {
    const values = new Set<string>();

    apps.forEach((app) => {
        values.add(getter(app) || "-");
    });

    return ["all", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
};

const DEFAULT_VISIBLE_COLUMNS: ToggleableColumnId[] = [
    "myScore",
    "averageScore",
    "internalDecision",
    "gender",
    "yearOfStudy",
    "subject",
    "nationality",
    "submitted",
    "lastUpdated",
];

const isRatingColumnId = (columnId: ToggleableColumnId): columnId is `rating:${string}` => (
    columnId.startsWith("rating:")
);

export function AdminApplicationTable({
    applications,
    statusFilter: controlledStatusFilter,
    onStatusFilterChange,
}: AdminApplicationTableProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [localApps, setLocalApps] = useState<Application[]>(applications);

    useEffect(() => { setLocalApps(applications); }, [applications]);

    const [search, setSearch] = useState("");
    const [uncontrolledStatusFilter, setUncontrolledStatusFilter] = useState<AdminStatusFilter>("all");
    const [decisionFilter, setDecisionFilter] = useState("all");
    const [genderFilter, setGenderFilter] = useState("all");
    const [yearOfStudyFilter, setYearOfStudyFilter] = useState("all");
    const [subjectFilter, setSubjectFilter] = useState("all");
    const [visibleColumnIds, setVisibleColumnIds] = useState<ToggleableColumnId[]>(DEFAULT_VISIBLE_COLUMNS);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [updatingParams, setUpdatingParams] = useState<string | null>(null);
    const [updatingRatingId, setUpdatingRatingId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedActionRowId, setExpandedActionRowId] = useState<string | null>(null);
    const itemsPerPage = 50;
    const statusFilter = controlledStatusFilter ?? uncontrolledStatusFilter;

    const handleStatusFilterChange = (nextStatus: AdminStatusFilter) => {
        if (controlledStatusFilter === undefined) {
            setUncontrolledStatusFilter(nextStatus);
        }
        onStatusFilterChange?.(nextStatus);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search, decisionFilter, statusFilter, genderFilter, yearOfStudyFilter, subjectFilter]);

    const safeApps = localApps;
    const genderFilterOptions = getUniqueColumnFilterOptions(safeApps, getDisplayGender);
    const yearOfStudyFilterOptions = getUniqueColumnFilterOptions(safeApps, getDisplayYearOfStudy);
    const subjectFilterOptions = getUniqueColumnFilterOptions(safeApps, getDisplaySubject);
    const allRatingAdmins = useMemo(() => getAllRatingAdmins(safeApps), [safeApps]);
    const ratingAdminColumns = useMemo(() => allRatingAdmins.map((admin) => ({
        id: `rating:${admin.adminUid}` as const,
        adminUid: admin.adminUid,
        label: `Score: ${admin.label}`,
    })), [allRatingAdmins]);

    const filteredApps = safeApps.filter(app => {
        const searchTerm = search.toLowerCase();
        const fullName = (app.section1_personal?.full_name || "").toLowerCase();
        const email = (app.section1_personal?.personal_email || app.section1_personal?.cambridge_email || "").toLowerCase();
        const searchMatch = fullName.includes(searchTerm) || email.includes(searchTerm);
        const statusMatch = matchesStatusFilter(app.status, statusFilter);
        const genderMatch = genderFilter === "all" || getDisplayGender(app) === genderFilter;
        const yearOfStudyMatch = yearOfStudyFilter === "all" || getDisplayYearOfStudy(app) === yearOfStudyFilter;
        const subjectMatch = subjectFilter === "all" || getDisplaySubject(app) === subjectFilter;
        let decisionMatch = true;
        if (decisionFilter === "all") decisionMatch = true;
        else if (decisionFilter === "undecided") decisionMatch = !app.adminData?.internalDecision;
        else decisionMatch = app.adminData?.internalDecision === decisionFilter;
        return searchMatch && statusMatch && decisionMatch && genderMatch && yearOfStudyMatch && subjectMatch;
    });

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'lastUpdated', direction: 'desc' });

    const sortedApps = [...filteredApps].sort((a, b) => {
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        if (sortConfig.key === 'name') {
            const nameA = a.section1_personal?.full_name || "";
            const nameB = b.section1_personal?.full_name || "";
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

    const toggleColumnVisibility = (columnId: ToggleableColumnId) => {
        setVisibleColumnIds((current) => (
            current.includes(columnId)
                ? current.filter((id) => id !== columnId)
                : [...current, columnId]
        ));
    };

    useEffect(() => {
        const ratingColumnIds = new Set(ratingAdminColumns.map((column) => column.id));

        setVisibleColumnIds((current) => {
            const next = current.filter((columnId) => {
                if (!isRatingColumnId(columnId)) return true;
                return ratingColumnIds.has(columnId);
            });

            return next.length === current.length ? current : next;
        });
    }, [ratingAdminColumns]);

    const handleDecisionUpdate = async (userId: string, decision: InternalDecision | null) => {
        const previousApps = [...localApps];
        setLocalApps(current => current.map(app => {
            if (app.id === userId) {
                return { ...app, adminData: { ...app.adminData, internalDecision: decision } };
            }
            return app;
        }));
        setUpdatingParams(userId);
        try {
            if (decision === null || ['shortlisted', 'accepted', 'rejected', 'waitlisted'].includes(decision)) {
                await dbService.setInternalDecision(userId, decision);
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

    const handleRatingUpdate = async (applicationId: string, score: number) => {
        if (!user?.uid) {
            alert("You must be signed in as an admin to rate applications.");
            return;
        }

        const adminName = resolveAdminDisplayName({
            adminUid: user.uid,
            adminName: user.displayName,
            adminEmail: user.email,
        });
        const adminEmail = user.email || "";
        const previousApps = [...localApps];
        const timestamp = new Date().toISOString();

        setLocalApps((current) => current.map((app) => {
            if (app.id !== applicationId) return app;

            return {
                ...app,
                lastUpdatedAt: timestamp,
                adminData: {
                    ...app.adminData,
                    ratings: {
                        ...(app.adminData?.ratings || {}),
                        [user.uid]: {
                            score,
                            adminName,
                            adminEmail,
                            updatedAt: timestamp,
                        },
                    },
                },
            };
        }));

        setUpdatingRatingId(applicationId);
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
            setLocalApps(previousApps);
        } finally {
            setUpdatingRatingId(null);
        }
    };

    const isEligibleForRelease = (app: Application) => {
        const normalizedStatus = normalizeApplicationStatus(app.status) || app.status;
        return ['under_review', 'round_2_under_review', 'waitlisted'].includes(normalizedStatus) && !!app.adminData?.internalDecision;
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
    const [isExporting, setIsExporting] = useState(false);

    const handleBatchReleaseClick = () => { if (selectedIds.size === 0) return; setReleaseStage('confirming'); };

    const handleExport = async () => {
        const selectedApps = filteredApps.filter((app) => app.id && selectedIds.has(app.id));
        const appsToExport = selectedApps.length > 0 ? selectedApps : filteredApps;

        if (appsToExport.length === 0) {
            alert("No applications available to export.");
            return;
        }

        setIsExporting(true);
        try {
            downloadApplicationsExcel(appsToExport, { selectedOnly: selectedApps.length > 0 });
        } catch (error) {
            console.error("Failed to export applications:", error);
            alert("Failed to export applications.");
        } finally {
            setIsExporting(false);
        }
    };

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

    const renderSingleSelectFilter = (
        label: string,
        value: string,
        onChange: (nextValue: string) => void,
        options: string[],
        menuLabel: string,
    ) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs uppercase tracking-wider group font-medium">
                    {label} <Filter className="ml-1 h-3 w-3" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {options.map((option) => (
                    <DropdownMenuCheckboxItem
                        key={option}
                        checked={value === option}
                        onCheckedChange={() => onChange(option)}
                    >
                        {option === "all" ? "All" : option}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const renderRatingSelector = (app: Application) => {
        const myRating = user?.uid ? getApplicationRatingByAdmin(app, user.uid) : null;
        const isUpdating = updatingRatingId === app.id;

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={`inline-flex min-w-[88px] items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            myRating
                                ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        } ${isUpdating ? "cursor-wait opacity-60" : ""}`}
                        disabled={isUpdating || !user?.uid}
                    >
                        <span>{myRating ? `${myRating.score}/10` : "Rate"}</span>
                        {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Set Your Rating</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
                        <DropdownMenuItem
                            key={score}
                            onClick={() => handleRatingUpdate(app.id!, score)}
                            className="cursor-pointer"
                        >
                            {score}/10
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    const middleColumns = [
        {
            id: "myScore" as const,
            label: "My Score",
            minWidth: 120,
            visible: visibleColumnIds.includes("myScore"),
            header: <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">My Score</span>,
            cell: (app: Application) => renderRatingSelector(app),
        },
        {
            id: "averageScore" as const,
            label: "Average Score",
            minWidth: 130,
            visible: visibleColumnIds.includes("averageScore"),
            header: <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">Average Score</span>,
            cell: (app: Application) => (
                <span className="text-sm font-medium text-slate-700">
                    {formatRatingValue(getAverageApplicationRating(app), { compact: false })}
                </span>
            ),
        },
        {
            id: "aiScore" as const,
            label: "AI Score",
            minWidth: 120,
            visible: visibleColumnIds.includes("aiScore"),
            header: <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">AI Score</span>,
            cell: (app: Application) => (
                <span className="text-sm font-medium text-slate-700">
                    {formatRatingValue(getAverageAiReviewScore(app), { compact: false })}
                </span>
            ),
        },
        {
            id: "internalDecision" as const,
            label: "Internal Decision",
            minWidth: 190,
            visible: visibleColumnIds.includes("internalDecision"),
            header: renderSingleSelectFilter(
                "INTERNAL DECISION",
                decisionFilter,
                setDecisionFilter,
                ['all', 'undecided', 'shortlisted', 'accepted', 'rejected', 'waitlisted'],
                "Filter Decision",
            ),
            cell: (app: Application) => (
                app.status === 'draft' ? (
                    <span className="text-slate-400">-</span>
                ) : ['submitted', 'under_review', 'shortlisted', 'round_2_under_review', 'waitlisted'].includes(normalizeApplicationStatus(app.status) || app.status) ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors font-medium outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getDecisionColor(app.adminData?.internalDecision)} ${updatingParams === app.id ? 'opacity-50 cursor-wait' : ''}`} disabled={updatingParams === app.id}>
                                {allDecisionOptions.find(opt => opt.value === app.adminData?.internalDecision)?.label || 'Pending'}
                                {updatingParams === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleDecisionUpdate(app.id!, null)} className="cursor-pointer">
                                <span className="inline-block w-2 h-2 rounded-full mr-2 bg-slate-300"></span> Undecided
                            </DropdownMenuItem>
                            {getDecisionOptions(app.status).map(option => (
                                <DropdownMenuItem key={option.value} onClick={() => handleDecisionUpdate(app.id!, option.value)} className="cursor-pointer">
                                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${option.color.split(' ')[0]}`}></span> {option.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <button className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium opacity-50 cursor-not-allowed ${getDecisionColor(app.adminData?.internalDecision)}`} disabled>
                        {allDecisionOptions.find(opt => opt.value === app.adminData?.internalDecision)?.label || 'Pending'}
                    </button>
                )
            ),
        },
        {
            id: "gender" as const,
            label: "Gender",
            minWidth: 140,
            visible: visibleColumnIds.includes("gender"),
            header: renderSingleSelectFilter("GENDER", genderFilter, setGenderFilter, genderFilterOptions, "Filter Gender"),
            cell: (app: Application) => <span className="text-sm text-slate-700">{getDisplayGender(app)}</span>,
        },
        {
            id: "yearOfStudy" as const,
            label: "Year of Study",
            minWidth: 170,
            visible: visibleColumnIds.includes("yearOfStudy"),
            header: renderSingleSelectFilter("YEAR OF STUDY", yearOfStudyFilter, setYearOfStudyFilter, yearOfStudyFilterOptions, "Filter Year of Study"),
            cell: (app: Application) => <span className="text-sm text-slate-700">{getDisplayYearOfStudy(app)}</span>,
        },
        {
            id: "subject" as const,
            label: "Subject / Programme",
            minWidth: 220,
            visible: visibleColumnIds.includes("subject"),
            header: renderSingleSelectFilter("SUBJECT / PROGRAMME", subjectFilter, setSubjectFilter, subjectFilterOptions, "Filter Subject / Programme"),
            cell: (app: Application) => (
                <span className="block max-w-[200px] truncate text-sm text-slate-700" title={getDisplaySubject(app)}>
                    {getDisplaySubject(app)}
                </span>
            ),
        },
        {
            id: "nationality" as const,
            label: "Nationality",
            minWidth: 220,
            visible: visibleColumnIds.includes("nationality"),
            header: <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">Nationality</span>,
            cell: (app: Application) => (
                <span className="block max-w-[200px] truncate text-sm text-slate-700" title={getDisplayNationality(app)}>
                    {getDisplayNationality(app)}
                </span>
            ),
        },
        {
            id: "submitted" as const,
            label: "Submitted",
            minWidth: 150,
            visible: visibleColumnIds.includes("submitted"),
            header: (
                <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs uppercase tracking-wider group font-medium" onClick={() => handleSort('submitted')}>
                    SUBMITTED <span className="w-3 h-3 flex items-center justify-center"><SortIcon column="submitted" /></span>
                </button>
            ),
            cell: (app: Application) => (
                <span className="text-sm text-slate-700">{app.timeline?.submittedAt ? new Date(app.timeline.submittedAt).toLocaleDateString() : "-"}</span>
            ),
        },
        {
            id: "lastUpdated" as const,
            label: "Last Updated",
            minWidth: 160,
            visible: visibleColumnIds.includes("lastUpdated"),
            header: (
                <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs uppercase tracking-wider group font-medium" onClick={() => handleSort('lastUpdated')}>
                    LAST UPDATED <span className="w-3 h-3 flex items-center justify-center"><SortIcon column="lastUpdated" /></span>
                </button>
            ),
            cell: (app: Application) => (
                <span className="text-sm text-slate-700">{new Date(app.lastUpdatedAt || "").toLocaleDateString()}</span>
            ),
        },
        ...ratingAdminColumns.map((adminColumn) => ({
            id: adminColumn.id,
            label: adminColumn.label,
            minWidth: 120,
            visible: visibleColumnIds.includes(adminColumn.id),
            header: <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">{adminColumn.label}</span>,
            cell: (app: Application) => {
                const rating = getApplicationRatingByAdmin(app, adminColumn.adminUid);
                return (
                    <span className="text-sm font-medium text-slate-700">
                        {rating ? `${rating.score}/10` : "-"}
                    </span>
                );
            },
        })),
    ];

    const visibleMiddleColumns = middleColumns.filter((column) => column.visible);
    const tableMinWidth = 72 + 280 + 160 + 170 + visibleMiddleColumns.reduce((sum, column) => sum + column.minWidth, 0);
    const emptyStateColSpan = 4 + visibleMiddleColumns.length;

    const [confirmAction, setConfirmAction] = useState<{ type: 'reset' | 'advance' | 'back' | 'delete' | 'confirm_payment', userId: string } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const toggleExpandedActions = (userId: string) => {
        setExpandedActionRowId(current => current === userId ? null : userId);
    };

    const getActionTargetStatus = (action: NonNullable<typeof confirmAction>) => {
        const app = localApps.find(item => item.id === action.userId);
        if (!app) return null;
        if (action.type === 'advance') return getNextStatus(app.status);
        if (action.type === 'back') return getPreviousStatus(app.status);
        if (action.type === 'confirm_payment') return 'payment_received';
        if (action.type === 'reset') return 'draft';
        return null;
    };

    const confirmActionHandler = async () => {
        if (!confirmAction) return;
        setActionLoading(true);
        try {
            if (confirmAction.type === 'advance' || confirmAction.type === 'back') {
                const targetStatus = getActionTargetStatus(confirmAction);
                if (!targetStatus) throw new Error("No target status available.");
                await dbService.moveApplicationStatus(confirmAction.userId, targetStatus);
            }
            else if (confirmAction.type === 'reset') await dbService.resetApplication(confirmAction.userId);
            else if (confirmAction.type === 'delete') await dbService.deleteApplication(confirmAction.userId);
            else if (confirmAction.type === 'confirm_payment') await dbService.confirmPaymentReceived(confirmAction.userId);
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
                <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text" placeholder="Filter by name or email..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-colors shadow-sm text-sm">
                                Columns
                                <ChevronDown className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {middleColumns.map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    checked={visibleColumnIds.includes(column.id)}
                                    onCheckedChange={() => toggleColumnVisibility(column.id)}
                                >
                                    {column.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="flex items-center gap-2 px-6 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-colors shadow-sm hover:shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleExport}
                        disabled={filteredApps.length === 0 || isExporting}
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span>Export to Excel</span>
                    </button>
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
                <Table style={{ minWidth: `${tableMinWidth}px` }}>
                    <TableHeader>
                        <TableRow className="border-b border-slate-200 hover:bg-transparent">
                            <TableHead className="sticky left-0 z-30 w-[72px] min-w-[72px] bg-white px-6 py-3 text-left shadow-[6px_0_12px_-10px_rgba(15,23,42,0.18)]">
                                <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} disabled={eligibleApps.length === 0} className="border-slate-300 rounded w-4 h-4" />
                            </TableHead>
                            <TableHead className="sticky left-[72px] z-30 min-w-[280px] bg-white px-6 py-3 shadow-[6px_0_12px_-10px_rgba(15,23,42,0.18)]">
                                <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs uppercase tracking-wider group font-medium" onClick={() => handleSort('name')}>
                                    APPLICANT <span className="w-3 h-3 flex items-center justify-center"><SortIcon column="name" /></span>
                                </button>
                            </TableHead>
                            <TableHead className="sticky left-[352px] z-30 min-w-[160px] bg-white px-6 py-3 shadow-[6px_0_12px_-10px_rgba(15,23,42,0.18)]">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs uppercase tracking-wider group font-medium">STATUS <Filter className="ml-1 h-3 w-3" /></button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {ADMIN_STATUS_FILTER_OPTIONS.map(s => (
                                            <DropdownMenuCheckboxItem key={s} checked={statusFilter === s} onCheckedChange={() => handleStatusFilterChange(s)}>
                                                {formatAdminStatusFilterLabel(s)}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableHead>
                            {visibleMiddleColumns.map((column) => (
                                <TableHead key={column.id} className="px-6 py-3" style={{ minWidth: `${column.minWidth}px` }}>
                                    {column.header}
                                </TableHead>
                            ))}
                            <TableHead className="sticky right-0 z-30 min-w-[170px] bg-white px-4 py-3 text-center text-slate-500 text-xs uppercase tracking-wider font-medium shadow-[-6px_0_12px_-10px_rgba(15,23,42,0.18)]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedApps.length === 0 ? (
                            <TableRow><TableCell colSpan={emptyStateColSpan} className="h-24 text-center">No results found.</TableCell></TableRow>
                        ) : (
                            paginatedApps.map((app) => (
                                <TableRow key={app.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <TableCell className="sticky left-0 z-20 w-[72px] min-w-[72px] bg-white px-6 py-4 shadow-[6px_0_12px_-10px_rgba(15,23,42,0.14)]">
                                        <Checkbox checked={selectedIds.has(app.id!)} onCheckedChange={() => toggleSelectRow(app.id!)} disabled={!isEligibleForRelease(app)} className="border-slate-300 rounded w-4 h-4" />
                                    </TableCell>
                                    <TableCell className="sticky left-[72px] z-20 min-w-[280px] bg-white px-6 py-4 shadow-[6px_0_12px_-10px_rgba(15,23,42,0.14)]">
                                        <div className="flex items-center gap-3">
                                            <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200">
                                                {getInitials(app.section1_personal?.full_name || "No Name")}
                                            </div>
                                            <div>
                                                <div className="text-slate-900 font-medium text-sm leading-tight">{app.section1_personal?.full_name || "No Name"}</div>
                                                <div className="text-slate-500 text-xs mt-0.5 max-w-[200px] truncate" title={app.section1_personal?.personal_email || app.section1_personal?.cambridge_email || "No Email"}>
                                                    {app.section1_personal?.personal_email || app.section1_personal?.cambridge_email || "No Email"}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="sticky left-[352px] z-20 min-w-[160px] bg-white px-6 py-4 shadow-[6px_0_12px_-10px_rgba(15,23,42,0.14)]"><StatusBadge status={app.status} /></TableCell>
                                    {visibleMiddleColumns.map((column) => (
                                        <TableCell key={column.id} className="px-6 py-4" style={{ minWidth: `${column.minWidth}px` }}>
                                            {column.cell(app)}
                                        </TableCell>
                                    ))}
                                    <TableCell className="sticky right-0 z-20 min-w-[170px] bg-white px-2 py-4 shadow-[-6px_0_12px_-10px_rgba(15,23,42,0.14)]">
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex justify-end gap-1">
                                                <Link href={`/admin/application?id=${app.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700 hover:text-slate-900 hover:bg-slate-100" title="View">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {app.status === 'accepted_paid' && !!app.offerAcceptance?.submittedAt && !!app.offerAcceptance?.transfer_confirmed && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                        title="Confirm payment received"
                                                        onClick={() => setConfirmAction({ type: 'confirm_payment', userId: app.id! })}
                                                    >
                                                        <Banknote className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 gap-1.5 px-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                                    title={expandedActionRowId === app.id ? "Hide more actions" : "Show more actions"}
                                                    onClick={() => toggleExpandedActions(app.id!)}
                                                >
                                                    <span className="text-xs font-medium">More</span>
                                                    {expandedActionRowId === app.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </Button>
                                            </div>

                                            {expandedActionRowId === app.id && (
                                                <div className="flex flex-wrap justify-end gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Reset to Draft" onClick={() => setConfirmAction({ type: 'reset', userId: app.id! })}><RefreshCcw className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" title={getNextStatus(app.status) ? `Advance to ${formatStatusLabel(getNextStatus(app.status)!)}`
                                                        : "No next step"} disabled={!getNextStatus(app.status)} onClick={() => setConfirmAction({ type: 'advance', userId: app.id! })}><Play className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title={getPreviousStatus(app.status) ? `Return to ${formatStatusLabel(getPreviousStatus(app.status)!)}`
                                                        : "No previous step"} disabled={!getPreviousStatus(app.status)} onClick={() => setConfirmAction({ type: 'back', userId: app.id! })}><ArrowDown className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete" onClick={() => setConfirmAction({ type: 'delete', userId: app.id! })}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            )}
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
                                <h3 className="text-lg font-bold text-slate-900 mb-2 capitalize">{confirmAction.type.replace('_', ' ')} Application?</h3>
                                <p className="text-slate-600 mb-6 text-sm">
                                    {confirmAction.type === 'reset' && "This will revert the application status to 'Draft'."}
                                    {confirmAction.type === 'advance' && (() => {
                                        const target = getActionTargetStatus(confirmAction);
                                        return target ? `This will move the application to '${formatStatusLabel(target)}'.` : "No next step is available.";
                                    })()}
                                    {confirmAction.type === 'back' && (() => {
                                        const target = getActionTargetStatus(confirmAction);
                                        return target ? `This will return the application to '${formatStatusLabel(target)}'.` : "No previous step is available.";
                                    })()}
                                    {confirmAction.type === 'confirm_payment' && "This will mark the applicant as payment received."}
                                    {confirmAction.type === 'delete' && "Are you sure? This action cannot be undone."}
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setConfirmAction(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm">Cancel</button>
                                    <button onClick={confirmActionHandler} className={`px-4 py-2 text-white rounded-lg font-medium shadow-sm text-sm ${confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : confirmAction.type === 'reset' ? 'bg-blue-600 hover:bg-blue-700' : confirmAction.type === 'confirm_payment' ? 'bg-emerald-600 hover:bg-emerald-700' : confirmAction.type === 'back' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}>Confirm</button>
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
