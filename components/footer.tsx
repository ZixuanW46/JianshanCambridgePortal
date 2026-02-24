import Link from "next/link";
import { PROGRAMME_INFO } from "@/lib/constants";

export function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400 text-sm">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-white font-semibold mb-3">{PROGRAMME_INFO.name}</h3>
                        <p className="text-slate-500 leading-relaxed">
                            {PROGRAMME_INFO.organization}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-3">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                            <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                            <li><Link href="/register" className="hover:text-white transition-colors">Apply</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-3">Contact</h3>
                        <p className="text-slate-500">
                            For enquiries, please email us at<br />
                            <a href="mailto:tutors@jianshanacademy.com" className="text-blue-400 hover:text-blue-300">
                                tutors@jianshanacademy.com
                            </a>
                        </p>
                    </div>
                </div>
                <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-600">
                    <p>© {new Date().getFullYear()} {PROGRAMME_INFO.organization}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
