"use client"

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard, HelpCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY < 10 || currentScrollY < lastScrollY.current) {
                setIsVisible(true);
                document.documentElement.style.setProperty('--nav-height-current', '64px');
            }
            else if (currentScrollY > 10 && currentScrollY > lastScrollY.current) {
                setIsVisible(false);
                document.documentElement.style.setProperty('--nav-height-current', '0px');
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        document.documentElement.style.setProperty('--nav-height-current', '64px');

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* Spacer to prevent content jump since header is fixed */}
            <div className="h-16 w-full" />

            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 w-full border-b bg-white transition-transform duration-300",
                    isVisible ? "translate-y-0" : "-translate-y-full"
                )}
            >
                <div className="container px-4 md:px-4 flex h-16 items-center justify-between mx-auto max-w-7xl">
                    <div className="flex items-center gap-2 md:gap-4">
                        <Link
                            href={!user ? "/" : (isAdmin ? "/admin/dashboard" : "/dashboard")}
                            className="flex items-center gap-2"
                        >
                            <Image
                                src="/logo_black.png"
                                alt="Jianshan Academy Logo"
                                width={32}
                                height={32}
                                className="h-8 w-auto"
                            />
                            <div className="h-6 w-px bg-gray-300 mx-2" />
                            <span className="font-medium text-lg text-foreground">
                                {isAdmin ? "Admin Portal" : "Student Portal"}
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Admin Links */}
                        {isAdmin && (
                            <Link
                                href="/admin/dashboard"
                                className={cn("text-sm font-medium transition-colors hover:text-primary hidden sm:block", pathname.startsWith('/admin') ? "text-primary" : "text-muted-foreground")}
                            >
                                Dashboard
                            </Link>
                        )}

                        {/* Standard User Links */}
                        {!isAdmin && (
                            <Link
                                href="/faq"
                                className={cn("text-sm font-medium transition-colors hover:text-primary hidden sm:block", pathname === '/faq' ? "text-primary" : "text-muted-foreground")}
                            >
                                FAQ
                            </Link>
                        )}

                        {user ? (
                            <>
                                <button
                                    className="text-sm font-medium text-muted-foreground hover:text-primary hidden sm:flex items-center gap-2"
                                    onClick={() => { }}
                                >
                                    <UserIcon className="h-4 w-4" />
                                    {user.displayName || user.email || (isAdmin ? 'Admin' : 'Student')}
                                </button>

                                <Button
                                    variant="ghost"
                                    className="text-muted-foreground hover:bg-transparent hover:text-destructive hidden sm:flex px-2"
                                    onClick={() => logout()}
                                    title="Sign Out"
                                >
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </>
                        ) : (
                            <div className="hidden sm:flex items-center gap-4">
                                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
                                    Sign In
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            className="flex items-center justify-center p-2 sm:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="sm:hidden absolute top-16 left-0 right-0 border-b bg-white/95 backdrop-blur-md shadow-lg animate-in slide-in-from-top-2 fade-in duration-200 z-40">
                        <nav className="flex flex-col">
                            {!isAdmin && (
                                <Link
                                    href="/faq"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 px-6 py-4 text-base font-medium text-foreground bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="p-1 bg-gray-100 rounded-md">
                                        <HelpCircle className="h-4 w-4" />
                                    </div>
                                    FAQ
                                </Link>
                            )}

                            {isAdmin && (
                                <Link
                                    href="/admin/dashboard"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-6 py-4 text-base font-medium bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors",
                                        pathname.startsWith('/admin') ? "text-primary" : "text-foreground"
                                    )}
                                >
                                    <div className="p-1 bg-gray-100 rounded-md">
                                        <LayoutDashboard className="h-4 w-4" />
                                    </div>
                                    Dashboard
                                </Link>
                            )}

                            {user ? (
                                <>
                                    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                            Signed In As
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-primary/10 rounded-full">
                                                <UserIcon className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="font-medium text-foreground">
                                                {user.displayName || user.email || (isAdmin ? 'Admin' : 'Student')}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="flex items-center gap-3 px-6 py-4 text-base font-medium text-destructive bg-white hover:bg-red-50 transition-colors w-full text-left"
                                    >
                                        <div className="p-1 bg-red-50 rounded-md">
                                            <LogOut className="h-4 w-4" />
                                        </div>
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 px-6 py-4 text-base font-medium text-primary bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <div className="p-1 bg-primary/10 rounded-md">
                                        <UserIcon className="h-4 w-4" />
                                    </div>
                                    Sign In
                                </Link>
                            )}
                        </nav>
                    </div>
                )}
            </header>
        </>
    );
}
