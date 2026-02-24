"use client"

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PROGRAMME_INFO, PROGRAMME_DATES } from "@/lib/constants";
import { motion } from "framer-motion";
import { HelpCircle, GraduationCap, Calendar, ClipboardList, Users, Mail } from "lucide-react";

const faqData = [
    {
        category: "About the Programme",
        icon: GraduationCap,
        items: [
            { q: "What is the Cambridge Academic Mentoring Programme?", a: "It is a summer programme that connects Cambridge University students and graduates with ambitious secondary school students in China. Tutors lead seminars, workshops, and one-on-one mentoring sessions." },
            { q: "Who organises this programme?", a: "The programme is jointly organised by Jianshan Academy and CAMCapy, an official Cambridge student society." },
            { q: "Where does the programme take place?", a: "The programme runs at partner schools in various cities across China, including Hangzhou, Shanghai, Beijing, and Shenzhen." },
            { q: "What subjects can I teach?", a: "We welcome tutors across a wide range of subjects including Mathematics, Sciences, Computer Science, Engineering, Humanities, Economics, and more. You can indicate your subject preferences in the application." },
        ]
    },
    {
        category: "Application Process",
        icon: ClipboardList,
        items: [
            { q: "How do I apply?", a: "Create an account, fill out the application form with your academic background and a short essay, and submit. The whole process takes about 15 minutes." },
            { q: "What are the application requirements?", a: "You should be a current student or recent graduate of the University of Cambridge (or a comparable institution). We look for enthusiastic individuals with strong academic records and a passion for teaching." },
            { q: "When is the application deadline?", a: `The application deadline is ${PROGRAMME_DATES.applicationDeadline}. We review applications on a rolling basis, so early applications are encouraged.` },
            { q: "How long does the review process take?", a: "We aim to review all applications within 15 working days of submission. You will be notified by email when a decision is made." },
        ]
    },
    {
        category: "Dates & Logistics",
        icon: Calendar,
        items: [
            { q: "When does the programme run?", a: `The programme runs during ${PROGRAMME_DATES.programmeDates}. Training sessions are held in ${PROGRAMME_DATES.trainingDates}.` },
            { q: "Is accommodation provided?", a: "Yes, full accommodation and meals are provided for the duration of the programme at the partner school campus." },
            { q: "What about travel arrangements?", a: "We provide travel support and assistance with visa applications for international tutors. Flight costs and arrangements will be discussed upon acceptance." },
        ]
    },
    {
        category: "Compensation & Benefits",
        icon: Users,
        items: [
            { q: "Is this a paid position?", a: "Yes, tutors receive competitive compensation for their time. Details will be shared with successful applicants." },
            { q: "What other benefits are there?", a: "In addition to compensation, tutors receive full board and lodging, travel support, professional development opportunities, and a certificate of participation. It's also a wonderful addition to your CV." },
        ]
    },
];

export default function FAQPage() {
    return (
        <main className="flex-1 bg-gradient-to-b from-slate-50 to-white">
            {/* Hero */}
            <section className="py-16 md:py-20 text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
                        <HelpCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Everything you need to know about the {PROGRAMME_INFO.name}
                    </p>
                </motion.div>
            </section>

            {/* FAQ Content */}
            <section className="max-w-3xl mx-auto px-4 pb-20">
                <div className="space-y-8">
                    {faqData.map((category, ci) => (
                        <motion.div
                            key={category.category}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: ci * 0.1 }}
                        >
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 px-6 py-4 border-b bg-slate-50">
                                    <category.icon className="w-5 h-5 text-blue-600" />
                                    <h2 className="font-bold text-slate-900">{category.category}</h2>
                                </div>
                                <Accordion type="single" collapsible className="px-2">
                                    {category.items.map((item, i) => (
                                        <AccordionItem key={i} value={`${ci}-${i}`} className="border-b last:border-0">
                                            <AccordionTrigger className="text-left px-4 py-4 text-slate-800 font-medium hover:no-underline">
                                                {item.q}
                                            </AccordionTrigger>
                                            <AccordionContent className="px-4 pb-4 text-slate-600 leading-relaxed">
                                                {item.a}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Contact */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white"
                >
                    <Mail className="w-10 h-10 mx-auto mb-4 opacity-80" />
                    <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
                    <p className="text-blue-100 mb-4">
                        Get in touch with our admissions team and we&apos;ll be happy to help.
                    </p>
                    <a
                        href="mailto:tutors@jianshanacademy.com"
                        className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                        <Mail className="w-4 h-4" />
                        tutors@jianshanacademy.com
                    </a>
                </motion.div>
            </section>
        </main>
    );
}
