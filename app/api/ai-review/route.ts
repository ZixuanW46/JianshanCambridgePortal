import { NextRequest, NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import {
    AiReviewRound,
    buildAiReviewPrompt,
    createCompletedAiReview,
    createFailedAiReview,
    createPendingAiReview,
    normalizeAiReviewPayload,
    AI_REVIEW_MODEL,
} from "@/lib/ai-review";
import {
    createCompletedParsedAttachment,
    createFailedParsedAttachment,
    createPendingParsedAttachment,
    extractAttachmentTextFromUrl,
    getAttachmentFileExtension,
} from "@/lib/attachment-text";
import type { Application, ParsedAttachmentResult } from "@/lib/types";

const COLLECTION = "applications";

async function verifyRequester(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
    }

    const token = authHeader.split("Bearer ")[1];
    return adminAuth.verifyIdToken(token);
}

function isValidRound(value: unknown): value is AiReviewRound {
    return value === "round1" || value === "round2";
}

async function generateAiReview(application: Application, round: AiReviewRound) {
    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) {
        throw new Error("ZHIPU_API_KEY is not configured.");
    }

    const attachmentExcerpt = application.adminData?.parsedAttachment?.status === "completed"
        ? application.adminData.parsedAttachment.textExcerpt || null
        : null;

    const requestReview = async (nextAttachmentExcerpt: string | null) => fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: AI_REVIEW_MODEL,
            temperature: 0.3,
            stream: false,
            messages: [
                {
                    role: "system",
                    content: "You are a rigorous admissions review assistant. Return strict JSON only.",
                },
                {
                    role: "user",
                    content: buildAiReviewPrompt(application, round, nextAttachmentExcerpt),
                },
            ],
        }),
    });

    let response = await requestReview(attachmentExcerpt);

    if (!response.ok) {
        const errorText = await response.text();
        const isContentFiltered = response.status === 400 && errorText.includes('"code":"1301"');

        if (attachmentExcerpt && isContentFiltered) {
            response = await requestReview(null);
            if (!response.ok) {
                const retriedErrorText = await response.text();
                throw new Error(`Zhipu API error (${response.status}): ${retriedErrorText.slice(0, 500)}`);
            }
        } else {
            throw new Error(`Zhipu API error (${response.status}): ${errorText.slice(0, 500)}`);
        }
    }

    const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("Zhipu API returned an empty response.");
    }

    return normalizeAiReviewPayload(content);
}

function getAttachmentUrl(application: Application) {
    return application.section2_about_you?.additional_file_url?.trim() || "";
}

function shouldReuseParsedAttachmentCache(cached: ParsedAttachmentResult | undefined, sourceUrl: string) {
    return Boolean(
        cached
        && cached.status === "completed"
        && cached.sourceUrl === sourceUrl
        && cached.textExcerpt?.trim(),
    );
}

async function resolveParsedAttachment(application: Application, docRef: FirebaseFirestore.DocumentReference) {
    const sourceUrl = getAttachmentUrl(application);
    if (!sourceUrl) {
        return undefined;
    }

    const cached = application.adminData?.parsedAttachment;
    if (shouldReuseParsedAttachmentCache(cached, sourceUrl)) {
        return cached;
    }

    const detectedFileType = getAttachmentFileExtension(sourceUrl) || undefined;

    await docRef.set({
        adminData: {
            parsedAttachment: createPendingParsedAttachment(sourceUrl, detectedFileType),
        },
    }, { merge: true });

    try {
        const payload = await extractAttachmentTextFromUrl(sourceUrl);
        const completed = createCompletedParsedAttachment(sourceUrl, payload);

        await docRef.set({
            adminData: {
                parsedAttachment: completed,
            },
            lastUpdatedAt: new Date().toISOString(),
        }, { merge: true });

        return completed;
    } catch (error) {
        const failed = createFailedParsedAttachment(sourceUrl, error, detectedFileType);

        await docRef.set({
            adminData: {
                parsedAttachment: failed,
            },
            lastUpdatedAt: new Date().toISOString(),
        }, { merge: true });

        return failed;
    }
}

export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyRequester(req);
        const { applicationId, round } = await req.json() as { applicationId?: string; round?: AiReviewRound };

        if (!applicationId || !isValidRound(round)) {
            return NextResponse.json({ error: "Missing or invalid applicationId / round." }, { status: 400 });
        }

        const docRef = adminDb.collection(COLLECTION).doc(applicationId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return NextResponse.json({ error: "Application not found." }, { status: 404 });
        }

        const application = {
            id: docSnap.id,
            ...docSnap.data(),
        } as Application;

        if (!decodedToken.admin && decodedToken.uid !== application.userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await docRef.set({
            adminData: {
                aiReview: {
                    [round]: createPendingAiReview(),
                },
            },
        }, { merge: true });

        const parsedAttachment = await resolveParsedAttachment(application, docRef);
        if (parsedAttachment) {
            application.adminData = {
                ...application.adminData,
                parsedAttachment,
            };
        }

        try {
            const payload = await generateAiReview(application, round);
            const completed = createCompletedAiReview(payload);

            await docRef.set({
                adminData: {
                    aiReview: {
                        [round]: completed,
                    },
                },
                lastUpdatedAt: new Date().toISOString(),
            }, { merge: true });

            return NextResponse.json({ data: completed });
        } catch (error) {
            const failed = createFailedAiReview(error);

            await docRef.set({
                adminData: {
                    aiReview: {
                        [round]: failed,
                    },
                },
                lastUpdatedAt: new Date().toISOString(),
            }, { merge: true });

            return NextResponse.json({ error: failed.error, data: failed }, { status: 200 });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        const status = message === "Unauthorized" ? 401 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
