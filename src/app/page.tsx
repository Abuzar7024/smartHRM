"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Users, Calendar, CreditCard, FileText, CheckSquare,
  MessageSquare, ArrowRight, ShieldCheck, BarChart3,
  Building2, Clock, ChevronRight, Menu, X, Star
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-white font-sans">
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                body { font-family: 'Inter', sans-serif; }
                .gradient-text {
                    background: linear-gradient(135deg, #1e293b 0%, #4f46e5 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .hero-glow {
                    background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(79, 70, 229, 0.1) 0%, transparent 60%);
                }
                .feature-card:hover { transform: translateY(-2px); }
                .feature-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
                .float-anim { animation: float 4s ease-in-out infinite; }
            `}</style>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-100" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">SmartHR</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">How it works</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">Pricing</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg transition-colors">
              Sign in
            </Link>
            <Link href="/onboarding" className="text-sm font-semibold text-white bg-slate-900 hover:bg-indigo-600 px-5 py-2.5 rounded-lg transition-all shadow-sm">
              Get started free
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3">
            <a href="#features" className="block text-sm font-medium text-slate-700 py-2">Features</a>
            <a href="#how-it-works" className="block text-sm font-medium text-slate-700 py-2">How it works</a>
            <a href="#pricing" className="block text-sm font-medium text-slate-700 py-2">Pricing</a>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" className="text-sm font-medium text-center text-slate-700 border border-slate-200 py-2.5 rounded-lg">Sign in</Link>
              <Link href="/onboarding" className="text-sm font-semibold text-center text-white bg-slate-900 py-2.5 rounded-lg">Get started free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="hero-glow pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Built for growing teams in India
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight mb-6">
            HR management that{" "}
            <span className="gradient-text">actually works</span>
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            SmartHR helps you manage employees, approve leave requests, process payroll,
            and handle HR workflows — all from one place. No spreadsheets required.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-slate-900/10 hover:shadow-indigo-500/20 active:scale-95"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-8 py-4 rounded-xl text-base transition-all hover:shadow-sm"
            >
              Sign in to your account
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "Free", label: "Up to 5 employees" },
              { value: "₹99", label: "Per extra employee/mo" },
              { value: "100%", label: "Data stored securely" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview ── */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="float-anim bg-slate-900 rounded-2xl p-1 shadow-2xl shadow-slate-900/20">
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                <div className="flex-1 ml-2 bg-slate-700 rounded-md h-6 flex items-center px-3">
                  <span className="text-slate-400 text-xs font-mono">smarthrms.com/dashboard</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1 bg-slate-900 rounded-xl p-4 space-y-3">
                  {["Overview", "Employees", "Leaves", "Payroll", "Tasks", "Chat"].map((item) => (
                    <div key={item} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg ${item === "Overview" ? "bg-indigo-600" : ""}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item === "Overview" ? "bg-white" : "bg-slate-600"}`} />
                      <span className={`text-xs font-medium ${item === "Overview" ? "text-white" : "text-slate-400"}`}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="col-span-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total Employees", value: "24", color: "bg-indigo-500/20 text-indigo-400" },
                      { label: "Pending Leaves", value: "3", color: "bg-amber-500/20 text-amber-400" },
                      { label: "Payroll Due", value: "₹1.2L", color: "bg-emerald-500/20 text-emerald-400" },
                    ].map((card) => (
                      <div key={card.label} className="bg-slate-900 rounded-xl p-4">
                        <div className={`text-xs font-bold mb-2 ${card.color.split(" ")[1]}`}>{card.label}</div>
                        <div className="text-2xl font-black text-white">{card.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-900 rounded-xl p-4">
                    <div className="text-xs font-bold text-slate-400 mb-3">Recent Activity</div>
                    {[
                      { name: "Rahul Sharma", action: "Applied for 2 days leave", time: "10 min ago", dot: "bg-amber-400" },
                      { name: "Priya Nair", action: "Clocked in at 9:02 AM", time: "1 hr ago", dot: "bg-emerald-400" },
                      { name: "Arjun Patel", action: "Submitted expense report", time: "3 hrs ago", dot: "bg-indigo-400" },
                    ].map((row) => (
                      <div key={row.name} className="flex items-center justify-between py-2 border-t border-slate-800 first:border-0">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${row.dot}`} />
                          <div>
                            <span className="text-xs font-semibold text-white">{row.name}</span>
                            <span className="text-xs text-slate-500 ml-2">{row.action}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-600">{row.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Everything your HR team needs</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              SmartHR covers all core HR functions. No need to juggle multiple tools or maintain spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Employee Management",
                desc: "Maintain a central record for every employee — personal details, department, role, documents, and status.",
                color: "bg-indigo-50 text-indigo-600",
              },
              {
                icon: Calendar,
                title: "Leave Management",
                desc: "Employees submit leave requests online. Managers review and approve or reject them in one click.",
                color: "bg-emerald-50 text-emerald-600",
              },
              {
                icon: CreditCard,
                title: "Payroll & Payslips",
                desc: "Record salaries, generate payslips, and let employees download their pay records anytime.",
                color: "bg-amber-50 text-amber-600",
              },
              {
                icon: FileText,
                title: "Document Collection",
                desc: "Request, collect, and approve employee documents like Aadhaar, PAN, and bank details — all digitally.",
                color: "bg-rose-50 text-rose-600",
              },
              {
                icon: CheckSquare,
                title: "Task Assignment",
                desc: "Assign tasks to employees with deadlines and priority levels. Track progress without chasing updates.",
                color: "bg-purple-50 text-purple-600",
              },
              {
                icon: Clock,
                title: "Attendance Tracking",
                desc: "Employees clock in and out from the dashboard. View daily logs and session durations in real time.",
                color: "bg-sky-50 text-sky-600",
              },
              {
                icon: MessageSquare,
                title: "Internal Messaging",
                desc: "Team members can message each other directly inside the platform. No need for separate chat tools.",
                color: "bg-teal-50 text-teal-600",
              },
              {
                icon: BarChart3,
                title: "AI Insights",
                desc: "Get AI-generated summaries about team performance, attendance patterns, and leave trends.",
                color: "bg-violet-50 text-violet-600",
              },
              {
                icon: Building2,
                title: "Multi-Company Support",
                desc: "Each company gets its own isolated workspace. Data is never shared between organizations.",
                color: "bg-orange-50 text-orange-600",
              },
            ].map((feature) => (
              <div key={feature.title} className="feature-card bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Up and running in minutes</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              No lengthy setup or IT support needed. You can start managing your team the same day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create your company",
                desc: "Register with your company name and email. Your workspace is ready immediately — no approval process.",
              },
              {
                step: "2",
                title: "Add your employees",
                desc: "Invite employees by email. They sign up and are added to your company automatically after you approve them.",
              },
              {
                step: "3",
                title: "Start managing",
                desc: "Employees can submit leave, clock in, upload documents, and chat. You approve, track, and manage from one dashboard.",
              },
            ].map((step) => (
              <div key={step.step} className="relative text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center mx-auto mb-5">
                  {step.step}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Start free with up to 5 employees. Pay only when you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Starter</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-slate-900">Free</span>
              </div>
              <p className="text-sm text-slate-500 mb-8">For teams of up to 5 employees</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Up to 5 employees",
                  "All core features included",
                  "Leave & attendance tracking",
                  "Document collection",
                  "Internal messaging",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/onboarding" className="block text-center w-full border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold py-3 rounded-xl transition-all hover:bg-slate-50 text-sm">
                Get started free
              </Link>
            </div>

            {/* Growth Plan */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                Most popular
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Growth</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-white">₹99</span>
                <span className="text-slate-400 text-sm mb-1.5">/ employee / month</span>
              </div>
              <p className="text-sm text-slate-500 mb-8">For teams beyond 5 employees</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited employees",
                  "Everything in Starter",
                  "AI-powered HR insights",
                  "Priority support",
                  "Advanced payroll reports",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/onboarding" className="block text-center w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all text-sm">
                Start free trial
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonial / Trust ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-12">Trusted by teams</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "We replaced three separate tools with SmartHR. Leave approvals that used to take days now happen in minutes.",
                name: "Ramesh K.",
                role: "HR Manager, Bengaluru",
              },
              {
                quote: "The payslip and document features saved us hours every month. Employees can access everything without calling HR.",
                name: "Sneha M.",
                role: "Operations Lead, Pune",
              },
              {
                quote: "Setup was straightforward. We had our team onboarded and using the system the same afternoon.",
                name: "Amit D.",
                role: "Founder, Mumbai",
              },
            ].map((t) => (
              <div key={t.name} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-left">
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-xs font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Start managing your team today
          </h2>
          <p className="text-slate-400 mb-10 text-lg">
            Free for up to 5 employees. No credit card required. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl text-base hover:bg-slate-100 transition-all active:scale-95"
            >
              Create your free account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border border-slate-700 text-slate-300 font-semibold px-8 py-4 rounded-xl text-base hover:border-slate-500 hover:text-white transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <span className="text-slate-300 font-bold">SmartHR</span>
            </div>

            <p className="text-sm text-slate-600 text-center">
              HR software for growing companies. Built in India.
            </p>

            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Terms of Service</Link>
              <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Sign in</Link>
              <Link href="/onboarding" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Register</Link>
              <span className="text-xs text-slate-600">© 2026 SmartHR</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
