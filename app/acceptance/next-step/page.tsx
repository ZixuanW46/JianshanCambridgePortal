"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { Application } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle2, Loader2, Landmark, ShieldCheck } from "lucide-react";
import { formatNationalityList } from "@/lib/application-form";
import {
    formatHumanDate,
    formatOfferAcceptanceDeadline,
    isAcceptedFlowStatus,
    isAcceptedPaid,
} from "@/lib/offer-acceptance";

export default function AcceptanceNextStepPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        full_name_on_passport: "",
        nationality: "",
        passport_number: "",
        transfer_confirmed: false,
    });

    useEffect(() => {
        const fetchApp = async () => {
            if (!user) return;
            try {
                const myApp = await dbService.getMyApplication(user.uid);
                setApp(myApp as Application);
            } catch (error) {
                console.error("Failed to fetch application:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApp();
    }, [user]);

    useEffect(() => {
        if (!app) return;
        setFormData({
            full_name_on_passport: app.offerAcceptance?.full_name_on_passport || app.section1_personal?.full_name || "",
            nationality: app.offerAcceptance?.nationality || formatNationalityList(app.section1_personal?.nationality) || "",
            passport_number: app.offerAcceptance?.passport_number || "",
            transfer_confirmed: !!app.offerAcceptance?.transfer_confirmed,
        });
    }, [app]);

    const deadline = useMemo(() => formatOfferAcceptanceDeadline(app?.decisionReleasedAt), [app?.decisionReleasedAt]);
    const decisionDate = useMemo(() => formatHumanDate(app?.decisionReleasedAt), [app?.decisionReleasedAt]);

    const validate = () => {
        const nextErrors: string[] = [];
        if (!formData.full_name_on_passport.trim()) nextErrors.push("Full name on passport");
        if (!formData.nationality.trim()) nextErrors.push("Nationality");
        if (!formData.passport_number.trim()) nextErrors.push("Passport number");
        if (!formData.transfer_confirmed) nextErrors.push("Transfer confirmation");
        setErrors(nextErrors);
        return nextErrors.length === 0;
    };

    const handleSubmit = async () => {
        if (!user || !app || !validate()) return;

        setSubmitting(true);
        try {
            await dbService.submitOfferAcceptance(user.uid, {
                ...formData,
                startedAt: app.offerAcceptance?.startedAt,
            });
            router.push("/dashboard");
        } catch (error) {
            console.error("Failed to submit offer acceptance:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return null;

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!app || !isAcceptedFlowStatus(app.status)) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
                <p className="mb-4 text-slate-600">This confirmation page is only available for accepted applicants.</p>
                <Button variant="outline" asChild>
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        );
    }

    const isCompleted = isAcceptedPaid(app.status);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
                <div className="mb-6">
                    <Button variant="ghost" asChild className="px-0 text-primary hover:bg-transparent">
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
                        <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
                            <div>
                                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Next Step</p>
                                <h1 className="text-3xl font-black text-slate-900">Secure Your Place</h1>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    Complete the deposit confirmation and passport details below to secure your place in the Jianshan Scholarship 2026 cohort.
                                </p>
                            </div>
                            <ShieldCheck className="mt-1 h-10 w-10 shrink-0 text-primary/70" />
                        </div>

                        <div className="mb-6 grid gap-4 rounded-2xl bg-[#F7FAFC] p-5 md:grid-cols-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deposit</p>
                                <p className="mt-2 text-xl font-bold text-slate-900">GBP 350</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release Date</p>
                                <p className="mt-2 text-base font-semibold text-slate-900">{decisionDate}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deadline</p>
                                <p className="mt-2 text-base font-semibold text-red-600">{deadline}</p>
                            </div>
                        </div>

                        <div className="mb-8 rounded-2xl border border-primary/10 bg-primary/[0.03] p-5">
                            <div className="mb-3 flex items-center gap-2">
                                <Landmark className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-bold text-slate-900">Bank Details</h2>
                            </div>
                            <div className="space-y-2 text-sm leading-6 text-slate-700">
                                <p><span className="font-semibold">Account Name:</span> Jianshan Scholarship Ltd.</p>
                                <p><span className="font-semibold">Bank Name:</span> Example Bank PLC</p>
                                <p><span className="font-semibold">Sort Code:</span> 00-11-22</p>
                                <p><span className="font-semibold">Account Number:</span> 12345678</p>
                                <p><span className="font-semibold">IBAN:</span> GB00 EXAM 0011 2212 3456 78</p>
                                <p><span className="font-semibold">SWIFT / BIC:</span> EXAMPGB2L</p>
                                <p className="pt-2 text-slate-500">
                                    Placeholder bank details are shown here for now and can be replaced later.
                                </p>
                            </div>
                        </div>

                        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                            We will arrange airport pickup for scholars arriving in Hangzhou by 1 August. Detailed arrival coordination will be shared separately after your confirmation is complete.
                        </div>

                        {isCompleted ? (
                            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
                                <div className="mb-4 flex items-center gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    <h2 className="text-lg font-bold text-green-900">Confirmation Submitted</h2>
                                </div>
                                <p className="mb-4 text-sm leading-6 text-green-900/90">
                                    We have received your passport details and your transfer confirmation. If our team has already verified the transfer, your application status will show this shortly. We will contact you with the next instructions.
                                </p>
                                <div className="space-y-2 text-sm text-green-900/90">
                                    <p><span className="font-semibold">Full name on passport:</span> {app.offerAcceptance?.full_name_on_passport || "-"}</p>
                                    <p><span className="font-semibold">Nationality:</span> {app.offerAcceptance?.nationality || "-"}</p>
                                    <p><span className="font-semibold">Passport number:</span> {app.offerAcceptance?.passport_number || "-"}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {errors.length > 0 && (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        Please complete: {errors.join(", ")}.
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-800">Full name (as shown on passport)</label>
                                    <Input
                                        value={formData.full_name_on_passport}
                                        onChange={(e) => setFormData(prev => ({ ...prev, full_name_on_passport: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-800">Nationality</label>
                                    <Input
                                        value={formData.nationality}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-800">Passport number</label>
                                    <Input
                                        value={formData.passport_number}
                                        onChange={(e) => setFormData(prev => ({ ...prev, passport_number: e.target.value }))}
                                    />
                                </div>

                                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-4">
                                    <Checkbox
                                        checked={formData.transfer_confirmed}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, transfer_confirmed: checked === true }))}
                                        className="mt-0.5"
                                    />
                                    <span className="text-sm leading-6 text-slate-700">
                                        I confirm that I have completed the GBP 350 transfer to the bank account above.
                                    </span>
                                </label>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="h-12 w-full text-base font-bold"
                                >
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Done / Submit
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900">What secures your place</h2>
                            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                                <p>1. Transfer the GBP 350 deposit.</p>
                                <p>2. Submit your passport-matching details here.</p>
                                <p>3. Complete both by <span className="font-semibold text-red-600">{deadline}</span>.</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900">Important note</h2>
                            <p className="mt-4 text-sm leading-6 text-slate-600">
                                Your place is only secured once both the deposit and the confirmation form have been completed. If the steps are not completed in time, the place may be released to another applicant on the waitlist.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
