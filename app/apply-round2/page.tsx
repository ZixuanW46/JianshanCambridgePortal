"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Save, Send } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { Application } from "@/lib/types";
import { dbService } from "@/lib/db-service";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BriefSection = {
    eyebrow: string;
    title: string;
    body?: string[];
    numbered?: string[];
    closing?: string[];
    bullets?: string[];
    sessionCards?: Array<{
        badge: string;
        duration: string;
        title: string;
        description: string;
        outcome: string;
    }>;
};

const BRIEF_SECTIONS: BriefSection[] = [
    {
        eyebrow: "Your Role",
        title: "Help students see what your subject really is.",
        body: [
            "As a Jianshan scholar, you will design and deliver academic sessions for secondary school students in China. But this is not simply about passing on information or teaching content in the traditional sense.",
            "Our goal is to help students truly explore a discipline. We want them to begin answering four questions:",
        ],
        numbered: [
            "What is this subject actually about?",
            "How is it studied?",
            "What kind of thinking does it train?",
            "How does it solve problems and create value in the real world?",
        ],
        closing: [
            "For many of our students, this is also a stage of exploration. Most are still in secondary school and have not yet decided what they may want to study later in high school, university, or beyond. They are not coming only to learn more content. They are also coming to discover what genuinely interests them.",
            "That means a strong session should not only teach something clearly. It should also help students feel what is exciting, distinctive, and meaningful about your discipline.",
        ],
    },
    {
        eyebrow: "Who Your Students Are",
        title: "Your audience: Chinese secondary school students aged 14-16",
        body: [
            "Your students will be Chinese secondary school students, usually around 14-16 years old.",
            "They are generally able to participate in English-medium sessions, including online classes taught in English. However, some students may feel less confident speaking at first, especially at the beginning of a session.",
            "Most everyday English vocabulary will be manageable, but more technical or discipline-specific terms may be unfamiliar. We therefore hope you will explain ideas clearly, avoid unnecessary jargon, and use examples, analogies, and interaction to bring students in.",
            "Just as importantly, many of these students are still figuring out what they enjoy, what they are good at, and what kinds of subjects or problems they may want to pursue in the future. Your role is not only to teach them something well, but also to help them explore whether this way of thinking speaks to them.",
            "Sessions are usually taught in small groups of around 5-15 students. We hope you will make the most of this format by designing for discussion, participation, collaboration, and live feedback, rather than relying on one-way delivery.",
        ],
    },
    {
        eyebrow: "What Makes Jianshan Different",
        title: "This is not a traditional content-focused class",
        bullets: [
            "Real-world questions and applications",
            "Active, workshop-based learning",
            "Disciplinary thinking, not just disciplinary facts",
            "Helping students connect ideas across subjects",
            "Making students curious enough to want to keep exploring",
        ],
        body: [
            "Jianshan is not designed as a conventional classroom experience where the main goal is to cover a body of content from start to finish.",
            "We are especially interested in how you would help students experience your subject as a living way of thinking and problem-solving, rather than as a set of concepts to memorise.",
        ],
    },
    {
        eyebrow: "This Year's Theme",
        title: "Project 2050: The Future City",
        body: [
            "To anchor every subject in a shared real-world context, this year's overarching theme is Project 2050: The Future City.",
            "A city is one of the most complex systems human beings have ever built. It brings together science, engineering, environment, economics, policy, psychology, design, ethics, history, and many other ways of understanding the world.",
            "This theme gives all scholars a shared macro context, so sessions across different disciplines feel connected rather than isolated. It also places subject knowledge inside a real-world application space, helping students see how ideas become tools for understanding and solving actual problems.",
            "You do not need to turn your subject into urban studies. Rather, we hope you will use the Future City theme as a meaningful context through which your discipline can come alive.",
        ],
    },
    {
        eyebrow: "Session Format & Workload",
        title: "What you would teach",
        body: [
            "Each scholar is expected to design one Type A session and one Type B session.",
            "You would then deliver these same sessions to different groups of students across the camp. Your expected teaching time during camp will be around 3-4 hours per day.",
        ],
        sessionCards: [
            {
                badge: "Type A",
                duration: "2 hours",
                title: "PBL Session - Deep Dive",
                description: "Type A sessions are built around a concrete challenge, question, or problem. Rather than introducing a topic in a purely theoretical way, you would guide students through a mini project or applied inquiry. The aim is to help them experience how your discipline can be used to analyse a problem, generate insight, and create value.",
                outcome: "Students should leave with a stronger sense of how the subject works in practice.",
            },
            {
                badge: "Type B",
                duration: "1 hour",
                title: "Mind Tool Workshop - Wide Lens",
                description: "Type B sessions focus less on one specific problem and more on one transferable way of thinking. This could be a framework, mental model, analytical tool, or method that is central to your discipline, but useful far beyond a single topic.",
                outcome: "Students should leave with a tool they can carry into future discussions, projects, or ways of seeing the world.",
            },
        ],
    },
    {
        eyebrow: "What We're Looking For",
        title: "How we will read this round",
        bullets: [
            "How well you understand the Jianshan teaching model",
            "Whether you can design sessions that are clear, thoughtful, and student-centred",
            "Whether you can make good use of the small-group format",
            "Whether you can communicate in a way that feels engaging and accessible to students",
            "Whether you can help students not only learn, but also explore what they may want to pursue in the future",
        ],
    },
] as const;

