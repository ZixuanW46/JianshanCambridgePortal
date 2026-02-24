"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
    const { login, loginWithGoogle, loading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await login(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError("Invalid email or password. Please try again.");
            } else if (err.code === 'auth/user-not-found') {
                setError("No account found with this email. Please register first.");
            } else if (err.code === 'auth/too-many-requests') {
                setError("Too many failed attempts. Please try again later.");
            } else {
                setError(err.message || "Login failed. Please try again.");
            }
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        try {
            await loginWithGoogle();
            router.push('/dashboard');
        } catch (err: any) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(err.message || "Google login failed.");
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
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
                        <p className="text-slate-600">Sign in to your tutor application portal</p>
                    </div>

                    {/* Google Sign In */}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full mb-6 py-5 text-base border-slate-300 hover:bg-slate-50"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </Button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-3 text-slate-500">Or sign in with email</span>
                        </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
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

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password" className="text-slate-700">Password</Label>
                                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
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
                            {loading ? "Signing in..." : "Sign In"}
                            {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-600">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                            Create one
                        </Link>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
