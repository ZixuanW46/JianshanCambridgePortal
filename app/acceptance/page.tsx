"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Application } from "@/lib/types";
import { dbService } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import { Loader2, PartyPopper, ArrowRight, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AcceptancePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchApp = async () => {
            if (!user) return;
            try {
                const myApp = await dbService.getMyApplication(user.uid);
                setApp(myApp);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchApp();
    }, [user]);

    if (authLoading || loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
    }

    if (!user || !app) return null;

    if (app.status === 'accepted') {
        return (
            <main className="flex-1 flex items-center justify-center py-12 px-4">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full text-center">
                    <div className="bg-white rounded-2xl shadow-xl border p-10">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <PartyPopper className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-3">Congratulations! 🎉</h1>
                        <p className="text-slate-600 leading-relaxed mb-6">
                            We are delighted to offer you a position as a tutor for the Cambridge Academic Mentoring Programme.
                            Please check your email for further details about onboarding and training.
                        </p>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left mb-6">
                            <h3 className="font-semibold text-green-800 mb-2">Next Steps:</h3>
                            <ul className="text-sm text-green-700 space-y-1.5">
                                <li>✓ Check your email for the welcome pack</li>
                                <li>✓ Confirm your attendance by replying to the email</li>
                                <li>✓ Join the tutor orientation session (details in email)</li>
                            </ul>
                        </div>
                        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                            <Link href="/dashboard">
                                Back to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </main>
        );
    }

    if (app.status === 'rejected') {
        return (
            <main className="flex-1 flex items-center justify-center py-12 px-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg w-full text-center">
                    <div className="bg-white rounded-2xl shadow-xl border p-10">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-3">Application Update</h1>
                        <p className="text-slate-600 leading-relaxed mb-6">
                            Thank you for your interest in the Cambridge Tutor Programme. After careful consideration,
                            we are unable to offer you a position at this time. We encourage you to apply again in the future.
                        </p>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/dashboard">Back to Dashboard</Link>
                        </Button>
                    </div>
                </motion.div>
            </main>
        );
    }

    if (app.status === 'waitlisted') {
        return (
            <main className="flex-1 flex items-center justify-center py-12 px-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg w-full text-center">
                    <div className="bg-white rounded-2xl shadow-xl border p-10">
                        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-10 h-10 text-amber-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-3">You&apos;re on the Waitlist</h1>
                        <p className="text-slate-600 leading-relaxed mb-6">
                            Your application has been placed on our waitlist. We will contact you if a position becomes available.
                            Thank you for your patience and understanding.
                        </p>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/dashboard">Back to Dashboard</Link>
                        </Button>
                    </div>
                </motion.div>
            </main>
        );
    }

    // Default: redirect to dashboard if status doesn't match
    router.push('/dashboard');
    return null;
}
