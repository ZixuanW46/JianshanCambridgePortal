"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Hide Navbar/Footer on Landing Page and Forgot Password Page
    // (Login/Register typically also hide these, but sticking to request)
    // Hide Navbar/Footer on Landing Page, Login, Register, and Forgot Password pages
    const hiddenPaths = ["/login", "/register"];
    const shouldHideLayout =
        pathname === "/" ||
        hiddenPaths.some(path => pathname === path || pathname === `${path}/`) ||
        pathname?.startsWith("/forgot-password");

    return (
        <>
            {!shouldHideLayout && <Navbar />}
            <main className="flex-1">
                {children}
            </main>
            {!shouldHideLayout && <Footer />}
        </>
    );
}
