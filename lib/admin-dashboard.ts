import type { Application } from "@/lib/types";
import { normalizeApplicationStatus } from "@/lib/application-status";

export const ADMIN_STATUS_FILTER_OPTIONS = [
    "all",
    "draft",
    "under_review",
    "shortlisted",
    "round_2_under_review",
    "offer_open",
    "accepted",
    "accepted_pending_payment",
    "accepted_paid",
    "payment_received",
    "offer_declined",
    "rejected",
    "waitlisted",
] as const;

export type AdminStatusFilter = (typeof ADMIN_STATUS_FILTER_OPTIONS)[number];

export interface AdminWorkflowNode {
    id: Exclude<AdminStatusFilter, "all">;
    label: string;
    description: string;
    group: "pipeline" | "branch";
    order: number;
    tone: "slate" | "amber" | "purple" | "emerald" | "blue" | "orange" | "red";
}

export interface AdminWorkflowEdge {
    from: AdminWorkflowNode["id"];
    to: AdminWorkflowNode["id"];
    style?: "solid" | "dashed";
}

export const ADMIN_WORKFLOW_NODES: AdminWorkflowNode[] = [
    // Main pipeline (happy path)
    { id: "draft", label: "Draft", description: "Started, not submitted", group: "pipeline", order: 1, tone: "slate" },
    { id: "under_review", label: "Round 1 Review", description: "Initial application review", group: "pipeline", order: 2, tone: "amber" },
    { id: "shortlisted", label: "Shortlisted", description: "Invited to final round", group: "pipeline", order: 3, tone: "purple" },
    { id: "round_2_under_review", label: "Final Review", description: "Teaching challenge under review", group: "pipeline", order: 4, tone: "amber" },
    { id: "offer_open", label: "Offer Open", description: "Offer released, not yet confirmed", group: "pipeline", order: 5, tone: "emerald" },
    { id: "accepted_paid", label: "Deposit Submitted", description: "Passport and transfer submitted", group: "pipeline", order: 6, tone: "blue" },
    { id: "payment_received", label: "Payment Received", description: "Transfer verified by admin", group: "pipeline", order: 7, tone: "emerald" },
    // Branch statuses
    { id: "rejected", label: "Rejected", description: "May happen after round 1 or final review", group: "branch", order: 1, tone: "red" },
    { id: "waitlisted", label: "Waitlisted", description: "Can later convert to accepted", group: "branch", order: 2, tone: "orange" },
    { id: "offer_declined", label: "Offer Declined", description: "Applicant explicitly declined", group: "branch", order: 3, tone: "red" },
];

export const ADMIN_WORKFLOW_EDGES: AdminWorkflowEdge[] = [
    { from: "draft", to: "under_review" },
    { from: "under_review", to: "shortlisted" },
    { from: "shortlisted", to: "round_2_under_review" },
    { from: "round_2_under_review", to: "offer_open" },
    { from: "offer_open", to: "accepted_paid" },
    { from: "accepted_paid", to: "payment_received" },
    { from: "under_review", to: "rejected", style: "dashed" },
    { from: "round_2_under_review", to: "rejected", style: "dashed" },
    { from: "round_2_under_review", to: "waitlisted", style: "dashed" },
    { from: "waitlisted", to: "offer_open", style: "dashed" },
    { from: "offer_open", to: "offer_declined", style: "dashed" },
];

export function countApplicationsForStatus(applications: Application[], filterValue: Exclude<AdminStatusFilter, "all">) {
    const statuses =
        filterValue === "offer_open"
            ? ["accepted", "accepted_pending_payment"]
            : [filterValue];

    return applications.filter((application) => {
        const normalizedStatus = normalizeApplicationStatus(application.status) || application.status;
        return statuses.includes(normalizedStatus as (typeof statuses)[number]);
    }).length;
}
