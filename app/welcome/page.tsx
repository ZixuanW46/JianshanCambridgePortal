"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { PROGRAMME_INFO } from "@/lib/constants";

export default function WelcomePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const handleGetStarted = async () => {
        if (!user) return;
        setCreating(true);
        try {
            // Check if application already exists
            const existing = await dbService.getMyApplication(user.uid);
            if (existing) {
                router.push('/dashboard');
                return;
            }
            // Create new application
            await dbService.createApplication(user.uid, user.email || undefined);
            router.push('/apply');
        } catch (err) {
            console.error("Failed to create application:", err);
            // If it already exists, just go to dashboard
            router.push('/dashboard');
        } finally {
            setCreating(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-lg w-full text-center"
            >
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <span className="text-2xl">🎓</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">
                        Welcome, {user?.displayName?.split(' ')[0] || 'there'}!
                    </h1>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                        Thank you for your interest in the {PROGRAMME_INFO.name}.
                        Let&apos;s get started with your tutor application.
                    </p>

                    <div className="bg-blue-50 rounded-xl p-4 mb-8 text-left">
                        <h3 className="font-medium text-blue-900 mb-2 text-sm">What you&apos;ll need:</h3>
                        <ul className="text-sm text-blue-800 space-y-1.5">
                            <li>• Your academic details (university, programme, year)</li>
                            <li>• Subjects you&apos;re interested in teaching</li>
                            <li>• A brief essay about your motivation</li>
                            <li>• About 15 minutes of your time</li>
                        </ul>
                    </div>

                    <Button
                        onClick={handleGetStarted}
                        disabled={creating}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-6 text-base"
                    >
                        {creating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Setting up...
                            </>
                        ) : (
                            <>
                                Start Application
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </main>
    );
}
