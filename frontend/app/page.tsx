"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Heart, 
  Activity, 
  ShieldCheck, 
  Zap, 
  Users, 
  Stethoscope, 
  ArrowRight, 
  Sparkles, 
  Globe, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Award,
  CheckCircle2,
  Cpu,
  Database,
  Smartphone,
  Shield,
  Clock,
  Compass,
  FileText
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { AuroraPulse } from "@/components/visuals/AuroraPulse";

export default function LandingPage() {
  const [lang, setLang] = useState<"en" | "kn" | "tcy">("en");
  const [showDemoModal, setShowDemoModal] = useState(false);

  const heroTexts = {
    en: {
      headline: "Every Beat Tells a Story. We Help You Read It.",
      desc: "Meet PULSEORA, an intelligent wearable health monitoring platform that learns your personal health patterns, detects unusual changes, and helps connect you with timely care.",
      primaryBtn: "Explore Live Demo",
      secBtn: "Clinical Architecture",
      partnerBadge: "Nitte Pharma Innovation Centre • Build4Karnataka 2026",
    },
    kn: {
      headline: "ಪ್ರತಿಯೊಂದು ನಾಡಿಬಡಿತವೂ ಒಂದು ಕಥೆ ಹೇಳುತ್ತದೆ. ಅದನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನಾವು ನೆರವಾಗುತ್ತೇವೆ.",
      desc: "ಪಲ್ಸೋರಾ (PULSEORA) — ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಆರೋಗ್ಯ ಶೈಲಿಯನ್ನು ಕಲಿತು, ಅನಿರೀಕ್ಷಿತ ಏರುಪೇರುಗಳನ್ನು ಗುರುತಿಸಿ, ತುರ್ತು ಆರೈಕೆಗೆ ಸಂಪರ್ಕಿಸುವ ಎಐ ಧರಿಸಬಹುದಾದ ಆರೋಗ್ಯ ವೇದಿಕೆ.",
      primaryBtn: "ಡೆಮೊ ವೀಕ್ಷಿಸಿ",
      secBtn: "ತಂತ್ರಜ್ಞಾನ ವಿವರ",
      partnerBadge: "ನಿಟ್ಟೆ ಫಾರ್ಮಾ ಇನ್ನೋವೇಶನ್ ಸೆಂಟರ್ • Build4Karnataka",
    },
    tcy: {
      headline: "ಪ್ರತಿ ಹೃದಯ ಬಡಿತೊ ಒಂಜಿ ಕತೆ ಪನ್ಪುಂಡು. ಅವೆನ್ ತೆರಿಯರೆ ನಮ ಸಹಾಯ ಮಲ್ಪುವ.",
      desc: "ಪಲ್ಸೋರಾ (PULSEORA) — ನಿಕ್ಲೆನ ದಿನನಿತ್ಯದ ಆರೋಗ್ಯ ಬದಲಾವಣೆಲೆನ್ ತೆರಿದ್, ಸಮಯೊಗು ಸರಿಯಾದ್ ಎಚ್ಚರಿಕೆ ಕೊರ್ಪಿನ ಎಐ ಹೆಲ್ತ್ ಮಾನಿಟರಿಂಗ್.",
      primaryBtn: "ಲೈವ್ ಡೆಮೊ ತೂಲೆ",
      secBtn: "ತಂತ್ರಜ್ಞಾನ ವಿವರಣೆ",
      partnerBadge: "ನಿಟ್ಟೆ ಫಾರ್ಮಾ ಇನ್ನೋವೇಶನ್ ಸೆಂಟರ್ • ಕುಡ್ಲ / ಕರ್ನಾಟಕ",
    }
  };

  const t = heroTexts[lang];

  return (
    <div className="relative min-h-screen bg-surface-ivory flex flex-col overflow-x-hidden selection:bg-emerald-aurora selection:text-emerald-deep">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-emerald-deep/95 backdrop-blur-md border-b border-emerald-aurora/20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo variant="white" size="md" showTagline={true} />

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-emerald-mint/90">
            <Link href="#problem" className="hover:text-white transition-colors">The Challenge</Link>
            <Link href="#solution" className="hover:text-white transition-colors">Solution</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="#companion-showcase" className="hover:text-white transition-colors">AI Companion</Link>
            <Link href="/demo" className="text-emerald-aurora font-semibold hover:text-white transition-colors flex items-center gap-1">
              <span>⚡ Judge Demo</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-emerald-dark/80 rounded-full p-1 border border-emerald-aurora/30 text-xs">
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  lang === "en" ? "bg-emerald-aurora text-emerald-deep font-bold" : "text-emerald-mint hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("kn")}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  lang === "kn" ? "bg-emerald-aurora text-emerald-deep font-bold" : "text-emerald-mint hover:text-white"
                }`}
              >
                ಕನ್ನಡ
              </button>
              <button
                onClick={() => setLang("tcy")}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  lang === "tcy" ? "bg-emerald-aurora text-emerald-deep font-bold" : "text-emerald-mint hover:text-white"
                }`}
              >
                ತುಳು
              </button>
            </div>

            <button
              onClick={() => setShowDemoModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-primary hover:bg-emerald-aurora hover:text-emerald-deep text-white transition-all shadow-md shadow-emerald-deep/40"
            >
              Portal Login
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 1: HERO WITH AURORA PULSE */}
      <section className="relative pt-16 pb-24 lg:pt-28 lg:pb-36 bg-emerald-deep text-white overflow-hidden">
        <AuroraPulse variant="hero" showWaveform={true} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-dark/80 border border-emerald-aurora/40 text-xs text-emerald-mint font-medium shadow-inner">
                <Award className="w-4 h-4 text-emerald-aurora animate-pulse" />
                <span>{t.partnerBadge}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-[1.12]">
                {t.headline.split(".")[0]}.
                <span className="block text-emerald-aurora mt-1">
                  {t.headline.split(".")[1] || "Every Life."}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-emerald-mint/90 max-w-2xl leading-relaxed font-light">
                {t.desc}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/demo"
                  className="px-6 py-3.5 rounded-xl font-bold text-base bg-emerald-aurora text-emerald-deep hover:bg-white transition-all shadow-lg shadow-emerald-aurora/25 flex items-center justify-center gap-2 group"
                >
                  <span>{t.primaryBtn}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#how-it-works"
                  className="px-6 py-3.5 rounded-xl font-semibold text-base border border-emerald-aurora/40 hover:bg-emerald-dark/60 text-white transition-all flex items-center justify-center gap-2"
                >
                  <span>{t.secBtn}</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-emerald-dark/60 text-xs text-emerald-mint/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-aurora" />
                  <span>14-Day Rolling Baselines</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-aurora" />
                  <span>Ensemble AI Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-aurora" />
                  <span>Multilingual Companion</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Simulated Wearable Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-2xl p-6 bg-emerald-dark/85 backdrop-blur-xl border border-emerald-aurora/30 shadow-2xl shadow-emerald-deep/80">
                <div className="flex items-center justify-between pb-4 border-b border-emerald-primary/30">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-aurora animate-ping" />
                    <span className="text-xs font-semibold tracking-wider uppercase text-emerald-mint">Live Telemetry Stream</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                    SIMULATED DEMO DATA
                  </span>
                </div>

                <div className="py-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-white">Ramesh Kumar (68 yrs)</h3>
                    <p className="text-xs text-emerald-mint/70">PULSEORA CareBand Elite • Connected</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-emerald-mint/70">Health Risk Score</span>
                    <div className="text-2xl font-extrabold text-health-normal">14<span className="text-xs font-normal text-emerald-mint">/100</span></div>
                    <span className="text-[10px] font-semibold text-health-normal bg-health-normal/10 px-2 py-0.5 rounded">NORMAL</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2">
                  <div className="p-3 rounded-xl bg-emerald-deep/70 border border-emerald-aurora/20">
                    <div className="flex items-center justify-between text-xs text-emerald-mint/80 mb-1">
                      <span>Heart Rate</span>
                      <Heart className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    </div>
                    <div className="text-xl font-bold text-white">68 <span className="text-xs font-normal text-emerald-mint/70">BPM</span></div>
                    <span className="text-[10px] text-emerald-aurora font-medium">Within 14d baseline (62-72)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-deep/70 border border-emerald-aurora/20">
                    <div className="flex items-center justify-between text-xs text-emerald-mint/80 mb-1">
                      <span>Blood Oxygen (SpO2)</span>
                      <Activity className="w-3.5 h-3.5 text-emerald-aurora" />
                    </div>
                    <div className="text-xl font-bold text-white">98.2 <span className="text-xs font-normal text-emerald-mint/70">%</span></div>
                    <span className="text-[10px] text-emerald-aurora font-medium">Normal Saturation</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-deep/70 border border-emerald-aurora/20">
                    <div className="flex items-center justify-between text-xs text-emerald-mint/80 mb-1">
                      <span>HRV (rMSSD)</span>
                      <TrendingUp className="w-3.5 h-3.5 text-blue-300" />
                    </div>
                    <div className="text-xl font-bold text-white">38.5 <span className="text-xs font-normal text-emerald-mint/70">ms</span></div>
                    <span className="text-[10px] text-emerald-mint font-medium">Stable autonomic tone</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-deep/70 border border-emerald-aurora/20">
                    <div className="flex items-center justify-between text-xs text-emerald-mint/80 mb-1">
                      <span>Sleep Duration</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                    </div>
                    <div className="text-xl font-bold text-white">7.4 <span className="text-xs font-normal text-emerald-mint/70">hrs</span></div>
                    <span className="text-[10px] text-emerald-mint font-medium">Optimal restful sleep</span>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-emerald-primary/30 border border-emerald-aurora/30 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-aurora mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Health Companion Insight</span>
                  </div>
                  <p className="text-emerald-mint/90 text-[11px] leading-relaxed">
                    "All vital signals match Ramesh's personal 14-day learned circadian baseline. Resting heart rate dipped normally during sleep."
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2: HEALTHCARE PROBLEM */}
      <section id="problem" className="py-20 bg-surface-ivory border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-primary">The Healthcare Gap</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-emerald-deep">
              Why Traditional Health Monitoring Can Miss Gradual Deterioration
            </h2>
            <p className="text-base text-brandtext-secondary leading-relaxed">
              Standard clinical cutoffs treat everyone as a generic average. A heart rate of 88 BPM is deemed "normal" by standard tables, but for a senior whose personal baseline is 64 BPM, this represents an acute 37% elevation that demands timely intervention.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-surface-border shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-emerald-deep">Generic Thresholds</h3>
              <p className="text-xs text-brandtext-secondary leading-relaxed">
                Hospital crosses and generic wearable alerts trigger too late — only after acute thresholds (e.g. HR &gt; 100) are breached, missing subtle multi-day drifts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-surface-border shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-emerald-deep">Episodic Clinic Visits</h3>
              <p className="text-xs text-brandtext-secondary leading-relaxed">
                Vital measurements taken once every few months at a clinic fail to capture circadian patterns, nocturnal dips, or physiological stress accumulation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-surface-border shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-soft text-emerald-primary flex items-center justify-center font-bold">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-emerald-deep">False Alarms & Fatigue</h3>
              <p className="text-xs text-brandtext-secondary leading-relaxed">
                Without context awareness, mundane physical exertion triggers false alerts, leading caregivers and elderly individuals to silence monitoring tools completely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE PULSEORA SOLUTION */}
      <section id="solution" className="py-20 bg-white border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-primary">The PULSEORA Solution</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-emerald-deep leading-tight">
                Personalized Baselines. Explainable AI. Multilingual Reach.
              </h2>
              <p className="text-base text-brandtext-secondary leading-relaxed">
                PULSEORA transforms raw telemetry into clinically grounded, explainable early warnings. Instead of comparing you to millions of strangers, PULSEORA learns <i>your</i> personal health signature across 14 rolling days.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "Continuous 14-day rolling circadian diurnal baseline calculation",
                  "Multi-model ensemble anomaly detection (Z-Score + EWMA + Isolation Forest)",
                  "Context-aware suppression of false positives during exercise",
                  "Explainable 0–100 monitoring risk score with plain-language reasons",
                  "Native Kannada and Tulu speech & text conversational companion"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-brandtext-primary">
                    <CheckCircle2 className="w-4 h-4 text-emerald-primary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-primary text-white font-bold text-sm hover:bg-emerald-deep transition-all shadow-md"
                >
                  <span>Launch Patient Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-surface-ivory p-6 rounded-3xl border border-surface-border shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <span className="text-xs font-bold uppercase text-emerald-deep">14-Day Baseline Comparison Model</span>
                  <span className="text-xs text-health-normal font-bold">Stable Autonomic Curve</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-surface-border space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-brandtext-secondary">Learned Resting HR:</span>
                    <span className="font-bold text-emerald-deep">68 BPM (±3.8 BPM)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-brandtext-secondary">Expected SpO2 Range:</span>
                    <span className="font-bold text-emerald-deep">97.2% – 99.4%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-brandtext-secondary">Diurnal Nocturnal Dip:</span>
                    <span className="font-bold text-emerald-deep">-8.5 BPM during sleep (Normal)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-mint/30 border border-emerald-aurora/30 text-xs text-emerald-deep leading-relaxed">
                  <b>Clinical Value:</b> An increase of 8 BPM over 48 hours without high step counts triggers a "Watch" notice days before acute decompensation occurs.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS — 4-STEP PIPELINE */}
      <section id="how-it-works" className="py-20 bg-surface-ivory border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-primary">Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-emerald-deep">
              How PULSEORA Works
            </h2>
            <p className="text-sm text-brandtext-secondary">
              A continuous, secure 4-step pipeline turning telemetry into actionable early warnings.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Wearable Ingestion",
                desc: "Ingests continuous PPG, ECG, accelerometer, and sleep telemetry via Bluetooth LE, REST API, or simulated clinical feeds.",
                icon: Activity
              },
              {
                step: "02",
                title: "Baseline Learning",
                desc: "Maintains a rolling 14-day circadian baseline calculating hourly mean, median, standard deviations, and 10th-90th percentiles.",
                icon: Compass
              },
              {
                step: "03",
                title: "Ensemble AI Anomaly",
                desc: "Evaluates multi-metric deviations with Z-Scores, EWMA residuals, and scikit-learn Isolation Forests with context filters.",
                icon: Cpu
              },
              {
                step: "04",
                title: "Caregiver Escalation",
                desc: "Generates explainable alerts, notifies authorized loved ones, and enables PDF clinical downloads for consulting physicians.",
                icon: Users
              }
            ].map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-3xl font-black text-emerald-mint/80 font-heading block mb-2">{p.step}</span>
                    <Icon className="w-6 h-6 text-emerald-primary mb-3" />
                    <h3 className="font-heading font-bold text-base text-emerald-deep">{p.title}</h3>
                    <p className="text-xs text-brandtext-secondary mt-2 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5: MULTILINGUAL AI HEALTH COMPANION & VOICE */}
      <section id="companion-showcase" className="py-20 bg-emerald-deep text-white border-b border-emerald-dark relative overflow-hidden">
        <AuroraPulse variant="hero" showWaveform={false} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-dark border border-emerald-aurora/30 text-xs text-emerald-mint">
                <Globe className="w-3.5 h-3.5 text-emerald-aurora" />
                <span>Karnataka Regional Inclusion</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-heading leading-tight">
                PULSEORA AI Health Companion in English, Kannada & Tulu
              </h2>
              <p className="text-sm text-emerald-mint/90 leading-relaxed">
                Bridging healthcare equity for coastal Karnataka and beyond. With our 155+ entry verified Tulu medical glossary (<code className="text-emerald-aurora">tulu_glossary.json</code>) and Web Speech voice recognition, seniors can speak naturally in their native tongue.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-emerald-dark/80 border border-emerald-aurora/30 text-xs">
                  <span className="text-emerald-aurora font-bold block mb-1">Kannada:</span>
                  <span className="text-white">"ನನ್ನ ಆರೋಗ್ಯ ಹೇಗಿದೆ?" → "ನಿಮ್ಮ ವಿಶ್ರಾಂತಿ ಹೃದಯ ಬಡಿತ ಸಾಮಾನ್ಯವಾಗಿದೆ..."</span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-dark/80 border border-emerald-aurora/30 text-xs">
                  <span className="text-emerald-aurora font-bold block mb-1">Tulu (Coastal Dialect):</span>
                  <span className="text-white">"ಗುಂಡಿಗೆ ಬಡಿತ ಎಂಚ ಉಂಡು?" → "ನಿಕ್ಲೆನ ಗುಂಡಿಗೆ ಬಡಿತ ಎಡ್ಡೆ ಉಂಡು, ಬೊಂಡ ಪರಿಲೆ..."</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="px-5 py-3 rounded-xl bg-emerald-aurora text-emerald-deep font-bold text-sm hover:bg-white transition-all shadow-md"
                >
                  Try AI Companion Now
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-emerald-dark/90 p-6 rounded-3xl border border-emerald-aurora/40 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-emerald-aurora/20">
                  <Sparkles className="w-5 h-5 text-emerald-aurora animate-spin" />
                  <div>
                    <h4 className="font-bold text-sm text-white">Emergency Safety Architecture</h4>
                    <span className="text-[11px] text-emerald-mint/70">Red-Flag Recognition Guardrails</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-2">
                  <span className="font-bold text-rose-300 block">Immediate Red-Flag Triage:</span>
                  <p className="text-rose-100/90 leading-relaxed">
                    Symptoms such as acute chest pain, radiating left arm pain, or fainting instantly bypass regular conversational chat to display India Emergency Services (112) and Ambulance (108) buttons.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-deep/80 border border-emerald-aurora/20 text-xs space-y-1">
                  <span className="font-bold text-emerald-mint block">Authorized Clinical Tools:</span>
                  <p className="text-emerald-mint/80">
                    Connects directly to <code className="text-white">get_latest_vitals()</code>, <code className="text-white">get_patient_baseline()</code>, and <code className="text-white">log_symptom()</code> without hallucinating data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: CAREGIVER & CLINICAL COLLABORATION */}
      <section className="py-20 bg-white border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Caregiver Card */}
            <div className="p-8 rounded-3xl bg-surface-ivory border border-surface-border shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-soft text-emerald-primary flex items-center justify-center font-bold mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold font-heading text-emerald-deep">Caregiver Portal</h3>
                <p className="text-sm text-brandtext-secondary mt-2 leading-relaxed">
                  Allows daughters, sons, and family members to remotely check on aging parents. Patients are automatically sorted by continuous risk score, enabling quick phone check-ins or WhatsApp contact when alerts trigger.
                </p>
              </div>

              <Link
                href="/caregiver"
                className="inline-flex items-center gap-2 font-bold text-sm text-emerald-primary hover:text-emerald-dark"
              >
                <span>Explore Caregiver Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Doctor Card */}
            <div className="p-8 rounded-3xl bg-surface-ivory border border-surface-border shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-clinical-blue text-blue-700 flex items-center justify-center font-bold mb-4">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold font-heading text-emerald-deep">Doctor Clinical Hub & PDF Reports</h3>
                <p className="text-sm text-brandtext-secondary mt-2 leading-relaxed">
                  Developed in consultation with Nitte Pharma Innovation Centre. Physicians can review longitudinal vitals, inspect multi-metric anomaly timelines, and generate clinical PDF reports with 1 click.
                </p>
              </div>

              <Link
                href="/doctor"
                className="inline-flex items-center gap-2 font-bold text-sm text-emerald-primary hover:text-emerald-dark"
              >
                <span>Explore Doctor Clinical Portal</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 7: INTERACTIVE JUDGE DEMONSTRATION CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-deep to-[#0d3d3a] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-aurora text-emerald-deep uppercase tracking-wider">
            Built for Build4Karnataka & Nitte Innovation
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-heading">
            Experience the Real-Time Anomaly Engine Live
          </h2>
          <p className="text-base text-emerald-mint/90 leading-relaxed max-w-2xl mx-auto">
            Test the live wearable simulator with 5 demo patients, inject progressive deterioration, witness the real anomaly pipeline update risk scores, and listen to AI explanations.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/demo"
              className="px-8 py-4 rounded-xl bg-emerald-aurora text-emerald-deep font-bold text-base hover:bg-white transition-all shadow-xl shadow-emerald-aurora/30"
            >
              Open Hackathon Judge Demo Panel
            </Link>
            <button
              onClick={() => setShowDemoModal(true)}
              className="px-6 py-4 rounded-xl border border-emerald-aurora/40 text-white font-semibold text-base hover:bg-emerald-dark transition-all"
            >
              Quick Login Accounts
            </button>
          </div>
        </div>
      </section>

      {/* Quick Demo Login Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-surface-border text-brandtext-primary">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <Logo variant="icon" size="sm" />
                <div>
                  <h3 className="font-heading font-bold text-xl text-emerald-deep">PULSEORA Portal Login</h3>
                  <p className="text-xs text-brandtext-secondary">Select an authorized role or demo account</p>
                </div>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-brandtext-secondary hover:text-brandtext-primary text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold text-brandtext-secondary uppercase tracking-wider">
                Instant Demo Profiles (Password: <code className="text-emerald-primary font-bold">Pulseora@123</code>)
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => {
                    localStorage.setItem("demo_role", "patient");
                    window.location.href = "/dashboard";
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-emerald-aurora/30 hover:border-emerald-primary bg-emerald-mint/20 hover:bg-emerald-mint/40 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-primary text-white flex items-center justify-center font-bold text-sm">
                      RK
                    </div>
                    <div>
                      <div className="font-bold text-sm text-emerald-deep">Ramesh Kumar (Patient)</div>
                      <div className="text-xs text-brandtext-secondary">ramesh@pulseora.health • Normal Baseline (14.0)</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-primary" />
                </button>

                <button
                  onClick={() => {
                    localStorage.setItem("demo_role", "caregiver");
                    window.location.href = "/caregiver";
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-surface-border hover:border-emerald-primary bg-white hover:bg-emerald-mint/20 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-dark text-white flex items-center justify-center font-bold text-sm">
                      KK
                    </div>
                    <div>
                      <div className="font-bold text-sm text-emerald-deep">Kavitha Kumar (Caregiver)</div>
                      <div className="text-xs text-brandtext-secondary">kavitha@pulseora.health • Real-time escalation view</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-primary" />
                </button>

                <button
                  onClick={() => {
                    localStorage.setItem("demo_role", "doctor");
                    window.location.href = "/doctor";
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-surface-border hover:border-emerald-primary bg-white hover:bg-emerald-mint/20 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      SS
                    </div>
                    <div>
                      <div className="font-bold text-sm text-emerald-deep">Dr. Sudhir Shenoy (Doctor)</div>
                      <div className="text-xs text-brandtext-secondary">dr.shenoy@pulseora.health • Nitte Hospital Clinical Portal</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-primary" />
                </button>

                <button
                  onClick={() => {
                    window.location.href = "/demo";
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-emerald-aurora bg-emerald-deep text-white hover:bg-emerald-dark transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-aurora text-emerald-deep flex items-center justify-center font-bold text-sm">
                      ⚡
                    </div>
                    <div>
                      <div className="font-bold text-sm text-emerald-aurora">Interactive Judge Demo Panel</div>
                      <div className="text-xs text-emerald-mint/80">Simulator controls, deterioration, explainable alert test</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-aurora" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto bg-emerald-deep text-white py-12 border-t border-emerald-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo variant="white" size="sm" showTagline={true} />
          <p className="text-xs text-emerald-mint/70 text-center md:text-right">
            PULSEORA is an early warning and health intelligence monitoring support platform. It is not a clinically validated diagnostic device.<br/>
            Innovation Partner: Nitte Pharma Innovation Centre • Built for Build4Karnataka
          </p>
        </div>
      </footer>
    </div>
  );
}
