"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Application } from "@/lib/types";
import { dbService } from "@/lib/db-service";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationForm } from "@/components/apply/application-form";

export default function ApplyPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isReadOnly = app?.status !== 'draft';

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchApp = async () => {
            if (!user) return;
            try {
                let myApp = await dbService.getMyApplication(user.uid);
                if (!myApp) {
                    try {
                        myApp = await dbService.createApplication(user.uid, user.email || undefined);
                    } catch (createErr) {
                        console.error("Failed to create application:", createErr);
                        router.replace('/welcome');
                        return;
                    }
                }
                setApp(myApp);
            } catch (err) {
                console.error("Failed to fetch application:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchApp();
    }, [user, router]);

    const handleSave = async (formData: Partial<Application>) => {
        if (!user || isReadOnly) return;
        setSaving(true);
        try {
            await dbService.saveApplication(user.uid, formData);
            setApp(prev => prev ? { ...prev, ...formData } : null);
        } catch (err) {
            console.error("Save failed:", err);
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (formData: Partial<Application>) => {
        if (!user || isReadOnly) return;
        setSubmitting(true);
        try {
            await dbService.saveApplication(user.uid, formData);
            await dbService.submitApplication(user.uid);
            router.push('/dashboard');
        } catch (err) {
            console.error("Submit failed:", err);
            throw err;
            // The form will handle showing the alert or we let the form handle it.
            // Form catches and logs it.
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading securely...</p>
            </div>
        );
    }

    if (!user || !app) return null;

    return (
        <div className="min-h-screen bg-[#F8FAF9] pb-24">
            {/* Header / Nav */}
            <div className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 transition-all duration-300">
                <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-slate-600 hover:text-slate-900 hover:bg-transparent hover:underline -ml-2 rounded-full cursor-pointer">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>
                    {isReadOnly && (
                        <div className="text-xs font-semibold px-3 py-1 bg-amber-100/80 text-amber-800 rounded-full border border-amber-200">View Only Mode</div>
                    )}
                </div>
            </div>

            <main className="container max-w-4xl mx-auto px-4 pt-10 md:pt-16">
                <div className="mb-10 md:mb-16">
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                        {isReadOnly ? 'Your Application' : 'Jianshan Scholarship Application'}
                    </h1>
                    <p className="text-slate-600 md:text-lg leading-relaxed">
                        {isReadOnly
                            ? 'You have already submitted your application. It is currently locked for review.'
                            : "Your Jianshan journey starts here. Please complete the form below so we can understand your passions, experiences, and why you're drawn to this programme."
                        }
                    </p>
                </div>

                <ApplicationForm
                    app={app}
                    isReadOnly={isReadOnly}
                    onSave={handleSave}
                    onSubmit={handleSubmit}
                    saving={saving}
                    submitting={submitting}
                />
            </main>
        </div>
    );
}
