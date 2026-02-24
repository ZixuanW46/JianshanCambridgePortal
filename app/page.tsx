"use client"

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useBackground } from "@/lib/use-background";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Mail, UserPlus, ChevronRight } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { backgroundImage, isLoaded } = useBackground();

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
                  Jianshan Summer Camp 2026 is now open for applications.
                  <br />Check our website for camp details.
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-8 w-full">
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
                  <p className="text-muted-foreground text-muted-foreground/80 text-sm font-normal leading-relaxed max-w-xs mx-auto">
                    Jianshan Summer Camp 2026 is now open for applications.
                    <br />Check our website for camp details.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 mt-8 w-full">
                <Button
                  variant="default"
                  onClick={() => router.push('/login')}
                  className="h-14 w-full bg-primary hover:bg-primary/90 text-white font-bold gap-3 shadow-lg hover:shadow-xl rounded-xl outline-none border-none ring-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all"
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
                  <span>© 2026 Jianshan Academy</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
