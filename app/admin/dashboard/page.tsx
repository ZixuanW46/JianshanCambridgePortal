"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Application } from "@/lib/types";
import { dbService } from "@/lib/db-service";
import { Loader2 } from "lucide-react";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { AdminApplicationTable } from "@/components/admin/application-table";

export default function AdminDashboardPage() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) { router.push("/login"); return; }
            if (!isAdmin) { router.push("/dashboard"); return; }
        }
    }, [user, authLoading, isAdmin, router]);

    useEffect(() => {
        if (!user || !isAdmin) return;
        const fetchApps = async () => {
            setLoading(true);
            try {
                const apps = await dbService.getAllApplications();
                setApplications(apps as Application[]);
            } catch (error) {
                console.error("Failed to fetch applications:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, [user, isAdmin]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-slate-600 mt-1">Manage tutor applications and decisions.</p>
                </div>

                {/* Stats */}
                <div className="mb-8">
                    <DashboardStats applications={applications} />
                </div>

                {/* Applications Table */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Applications</h2>
                    <AdminApplicationTable applications={applications} />
                </div>
            </div>
        </div>
    );
}