const TYPE_A_PROMPTS = [
    "What concrete challenge or question would students explore?",
    "How does it connect to Project 2050: The Future City?",
    "What would students actually do during the session?",
    "How would you use the small-group format to keep students actively involved?",
    "What do you hope students would understand, produce, or leave with by the end?",
];

const TYPE_B_PROMPTS = [
    "What core tool, framework, or lens would you teach?",
    "Why is it useful beyond one single topic?",
    "How would you explain it in a way that feels accessible to high school students?",
    "What would students do, discuss, or practise during the workshop, rather than just listen to?",
    "How does it complement your Type A session or reflect your wider discipline?",
];

const VIDEO_REQUIREMENTS = [
    "Please film in landscape",
    "Please make sure your face is clearly visible",
    "Please pay close attention to lighting and avoid strong backlighting or overly bright glare",
    "Please keep yourself centred in frame",
];

type ConfirmationState = {
    confirms_workload_readiness: boolean;
    confirms_deposit_terms: boolean;
    confirms_flight_costs: boolean;
    confirms_visa_responsibility: boolean;
};

const FINAL_CONFIRMATIONS: Array<{
    key: keyof ConfirmationState;
    label: string;
}> = [
    {
        key: "confirms_workload_readiness",
        label: "I understand that the expected teaching workload during camp is around 3-4 hours per day, and I am prepared for that responsibility.",
    },
    {
        key: "confirms_deposit_terms",
        label: "I understand that, if I am offered a place after this round and wish to confirm my participation, I will need to pay a GBP 350 deposit to secure my place. I understand that this deposit is non-refundable in case of withdrawal, and will be fully returned after successful completion of the summer camp.",
    },
    {
        key: "confirms_flight_costs",
        label: "I understand that international return flights to and from China are my own responsibility and cost.",
    },
    {
        key: "confirms_visa_responsibility",
        label: "I understand that, if I am not eligible for visa-free entry, I will need to arrange my own visa and cover any related costs.",
    },
] as const;

type ConfirmationKey = keyof ConfirmationState;

function buildRound2Snapshot(input: {
    typeATitle: string;
    typeAThoughts: string;
    typeBTitle: string;
    typeBThoughts: string;
    videoUrl: string;
    finalRoundConcerns: string;
    confirmations: ConfirmationState;
}) {
    return JSON.stringify({
        type_a_session_title: input.typeATitle,
        type_a_session_thoughts: input.typeAThoughts,
        type_b_session_title: input.typeBTitle,
        type_b_session_thoughts: input.typeBThoughts,
        video_url: input.videoUrl,
        final_round_concerns: input.finalRoundConcerns,
        confirmations: input.confirmations,
    });
}



