import type { AiReviewResult, Application } from "@/lib/types";

export const AI_REVIEW_MODEL = "glm-4.5-air";
export const AI_REVIEW_PROMPT_VERSION = "2026-03-24-v4";

export type AiReviewRound = "round1" | "round2";

interface AiReviewPayload {
    summary: string;
    tags: string[];
    score: number;
}

const ROUND_COPY: Record<AiReviewRound, { title: string; focus: string }> = {
    round1: {
        title: "Round 1 Candidate Fit Review",
        focus: "Assess the applicant's background, motivations, interests, standout achievements, leadership, communication, and likely fit for the Jianshan programme.",
    },
    round2: {
        title: "Round 2 Teaching Design Review",
        focus: "Assess the proposed session design for feasibility, clarity, originality, student engagement, accessibility to high-school learners, and likely delivery quality.",
    },
};

const PROGRAMME_BACKGROUND = [
    "The Jianshan Scholarship is a fully funded cultural and academic exchange programme for a small cohort of Cambridge scholars travelling to China for a high-intensity, high-trust experience combining teaching, cross-cultural exchange, and immersive travel.",
    "It is not a conventional scholarship for independent research. It is a selective experiential programme. Scholars are chosen not only for academic strength, but also for their ability to communicate ideas, connect across cultures, contribute to a group, and inspire younger students.",
    "At the heart of the programme is Jianshan Academy, a 7-day teaching and exchange experience where selected Cambridge scholars design and lead original sessions for Chinese high school students aged roughly 14 to 18.",
    "The emphasis is not on delivering standard university-level content. The goal is to help students understand what a subject really is, why it matters, and how it connects to the real world.",
    "Strong candidates are therefore not just technically excellent. They can translate their discipline into something vivid, accessible, and curiosity-sparking. The programme values clarity, warmth, imagination, and the ability to make ideas come alive.",
    "The Academy is intentionally broader than classroom teaching. Scholars are expected to share their experience at Cambridge, their interests outside academia, and aspects of their own cultural identity. The programme is framed as a two-way exchange, not a one-way act of teaching.",
    "Because of this, strong candidates usually combine intellectual seriousness with openness, humility, generosity, and genuine interest in other people.",
    "The second major component is the Capy China Trip, an 11-day guided journey across Hangzhou, Shanghai, and Beijing. It is designed as a structured, socially rich encounter with China that goes beyond tourism and exposes scholars to history, local life, culture, and modern China as a lived, layered reality.",
    "The scholarship sits at the intersection of academic communication, youth engagement, intercultural exchange, and immersive travel. It is best understood as a character-revealing programme: scholars are selected into a setting that asks them to teach, adapt, collaborate, and live closely with others over an extended period.",
    "Reviewers should not assess candidates purely on prestige markers or subject-matter brilliance. A strong Jianshan Scholar is someone who can turn academic background into meaningful engagement, participate constructively in a diverse cohort, and represent both Cambridge and themselves with maturity, curiosity, emotional intelligence, and trustworthiness.",
    "Community fit matters. The programme is intentionally small, relationship-driven, and collective. Scholars explore together, eat together, reflect together, and remain connected through an alumni network. Applicants who are collaborative, dependable, and energised by shared experiences are likely to thrive more than applicants who are highly individualistic or disengaged from community life.",
    "In short, the ideal scholar can do three things well: communicate their subject in an inspiring way, engage young people with empathy and credibility, and enter a cross-cultural environment with curiosity, maturity, and generosity.",
].join("\n");

