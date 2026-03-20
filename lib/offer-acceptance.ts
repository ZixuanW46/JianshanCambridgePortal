import type { Application } from "@/lib/types";

export const ACCEPTED_PENDING_PAYMENT_STATUSES: Application["status"][] = [
    "accepted_pending_payment",
];

export const ACCEPTED_COMPLETED_STATUSES: Application["status"][] = [
    "accepted_paid",
    "payment_received",
];

export const ACCEPTED_FLOW_STATUSES: Application["status"][] = [
    "accepted",
    ...ACCEPTED_PENDING_PAYMENT_STATUSES,
    ...ACCEPTED_COMPLETED_STATUSES,
];

export const OFFER_DECLINED_STATUSES: Application["status"][] = [
    "offer_declined",
];

export function formatHumanDate(dateStr?: string) {
    const fallback = new Date();
    const date = dateStr ? new Date(dateStr) : fallback;

    return (Number.isNaN(date.getTime()) ? fallback : date).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export function getFirstName(fullName?: string) {
    const trimmed = fullName?.trim() || "";
    if (!trimmed) return "Applicant";

    const parts = trimmed.split(/\s+/);
    if (parts.length === 0) return trimmed;

    return parts[0] || trimmed;
}

export function addWorkingDays(dateStr?: string, workingDays = 5) {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    const date = Number.isNaN(baseDate.getTime()) ? new Date() : new Date(baseDate);
    let added = 0;

    while (added < workingDays) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) {
            added += 1;
        }
    }

    return date;
}

export function getOfferAcceptanceDeadline(dateStr?: string) {
    return addWorkingDays(dateStr, 5);
}

export function formatOfferAcceptanceDeadline(dateStr?: string) {
    return getOfferAcceptanceDeadline(dateStr).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export function isAcceptedPendingPayment(status?: string) {
    return ACCEPTED_PENDING_PAYMENT_STATUSES.includes(status as Application["status"]);
}

export function isAcceptedPaid(status?: string) {
    return ACCEPTED_COMPLETED_STATUSES.includes(status as Application["status"]);
}

export function isAcceptedFlowStatus(status?: string) {
    return ACCEPTED_FLOW_STATUSES.includes(status as Application["status"]);
}

export function isOfferDeclined(status?: string) {
    return OFFER_DECLINED_STATUSES.includes(status as Application["status"]);
}
