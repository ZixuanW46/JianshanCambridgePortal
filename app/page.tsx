"use client"

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BookOpen, ArrowRight, Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { PROGRAMME_INFO, PROGRAMME_DATES } from "@/lib/constants";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.1),transparent_50%)]" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-white/90 text-sm font-medium">Applications Now Open for Summer 2026</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              Inspire the Next<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Generation
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100/80 mb-4 max-w-3xl mx-auto leading-relaxed">
              {PROGRAMME_INFO.description}
            </p>

            <p className="text-lg text-blue-200/60 mb-10 max-w-2xl mx-auto">
              Application deadline: {PROGRAMME_DATES.applicationDeadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30">
                  Apply Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl backdrop-blur-sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Join as a Tutor?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Make a meaningful impact while developing your own skills and enriching your CV
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: GraduationCap,
                title: "Share Your Expertise",
                description: "Lead seminars and workshops in your subject area. Help ambitious students explore academic interests and develop critical thinking skills.",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Users,
                title: "Mentorship Experience",
                description: "Gain valuable teaching and mentoring experience. Work closely with small groups of students in an intensive, rewarding programme.",
                color: "from-violet-500 to-purple-500",
              },
              {
                icon: BookOpen,
                title: "Competitive Package",
                description: "Receive competitive compensation, full accommodation, and meals during the programme. Travel and visa support provided.",
                color: "from-teal-500 to-emerald-500",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <div className="group relative bg-slate-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Application Process</h2>
            <p className="text-lg text-slate-600">Simple, straightforward, and takes about 15 minutes</p>
          </motion.div>

          <div className="space-y-6">
            {[
              { step: 1, title: "Create an Account", desc: "Sign up with your email or Google account" },
              { step: 2, title: "Complete Your Profile", desc: "Fill in your academic background and subject preferences" },
              { step: 3, title: "Write Your Essays", desc: "Tell us about your motivation and experience" },
              { step: 4, title: "Submit & Wait", desc: "We'll review your application within 15 working days" },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-6 bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{item.title}</h3>
                  <p className="text-slate-600 mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our team of Cambridge tutors and help shape the future of education.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg rounded-xl shadow-lg">
              Start Your Application
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
