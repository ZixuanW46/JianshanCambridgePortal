"use client"

import { useState, useRef, useCallback } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Upload, X, FileIcon, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onUpload: (url: string, fileName: string) => void;
    accept?: string;
    maxSizeMB?: number;
    storagePath?: string;
    className?: string;
    disabled?: boolean;
}

export function FileUpload({
    onUpload,
    accept = "image/*,.pdf,.doc,.docx",
    maxSizeMB = 10,
    storagePath = "uploads",
    className,
    disabled = false,
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const [uploaded, setUploaded] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

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
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => inputRef.current?.click()}
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
