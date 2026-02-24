import { Application } from "@/lib/types";
import { Users, FileText, CheckCircle, Clock } from "lucide-react";

interface DashboardStatsProps {
    applications: Application[];
}

export function DashboardStats({ applications }: DashboardStatsProps) {
    const total = applications.length;
    const submitted = applications.filter(app => app.status !== 'draft').length;
    const pendingReview = applications.filter(app =>
        app.status === 'submitted' || app.status === 'under_review'
    ).length;
    const accepted = applications.filter(app =>
        app.status === 'accepted' || app.status === 'enrolled'
    ).length;

    const stats = [
        {
            title: "Registered",
            value: total,
            icon: Users,
            description: "Total registered applicants",
            lightColor: 'bg-blue-50',
            textColor: 'text-blue-600'
        },
        {
            title: "Submitted",
            value: submitted,
            icon: FileText,
            description: "Completed form submission",
            lightColor: 'bg-purple-50',
            textColor: 'text-purple-600'
        },
        {
            title: "Reviewing",
            value: pendingReview,
            icon: Clock,
            description: "Needs attention",
            lightColor: 'bg-amber-50',
            textColor: 'text-amber-600'
        },
        {
            title: "Accepted",
            value: accepted,
            icon: CheckCircle,
            description: "Tutors accepted",
            lightColor: 'bg-green-50',
            textColor: 'text-green-600'
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={index}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-700">{stat.title}</h3>
                            <div className={`${stat.lightColor} ${stat.textColor} p-2.5 rounded-full group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mb-1">
                            <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                        </div>
                        <p className="text-slate-500 text-xs">{stat.description}</p>
                    </div>
                );
            })}
        </div>
    );
}