const ROUND2_BRIEFING = [
    "Round 2 briefing summary:",
    "- Scholars design and deliver academic sessions for Chinese secondary school students in China, but this is not traditional content delivery.",
    "- The goal is to help students explore a discipline by beginning to answer four questions: what the subject is really about, how it is studied, what kind of thinking it trains, and how it creates value in the real world.",
    "- Many students are still discovering what genuinely interests them. A strong session should not only teach clearly, but also help students feel what is exciting, distinctive, and meaningful about the discipline.",
    "- The audience is usually Chinese secondary school students aged around 14-16.",
    "- Students can generally participate in English-medium sessions, but some may be less confident speaking at first.",
    "- Everyday English is manageable, but technical vocabulary may not be. Strong sessions explain clearly, avoid unnecessary jargon, and use examples, analogies, and interaction.",
    "- Sessions are usually taught in small groups of around 5-15 students. Good session design should use discussion, participation, collaboration, and live feedback rather than one-way delivery.",
    "- Jianshan is not a conventional content-focused class. It values real-world questions, active workshop-based learning, disciplinary thinking rather than memorised facts, connections across subjects, and curiosity that continues after the session.",
    "- This year's shared theme is Project 2050: The Future City. Scholars should use this as a meaningful context that helps their discipline come alive, without forcing everything into urban studies.",
    "- Each scholar designs one Type A session and one Type B session, and repeats them across different groups during camp.",
    "- Type A is a 2-hour PBL-style deep dive built around a concrete challenge, question, or problem. Students should experience how the discipline helps analyse problems, generate insight, and create value.",
    "- Type B is a 1-hour mind-tool workshop focused on a transferable framework, mental model, analytical tool, or way of thinking useful beyond one narrow topic.",
    "- In this round, reviewers are looking for understanding of the Jianshan teaching model, clear and student-centred session design, effective use of the small-group format, engaging and accessible communication, and whether the scholar helps students explore future interests rather than only learn content.",
    "- Type A reflection prompts include: what concrete challenge students explore, how it connects to Project 2050, what students actually do, how the small-group format is used, and what students understand, produce, or leave with.",
    "- Type B reflection prompts include: what core tool or lens is taught, why it matters beyond one topic, how it is made accessible to high-school students, what students actively do rather than just listen to, and how it complements Type A or reflects the wider discipline.",
    "- The introduction video is not judged on polish. It is mainly about clarity, presence, warmth, and the ability to make students feel curious, comfortable, and excited to join.",
].join("\n");

const ROUND1_SCORING_RUBRIC = [
    "Round 1 scoring rubric:",
    "- Evaluate the candidate using four dimensions:",
    "  1. Distinctive hook / standout profile / publicity value (0-3): memorable leadership, elite achievement, unusual identity, major public-facing experience, or a strong story that makes the candidate especially noticeable.",
    "  2. Teaching and youth engagement potential (0-3): likely ability to explain ideas clearly, connect with teenagers, make a subject come alive, and create curiosity rather than just deliver content.",
    "  3. Cross-cultural and community fit (0-2): openness, generosity, adaptability, group orientation, and likelihood of thriving in a close, shared, intercultural cohort.",
    "  4. Maturity / reliability / presence (0-2): judgment, dependability, humility, emotional intelligence, and overall trustworthiness in a high-trust programme setting.",
    "- Use these dimensions to decide the final score even though you should not output the sub-scores.",
    "- Score anchors:",
    "  - 9-10: exceptionally strong fit; clearly memorable and high-value for the programme, with standout strengths across multiple dimensions and no major concern.",
    "  - 7-8: strong fit; good overall case with at least one notable strength or hook, but still some uncertainty or missing evidence in one area.",
    "  - 5-6: mixed / borderline; some promise, but the fit, teaching potential, or distinctiveness is not yet convincingly strong.",
    "  - 3-4: weak fit; notable concerns or insufficient evidence on key dimensions.",
    "  - 1-2: very poor fit for the programme as currently presented.",
    "- Do not inflate scores. Most decent applicants should not automatically receive 8+.",
].join("\n");

const ROUND2_SCORING_RUBRIC = [
    "Round 2 scoring rubric:",
    "- Evaluate the candidate using four dimensions:",
    "  1. Session design quality (0-3): clarity of concept, strength of structure, and whether the activities/outcomes make sense.",
    "  2. Suitability for Jianshan students (0-3): accessibility for English-medium Chinese secondary school students aged 14-16, appropriate level, low jargon, and strong use of examples, interaction, and small-group participation.",
    "  3. Jianshan teaching fit (0-2): whether the sessions reflect the Jianshan model of real-world relevance, disciplinary thinking, curiosity-building, and student-centred exploration rather than lecture-heavy content delivery.",
    "  4. Distinctiveness and delivery promise (0-2): whether the sessions feel memorable, fresh, energising, and likely to create a strong camp experience, including any standout hook that would help both camp quality and storytelling/publicity.",
    "- Use these dimensions to decide the final score even though you should not output the sub-scores.",
    "- Score anchors:",
    "  - 9-10: exceptional round 2 fit; sessions feel highly compelling, well-pitched, clearly Jianshan-aligned, and likely to work extremely well in practice.",
    "  - 7-8: strong round 2 fit; well-designed and promising, with only moderate uncertainty or a limited weakness.",
    "  - 5-6: mixed / borderline; some good ideas, but important concerns around clarity, feasibility, accessibility, or student engagement remain.",
    "  - 3-4: weak fit; sessions are poorly aligned, overly abstract, insufficiently student-centred, or difficult to imagine working well.",
    "  - 1-2: very poor fit for the round 2 teaching task as currently presented.",
    "- Penalise sessions that sound too abstract, too university-style, too lecture-led, or not genuinely designed for teenagers.",
].join("\n");