export default function ApplyRound2Page() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [hasReadIntro, setHasReadIntro] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
    const [initialDraftSnapshot, setInitialDraftSnapshot] = useState("");

    const [typeATitle, setTypeATitle] = useState("");
    const [typeAThoughts, setTypeAThoughts] = useState("");
    const [typeBTitle, setTypeBTitle] = useState("");
    const [typeBThoughts, setTypeBThoughts] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [finalRoundConcerns, setFinalRoundConcerns] = useState("");
    const [confirmations, setConfirmations] = useState<ConfirmationState>({
        confirms_workload_readiness: false,
        confirms_deposit_terms: false,
        confirms_flight_costs: false,
        confirms_visa_responsibility: false,
    });
    const [error, setError] = useState<string | null>(null);



    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/");
        }
    }, [authLoading, router, user]);

    useEffect(() => {
        const fetchApp = async () => {
            if (!user) return;
            try {
                const myApp = await dbService.getMyApplication(user.uid);
                if (!myApp) {
                    router.replace("/dashboard");
                    return;
                }

                if (myApp.status !== "shortlisted") {
                    router.replace("/dashboard");
                    return;
                }

                setApp(myApp as Application);

                const round2 = myApp.section6_round_2;
                if (round2) {
                    const loadedConfirmations = {
                        confirms_workload_readiness: !!round2.confirms_workload_readiness,
                        confirms_deposit_terms: !!round2.confirms_deposit_terms,
                        confirms_flight_costs: !!round2.confirms_flight_costs,
                        confirms_visa_responsibility: !!round2.confirms_visa_responsibility,
                    };
                    const loadedTypeATitle = round2.type_a_session_title || "";
                    const loadedTypeAThoughts = round2.type_a_session_thoughts || round2.session_design_thoughts || "";
                    const loadedTypeBTitle = round2.type_b_session_title || "";
                    const loadedTypeBThoughts = round2.type_b_session_thoughts || "";
                    const loadedVideoUrl = round2.video_url || "";
                    const loadedFinalRoundConcerns = round2.final_round_concerns || "";

                    setTypeATitle(loadedTypeATitle);
                    setTypeAThoughts(loadedTypeAThoughts);
                    setTypeBTitle(loadedTypeBTitle);
                    setTypeBThoughts(loadedTypeBThoughts);
                    setVideoUrl(loadedVideoUrl);
                    setFinalRoundConcerns(loadedFinalRoundConcerns);
                    setConfirmations(loadedConfirmations);
                    setInitialDraftSnapshot(buildRound2Snapshot({
                        typeATitle: loadedTypeATitle,
                        typeAThoughts: loadedTypeAThoughts,
                        typeBTitle: loadedTypeBTitle,
                        typeBThoughts: loadedTypeBThoughts,
                        videoUrl: loadedVideoUrl,
                        finalRoundConcerns: loadedFinalRoundConcerns,
                        confirmations: loadedConfirmations,
                    }));
                    setDraftSavedAt(myApp.lastUpdatedAt || null);
                } else {
                    setInitialDraftSnapshot(buildRound2Snapshot({
                        typeATitle: "",
                        typeAThoughts: "",
                        typeBTitle: "",
                        typeBThoughts: "",
                        videoUrl: "",
                        finalRoundConcerns: "",
                        confirmations: {
                            confirms_workload_readiness: false,
                            confirms_deposit_terms: false,
                            confirms_flight_costs: false,
                            confirms_visa_responsibility: false,
                        },
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch application:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchApp();
    }, [router, user]);

    useEffect(() => {
        if (loading || !initialDraftSnapshot) return;

        const currentSnapshot = buildRound2Snapshot({
            typeATitle,
            typeAThoughts,
            typeBTitle,
            typeBThoughts,
            videoUrl,
            finalRoundConcerns,
            confirmations,
        });

        setIsDirty(currentSnapshot !== initialDraftSnapshot);
    }, [
        confirmations,
        finalRoundConcerns,
        initialDraftSnapshot,
        loading,
        typeAThoughts,
        typeATitle,
        typeBThoughts,
        typeBTitle,
        videoUrl,
    ]);

    const formatSavedTime = (timestamp: string | null) => {
        if (!timestamp) return "";

        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return "";

        return new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    const handleSaveDraft = async () => {
        if (!user || savingDraft || submitting) return;

        setError(null);
        setSavingDraft(true);

        try {
            const savedAt = new Date().toISOString();
            const normalizedRound2Data = {
                type_a_session_title: typeATitle.trim(),
                type_a_session_thoughts: typeAThoughts.trim(),
                type_b_session_title: typeBTitle.trim(),
                type_b_session_thoughts: typeBThoughts.trim(),
                video_url: videoUrl.trim(),
                confirms_workload_readiness: confirmations.confirms_workload_readiness,
                confirms_deposit_terms: confirmations.confirms_deposit_terms,
                confirms_flight_costs: confirmations.confirms_flight_costs,
                confirms_visa_responsibility: confirmations.confirms_visa_responsibility,
                final_round_concerns: finalRoundConcerns.trim() || null,
            };

            await dbService.saveRound2Draft(user.uid, normalizedRound2Data);

            setDraftSavedAt(savedAt);
            setInitialDraftSnapshot(buildRound2Snapshot({
                typeATitle: normalizedRound2Data.type_a_session_title,
                typeAThoughts: normalizedRound2Data.type_a_session_thoughts,
                typeBTitle: normalizedRound2Data.type_b_session_title,
                typeBThoughts: normalizedRound2Data.type_b_session_thoughts,
                videoUrl: normalizedRound2Data.video_url,
                finalRoundConcerns: normalizedRound2Data.final_round_concerns || "",
                confirmations,
            }));
            setIsDirty(false);
        } catch (err) {
            console.error("Draft save failed:", err);
            setError("We couldn't save your draft just now. Please try again.");
        } finally {
            setSavingDraft(false);
        }
    };

    const handleConfirmationChange = (key: ConfirmationKey, checked: boolean) => {
        setConfirmations(prev => ({
            ...prev,
            [key]: checked,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!typeATitle.trim()) {
            setError("Please give your Type A session a title.");
            return;
        }

        if (!typeAThoughts.trim()) {
            setError("Please share your Type A session idea.");
            return;
        }

        if (!typeBTitle.trim()) {
            setError("Please give your Type B session a title.");
            return;
        }

        if (!typeBThoughts.trim()) {
            setError("Please share your Type B session idea.");
            return;
        }

        if (!videoUrl.trim()) {
            setError("Please provide a link to your video introduction.");
            return;
        }

        try {
            new URL(videoUrl);
        } catch {
            setError("Please enter a valid URL for your video.");
            return;
        }



        const missingConfirmation = FINAL_CONFIRMATIONS.find(item => !confirmations[item.key]);
        if (missingConfirmation) {
            setError("Please confirm all required statements before submitting.");
            return;
        }

        if (!user) return;

        setSubmitting(true);
        try {
            await dbService.submitRound2Application(user.uid, {
                type_a_session_title: typeATitle.trim(),
                type_a_session_thoughts: typeAThoughts.trim(),
                type_b_session_title: typeBTitle.trim(),
                type_b_session_thoughts: typeBThoughts.trim(),
                video_url: videoUrl.trim(),
                confirms_workload_readiness: confirmations.confirms_workload_readiness,
                confirms_deposit_terms: confirmations.confirms_deposit_terms,
                confirms_flight_costs: confirmations.confirms_flight_costs,
                confirms_visa_responsibility: confirmations.confirms_visa_responsibility,
                final_round_concerns: finalRoundConcerns.trim() || null,
            });
            router.push("/dashboard");
        } catch (err) {
            console.error("Submit failed:", err);
            setError("An error occurred while submitting. Please try again or contact support.");
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-4 animate-pulse font-medium text-slate-500">Loading securely...</p>
            </div>
        );
    }

    if (!user || !app) return null;

    if (!hasReadIntro) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] pb-24 text-slate-900 selection:bg-amber-100 selection:text-amber-900">
                <div className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
                    <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/dashboard")}
                            className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                    </div>
                </div>

                <main className="container mx-auto flex max-w-4xl flex-col items-center px-4 pt-20 text-center md:pt-32">
                    <p className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-amber-600">
                        Final Round
                    </p>
                    <h1 className="max-w-3xl font-serif text-5xl font-medium tracking-tight text-slate-900 md:text-7xl">
                        Teaching Challenge
                    </h1>
                    <div className="mt-10 flex max-w-3xl flex-col items-center gap-6 text-lg leading-relaxed text-slate-600 md:text-xl md:leading-relaxed">
                        <p>
                            Congratulations on making it to the final round of the Jianshan Scholarship application process! 🎉
                        </p>
                        <p>
                            At Jianshan, teaching is a core part of the experience. In this round, we want to understand how you approach designing sessions for our students, and how your unique teaching style might resonate with them.
                        </p>
                        <p className="font-medium text-slate-700">
                            The next page contains a comprehensive teaching brief with essential background information. We kindly ask that you read it carefully and thoroughly before you begin working on your answers.
                        </p>
                    </div>

                    <Button
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            setHasReadIntro(true);
                        }}
                        size="lg"
                        className="mt-14 h-14 rounded-full bg-slate-900 px-10 text-lg font-medium text-white shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-1 hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/20"
                    >
                        Continue to Briefing
                        <ArrowRight className="ml-3 h-5 w-5" />
                    </Button>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-24 text-slate-900 selection:bg-amber-100 selection:text-amber-900">
            <div className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHasReadIntro(false)}
                        className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Intro
                    </Button>

                    <div className="flex items-center gap-3">
                        <p className={cn(
                            "hidden text-sm font-medium sm:block",
                            isDirty ? "text-amber-700" : "text-emerald-700"
                        )}>
                            {isDirty ? "Unsaved changes" : draftSavedAt ? `Saved at ${formatSavedTime(draftSavedAt)}` : "Ready to save"}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSaveDraft}
                            disabled={savingDraft || submitting}
                            className="rounded-full border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            {savingDraft ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Draft
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <main className="container mx-auto max-w-6xl px-4 pt-10 md:pt-16">
                <div className="mb-10 md:mb-14">
                    <h2 className="font-serif text-4xl font-medium tracking-tight text-slate-900 md:text-5xl">Part 1: The Briefing</h2>
                    <p className="mt-4 text-lg text-slate-500">Essential context and guidelines for planning your sessions.</p>
                </div>

                <section className="space-y-8">
                    {BRIEF_SECTIONS.map((section, index) => (
                        <Card key={section.eyebrow} className="gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-sm transition-shadow hover:shadow-md">
                            <CardHeader className="space-y-2 border-b border-slate-100 bg-slate-100/80 px-6 pb-5 pt-6 md:px-8 md:pb-6 md:pt-8">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600/90">
                                    {section.eyebrow}
                                </p>
                                <CardTitle className="font-serif text-2xl font-medium leading-[1.3] text-slate-900 md:text-3xl">
                                    {section.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 px-6 pb-6 pt-5 text-[15px] leading-8 text-slate-600 md:px-8 md:pb-8 md:pt-6 md:text-base md:leading-relaxed">
                                {section.body?.map(paragraph => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}

                                {section.numbered && (
                                    <ol className="list-decimal space-y-3 pl-5 text-slate-700">
                                        {section.numbered.map(item => (
                                            <li key={item} className="pl-2">{item}</li>
                                        ))}
                                    </ol>
                                )}

                                {section.closing?.map(paragraph => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}

                                {section.bullets && (
                                    <ul className="mt-8 space-y-5">
                                        {section.bullets.map((item, i) => (
                                            <li key={item} className="flex gap-5 border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                                                <span className="pt-0.5 font-serif text-lg font-medium tracking-widest text-amber-600/40">
                                                    {(i + 1).toString().padStart(2, '0')}
                                                </span>
                                                <span className="text-[15px] leading-8 text-slate-700 md:text-base md:leading-relaxed">
                                                    {item}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {section.sessionCards && (
                                    <div className="mt-6 grid gap-12 md:grid-cols-2 lg:gap-16">
                                        {section.sessionCards.map(card => (
                                            <div key={card.badge} className="flex flex-col">
                                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                                    <span className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                                        {card.badge}
                                                    </span>
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{card.duration}</span>
                                                </div>
                                                <h3 className="mt-6 font-serif text-2xl font-medium leading-tight text-slate-900">{card.title}</h3>
                                                <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{card.description}</p>
                                                <div className="mt-6 border-l-2 border-slate-200 pl-4">
                                                    <p className="text-sm leading-relaxed text-slate-700"><span className="font-semibold text-slate-900">Outcome:</span> {card.outcome}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {index === BRIEF_SECTIONS.length - 1 && (
                                    <div className="mt-10 border-t border-slate-100 pt-8">
                                        <p className="text-center font-serif text-xl font-medium italic text-slate-700/80">
                                            &quot;We are looking for clarity, judgment, student awareness, and the ability to make your subject feel alive.&quot;
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <div className="mb-10 mt-20 border-t border-slate-200/60 pt-16 md:mb-14 md:mt-32 md:pt-24">
                    <h2 className="font-serif text-4xl font-medium tracking-tight text-slate-900 md:text-5xl">Part 2: Your Application</h2>
                    <p className="mt-4 text-lg text-slate-500">Outline your session ideas and provide your video introduction.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <Card className="gap-0 py-0 overflow-hidden border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200">
                        <CardHeader className="border-b border-slate-100/80 bg-slate-50/80 px-6 pb-6 pt-8 md:px-10 md:pb-8 md:pt-10">
                            <CardTitle className="font-serif text-3xl font-medium text-slate-900">Your Session Ideas</CardTitle>
                            <CardDescription className="mt-2 text-base text-slate-500">
                                We&apos;d love to see how you would translate your discipline into a student-facing Jianshan experience.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-12 px-6 pb-6 pt-8 md:px-10 md:pb-10 md:pt-10">
                            <PromptField
                                id="type-a"
                                title="Type A Session: Deep Dive"
                                description="Imagine the Type A session you would design for Jianshan Summer Camp. What real problem, challenge, or question would students work on, and how would your discipline help them work through it?"
                                prompts={TYPE_A_PROMPTS}
                                titleValue={typeATitle}
                                onTitleChange={setTypeATitle}
                                value={typeAThoughts}
                                onChange={setTypeAThoughts}
                                disabled={submitting}
                                placeholder="Share the challenge, how students would work through it, and how you would make the session interactive."
                            />

                            <hr className="border-slate-100" />

                            <PromptField
                                id="type-b"
                                title="Type B Session: Wide Lens"
                                description="Now imagine your Type B session. What thinking tool, framework, or mental lens from your discipline would you teach, and how would you make it useful and engaging for students?"
                                prompts={TYPE_B_PROMPTS}
                                titleValue={typeBTitle}
                                onTitleChange={setTypeBTitle}
                                value={typeBThoughts}
                                onChange={setTypeBThoughts}
                                disabled={submitting}
                                placeholder="Show us the mind tool you would teach and how students would practise using it."
                            />
                        </CardContent>
                    </Card>

                    <Card className="gap-0 py-0 overflow-hidden border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200">
                        <CardHeader className="border-b border-slate-100/80 bg-slate-50/80 px-6 pb-6 pt-8 md:px-10 md:pb-8 md:pt-10">
                            <CardTitle className="font-serif text-3xl font-medium text-slate-900">Video Introduction</CardTitle>
                            <CardDescription className="mt-2 text-base text-slate-500">
                                Please provide a short video so we can get a sense of your communication style and presence.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-10 px-6 pb-6 pt-8 md:px-10 md:pb-10 md:pt-10">
                            
                            <div className="space-y-8">
                                <div className="border-l-2 border-slate-200 pl-5">
                                    <h4 className="font-serif text-xl font-medium text-slate-900">The Prompt: First Day of Camp</h4>
                                    <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-slate-600">
                                        <p>
                                            Please record a <strong className="font-semibold text-slate-800">3-5 minute video</strong> imagining that it is your first day meeting our students at camp.
                                        </p>
                                        <p>
                                            How would you introduce yourself? How would you briefly introduce your sessions? How would you make students feel curious, comfortable, and excited to join your class?
                                        </p>
                                        <p>
                                            <em className="text-slate-500">We are not looking for polished production. We care much more about your clarity, presence, warmth, and how you connect with students.</em>
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 md:p-8">
                                    <h4 className="font-medium text-slate-900">Upload Instructions</h4>
                                    <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                                        You may upload your video to YouTube (Unlisted), Google Drive, Bilibili, or another accessible platform, and paste the link below.
                                    </p>
                                    <ul className="mt-6 grid gap-4 md:grid-cols-2">
                                        {VIDEO_REQUIREMENTS.map(item => (
                                            <li key={item} className="flex items-start gap-3 text-[14.5px] text-slate-600">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                                <span className="leading-snug">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="video" className="text-base font-semibold text-slate-900">
                                    Video Introduction URL <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="video"
                                    type="url"
                                    placeholder="https://"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    disabled={submitting}
                                    className="h-12 border-slate-200 bg-white text-base text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:ring-amber-500"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-0 py-0 overflow-hidden border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200">
                        <CardHeader className="border-b border-slate-100/80 bg-slate-50/80 px-6 pb-6 pt-8 md:px-10 md:pb-8 md:pt-10">
                            <CardTitle className="font-serif text-3xl font-medium text-slate-900">Before You Submit</CardTitle>
                            <CardDescription className="mt-2 text-base text-slate-500">
                                Please confirm that you understand the following points before submitting your final round application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 px-6 pb-6 pt-8 md:px-10 md:pb-10 md:pt-10">
                            <div className="flex flex-col space-y-2">
                                {FINAL_CONFIRMATIONS.map(item => (
                                    <label
                                        key={item.key}
                                        className="group flex cursor-pointer items-start gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-slate-50/80 md:-mx-4"
                                    >
                                        <Checkbox
                                            checked={confirmations[item.key]}
                                            onCheckedChange={(checked) => handleConfirmationChange(item.key, checked === true)}
                                            disabled={submitting}
                                            className="mt-1 flex-shrink-0 border-slate-300 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white"
                                        />
                                        <span className="text-[15px] leading-relaxed text-slate-700 group-hover:text-slate-900">{item.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="concerns" className="text-base font-semibold leading-relaxed text-slate-900">
                                    Do you foresee any concerns, constraints, or support needs that may affect your participation, preparation, or teaching delivery?
                                </Label>
                                <Textarea
                                    id="concerns"
                                    placeholder="Optional: Share anything we should know in advance."
                                    className="min-h-[120px] resize-y border-slate-200 bg-white p-4 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:ring-amber-500"
                                    value={finalRoundConcerns}
                                    onChange={(e) => setFinalRoundConcerns(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>

                            {error && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
                                    {error}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end border-t border-slate-100 bg-slate-50/50 py-6 px-6 md:px-10">
                            <Button
                                type="submit"
                                size="lg"
                                className="h-12 w-full rounded-full bg-slate-900 px-8 text-base font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow sm:w-auto"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Final Round
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

function PromptField({
    id,
    title,
    description,
    prompts,
    titleValue,
    onTitleChange,
    value,
    onChange,
    disabled,
    placeholder,
}: {
    id: string;
    title: string;
    description: string;
    prompts: string[];
    titleValue: string;
    onTitleChange: (value: string) => void;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    placeholder: string;
}) {
    return (
        <div className="space-y-6">
            <div className="space-y-6">
                <div>
                    <Label htmlFor={id} className="font-serif text-2xl font-medium text-slate-900">
                        {title} <span className="text-red-500">*</span>
                    </Label>
                    <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                        {description}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${id}-title`} className="text-sm font-semibold text-slate-700">
                        Session Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`${id}-title`}
                        placeholder="Give your session a catchy, intriguing title"
                        value={titleValue}
                        onChange={(e) => onTitleChange(e.target.value)}
                        disabled={disabled}
                        className="h-12 border-slate-200 bg-white text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:ring-amber-500"
                    />
                </div>

                <div className="border-l-2 border-slate-200 pl-5">
                    <p className="text-[13px] font-bold uppercase tracking-wider text-slate-400">Guiding Questions</p>
                    <ul className="mt-4 space-y-3">
                        {prompts.map(prompt => (
                            <li key={prompt} className="flex items-start gap-3 text-[15px] text-slate-700">
                                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
                                <span className="leading-relaxed">{prompt}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <Textarea
                id={id}
                placeholder={placeholder}
                className="min-h-[260px] resize-y border-slate-200 bg-white p-5 text-base leading-relaxed text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:ring-amber-500"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            />
        </div>
    );
}
