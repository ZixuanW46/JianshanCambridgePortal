import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import type { ParsedAttachmentResult } from "@/lib/types";

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_PROMPT_TEXT_CHARS = 6000;

interface ParsedAttachmentPayload {
    fileType: string;
    textExcerpt: string;
}

function getUrlPath(url: string) {
    try {
        const parsed = new URL(url);
        const encodedPath = parsed.pathname.split("/o/")[1] || "";
        return decodeURIComponent(encodedPath || parsed.pathname);
    } catch {
        return decodeURIComponent(url.split("?")[0] || url);
    }
}

export function getAttachmentFileExtension(url: string) {
    const path = getUrlPath(url);
    const fileName = path.split("/").pop() || "";
    return fileName.split(".").pop()?.toLowerCase() || "";
}

function normaliseExtractedText(text: string) {
    return text
        .replace(/\r/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[^\S\n]{2,}/g, " ")
        .trim();
}

function truncateForPrompt(text: string) {
    return text.slice(0, MAX_PROMPT_TEXT_CHARS).trim();
}

async function downloadAttachment(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Attachment download failed (${response.status}).`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0) {
        throw new Error("Attachment file is empty.");
    }

    if (buffer.byteLength > MAX_ATTACHMENT_BYTES) {
        throw new Error("Attachment file is too large to parse.");
    }

    return buffer;
}

async function parsePdf(buffer: Buffer) {
    const parser = new PDFParse({ data: buffer });

    try {
        const result = await parser.getText();
        return result.text;
    } finally {
        await parser.destroy().catch(() => undefined);
    }
}

async function parseDocx(buffer: Buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}

export async function extractAttachmentTextFromUrl(url: string): Promise<ParsedAttachmentPayload> {
    const fileType = getAttachmentFileExtension(url);
    if (!fileType) {
        throw new Error("Attachment file type could not be determined.");
    }

    if (!["pdf", "docx", "doc"].includes(fileType)) {
        throw new Error(`Unsupported attachment type: ${fileType}.`);
    }

    if (fileType === "doc") {
        throw new Error("Legacy .doc files are not supported for AI parsing yet.");
    }

    const buffer = await downloadAttachment(url);
    const extractedText = fileType === "pdf"
        ? await parsePdf(buffer)
        : await parseDocx(buffer);

    const textExcerpt = truncateForPrompt(normaliseExtractedText(extractedText));
    if (!textExcerpt) {
        throw new Error("No readable text was found in the attachment.");
    }

    return {
        fileType,
        textExcerpt,
    };
}

export function createPendingParsedAttachment(sourceUrl: string, fileType?: string): ParsedAttachmentResult {
    return {
        status: "pending",
        sourceUrl,
        fileType,
    };
}

export function createCompletedParsedAttachment(
    sourceUrl: string,
    payload: ParsedAttachmentPayload,
): ParsedAttachmentResult {
    return {
        status: "completed",
        sourceUrl,
        fileType: payload.fileType,
        extractedAt: new Date().toISOString(),
        textExcerpt: payload.textExcerpt,
    };
}

export function createFailedParsedAttachment(
    sourceUrl: string,
    error: unknown,
    fileType?: string,
): ParsedAttachmentResult {
    const message = error instanceof Error ? error.message : "Unknown attachment parsing error";

    return {
        status: "failed",
        sourceUrl,
        fileType,
        extractedAt: new Date().toISOString(),
        error: message.slice(0, 1000),
    };
}
