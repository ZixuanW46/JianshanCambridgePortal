"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useBackground } from "@/lib/use-background";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Mail, UserPlus, ChevronRight, Loader2, AlertCircle } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading, loginWithGoogle } = useAuth();
  const { backgroundImage, isLoaded } = useBackground();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      // Router redirection is handled by the useEffect watching `user` and `loading`
    } catch (error: any) {
      console.error("Google login failed", error);
      setError(error.message || "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen w-full bg-white lg:p-6 lg:flex lg:items-center lg:justify-center">

      {/* =======================
                MOBILE LAYOUT (lg:hidden)
               ======================= */}
      <div className="lg:hidden flex flex-col w-full h-[100vh] overflow-hidden bg-white">

        {/* Top "Poster" Section */}
        <div className="relative h-[45vh] w-full bg-slate-900 shrink-0 overflow-hidden">
          {/* Background Image */}
          <div
            className={`absolute inset-0 bg-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{
              backgroundImage: backgroundImage ? `url('${backgroundImage}')` : 'none',
              backgroundPosition: "68% 35%"
            }}
          />
          {/* Dark Overlay */}
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

        {/* Bottom Action Section */}
        <div className="flex-1 bg-white rounded-t-[32px] -mt-8 relative z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] isolate overflow-hidden flex flex-col">
          <div className="w-full h-full overflow-y-auto px-8 pt-12 pb-8 flex flex-col justify-start">

            <div className="flex flex-col items-center text-center space-y-8">
              <div className="relative w-[70px] h-[95px]">
                <Image
                  src="/jianshan-login-logo.png"
                  alt="Jianshan Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Welcome to Jianshan</h2>
                <p className="text-sm text-gray-500 leading-relaxed font-normal">
                  Jianshan Scholarship 2026 is now open for applications.
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-8 w-full">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-[12px] font-medium border border-red-100 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google Sign-In Button */}
              <Button
                type="button"
                variant="outline"
                disabled={googleLoading}
                onClick={handleGoogleLogin}
                className="h-14 w-full bg-white hover:bg-gray-50 text-gray-800 font-bold gap-2 rounded-xl text-[14px] border-2 border-gray-200 shadow-sm hover:shadow-md transition-all"
              >
                {googleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative my-4 flex items-center">
                <div className="flex-grow border-t border-muted-foreground/20"></div>
                <span className="flex-shrink-0 px-4 text-xs text-muted-foreground/60">
                  or continue with email
                </span>
                <div className="flex-grow border-t border-muted-foreground/20"></div>
              </div>
              <Button
                variant="default"
                onClick={() => router.push('/login')}
                className="h-14 w-full bg-primary hover:bg-primary/90 text-white font-bold gap-2 rounded-xl text-[14px] shadow-lg outline-none border-none ring-0 focus:ring-0 focus:outline-none transition-all"
              >
                <Mail className="h-4 w-4" />
                Sign In
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push('/register')}
                className="h-14 w-full bg-white hover:bg-white text-gray-700 hover:text-primary/80 font-bold gap-2 rounded-xl text-[14px] border-2 border-gray-100 hover:border-primary/20 shadow-sm hover:shadow-md transition-all"
              >
                <UserPlus className="h-4 w-4" />
                Create Account
              </Button>
            </div>

            <div className="mt-8 pb-4 w-full text-center">
              <div className="text-[10px] text-gray-400">
                <span>© 2026 Jianshan Academy</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* =======================
                DESKTOP LAYOUT (hidden lg:block)
               ======================= */}
      <div className="hidden lg:block relative w-full lg:h-[calc(100vh-3rem)] lg:rounded-[2rem] overflow-hidden bg-primary/95 group/design-root shadow-2xl">
        {/* Background Image */}
        <div
          className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: backgroundImage ? `url('${backgroundImage}')` : 'none' }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Grid Layout */}
        <div className="relative z-10 w-full h-full grid grid-cols-2 p-16 gap-8">

          {/* Left Column - Poster Content */}
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

          {/* Right Column - Action Panel */}
          <div className="flex items-center justify-end h-full">
            <div className="w-full max-w-[480px] bg-white/80 backdrop-blur-[5px] border border-white/40 shadow-xl rounded-[32px] pt-12 px-12 pb-8 relative flex flex-col h-full overflow-y-auto scrollbar-hide">

              {/* Panel Header */}
              <div className="flex flex-col items-center text-center space-y-10">
                <div className="relative w-[80px] h-[110px] mt-8 mb-10">
                  <Image
                    src="/jianshan-login-logo.png"
                    alt="Jianshan Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="space-y-4">
                  <h2 className="text-primary tracking-tight text-3xl font-bold leading-tight">Welcome to Jianshan</h2>
                  <p className="text-muted-foreground text-muted-foreground/80 text-sm font-normal leading-relaxed max-w-md mx-auto">
                    Jianshan Scholarship 2026 is now open for applications.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-8 w-full">
                {error && (
                  <div className="bg-red-50/80 backdrop-blur-sm text-red-600 px-4 py-3 rounded-md text-sm font-medium border border-red-100 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Google Sign-In Button */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={googleLoading}
                  onClick={handleGoogleLogin}
                  className="h-14 w-full bg-white/90 hover:bg-white text-gray-800 font-bold gap-3 border-2 border-gray-200/50 hover:border-gray-300 shadow-sm hover:shadow-md rounded-xl transition-all"
                >
                  {googleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                {/* Divider */}
                <div className="relative my-4 flex items-center">
                  <div className="flex-grow border-t border-muted-foreground/20"></div>
                  <span className="flex-shrink-0 px-4 text-xs text-muted-foreground/60">
                    or continue with email
                  </span>
                  <div className="flex-grow border-t border-muted-foreground/20"></div>
                </div>

                <Button
                  variant="default"
                  onClick={() => router.push('/login')}
                  className="mt-2 h-14 w-full bg-primary hover:bg-primary/90 text-white font-bold gap-3 shadow-lg hover:shadow-xl rounded-xl outline-none border-none ring-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all"
                >
                  <Mail className="h-5 w-5" />
                  Sign In
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push('/register')}
                  className="h-14 w-full bg-white/60 hover:bg-white text-primary hover:text-primary/80 font-bold gap-3 border-1 border-primary/10 hover:border-primary/20 shadow-sm hover:shadow-md rounded-xl transition-all"
                >
                  <UserPlus className="h-5 w-5" />
                  Create Account
                </Button>
              </div>

              <div className="mt-auto pt-6 w-full text-center">
                <div className="text-xs text-muted-foreground/60">
                  <span>© 2026 Jianshan Academy. All rights reserved.</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
