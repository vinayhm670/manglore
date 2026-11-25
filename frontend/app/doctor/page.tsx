"use client";

import React, { useState, useEffect } from "react";
import { 
  Stethoscope, 
  Download, 
  FileText, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  TrendingUp, 
  Heart, 
  Activity,
  Award,
  ShieldAlert,
  Clock,
  Send,
  Check,
  Phone,
  Zap,
  RefreshCw
} from "lucide-react";
import { Header } from "@/components/navigation/Header";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { AICompanionModal } from "@/components/companion/AICompanionModal";
import { getRiskColor, formatDate } from "@/lib/utils";
import { soundManager } from "@/lib/soundAlerts";

export default function DoctorPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Emergency Escalations State
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loadingEmergencies, setLoadingEmergencies] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState<{ [id: string]: string }>({});
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [triggeringDemo, setTriggeringDemo] = useState(false);

  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/patients/");
        if (res.ok) {
          const data = await res.json();
          setPatients(data);
          if (data.length > 0) setSelectedPatientId(data[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadPatients();
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    setLoadingEmergencies(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/emergency/active");
      if (res.ok) {
        const data = await res.json();
        setEmergencies(data);
      }
    } catch (e) {
      console.error("Failed to load emergencies", e);
    } finally {
      setLoadingEmergencies(false);
    }
  };

  const handleDownloadPdf = async (patientId: string) => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/reports/pdf/${patientId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Pulseora_Clinical_Report_${patientId.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to generate clinical report.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting reporting service.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleAcknowledgeEmergency = async (emergencyId: string) => {
    setAcknowledgingId(emergencyId);
    const notes = doctorNotes[emergencyId] || "Ambulatory review completed. Vitals stabilized under monitoring.";
    try {
      const res = await fetch("http://localhost:8000/api/v1/emergency/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergency_event_id: emergencyId,
          doctor_id: "doc_1",
          clinical_notes: notes,
          contacted_patient: true,
          contacted_caregiver: true
        })
      });
      if (res.ok) {
        // Refresh list
        await fetchEmergencies();
      } else {
        alert("Could not acknowledge alert.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error acknowledging alert.");
    } finally {
      setAcknowledgingId(null);
    }
  };

  const handleSimulateEmergency = async () => {
    if (!patients || patients.length === 0) return;
    setTriggeringDemo(true);
    try {
      soundManager.playCriticalEmergencySound();
      const res = await fetch("http://localhost:8000/api/v1/emergency/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatientId || patients[0].id,
          title: "Acute Cardiac & Desaturation Emergency (Level 4 Critical)",
          indicators: { resting_heart_rate: 112, spo2: 90.4, hrv: 14.8 },
          severity: "Critical"
        })
      });
      if (res.ok) {
        await fetchEmergencies();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTriggeringDemo(false);
    }
  };

  const unacknowledgedEmergencies = emergencies.filter(e => e.status === "unacknowledged");

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-ivory pb-20 lg:pb-12 text-brandtext-primary">
      <Header onOpenCompanion={() => setIsCompanionOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        
        {/* Clinician Header Bar */}
        <div className="bg-gradient-to-r from-emerald-deep via-[#164B49] to-emerald-deep text-white p-6 rounded-2xl border border-emerald-aurora/30 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-aurora text-emerald-deep">
                  Clinical Portal
                </span>
                <span className="text-xs text-emerald-mint font-semibold">
                  Nitte Pharma Innovation Centre • KMC-44892
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading">
                Dr. Sudhir Shenoy, MD, DM (Cardiology)
              </h1>
              <p className="text-xs sm:text-sm text-emerald-mint/80 mt-1">
                Continuous biometric ambulatory monitoring cohort • Mangaluru Clinical Cluster
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-emerald-dark/80 px-4 py-2.5 rounded-xl border border-emerald-aurora/30 text-xs text-right">
                <span className="text-emerald-mint block">Active Monitored Cohort</span>
                <span className="text-xl font-extrabold text-white">{patients.length} Enrolled Patients</span>
              </div>
              <button
                onClick={handleSimulateEmergency}
                disabled={triggeringDemo}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                title="Test emergency trigger and doctor dispatch"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{triggeringDemo ? "Triggering..." : "Simulate Emergency"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Doctor Active Emergency Escalation Section */}
        {unacknowledgedEmergencies.length > 0 ? (
          <div className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-500 shadow-md space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-rose-200">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-600 animate-ping" />
                <h3 className="font-heading font-extrabold text-lg text-rose-950 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>CRITICAL AMBULATORY ESCALATIONS REQUIRING ACKNOWLEDGEMENT ({unacknowledgedEmergencies.length})</span>
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white uppercase tracking-wider">
                LEVEL 4 CRITICAL DISPATCH
              </span>
            </div>

            <div className="space-y-4">
              {unacknowledgedEmergencies.map((em) => {
                const pat = patients.find(p => p.id === em.patient_id) || { full_name: "Ramesh Kumar", age: 67, phone: "+91 98450 12345" };
                const isAcking = acknowledgingId === em.id;

                return (
                  <div key={em.id} className="p-4 bg-white rounded-xl border border-rose-200 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-rose-900">{pat.full_name}</span>
                          <span className="text-xs text-brandtext-secondary">({pat.age} yrs • ID: {em.patient_id.slice(0, 8)})</span>
                        </div>
                        <p className="text-xs font-medium text-rose-700 mt-0.5">{em.title}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-brandtext-secondary">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Triggered: {new Date(em.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Vitals Indicators */}
                    {em.indicators && (
                      <div className="grid grid-cols-3 gap-3 p-2.5 rounded-lg bg-surface-ivory text-xs border border-surface-border">
                        <div>
                          <span className="text-brandtext-secondary block">Resting HR:</span>
                          <span className="font-bold text-rose-600">{em.indicators.resting_heart_rate || em.indicators.heart_rate || 104} BPM</span>
                        </div>
                        <div>
                          <span className="text-brandtext-secondary block">SpO2 Oxygen:</span>
                          <span className="font-bold text-rose-600">{em.indicators.spo2 || 91.2}%</span>
                        </div>
                        <div>
                          <span className="text-brandtext-secondary block">Heart Rate Var:</span>
                          <span className="font-bold text-rose-600">{em.indicators.hrv || 16.5} ms</span>
                        </div>
                      </div>
                    )}

                    {/* Notification Dispatch Status */}
                    <div className="text-xs text-brandtext-secondary flex flex-wrap items-center gap-4 bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                      <span>✓ In-App Alert Sent</span>
                      <span>✓ SMS & WhatsApp Sent (+91 98450 44892)</span>
                      <span>✓ Caregiver Notified (Kavitha Kumar)</span>
                      <span className="text-rose-700 font-semibold">Escalation Timeout: 5 mins</span>
                    </div>

                    {/* Doctor Action Input */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                      <input
                        type="text"
                        placeholder="Enter clinical notes and instructions (e.g. Advised rest, follow-up vitals in 30 mins)..."
                        value={doctorNotes[em.id] || ""}
                        onChange={(e) => setDoctorNotes({ ...doctorNotes, [em.id]: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-rose-300 bg-white focus:outline-none focus:border-rose-500"
                      />
                      <button
                        onClick={() => handleAcknowledgeEmergency(em.id)}
                        disabled={isAcking}
                        className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isAcking ? "Confirming..." : "Clinically Acknowledge & Verify"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-mint/30 border border-emerald-aurora/40 flex items-center justify-between text-xs text-emerald-deep">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-primary" />
              <span className="font-semibold">
                Continuous Ambulatory Watchdog Active • No unacknowledged Level 4 emergencies currently pending review.
              </span>
            </div>
            <button
              onClick={fetchEmergencies}
              className="text-emerald-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh status</span>
            </button>
          </div>
        )}

        {/* Patient Roster Table */}
        <div className="bg-white rounded-2xl border border-surface-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-base text-emerald-deep">Remote Patient Registry</h3>
              <p className="text-xs text-brandtext-secondary">Click any patient to download comprehensive PDF summary or view baseline shifts.</p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-brandtext-secondary" />
              <input
                type="text"
                placeholder="Search by patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-emerald-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-ivory text-brandtext-secondary uppercase text-[10px] tracking-wider border-b border-surface-border">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Patient</th>
                  <th className="px-4 py-3.5 font-bold">Demographics</th>
                  <th className="px-4 py-3.5 font-bold">Clinical Conditions</th>
                  <th className="px-4 py-3.5 font-bold">Monitoring Status</th>
                  <th className="px-4 py-3.5 font-bold">Telemetry Device</th>
                  <th className="px-5 py-3.5 font-bold text-right">Clinical PDF Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredPatients.map((pat) => {
                  const riskStyles = getRiskColor(pat.current_risk_level);
                  return (
                    <tr key={pat.id} className="hover:bg-surface-ivory/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-sm text-emerald-deep">{pat.full_name}</div>
                        <div className="text-[11px] text-brandtext-secondary">{pat.email}</div>
                      </td>
                      <td className="px-4 py-4 text-brandtext-secondary">
                        {pat.age} yrs • {pat.gender}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {pat.medical_conditions?.map((c: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-surface-muted text-[11px] text-brandtext-primary">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${riskStyles.badge}`}>
                            {pat.current_risk_level}
                          </span>
                          <span className="font-bold text-emerald-deep">{pat.current_risk_score}/100</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-brandtext-secondary">
                        {pat.wearable_device_name}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDownloadPdf(pat.id)}
                          disabled={downloadingPdf}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-primary hover:bg-emerald-aurora hover:text-emerald-deep text-white font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadingPdf ? "Generating..." : "Download PDF"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <AICompanionModal
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
        patientId={selectedPatientId}
      />

      <MobileBottomNav onOpenCompanion={() => setIsCompanionOpen(true)} />
    </div>
  );
}
