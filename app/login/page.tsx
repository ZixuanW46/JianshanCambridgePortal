"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useBackground } from "@/lib/use-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { dbService } from "@/lib/db-service";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const { backgroundImage, isLoaded } = useBackground();
    const [loading, setLoading] = useState(false);

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Password visibility
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const result = await login(email, password);
            const currentUser = result.user;

            // Check if admin
            const tokenResult = await currentUser.getIdTokenResult();
            if (tokenResult.claims.admin) {
                router.push("/admin/dashboard");
                return;
            }

            // Check if user has an application
            if (currentUser.uid) {
                const app = await dbService.getMyApplication(currentUser.uid);
                if (!app) {
                    router.push("/welcome");
                    return;
                }
            }

            router.push("/dashboard");
        } catch (error: any) {
            console.error("Login failed", error);
            setError(error.message || "Login failed. Please check your email and password.");
            setLoading(false);
        }
    };


    const renderForm = (isMobileLayout: boolean) => (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email Input */}
            <div className="grid gap-2">
                <Label htmlFor={`${isMobileLayout ? 'm-' : ''}email`} className="font-semibold text-primary/90">Email</Label>
                <div className="relative group">
                    <Input
                        id={`${isMobileLayout ? 'm-' : ''}email`}
                        type="email"
                        placeholder="Enter your email"
                        className={`pl-11 h-12 border-primary/10 bg-white/50 focus:bg-white/80 transition-all focus-visible:ring-primary/20 placeholder:text-muted-foreground/60 ${isMobileLayout ? 'text-[12px] rounded-xl' : ''}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70 pointer-events-none group-focus-within:text-primary transition-colors" />
                </div>
            </div>

            {/* Password Input */}
            <div className="grid gap-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor={`${isMobileLayout ? 'm-' : ''}password`} className="font-semibold text-primary/90">Password</Label>
                    <Link href="/forgot-password" className="text-xs font-semibold text-muted-foreground/80 hover:text-primary transition-colors">
                        Forgot password?
                    </Link>
                </div>
                <div className="relative group">
                    <Input
                        id={`${isMobileLayout ? 'm-' : ''}password`}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className={`pl-11 pr-11 h-12 border-primary/10 bg-white/50 focus:bg-white/80 transition-all focus-visible:ring-primary/20 placeholder:text-muted-foreground/60 ${isMobileLayout ? 'text-[12px] rounded-xl' : ''}`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70 pointer-events-none group-focus-within:text-primary transition-colors" />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-primary transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={isMobileLayout ? 16 : 18} /> : <Eye size={isMobileLayout ? 16 : 18} />}
                    </button>
                </div>
            </div>

            <Button
                type="submit"
                disabled={loading}
                className={`mt-2 h-12 w-full font-bold tracking-wide border-none shadow-lg hover:shadow-xl outline-none ring-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all ${isMobileLayout ? 'text-[12px] rounded-xl' : ''}`}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
            </Button>

        </form>
    );

    return (
        <div className="min-h-screen w-full bg-white lg:p-6 flex items-center justify-center">

            {/* =======================
                MOBILE LAYOUT (lg:hidden)
               ======================= */}
            <div className="lg:hidden flex flex-col w-full h-[100dvh] overflow-hidden bg-white">

                {/* Top "Poster" Section */}
                <div className="relative h-[40vh] w-full bg-slate-900 shrink-0 overflow-hidden">
                    {/* Background Image */}
                    <div
                        className={`absolute inset-0 bg-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                            backgroundImage: backgroundImage ? `url('${backgroundImage}')` : 'none',
                            backgroundPosition: "68% 35%"
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-8 left-8 z-10">
                        <div className="inline-flex items-center justify-center px-[16px] py-[8px] rounded-[32px] bg-[#818181]/40 backdrop-blur-[4px] border border-[#CCC]/40 w-fit">
                            <span className="text-white text-xs font-medium tracking-wide">Jianshan Academy 2026</span>
                        </div>
                    </div>

                    {/* Marketing Text */}
                    <div className="absolute bottom-14 left-8 space-y-4 z-10">
                        <h1 className="text-white text-xl font-black leading-tight drop-shadow-sm">
                            A borderless micro-university
                            <br />built by you and
                            <span className="text-[#FFB800]"> Cambridge Scholars</span>
                        </h1>
                        <p className="text-white/80 text-xs font-light tracking-wide">
                            Unlock the infinite possibilities of academic exploration
                        </p>
                    </div>
                </div>

                {/* Bottom Login Section */}
                <div className="flex-1 bg-white rounded-t-[32px] -mt-8 relative z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] isolate overflow-hidden flex flex-col">
                    <div className="w-full h-full overflow-y-auto px-8 pt-10 pb-8">
                        <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
                            <div className="text-left w-full space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-[12px] font-medium border border-red-100">
                                    {error}
                                </div>
                            )}

                            {renderForm(true)}

                            <div className="text-center mt-2 pb-6">
                                <p className="text-[12px] text-gray-500">
                                    Don&apos;t have an account?{' '}
                                    <Link href="/register" className="text-primary font-bold hover:underline">
                                        Create Account
                                    </Link>
                                </p>
                                <div className="mt-12 text-xs text-muted-foreground/60">
                                    <span>© 2026 Jianshan Academy</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* =======================
                DESKTOP LAYOUT (hidden lg:block)
               ======================= */}
            <div className="hidden lg:block relative w-full lg:h-[calc(100vh-3rem)] lg:rounded-[2rem] overflow-hidden bg-primary/95 group/design-root shadow-2xl">
                <div
                    className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{ backgroundImage: backgroundImage ? `url('${backgroundImage}')` : 'none' }}
                />
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                <div className="relative z-10 w-full h-full grid grid-cols-2 p-16 gap-8">

                    {/* Left Column */}
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

                    {/* Right Column - Login Card */}
                    <div className="flex items-center justify-end h-full overflow-hidden">
                        <div className="w-full max-w-[480px] h-full bg-white/80 backdrop-blur-[5px] border border-white/40 shadow-xl rounded-[32px] px-10 pt-10 pb-8 relative flex flex-col overflow-y-auto scrollbar-hide">
                            <div className="flex flex-col gap-8 flex-1">
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
                                        <h2 className="text-primary tracking-tight text-2xl font-bold leading-tight">Sign In</h2>
                                        <p className="text-muted-foreground/80 text-sm font-normal mt-2">
                                            Welcome to the Jianshan Application Portal.
                                        </p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50/80 backdrop-blur-sm text-red-600 px-4 py-3 rounded-md text-sm font-medium border border-red-100">
                                        {error}
                                    </div>
                                )}

                                {renderForm(false)}

                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground/80">
                                        Don&apos;t have an account?{' '}
                                        <Link href="/register" className="text-primary font-bold hover:text-primary/80 transition-colors">
                                            Create Account
                                        </Link>
                                    </p>
                                </div>
                                <div className="text-center mt-auto">
                                    <div className="mt-8 text-xs text-muted-foreground/60">
                                        <span>© 2026 Jianshan Academy. All rights reserved.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
