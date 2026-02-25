"use client"

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useBackground } from "@/lib/use-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth();
    const { backgroundImage, isLoaded } = useBackground();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        setLoading(true);
        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (error: any) {
            console.error("Password reset failed", error);
            setError(error.message || "Failed to send reset email. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const renderForm = (isMobile: boolean) => {
        if (success) {
            return (
                <div className="flex flex-col items-center gap-4 text-center py-6">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>Email Sent!</h3>
                    <p className={`text-muted-foreground ${isMobile ? 'text-[12px]' : 'text-sm'}`}>
                        We&apos;ve sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
                    </p>
                    <Button
                        variant="outline"
                        className={`mt-4 h-12 w-full font-bold ${isMobile ? 'text-[12px] rounded-xl' : ''}`}
                        asChild
                    >
                        <Link href="/login">
                            Return to Sign In
                        </Link>
                    </Button>
                </div>
            );
        }

        return (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                <div className="grid gap-2">
                    <Label htmlFor={`${isMobile ? 'mobile-' : ''}email`} className={`font-semibold ${isMobile ? 'text-gray-700 text-[12px]' : 'text-primary/90'}`}>Email Address</Label>
                    <div className="relative group">
                        <Input
                            id={`${isMobile ? 'mobile-' : ''}email`}
                            type="email"
                            placeholder="Enter your registered email"
                            className={`pl-11 h-12 ${isMobile
                                ? 'border-gray-200 bg-gray-50 focus:bg-white text-[12px] rounded-xl'
                                : 'border-primary/10 bg-white/50 focus:bg-white/80'} transition-all focus-visible:ring-primary/20 placeholder:text-gray-400`}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400 pointer-events-none group-focus-within:text-primary transition-colors`} />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className={`mt-2 h-12 w-full font-bold ${isMobile ? 'text-[12px] rounded-xl' : 'tracking-wide'} border-none shadow-lg hover:shadow-xl outline-none ring-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all`}
                >
                    {loading && <Loader2 className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'} animate-spin`} />}
                    Send Reset Link
                </Button>
            </form>
        );
    };

    return (
        <div className="min-h-screen w-full bg-white lg:p-6 flex items-center justify-center">

            {/* MOBILE LAYOUT */}
            <div className="lg:hidden flex flex-col w-full h-[100dvh] overflow-hidden bg-white">
                <div className="relative h-[30vh] w-full bg-slate-900 shrink-0 overflow-hidden">
                    <div
                        className={`absolute inset-0 bg-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                            backgroundImage: backgroundImage ? `url('${backgroundImage}')` : 'none',
                            backgroundPosition: "68% 35%"
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    <div className="absolute top-8 left-8 z-10">
                        <div className="inline-flex items-center justify-center px-[16px] py-[8px] rounded-[32px] bg-[#818181]/40 backdrop-blur-[4px] border border-[#CCC]/40 w-fit">
                            <span className="text-white text-xs font-medium tracking-wide">Jianshan Academy 2026</span>
                        </div>
                    </div>

                    <div className="absolute bottom-10 left-8 space-y-2 z-10">
                        <h1 className="text-white text-xl font-black leading-tight drop-shadow-sm">
                            Reset your<br />
                            <span className="text-[#FFB800]">password</span>
                        </h1>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-t-[32px] -mt-6 relative z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] isolate overflow-hidden flex flex-col">
                    <div className="w-full h-full overflow-y-auto px-8 pt-8 pb-8">
                        <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
                            <div className="text-left w-full">
                                <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-[12px] font-medium border border-red-100">
                                    {error}
                                </div>
                            )}

                            {renderForm(true)}

                            {!success && (
                                <div className="text-center mt-2 pb-6">
                                    <p className="text-[12px] text-gray-500">
                                        Remember your password?{' '}
                                        <Link href="/login" className="text-primary font-bold hover:underline">
                                            Sign In
                                        </Link>
                                    </p>
                                    <div className="mt-12 text-xs text-muted-foreground/60">
                                        <span>© 2026 Jianshan Academy. All rights reserved.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* DESKTOP LAYOUT */}
            <div className="hidden lg:block relative w-full lg:h-[calc(100vh-3rem)] lg:rounded-[2rem] overflow-hidden bg-primary/95 group/design-root shadow-2xl">
                <div
                    className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{ backgroundImage: backgroundImage ? `url('${backgroundImage}')` : 'none' }}
                />
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                <div className="relative z-10 w-full h-full grid grid-cols-2 p-16 gap-8">
                    <div className="flex flex-col justify-end items-start space-y-6">
                        <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/10">
                            <span className="text-white font-medium text-lg tracking-wide">Jianshan Academy 2026</span>
                        </div>
                        <h1 className="text-white text-5xl xl:text-6xl font-black leading-tight tracking-tight drop-shadow-md">
                            A borderless<br />
                            micro-university<br />
                            built by you and<br />
                            <span className="text-accent">Cambridge Scholars</span>
                        </h1>
                        <p className="text-gray-200 text-lg font-light tracking-wide opacity-90">
                            Unlock the infinite possibilities of academic exploration
                        </p>
                    </div>

                    <div className="flex items-center justify-end h-full overflow-hidden">
                        <div className="w-full max-w-[480px] h-full bg-white/80 backdrop-blur-[5px] border border-white/40 shadow-xl rounded-[32px] pt-10 px-12 pb-8 relative flex flex-col overflow-y-auto scrollbar-hide">
                            <div className="flex flex-col gap-6 flex-1">
                                <div className="flex flex-col gap-2 items-center text-center">
                                    <div className="relative w-[60px] h-[90px] hover:opacity-80 transition-opacity cursor-pointer mt-2 mb-2">
                                        <Link href="/">
                                            <Image
                                                src="/jianshan-login-logo.png"
                                                alt="Jianshan Logo"
                                                fill
                                                className="object-contain"
                                                priority
                                            />
                                        </Link>
                                    </div>

                                    <div className="text-left w-full mt-4">
                                        <h2 className="text-primary tracking-tight text-2xl font-bold leading-tight">Forgot Password</h2>
                                        <p className="text-muted-foreground/80 text-sm font-normal mt-2">
                                            Enter your email and we&apos;ll send you a reset link.
                                        </p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50/80 backdrop-blur-sm text-red-600 px-4 py-3 rounded-md text-sm font-medium border border-red-100">
                                        {error}
                                    </div>
                                )}

                                {renderForm(false)}

                                {!success && (
                                    <>
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground/80">
                                                Remember your password?{' '}
                                                <Link href="/login" className="text-primary font-bold hover:text-primary/80 transition-colors">
                                                    Sign In
                                                </Link>
                                            </p>
                                        </div>
                                        <div className="text-center mt-auto">
                                            <div className="mt-8 text-xs text-muted-foreground/60">
                                                <span>© 2026 Jianshan Academy. All rights reserved.</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
