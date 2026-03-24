import type { Application } from "@/lib/types";
import { resolveAdminDisplayName } from "@/lib/admin-profiles";

export type AdminRatingRecord = NonNullable<NonNullable<Application["adminData"]>["ratings"]>[string];

export interface AdminRatingEntry extends AdminRatingRecord {
    adminUid: string;
}

export interface AdminRatingColumnOption {
    adminUid: string;
    label: string;
    adminName: string;
    adminEmail: string;
}

const isValidScore = (score: unknown): score is number => (
    typeof score === "number" &&
    Number.isInteger(score) &&
    score >= 1 &&
    score <= 10
);

export function getAdminDisplayName(
    rating: (Pick<AdminRatingRecord, "adminName" | "adminEmail"> & { adminUid?: string }) | null | undefined,
) {
    return resolveAdminDisplayName({
        adminUid: rating?.adminUid,
        adminName: rating?.adminName,
        adminEmail: rating?.adminEmail,
    });
}

export function getApplicationRatings(application: Application): AdminRatingEntry[] {
    const ratings = application.adminData?.ratings;
    if (!ratings) return [];

    return Object.entries(ratings)
        .map(([adminUid, rating]) => ({ adminUid, ...rating }))
        .filter((rating) => isValidScore(rating.score))
        .sort((a, b) => {
            const timeA = new Date(a.updatedAt || 0).getTime();
            const timeB = new Date(b.updatedAt || 0).getTime();
            return timeB - timeA;
        });
}

export function getApplicationRatingByAdmin(application: Application, adminUid: string) {
    const rating = application.adminData?.ratings?.[adminUid];
    if (!rating || !isValidScore(rating.score)) return null;
    return rating;
}

export function getAverageApplicationRating(application: Application) {
    const ratings = getApplicationRatings(application);
    if (ratings.length === 0) return null;

    const total = ratings.reduce((sum, rating) => sum + rating.score, 0);
    return total / ratings.length;
}

export function formatRatingValue(score: number | null | undefined, options?: { compact?: boolean }) {
    if (score === null || score === undefined || Number.isNaN(score)) return "-";

    const rounded = Math.round(score * 10) / 10;
    if (Number.isInteger(rounded)) return `${rounded}`;

    return options?.compact ? rounded.toFixed(1) : `${rounded.toFixed(1)}/10`;
}

export function getAllRatingAdmins(applications: Application[]): AdminRatingColumnOption[] {
    const ratingsByAdmin = new Map<string, AdminRatingColumnOption>();

    applications.forEach((application) => {
        getApplicationRatings(application).forEach((rating) => {
            if (!ratingsByAdmin.has(rating.adminUid)) {
                const label = getAdminDisplayName(rating);
                ratingsByAdmin.set(rating.adminUid, {
                    adminUid: rating.adminUid,
                    adminName: rating.adminName,
                    adminEmail: rating.adminEmail,
                    label,
                });
            }
        });
    });

    return Array.from(ratingsByAdmin.values()).sort((a, b) => a.label.localeCompare(b.label));
}
