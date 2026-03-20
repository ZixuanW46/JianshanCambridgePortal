"use client"

import { useState, useRef, useCallback } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { CheckCircle, Eye, FileIcon, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onUpload: (url: string, fileName: string) => void;
    accept?: string;
    maxSizeMB?: number;
    storagePath?: string;
    className?: string;
    disabled?: boolean;
    uploadedUrl?: string;
    uploadedFileName?: string;
    onRemove?: () => void;
}

const getDisplayFileName = (uploadedUrl?: string, uploadedFileName?: string) => {
    if (uploadedFileName?.trim()) return uploadedFileName.trim();
    if (!uploadedUrl) return "Uploaded file";

    try {
        const url = new URL(uploadedUrl);
        const encodedPath = url.pathname.split("/o/")[1] || "";
        const storagePath = decodeURIComponent(encodedPath);
        const rawFileName = storagePath.split("/").pop() || "Uploaded file";
        return rawFileName.replace(/^\d+_/, "");
    } catch {
        const rawFileName = uploadedUrl.split("/").pop()?.split("?")[0] || "Uploaded file";
        return decodeURIComponent(rawFileName).replace(/^\d+_/, "");
    }
};

export function FileUpload({
    onUpload,
    accept = "image/*,.pdf,.doc,.docx",
    maxSizeMB = 10,
    storagePath = "uploads",
    className,
    disabled = false,
    uploadedUrl,
    uploadedFileName,
    onRemove,
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const [uploaded, setUploaded] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const displayFileName = getDisplayFileName(uploadedUrl, uploadedFileName);
    const hasUploadedFile = Boolean(uploadedUrl);

    const openFilePicker = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !storage) return;

        // Validate size
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File must be smaller than ${maxSizeMB}MB`);
            return;
        }

        setError("");
        setUploading(true);
        setProgress(0);
        setUploaded(false);

        try {
            const timestamp = Date.now();
            const fileName = `${storagePath}/${timestamp}_${file.name}`;
            const storageRef = ref(storage, fileName);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setProgress(pct);
                },
                (err) => {
                    setError("Upload failed. Please try again.");
                    setUploading(false);
                    console.error("Upload error:", err);
                },
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    onUpload(url, file.name);
                    setUploading(false);
                    setUploaded(true);
                    setTimeout(() => setUploaded(false), 3000);
                }
            );
        } catch (err) {
            setError("Upload failed. Please try again.");
            setUploading(false);
            console.error("Upload error:", err);
        }

        // Reset input
        if (inputRef.current) inputRef.current.value = '';
    }, [maxSizeMB, storagePath, onUpload]);

    return (
        <div className={cn("space-y-2", className)}>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled || uploading}
            />

            {hasUploadedFile ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex items-center gap-3">
                            <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600">
                                <FileIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800">{displayFileName}</p>
                                <p className="text-xs text-slate-500">
                                    {uploading ? `Uploading replacement ${progress}%...` : "1 file uploaded"}
                                </p>
                            </div>
                        </div>
                        {uploaded && !uploading && (
                            <div className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Updated
                            </div>
                        )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button asChild type="button" variant="outline" size="sm" className="border-slate-200">
                            <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </a>
                        </Button>
                        {!disabled && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={openFilePicker}
                                    disabled={uploading}
                                    className="border-slate-200"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Replacing...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Replace
                                        </>
                                    )}
                                </Button>
                                {onRemove && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={onRemove}
                                        disabled={uploading}
                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={openFilePicker}
                    disabled={disabled || uploading}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading {progress}%...
                        </>
                    ) : uploaded ? (
                        <>
                            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                            Uploaded!
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload File
                        </>
                    )}
                </Button>
            )}

            {uploading && (
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
