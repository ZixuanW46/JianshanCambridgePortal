"use client"

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, LayoutDashboard, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { PROGRAMME_INFO } from "@/lib/constants";

export function Navbar() {
    const { user, isAdmin, logout, loading } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <div className="font-semibold text-slate-900 text-sm leading-tight">{PROGRAMME_INFO.shortName}</div>
                            <div className="text-[10px] text-slate-500 leading-tight">Tutor Portal</div>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                {isAdmin && (
                                    <Link href="/admin">
                                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                                            <Shield className="w-4 h-4 mr-1.5" />
                                            Admin
                                        </Button>
                                    </Link>
                                )}
                                <Link href="/dashboard">
                                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                                        <LayoutDashboard className="w-4 h-4 mr-1.5" />
                                        Dashboard
                                    </Button>
                                </Link>
                                <div className="w-px h-6 bg-slate-200 mx-1" />
                                <span className="text-sm text-slate-500 max-w-[150px] truncate">
                                    {user.displayName || user.email}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={logout}
                                    className="text-slate-500 hover:text-red-600"
                                    disabled={loading}
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/faq">
                                    <Button variant="ghost" size="sm" className="text-slate-600">FAQ</Button>
                                </Link>
                                <Link href="/login">
                                    <Button variant="ghost" size="sm" className="text-slate-600">Sign In</Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                        Apply Now
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 text-slate-600"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200 py-4 space-y-2">
                        {user ? (
                            <>
                                <div className="px-2 py-1 text-sm text-slate-500 truncate">
                                    {user.displayName || user.email}
                                </div>
                                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start">
                                        <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                                    </Button>
                                </Link>
                                {isAdmin && (
                                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="ghost" className="w-full justify-start">
                                            <Shield className="w-4 h-4 mr-2" /> Admin Panel
                                        </Button>
                                    </Link>
                                )}
                                <Button variant="ghost" className="w-full justify-start text-red-600" onClick={logout}>
                                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/faq" onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start">FAQ</Button>
                                </Link>
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start">Sign In</Button>
                                </Link>
                                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">Apply Now</Button>
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
