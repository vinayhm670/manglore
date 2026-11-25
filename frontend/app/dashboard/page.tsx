"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  Footprints, 
  Moon, 
  Wind, 
  Thermometer, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Wifi
} from "lucide-react";
import { Header } from "@/components/navigation/Header";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { AICompanionModal } from "@/components/companion/AICompanionModal";
import { NetworkFailureBanner } from "@/components/network/NetworkFailureBanner";
import { getRiskColor, formatTime, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [patientData, setPatientData] = useState<any>(null);
  const [vitals, setVitals] = useState<any>(null);
  const [baselines, setBaselines] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Time-based greeting
  const [greeting, setGreeting] = useState("Good Morning");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 17) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch patient summary
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch demo patient Ramesh Kumar by default
        const pRes = await fetch("http://localhost:8000/api/v1/patients/");
        if (!pRes.ok) return;
        const patients = await pRes.json();
        if (patients.length > 0) {
          const pat = patients[0];
          localStorage.setItem("pulseora_patient_id", pat.id);

          const sumRes = await fetch(`http://localhost:8000/api/v1/patients/${pat.id}/summary`);
          if (sumRes.ok) {
            const data = await sumRes.json();
            setPatientData(data.patient);
            setVitals(data.latest_vitals);
            setBaselines(data.baselines || {});
            setAlerts(data.active_alerts || []);
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const riskScore = patientData?.risk_score || 14.0;
  const riskLevel = patientData?.risk_level || "Normal";
  const riskStyles = getRiskColor(riskLevel);

  // Calculate comparisons against 14-day learned baseline
  const getDeviation = (val?: number, baseVal?: number) => {
    if (!val || !baseVal) return null;
    const diff = Math.round(((val - baseVal) / baseVal) * 100);
    return diff > 0 ? `+${diff}%` : `${diff}%`;
  };

  const overviewCards = [
    {
      title: "Resting Heart Rate",
      value: vitals?.resting_heart_rate || 68,
      unit: "BPM",
      icon: Heart,
      color: "text-rose-500",
      baseline: baselines?.resting_heart_rate ? `${baselines.resting_heart_rate.mean} BPM (14d base)` : "68 BPM",
      deviation: getDeviation(vitals?.resting_heart_rate, baselines?.resting_heart_rate?.mean),
      status: "Normal range"
    },
    {
      title: "Blood Oxygen (SpO2)",
      value: vitals?.spo2 || 98.2,
      unit: "%",
      icon: Activity,
      color: "text-emerald-aurora",
      baseline: baselines?.spo2 ? `${baselines.spo2.mean}% base` : "98.0%",
      deviation: getDeviation(vitals?.spo2, baselines?.spo2?.mean),
      status: vitals?.spo2 < 95 ? "Watch" : "Optimal"
    },
    {
      title: "Heart Rate Variability",
      value: vitals?.hrv || 38.5,
      unit: "ms",
      icon: TrendingUp,
      color: "text-blue-500",
      baseline: baselines?.hrv ? `${baselines.hrv.mean} ms base` : "38.0 ms",
      deviation: getDeviation(vitals?.hrv, baselines?.hrv?.mean),
      status: "Stable tone"
    },
    {
      title: "Respiratory Rate",
      value: vitals?.respiratory_rate || 16.0,
      unit: "rpm",
      icon: Wind,
      color: "text-purple-500",
      baseline: baselines?.respiratory_rate ? `${baselines.respiratory_rate.mean} rpm` : "16.0 rpm",
      deviation: getDeviation(vitals?.respiratory_rate, baselines?.respiratory_rate?.mean),
      status: "Normal rhythm"
    },
    {
      title: "Sleep Duration",
      value: vitals?.sleep_duration || 7.4,
      unit: "hrs",
      icon: Moon,
      color: "text-indigo-500",
      baseline: "7.0 hrs normal",
      deviation: null,
      status: "88% quality score"
    },
    {
      title: "Daily Steps",
      value: (vitals?.steps || 3840).toLocaleString(),
      unit: "steps",
      icon: Footprints,
      color: "text-amber-500",
      baseline: "Target: 5,000",
      deviation: null,
      status: "Moderate senior pace"
    },
    {
      title: "Skin Temperature",
      value: vitals?.skin_temperature || 36.6,
      unit: "°C",
      icon: Thermometer,
      color: "text-orange-500",
      baseline: "36.5°C normal",
      deviation: null,
      status: "Afebrile"
    },
    {
      title: "Live Pulse Rate",
      value: vitals?.heart_rate || 70,
      unit: "BPM",
      icon: Heart,
      color: "text-rose-600",
      baseline: "62-76 circadian range",
      deviation: null,
      status: "Active sensor telemetry"
    }
  ];

  return (
    <div className="min-h-screen bg-surface-ivory pb-20 lg:pb-12 text-brandtext-primary">
      <Header onOpenCompanion={() => setIsCompanionOpen(true)} activeAlertCount={alerts.length} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        
        {/* Real-time Network Connectivity & Watchdog Banner */}
        <NetworkFailureBanner patientId={patientData?.id} />

        {/* Dashboard Header Bar */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-surface-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-primary mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(new Date())} • {currentTime}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-deep">
              {greeting}, {patientData?.full_name || "Ramesh Kumar"}
            </h1>
            <p className="text-xs sm:text-sm text-brandtext-secondary mt-1">
              Wearable ID: <span className="font-semibold text-emerald-deep">{patientData?.wearable_device_name || "PULSEORA CareBand Elite #A1"}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Wearable Connection Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-mint/30 border border-emerald-aurora/30 text-xs font-semibold text-emerald-deep">
              <span className="w-2 h-2 rounded-full bg-emerald-aurora animate-ping" />
              <span>Sensors Connected</span>
            </div>

            {/* AI Companion Quick Trigger */}
            <button
              onClick={() => setIsCompanionOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-primary hover:bg-emerald-aurora hover:text-emerald-deep text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Talk to AI Companion</span>
            </button>
          </div>
        </div>

        {/* Health Monitoring Status & Daily Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Risk Score Widget (5 cols) */}
          <div className={`lg:col-span-5 p-6 rounded-2xl border ${riskStyles.border} ${riskStyles.bg} shadow-sm flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brandtext-secondary uppercase tracking-wider">
                  Continuous Monitoring Status
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${riskStyles.badge}`}>
                  {riskLevel.toUpperCase()}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-3">
                <span className={`text-5xl font-black ${riskStyles.text}`}>{riskScore}</span>
                <span className="text-sm font-medium text-brandtext-secondary">/ 100 risk score</span>
              </div>

              <p className="text-xs text-brandtext-secondary mt-2 leading-relaxed">
                Calculated from 14-day rolling diurnal baselines, Z-scores, and autonomic stability filters.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-xs">
              <span className="text-brandtext-secondary">Simulated Telemetry Feed</span>
              <Link href="/demo" className="text-emerald-primary font-bold hover:underline flex items-center gap-1">
                <span>Judge Demo Panel</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Daily Health Summary & Alerts (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-surface-border shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 font-heading font-bold text-base text-emerald-deep mb-2">
                <Sparkles className="w-4 h-4 text-emerald-aurora" />
                <span>Today's Health Pattern Summary</span>
              </div>
              <p className="text-xs sm:text-sm text-brandtext-primary leading-relaxed bg-surface-ivory p-3.5 rounded-xl border border-surface-border">
                {alerts.length > 0 
                  ? alerts[0].explanation 
                  : "All biometric readings match your personal 14-day learned health patterns. Resting heart rate dipped normally during sleep, and blood oxygen remained optimal."}
              </p>
            </div>

            {/* Active Alerts Banner if any */}
            {alerts.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold">{alerts[0].title}</span>
                </div>
                <Link href="/alerts" className="font-bold text-emerald-primary hover:underline shrink-0">
                  View Alert →
                </Link>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-xs text-brandtext-secondary border-t border-surface-border">
              <span>Emergency Contact: {patientData?.emergency_contact_name || "Kavitha Kumar (Daughter)"}</span>
              <span className="font-semibold text-emerald-primary">{patientData?.emergency_contact_phone || "+91 98450 67890"}</span>
            </div>
          </div>

        </div>

        {/* 10 Health Overview Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-heading text-emerald-deep">Biometric Telemetry Cards</h2>
            <Link href="/vitals" className="text-xs font-semibold text-emerald-primary hover:underline flex items-center gap-1">
              <span>View Interactive Graphs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-surface-border shadow-sm hover:border-emerald-primary/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-brandtext-secondary mb-2">
                      <span className="font-medium">{card.title}</span>
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-deep">
                      {card.value} <span className="text-xs font-normal text-brandtext-secondary">{card.unit}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-[11px]">
                    <span className="text-brandtext-secondary">{card.baseline}</span>
                    {card.deviation ? (
                      <span className={`font-bold ${card.deviation.startsWith("+") ? "text-health-watch" : "text-emerald-primary"}`}>
                        {card.deviation}
                      </span>
                    ) : (
                      <span className="text-emerald-primary font-medium">{card.status}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* AI Companion Modal */}
      <AICompanionModal
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
        patientId={patientData?.id}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onOpenCompanion={() => setIsCompanionOpen(true)}
        activeAlertCount={alerts.length}
      />
    </div>
  );
}