function stringifyCompact(value: unknown) {
    return JSON.stringify(value, null, 2);
}

function buildRound1Context(application: Application, attachmentExcerpt?: string | null) {
    return stringifyCompact({
        applicant: {
            fullName: application.section1_personal?.full_name || "",
            gender: application.section1_personal?.gender || "",
            nationality: application.section1_personal?.nationality || [],
            college: application.section1_personal?.college || "",
            subject: application.section1_personal?.subject || "",
            subjectOther: application.section1_personal?.subject_other || "",
            yearOfStudy: application.section1_personal?.year_of_study || "",
            yearOfStudyOther: application.section1_personal?.year_of_study_other || "",
        },
        aboutYou: application.section2_about_you || {},
        teaching: application.section3_teaching || {},
        travel: application.section4_travel || {},
        availability: application.section5_availability || {},
        supplementalSupportingFile: attachmentExcerpt
            ? {
                note: "The applicant uploaded a supporting file / CV. This text is supplemental evidence only and may be incomplete if extraction was imperfect.",
                extractedText: attachmentExcerpt,
            }
            : undefined,
    });
}

function buildRound2Context(application: Application, attachmentExcerpt?: string | null) {
    return stringifyCompact({
        applicant: {
            fullName: application.section1_personal?.full_name || "",
            college: application.section1_personal?.college || "",
            subject: application.section1_personal?.subject || "",
            yearOfStudy: application.section1_personal?.year_of_study || "",
        },
        teachingMotivation: application.section3_teaching || {},
        round2: application.section6_round_2 || {},
        supplementalSupportingFile: attachmentExcerpt
            ? {
                note: "The applicant uploaded a supporting file / CV. Treat it as lower-priority background context than the round 2 teaching submission.",
                extractedText: attachmentExcerpt,
            }
            : undefined,
    });
}

