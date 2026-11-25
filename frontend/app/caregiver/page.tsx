"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  PhoneCall, 
  MessageSquare, 
  AlertTriangle, 
  Heart, 
  Activity, 
  ChevronRight, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { Header } from "@/components/navigation/Header";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { AICompanionModal } from "@/components/companion/AICompanionModal";
import { getRiskColor } from "@/lib/utils";

export default function CaregiverPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/patients/");
        if (res.ok) {
          const data = await res.json();
          // Sort by risk score descending (highest risk first)
          data.sort((a: any, b: any) => b.current_risk_score - a.current_risk_score);
          setPatients(data);
          if (data.length > 0) setSelectedPatient(data[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  const openWhatsApp = (phone: string, name: string) => {
    const text = encodeURIComponent(`Hi ${name}, I checked your PULSEORA early warning dashboard. Are you resting comfortably and feeling okay today?`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-surface-ivory pb-20 lg:pb-12 text-brandtext-primary">
      <Header onOpenCompanion={() => setIsCompanionOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-primary">Family & Caregiver Portal</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-mint text-emerald-deep">
                Consent Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-deep">
              Monitored Loved Ones
            </h1>
            <p className="text-xs sm:text-sm text-brandtext-secondary mt-1">
              Authorized family remote monitoring with instant alert escalation and direct caregiver contact channels.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-white px-3 py-2 rounded-xl border border-surface-border">
            <span className="font-semibold text-emerald-deep">Logged in as:</span>
            <span className="text-brandtext-secondary">Kavitha Kumar (Primary Caregiver)</span>
          </div>
        </div>

        {/* Patient Cards List (Sorted by Risk) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((pat) => {
            const riskStyles = getRiskColor(pat.current_risk_level);
            return (
              <div
                key={pat.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                  pat.current_risk_level === "Warning" || pat.current_risk_level === "Critical"
                    ? "border-health-warning/50 ring-1 ring-health-warning/20"
                    : "border-surface-border"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between pb-3 border-b border-surface-border">
                    <div>
                      <h3 className="font-heading font-bold text-lg text-emerald-deep">{pat.full_name}</h3>
                      <p className="text-xs text-brandtext-secondary">{pat.age} yrs • {pat.gender} • {pat.medical_conditions?.join(", ")}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${riskStyles.badge}`}>
                      {pat.current_risk_level}
                    </span>
                  </div>

                  {/* Risk Score Pill */}
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-brandtext-secondary">Continuous Risk Score</span>
                      <div className="text-3xl font-black text-emerald-deep">{pat.current_risk_score}<span className="text-xs font-normal text-brandtext-secondary">/100</span></div>
                    </div>
                    <div className="text-right text-xs">
                      <span className="text-brandtext-secondary">Device Link</span>
                      <div className="flex items-center gap-1 font-semibold text-emerald-primary mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-aurora animate-ping" />
                        <span>Connected</span>
                      </div>
                    </div>
                  </div>

                  {/* Alerts note if elevated */}
                  {pat.current_risk_score >= 50 && (
                    <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Physiological shift detected in resting heart rate and sleep patterns.</span>
                    </div>
                  )}
                </div>

                {/* Quick Actions Bar */}
                <div className="pt-4 border-t border-surface-border space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openWhatsApp(pat.emergency_contact_phone || "919845012345", pat.full_name)}
                      className="py-2 px-3 rounded-xl bg-emerald-dark hover:bg-emerald-deep text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-aurora" />
                      <span>WhatsApp</span>
                    </button>

                    <a
                      href={`tel:${pat.emergency_contact_phone || "9845012345"}`}
                      className="py-2 px-3 rounded-xl bg-surface-muted hover:bg-surface-border text-brandtext-primary font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-primary" />
                      <span>Call Patient</span>
                    </a>
                  </div>

                  <Link
                    href={`/vitals?patient=${pat.id}`}
                    className="w-full py-2 rounded-xl border border-surface-border hover:border-emerald-primary text-center text-xs font-bold text-emerald-deep hover:bg-surface-ivory block transition-colors"
                  >
                    View Telemetry Trends & Baselines
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      <AICompanionModal
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
        patientId={selectedPatient?.id}
      />

      <MobileBottomNav onOpenCompanion={() => setIsCompanionOpen(true)} />
    </div>
  );
}
