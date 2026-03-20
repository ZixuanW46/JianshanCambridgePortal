"use client";

import { Button } from "@/components/ui/button";
import {
    ADMIN_WORKFLOW_NODES,
    type AdminStatusFilter,
    type AdminWorkflowNode,
    countApplicationsForStatus,
} from "@/lib/admin-dashboard";
import type { Application } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronRight, Filter, X } from "lucide-react";

/* ─── Visual tone mapping ─── */

const TONE = {
    slate: {
        idle: "bg-slate-50 text-slate-800 ring-slate-200/80",
        active: "bg-slate-900 text-white ring-slate-900 shadow-lg shadow-slate-900/20",
        badge: "bg-slate-200/70 text-slate-700",
        activeBadge: "bg-white/20 text-white",
        dot: "bg-slate-400",
    },
    amber: {
        idle: "bg-amber-50 text-amber-900 ring-amber-200/80",
        active: "bg-amber-600 text-white ring-amber-600 shadow-lg shadow-amber-600/25",
        badge: "bg-amber-200/70 text-amber-800",
        activeBadge: "bg-white/20 text-white",
        dot: "bg-amber-400",
    },
    purple: {
        idle: "bg-purple-50 text-purple-900 ring-purple-200/80",
        active: "bg-purple-600 text-white ring-purple-600 shadow-lg shadow-purple-600/25",
        badge: "bg-purple-200/70 text-purple-800",
        activeBadge: "bg-white/20 text-white",
        dot: "bg-purple-400",
    },
    emerald: {
        idle: "bg-emerald-50 text-emerald-900 ring-emerald-200/80",
        active: "bg-emerald-600 text-white ring-emerald-600 shadow-lg shadow-emerald-600/25",
        badge: "bg-emerald-200/70 text-emerald-800",
        activeBadge: "bg-white/20 text-white",
        dot: "bg-emerald-400",
    },
    blue: {
        idle: "bg-sky-50 text-sky-900 ring-sky-200/80",
        active: "bg-sky-600 text-white ring-sky-600 shadow-lg shadow-sky-600/25",
        badge: "bg-sky-200/70 text-sky-800",
        activeBadge: "bg-white/20 text-white",
        dot: "bg-sky-400",
    },
    orange: {
        idle: "bg-orange-50 text-orange-900 ring-orange-200/80",
        active: "bg-orange-500 text-white ring-orange-500 shadow-lg shadow-orange-500/25",
        badge: "bg-orange-200/70 text-orange-800",
        activeBadge: "bg-white/20 text-white",
        dot: "bg-orange-400",
    },
    red: {
        idle: "bg-red-50 text-red-900 ring-red-200/80",
        active: "bg-red-600 text-white ring-red-600 shadow-lg shadow-red-600/25",
        badge: "bg-red-200/70 text-red-800",
        activeBadge: "bg-white/20 text-white",
        dot: "bg-red-400",
    },
} as const;

/* ─── Status Node Card ─── */

function StatusNode({
    node,
    count,
    isActive,
    dimmed,
    onSelect,
    compact,
}: {
    node: AdminWorkflowNode;
    count: number;
    isActive: boolean;
    dimmed: boolean;
    onSelect: () => void;
    compact?: boolean;
}) {
    const tone = TONE[node.tone];

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "group/node relative flex items-center gap-3 rounded-xl ring-1 ring-inset transition-all duration-200 select-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60",
                compact ? "px-3.5 py-2.5" : "px-4 py-3",
                isActive
                    ? cn(tone.active, "scale-[1.02]")
                    : cn(
                          tone.idle,
                          "hover:-translate-y-0.5 hover:shadow-md",
                          dimmed && "opacity-50"
                      )
            )}
        >
            {/* Dot indicator */}
            <span
                className={cn(
                    "shrink-0 rounded-full transition-colors",
                    compact ? "h-1.5 w-1.5" : "h-2 w-2",
                    isActive ? "bg-white/60" : tone.dot
                )}
            />

            {/* Label */}
            <span
                className={cn(
                    "text-left font-semibold leading-tight whitespace-nowrap",
                    compact ? "text-xs" : "text-[13px]"
                )}
            >
                {node.label}
            </span>

            {/* Count badge */}
            <span
                className={cn(
                    "ml-auto shrink-0 inline-flex items-center justify-center rounded-full font-semibold tabular-nums",
                    compact
                        ? "min-w-[22px] px-1.5 py-0.5 text-[10px]"
                        : "min-w-[26px] px-2 py-0.5 text-[11px]",
                    isActive ? tone.activeBadge : tone.badge
                )}
            >
                {count}
            </span>
        </button>
    );
}