export function buildAiReviewPrompt(application: Application, round: AiReviewRound, attachmentExcerpt?: string | null) {
    const context = round === "round1"
        ? buildRound1Context(application, attachmentExcerpt)
        : buildRound2Context(application, attachmentExcerpt);
    const roundCopy = ROUND_COPY[round];
    const scoringRubric = round === "round1" ? ROUND1_SCORING_RUBRIC : ROUND2_SCORING_RUBRIC;

    return [
        "You are helping the Jianshan Scholarship admin team review tutor applications.",
        "Your job is to produce a short, practical admin-facing review.",
        `Review mode: ${roundCopy.title}.`,
        `Focus: ${roundCopy.focus}`,
        "Programme background:",
        PROGRAMME_BACKGROUND,
        ...(round === "round2" ? ["Round 2 teaching briefing:", ROUND2_BRIEFING] : []),
        "Scoring rubric:",
        scoringRubric,
        "Additional round-specific guidance:",
        "- For round 1, weigh not only achievement and prestige, but also communication ability, warmth, maturity, humility, community fit, and likely effectiveness with teenagers in a cross-cultural setting.",
        "- For round 2, weigh not only intellectual sophistication, but also whether the proposed sessions are feasible, engaging, accessible, memorable, and genuinely suited to high-school students rather than drifting into abstract university-style teaching.",
        "- The programme also benefits from scholars who bring unusually strong, distinctive, or publicity-friendly hooks: for example major leadership positions, elite sport, nationally significant awards, exceptional ranking, high-level performance background, unusual life experience, or a highly memorable personal identity/story.",
        "- Actively search for these standout hooks in the application. If they exist, surface them clearly.",
        "- If a supporting file / CV excerpt is provided, use it to look for concrete standout hooks, but do not let it override the main application if the evidence conflicts.",
        "- Do not default to bland descriptors. Generic adjectives like 'motivated', 'strong', 'curious', 'warm', or 'intelligent' are weak unless tied to concrete evidence.",
        "Output requirements:",
        '- Return strict JSON only. No markdown, no code fences.',
        '- Use this exact shape: {"summary":"...","tags":["..."],"score":7}',
        "- summary: concise English, 2-4 sentences, high signal only.",
        "- If the applicant has a standout hook, mention it explicitly in the summary rather than burying it.",
        "- tags: 3-6 short tags that capture concrete headline-worthy signals, standout identities, distinctive achievements, specific risks, or notable teaching qualities.",
        "- Prefer tags like 'Student Union President', 'National Team Athlete', 'Top of Year Group', 'Performed on National TV', 'Elite Debater', 'Strong Youth-Facing Communicator', or 'Abstract Teaching Risk'.",
        "- Avoid vague tags like 'Motivated', 'Interesting', 'Good Communicator', 'Strong Candidate', or 'Curious Person' unless no sharper wording is supported by evidence.",
        "- score: integer 1-10 reflecting overall fit for this round only.",
        "- In the summary and score, prioritise programme fit over prestige alone.",
        "- Use the rubric seriously. The score should be consistent with the evidence and score anchors, not a vague impression.",
        "- Do not output the rubric or hidden reasoning. Only output the required JSON.",
        "Applicant data:",
        context,
    ].join("\n");
}

export function getAiRoundScore(review?: AiReviewResult) {
    if (review?.status !== "completed") return null;
    if (typeof review.score !== "number" || !Number.isFinite(review.score)) return null;
    return review.score;
}

export function getAverageAiReviewScore(application: Application) {
    const scores = [
        getAiRoundScore(application.adminData?.aiReview?.round1),
        getAiRoundScore(application.adminData?.aiReview?.round2),
    ].filter((score): score is number => score !== null);

    if (scores.length === 0) return null;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function extractJsonObject(rawText: string) {
    const trimmed = rawText.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const candidate = fenced?.[1]?.trim() || trimmed;
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
        throw new Error("Model response did not contain a JSON object.");
    }

    return candidate.slice(start, end + 1);
}

export function normalizeAiReviewPayload(rawText: string): AiReviewPayload {
    const parsed = JSON.parse(extractJsonObject(rawText)) as Partial<AiReviewPayload>;

    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    if (!summary) {
        throw new Error("AI response is missing a summary.");
    }

    const tags = Array.isArray(parsed.tags)
        ? parsed.tags
            .filter((tag): tag is string => typeof tag === "string")
            .map((tag) => tag.trim())
            .filter(Boolean)
            .slice(0, 6)
        : [];

    const numericScore = typeof parsed.score === "number" ? parsed.score : Number(parsed.score);
    if (!Number.isFinite(numericScore)) {
        throw new Error("AI response is missing a valid score.");
    }

    const score = Math.min(10, Math.max(1, Math.round(numericScore)));

    return {
        summary: summary.slice(0, 1000),
        tags,
        score,
    };
}

export function createPendingAiReview(): AiReviewResult {
    return {
        status: "pending",
        model: AI_REVIEW_MODEL,
        promptVersion: AI_REVIEW_PROMPT_VERSION,
    };
}

export function createCompletedAiReview(payload: AiReviewPayload): AiReviewResult {
    return {
        status: "completed",
        model: AI_REVIEW_MODEL,
        promptVersion: AI_REVIEW_PROMPT_VERSION,
        generatedAt: new Date().toISOString(),
        summary: payload.summary,
        tags: payload.tags,
        score: payload.score,
    };
}

export function createFailedAiReview(error: unknown): AiReviewResult {
    const message = error instanceof Error ? error.message : "Unknown AI review error";

    return {
        status: "failed",
        model: AI_REVIEW_MODEL,
        promptVersion: AI_REVIEW_PROMPT_VERSION,
        generatedAt: new Date().toISOString(),
        error: message.slice(0, 1000),
    };
}
