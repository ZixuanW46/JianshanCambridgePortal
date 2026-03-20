import type { Application } from "@/lib/types";
import { normalizeApplicationStatus } from "@/lib/application-status";

export type ApplicationStatus = Application["status"];
export type InternalDecision = NonNullable<NonNullable<Application["adminData"]>["internalDecision"]>;

export const STATUS_FORWARD_MAP: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
    draft: "under_review",
    under_review: "shortlisted",
    shortlisted: "round_2_under_review",
    round_2_under_review: "accepted",
    accepted: "accepted_pending_payment",
    accepted_pending_payment: "accepted_paid",
    accepted_paid: "payment_received",
};

export const STATUS_BACKWARD_MAP: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
    offer_declined: "accepted",
    payment_received: "accepted_paid",
    accepted_paid: "accepted_pending_payment",
    accepted_pending_payment: "accepted",
    accepted: "round_2_under_review",
    rejected: "round_2_under_review",
    waitlisted: "round_2_under_review",
    round_2_under_review: "shortlisted",
    shortlisted: "under_review",
    under_review: "draft",
};

export function getNextStatus(status: ApplicationStatus) {
    const normalizedStatus = normalizeApplicationStatus(status);
    return normalizedStatus ? STATUS_FORWARD_MAP[normalizedStatus] || null : null;
}

export function getPreviousStatus(status: ApplicationStatus) {
    const normalizedStatus = normalizeApplicationStatus(status);
    return normalizedStatus ? STATUS_BACKWARD_MAP[normalizedStatus] || null : null;
}

export function getSyncedInternalDecision(status: ApplicationStatus): InternalDecision | null {
    switch (normalizeApplicationStatus(status)) {
        case "shortlisted":
            return "shortlisted";
        case "accepted":
        case "accepted_pending_payment":
        case "accepted_paid":
        case "payment_received":
        case "offer_declined":
            return "accepted";
        case "rejected":
            return "rejected";
        case "waitlisted":
            return "waitlisted";
        case "draft":
        case "under_review":
        case "round_2_under_review":
        default:
            return null;
    }
}

export function formatStatusLabel(status: ApplicationStatus) {
    const normalizedStatus = normalizeApplicationStatus(status) || status;
    return normalizedStatus.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
