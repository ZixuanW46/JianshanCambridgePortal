export interface AdminProfileOverride {
    name: string;
}

interface AdminProfileOverrides {
    byUid: Record<string, AdminProfileOverride>;
    byEmail: Record<string, AdminProfileOverride>;
}

// Fill in admin names here. UID has the highest priority, then email.
export const ADMIN_PROFILE_OVERRIDES: AdminProfileOverrides = {
    byUid: {
        "K6R9Gly9clRqfrrGq3fEwsnzm322": { name: "Zhewen" },
        "PnyslwlYT0UmgAu6V6eVr7U914v1": { name: "Will" },
        "egx6sMScoRR6XyjxhJALQ3dMzb83": { name: "Eddie" },
        "pK93CdA01Oayxj3GYcbCI26RPzJ3": { name: "Leo" },
    },
    byEmail: {
        "jennyyuan0204@gmail.com": { name: "Zhewen" },
        "zx_will@outlook.com": { name: "Will" },
        "edisonli0206@gmail.com": { name: "Eddie" },
        "leopold.dai.07@gmail.com": { name: "Leo" },
    },
};

export function getAdminProfileOverride(input: { adminUid?: string | null; adminEmail?: string | null }) {
    const adminUid = input.adminUid?.trim();
    if (adminUid && ADMIN_PROFILE_OVERRIDES.byUid[adminUid]) {
        return ADMIN_PROFILE_OVERRIDES.byUid[adminUid];
    }

    const normalizedEmail = input.adminEmail?.trim().toLowerCase();
    if (normalizedEmail && ADMIN_PROFILE_OVERRIDES.byEmail[normalizedEmail]) {
        return ADMIN_PROFILE_OVERRIDES.byEmail[normalizedEmail];
    }

    return null;
}

export function resolveAdminDisplayName(input: {
    adminUid?: string | null;
    adminName?: string | null;
    adminEmail?: string | null;
}) {
    const override = getAdminProfileOverride(input);
    if (override?.name?.trim()) return override.name.trim();

    const storedName = input.adminName?.trim();
    if (storedName) return storedName;

    const email = input.adminEmail?.trim();
    if (email) return email;

    return "Admin";
}