/* ─── Connector chevron between pipeline nodes ─── */

function PipelineConnector({ dimmed }: { dimmed: boolean }) {
    return (
        <div
            className={cn(
                "flex shrink-0 items-center justify-center transition-opacity duration-200",
                dimmed ? "opacity-20" : "opacity-40"
            )}
        >
            <ChevronRight className="h-4 w-4 text-slate-400" strokeWidth={2.5} />
        </div>
    );
}

/* ─── Root Component ─── */

interface AdminWorkflowOverviewProps {
    applications: Application[];
    selectedStatus: AdminStatusFilter;
    onStatusSelect: (status: AdminStatusFilter) => void;
}

export function AdminWorkflowOverview({
    applications,
    selectedStatus,
    onStatusSelect,
}: AdminWorkflowOverviewProps) {
    const pipelineNodes = ADMIN_WORKFLOW_NODES.filter((n) => n.group === "pipeline").sort(
        (a, b) => a.order - b.order
    );
    const branchNodes = ADMIN_WORKFLOW_NODES.filter((n) => n.group === "branch").sort(
        (a, b) => a.order - b.order
    );

    const activeNode =
        selectedStatus === "all"
            ? null
            : ADMIN_WORKFLOW_NODES.find((n) => n.id === selectedStatus) ?? null;

    const hasDim = selectedStatus !== "all";

    return (
        <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                {/* ─── Header bar ─── */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Filter className="h-3.5 w-3.5" />
                        <span>Click a status to filter the table below</span>
                    </div>
                    <div
                        className={cn(
                            "flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                            activeNode
                                ? "border-slate-300 bg-slate-50"
                                : "border-slate-200 bg-white"
                        )}
                    >
                        <span className="text-slate-500">Viewing:</span>
                        <span className="font-medium text-slate-900">
                            {activeNode?.label || "All Applicants"}
                        </span>
                        {activeNode && (
                            <button
                                type="button"
                                onClick={() => onStatusSelect("all")}
                                className="ml-0.5 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── Pipeline row (main happy path) ─── */}
                <div className="px-5 pt-6 pb-4">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Main Pipeline
                    </p>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {pipelineNodes.map((node, i) => {
                            const count = countApplicationsForStatus(applications, node.id);
                            const isActive = selectedStatus === node.id;
                            const dimmed = hasDim && !isActive;

                            return (
                                <div key={node.id} className="flex items-center gap-1.5">
                                    <StatusNode
                                        node={node}
                                        count={count}
                                        isActive={isActive}
                                        dimmed={dimmed}
                                        onSelect={() =>
                                            onStatusSelect(
                                                selectedStatus === node.id ? "all" : node.id
                                            )
                                        }
                                    />
                                    {i < pipelineNodes.length - 1 && (
                                        <PipelineConnector dimmed={dimmed} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ─── Separator ─── */}
                <div className="mx-5 h-px bg-slate-100" />

                {/* ─── Branch row (rejection / waitlist / declined) ─── */}
                <div className="px-5 pt-4 pb-5">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Other Outcomes
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {branchNodes.map((node) => {
                            const count = countApplicationsForStatus(applications, node.id);
                            const isActive = selectedStatus === node.id;
                            const dimmed = hasDim && !isActive;

                            return (
                                <StatusNode
                                    key={node.id}
                                    node={node}
                                    count={count}
                                    isActive={isActive}
                                    dimmed={dimmed}
                                    compact
                                    onSelect={() =>
                                        onStatusSelect(
                                            selectedStatus === node.id ? "all" : node.id
                                        )
                                    }
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ─── Active filter indicator (outside card) ─── */}
            {activeNode && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-2.5 text-sm text-slate-600">
                    <ChevronRight className="h-4 w-4 text-primary" />
                    <span>
                        Table filtered to{" "}
                        <span className="font-semibold text-slate-900">{activeNode.label}</span>.
                    </span>
                </div>
            )}
        </div>
    );
}
