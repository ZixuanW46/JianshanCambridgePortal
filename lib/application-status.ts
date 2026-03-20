import type { Application } from "@/lib/types";

export type ApplicationStatus = Application["status"];
export type LegacyApplicationStatus = ApplicationStatus | "enrolled";

// Keep supporting legacy records while treating round 2 as a single review stage.
export function normalizeApplicationStatus(status?: LegacyApplicationStatus) {
    if (status === "submitted") {
        return "under_review" as const;
    }

    if (status === "round_2_submitted") {
        return "round_2_under_review" as const;
    }

    if (status === "enrolled") {
        return "payment_received" as const;
    }

    return status;
}
