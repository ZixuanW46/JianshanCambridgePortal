"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Application } from "@/lib/types";
import { dbService } from "@/lib/db-service";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function ApplyRound2Page() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [thoughts, setThoughts] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchApp = async () => {
            if (!user) return;
            try {
                const myApp = await dbService.getMyApplication(user.uid);
                if (!myApp) {
                    router.replace('/dashboard');
                    return;
                }

                // Only allow access if they are shortlisted
                if (myApp.status !== 'shortlisted') {
                    router.replace('/dashboard');
                    return;
                }

                setApp(myApp as Application);
                if (myApp.section6_round_2) {
                    setThoughts(myApp.section6_round_2.session_design_thoughts || "");
                    setVideoUrl(myApp.section6_round_2.video_url || "");
                }
            } catch (err) {
                console.error("Failed to fetch application:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchApp();
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!thoughts.trim()) {
            setError("Please provide your session design thoughts.");
            return;
        }

        if (!videoUrl.trim()) {
            setError("Please provide a link to your video introduction.");
            return;
        }

        try {
            new URL(videoUrl);
        } catch (_) {
            setError("Please enter a valid URL for your video (e.g., https://youtu.be/...).");
            return;
        }

        if (!user) return;

        setSubmitting(true);
        try {
            await dbService.submitRound2Application(user.uid, {
                session_design_thoughts: thoughts,
                video_url: videoUrl,
            });
            router.push('/dashboard');
        } catch (err) {
            console.error("Submit failed:", err);
            setError("An error occurred while submitting. Please try again or contact support.");
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
                    <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-slate-600 hover:text-slate-900 -ml-2 rounded-full">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>
                </div>
            </div>

            <main className="container max-w-3xl mx-auto px-4 pt-10 md:pt-16">
                <div className="mb-10 md:mb-12">
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                        Round 2: Session Design & Video
                    </h1>
                    <p className="text-slate-600 md:text-lg leading-relaxed">
                        We&apos;re incredibly excited to invite you to the second round!
                        We are really looking for people who have genuine passion and the capability to share their subjects and interests with others.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle className="text-xl">Your Session Design</CardTitle>
                            <CardDescription>
                                We&apos;d love to hear some of your initial thoughts on designing an academic session for the summer trip.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">

                            <div className="space-y-3">
                                <Label htmlFor="thoughts" className="text-sm font-semibold text-slate-700">
                                    Initial Thoughts on Session Design <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="thoughts"
                                    placeholder="What topics would you like to cover? How would you make it engaging?"
                                    className="min-h-[150px] resize-y"
                                    value={thoughts}
                                    onChange={(e) => setThoughts(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="video" className="text-sm font-semibold text-slate-700">
                                    Video Introduction URL <span className="text-red-500">*</span>
                                </Label>
                                <p className="text-sm text-slate-500">
                                    Please submit a short 1–3 min video to introduce yourself and your session — no fancy editing needed! Just a way for us to get to know your communication style. You can upload it to YouTube (Unlisted), Google Drive, or Bilibili and paste the link here.
                                </p>
                                <Input
                                    id="video"
                                    type="url"
                                    placeholder="https://..."
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                                    {error}
                                </div>
                            )}

                        </CardContent>
                        <CardFooter className="bg-slate-50 border-t py-4 px-6 flex justify-end">
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-sm"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Round 2 Application
                                        <Send className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
