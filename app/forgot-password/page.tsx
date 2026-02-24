"use client"

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
    const { resetPassword, loading } = useAuth();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await resetPassword(email);
            setSent(true);
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
                setError("No account found with this email address.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Please enter a valid email address.");
            } else {
                setError(err.message || "Failed to send reset email. Please try again.");
            }
        }
    };

    return (
        <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                    {sent ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h1>
                            <p className="text-slate-600 mb-6">
                                We&apos;ve sent a password reset link to <strong>{email}</strong>.
                                Please check your inbox and follow the instructions.
                            </p>
                            <Link href="/login">
                                <Button variant="outline" className="w-full">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Sign In
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset Your Password</h1>
                                <p className="text-slate-600">
                                    Enter the email address associated with your account and we&apos;ll send you a reset link.
                                </p>
                            </div>

                            <form onSubmit={handleReset} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-700">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 border border-red-200">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-5 text-base"
                                    disabled={loading}
                                >
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
                                    <ArrowLeft className="w-3 h-3 mr-1" />
                                    Back to Sign In
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </main>
    );
}
