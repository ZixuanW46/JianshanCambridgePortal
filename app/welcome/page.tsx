"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { Application } from "@/lib/types";

export default function WelcomePage() {
    const [imageLoaded, setImageLoaded] = useState(false);
    const { user } = useAuth();
    const [application, setApplication] = useState<Application | null>(null);
    const [loadingApp, setLoadingApp] = useState(true);

    useEffect(() => {
        const img = new Image();
        img.src = '/images/welcome-bg.webp';
        img.onload = () => setImageLoaded(true);
    }, []);

    useEffect(() => {
        const fetchApp = async () => {
            if (user?.uid) {
                try {
                    const app = await dbService.getMyApplication(user.uid);
                    setApplication(app);
                } catch (error) {
                    console.error("Failed to fetch application:", error);
                } finally {
                    setLoadingApp(false);
                }
            }
        };
        fetchApp();
    }, [user]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-16 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center bg-card rounded-xl p-8 md:p-12 shadow-sm border w-full max-w-[640px]">
                {/* Illustration with fade-in loading */}
                <div
                    className="rounded-xl w-full aspect-[2/1] mb-8 relative overflow-hidden group border"
                    style={{ backgroundColor: '#1f495b' }}
                >
                    <div
                        className={`absolute inset-0 bg-center bg-no-repeat bg-cover transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        style={{ backgroundImage: "url('/images/welcome-bg.webp')" }}
                    />
                    <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors duration-500"></div>
                </div>

                <div className="flex flex-col items-center gap-4 text-center max-w-[480px]">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                        <CheckCircle className="h-4 w-4" />
                        Registration Complete
                    </div>
                    <h1 className="text-primary text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mt-2">
                        Welcome to Jianshan Academy
                    </h1>
                    <p className="text-muted-foreground text-base md:text-lg font-normal leading-relaxed">
                        Your account has been created successfully. Next, please complete your application form to finish the registration process. We look forward to having you!
                    </p>

                    <div className="flex flex-col w-full gap-3 mt-8 items-center">
                        <Link href="/faq" className="flex w-full max-w-[320px] items-center justify-center rounded-lg h-12 px-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium transition-colors">
                            <FileText className="h-4 w-4 mr-2" />
                            View Programme Details
                        </Link>

                        <Link href="/apply" className="group relative flex w-full max-w-[320px] items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-accent hover:bg-accent/90 text-primary text-base font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                            <span className="mr-2">Complete Application</span>
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>

                        <p className="text-xs text-muted-foreground mt-2">
                            The application takes approximately 15–30 minutes to complete.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
