"use client";

import React, { useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export function Section({ number, title, titleEn, description, children }: { number: string, title: string, titleEn: string, description?: React.ReactNode, children: React.ReactNode }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!cardRef.current || !textRef.current) return;
            const cardRect = cardRef.current.getBoundingClientRect();
            const viewHeight = window.innerHeight;
            const center = viewHeight / 2;
            const numberApproxCenter = cardRect.top + 60;
            const dist = Math.abs(center - numberApproxCenter);

            const maxOpacity = 0.3;
            const minOpacity = 0.03;
            const range = viewHeight * 0.5;

            let intensity = maxOpacity * (1 - dist / range);
            intensity = Math.max(minOpacity, intensity);

            textRef.current.style.opacity = intensity.toString();
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
        >
            <Card ref={cardRef} className="overflow-hidden border-0 shadow-sm bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/50 group hover:ring-blue-500/30 transition-all duration-500">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-600/80 to-blue-400/40" />

                <div className="relative p-6 sm:p-8 md:p-10">
                    <div
                        ref={textRef}
                        className="absolute top-0 left-0 -mt-6 -ml-4 text-9xl font-black text-blue-500 select-none pointer-events-none z-0 transition-opacity duration-100 ease-out font-sans"
                        style={{ opacity: 0.05 }}
                    >
                        {number}
                    </div>

                    <div className="relative z-10 mb-8 pb-4 border-b border-dashed border-slate-200">
                        <div className="flex items-baseline gap-2 flex-wrap mb-1">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
                            <span className="text-lg font-medium text-slate-400 font-serif italic">{titleEn}</span>
                        </div>
                        {description && <div className="text-slate-500 text-sm mt-1">{description}</div>}
                    </div>

                    <div className="relative z-10">
                        {children}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
