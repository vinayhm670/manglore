"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  Heart, 
  Activity, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  Stethoscope,
  Bell,
  Volume2,
  Check,
  Send
} from "lucide-react";
import { getRiskColor } from "@/lib/utils";
import { soundManager } from "@/lib/soundAlerts";

interface DemoControlPanelProps {
  onOpenCompanion?: () => void;
}

export const DemoControlPanel: React.FC<DemoControlPanelProps> = ({ onOpenCompanion }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [deteriorationActive, setDeteriorationActive] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(3000);
  const [latestReading, setLatestReading] = useState<any>(null);
  const [lastAlert, setLastAlert] = useState<any>(null);

  // Emergency & Connectivity Demo States
  const [networkOffline, setNetworkOffline] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState<any>(null);
  const [emergencyAcknowledged, setEmergencyAcknowledged] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState("Ambulatory review completed. Vitals stabilized under monitoring.");

  // Load patients
  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/patients/");
        if (res.ok) {
          const data = await res.json();
          setPatients(data);
          if (data.length > 0) {
            setSelectedPatientId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch patients", err);
      }
    }
    loadPatients();
  }, []);

  // Load patient summary when selection changes
  useEffect(() => {
    if (!selectedPatientId) return;
    async function loadSummary() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/patients/${selectedPatientId}/summary`);
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
          setLatestReading(data.latest_vitals);
          setLastAlert(data.active_alerts && data.active_alerts.length > 0 ? data.active_alerts[0] : null);
        }
      } catch (err) {
        console.error("Failed to load summary", err);
      }
    }
    loadSummary();
  }, [selectedPatientId]);

  // Live Simulation Loop
  useEffect(() => {
    let interval: any = null;
    if (isSimulating && selectedPatientId) {
      interval = setInterval(async () => {
        try {
          const endpoint = deteriorationActive 
            ? `http://localhost:8000/api/v1/simulator/deteriorate/${selectedPatientId}`
            : `http://localhost:8000/api/v1/simulator/next/${selectedPatientId}`;
          
          const res = await fetch(endpoint, { method: "POST" });
          if (res.ok) {
            const data = await res.json();
            const readingData = data.data ? data.data.reading : data.reading;
            const riskData = data.data ? data.data.risk_assessment : data.risk_assessment;
            const alertData = data.data ? data.data.alert : data.alert;

            setLatestReading(readingData);
            if (riskData) {
              setSummary((prev: any) => ({
                ...prev,
                patient: {
                  ...prev.patient,
                  risk_score: riskData.score,
                  risk_level: riskData.status
                }
              }));
              if (riskData.score >= 70 && !activeEmergency) {
                // Auto trigger emergency sound & alert
                soundManager.playCriticalEmergencySound();
              }
            }
            if (alertData) {
              setLastAlert(alertData);
            }
          }
        } catch (e) {
          console.error("Simulation tick error", e);
        }
      }, simulationSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, deteriorationActive, selectedPatientId, simulationSpeed, activeEmergency]);

  const handleTriggerDeterioration = async () => {
    setDeteriorationActive(true);
    setIsSimulating(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/simulator/deteriorate/${selectedPatientId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLatestReading(data.data.reading);
        setSummary((prev: any) => ({
          ...prev,
          patient: {
            ...prev.patient,
            risk_score: data.data.risk_assessment.score,
            risk_level: data.data.risk_assessment.status
          }
        }));
        if (data.data.alert) {
          setLastAlert(data.data.alert);
        }
        if (data.data.risk_assessment.score >= 50) {
          soundManager.playCriticalEmergencySound();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetSimulation = async () => {
    setIsSimulating(false);
    setDeteriorationActive(false);
    setActiveEmergency(null);
    setEmergencyAcknowledged(false);
    setNetworkOffline(false);
    try {
      await fetch(`http://localhost:8000/api/v1/simulator/reset/${selectedPatientId}`, { method: "POST" });
      await fetch(`http://localhost:8000/api/v1/connectivity/restore/${selectedPatientId}`, { method: "POST" });
      const res = await fetch(`http://localhost:8000/api/v1/patients/${selectedPatientId}/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setLatestReading(data.latest_vitals);
        setLastAlert(data.active_alerts && data.active_alerts.length > 0 ? data.active_alerts[0] : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Scenario 2: Critical Doctor Emergency Alert
  const handleTriggerDoctorEmergency = async () => {
    soundManager.playCriticalEmergencySound();
    try {
      const res = await fetch("http://localhost:8000/api/v1/emergency/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatientId,
          title: "Acute Cardiac & Desaturation Emergency (Level 4)",
          indicators: {
            resting_heart_rate: latestReading?.resting_heart_rate || 108,
            spo2: 91.2,
            hrv: 16.5,
            respiratory_rate: 26.0
          },
          severity: "Critical"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveEmergency(data);
        setEmergencyAcknowledged(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledgeEmergency = async () => {
    if (!activeEmergency) return;
    try {
      const res = await fetch("http://localhost:8000/api/v1/emergency/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergency_event_id: activeEmergency.emergency_event_id,
          doctor_id: "doc_1",
          clinical_notes: doctorNotes,
          contacted_patient: true,
          contacted_caregiver: true
        })
      });
      if (res.ok) {
        setEmergencyAcknowledged(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Scenario 3: Network Failure & Restoration
  const handleSimulateNetworkFailure = async () => {
    setNetworkOffline(true);
    soundManager.playNetworkDisconnectedSound();
    try {
      await fetch(`http://localhost:8000/api/v1/connectivity/simulate-failure/${selectedPatientId}`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRestoreNetwork = async () => {
    setNetworkOffline(false);
    soundManager.playNetworkRestoredSound();
    try {
      await fetch(`http://localhost:8000/api/v1/connectivity/restore/${selectedPatientId}`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  };

  const currentRisk = summary?.patient?.risk_score || 12;
  const currentLevel = summary?.patient?.risk_level || "Normal";
  const riskStyles = getRiskColor(currentLevel);

  return (
    <div className="space-y-6">
      {/* Top Banner: Judge & Demonstration Header */}
      <div className="bg-gradient-to-r from-emerald-deep via-emerald-dark to-emerald-deep text-white p-6 rounded-2xl border border-emerald-aurora/30 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-aurora text-emerald-deep uppercase tracking-wider">
                Judge Demonstration Panel
              </span>
              <span className="text-xs text-amber-300 font-semibold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                REAL BACKEND + ML + SOUND ALERTS
              </span>
            </div>
            <h2 className="text-2xl font-bold font-heading">Interactive Telemetry, Doctor Alert & Network Watchdog</h2>
            <p className="text-sm text-emerald-mint/80 mt-1">
              Test all 3 primary innovations: live deterioration, automated doctor emergency escalation, and audible network failure watchdog.
            </p>
          </div>

          {/* Patient Selector */}
          <div className="w-full md:w-auto bg-emerald-dark/80 p-2.5 rounded-xl border border-emerald-aurora/30">
            <label className="block text-[11px] text-emerald-mint uppercase font-semibold mb-1">Select Demo Patient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-emerald-deep text-white font-medium text-sm py-1.5 px-3 rounded-lg border border-emerald-aurora/40 focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.age}y) — {p.current_risk_level} ({p.current_risk_score}/100)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary Simulator Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-surface-border shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulator Toggle */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isSimulating
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-emerald-primary hover:bg-emerald-aurora hover:text-emerald-deep text-white"
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimulating ? "Pause Simulator" : "Start Live Simulator"}</span>
          </button>

          {/* Scenario 1: Health Deterioration */}
          <button
            onClick={handleTriggerDeterioration}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Simulate Deterioration</span>
          </button>

          {/* Scenario 2: Emergency Doctor Escalation */}
          <button
            onClick={handleTriggerDoctorEmergency}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Stethoscope className="w-4 h-4 text-purple-200" />
            <span>Trigger Doctor Emergency Alert</span>
          </button>

          {/* Scenario 3: Network Failure */}
          {networkOffline ? (
            <button
              onClick={handleRestoreNetwork}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-health-normal hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Wifi className="w-4 h-4" />
              <span>Restore Network Chime</span>
            </button>
          ) : (
            <button
              onClick={handleSimulateNetworkFailure}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
            >
              <WifiOff className="w-4 h-4" />
              <span>Simulate Network Failure</span>
            </button>
          )}

          {/* Reset */}
          <button
            onClick={handleResetSimulation}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-muted hover:bg-surface-border text-brandtext-primary flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>

        {/* Speed Factor */}
        <div className="flex items-center gap-2 text-xs text-brandtext-secondary">
          <Clock className="w-3.5 h-3.5 text-emerald-primary" />
          <span>Speed:</span>
          {[
            { label: "1x", ms: 4000 },
            { label: "2x", ms: 2000 },
            { label: "5x", ms: 1000 },
          ].map((sp) => (
            <button
              key={sp.label}
              onClick={() => setSimulationSpeed(sp.ms)}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                simulationSpeed === sp.ms
                  ? "bg-emerald-deep text-white"
                  : "bg-surface-muted hover:bg-surface-border text-brandtext-primary"
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sound Audio Synthesis Verification Buttons */}
      <div className="bg-emerald-mint/20 p-3 rounded-xl border border-emerald-aurora/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-emerald-deep">
          <Volume2 className="w-4 h-4 text-emerald-primary" />
          <span>Web Audio Tone Test:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => soundManager.playNetworkDisconnectedSound()}
            className="px-3 py-1 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 shadow-sm"
          >
            Sound 1: Network Failure Warning
          </button>
          <button
            onClick={() => soundManager.playNetworkRestoredSound()}
            className="px-3 py-1 rounded-lg bg-emerald-primary text-white font-semibold hover:bg-emerald-dark shadow-sm"
          >
            Sound 2: Network Restored Chime
          </button>
          <button
            onClick={() => soundManager.playCriticalEmergencySound()}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 shadow-sm"
          >
            Sound 3: Critical Health Siren
          </button>
        </div>
      </div>

      {/* Active Critical Doctor Emergency Panel (When Triggered) */}
      {activeEmergency && (
        <div className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-500 shadow-md space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-rose-200">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
              <h3 className="font-heading font-extrabold text-lg text-rose-950">
                🚨 AUTOMATIC DOCTOR CRITICAL PATIENT ESCALATION ACTIVE
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded text-xs font-black bg-rose-600 text-white uppercase tracking-wider">
              LEVEL 4 CRITICAL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-white rounded-xl border border-rose-200">
              <span className="text-brandtext-secondary block">Assigned Doctor Notified:</span>
              <span className="font-bold text-emerald-deep text-sm">{activeEmergency.doctor_notified}</span>
              <span className="text-brandtext-secondary block mt-0.5">Phone: {activeEmergency.doctor_phone}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-rose-200">
              <span className="text-brandtext-secondary block">Caregiver Dispatched:</span>
              <span className="font-bold text-emerald-deep text-sm">{activeEmergency.caregiver_notified}</span>
              <span className="text-brandtext-secondary block mt-0.5">Channels: In-App, Push, SMS, WhatsApp</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-rose-200">
              <span className="text-brandtext-secondary block">Acknowledgement Status:</span>
              <span className={`font-bold text-sm block ${emergencyAcknowledged ? "text-health-normal" : "text-rose-600"}`}>
                {emergencyAcknowledged ? "✓ CLINICALLY ACKNOWLEDGED" : "PENDING PHYSICIAN CONFIRMATION"}
              </span>
              <span className="text-[10px] text-brandtext-secondary">Escalation Deadline: 5 mins</span>
            </div>
          </div>

          {/* Doctor Review Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <input
              type="text"
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              disabled={emergencyAcknowledged}
              placeholder="Doctor clinical review notes..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-rose-300 bg-white focus:outline-none"
            />

            {!emergencyAcknowledged ? (
              <button
                onClick={handleAcknowledgeEmergency}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Doctor Acknowledge & Verify Stability</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-health-normal font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Acknowledged. Caregiver received confirmation.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Monitoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Risk Score & Live Biometrics (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Risk Score Banner */}
          <div className={`p-6 rounded-2xl border ${riskStyles.border} ${riskStyles.bg} transition-all`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-brandtext-secondary uppercase tracking-wider">
                  Explainable Monitoring Risk Score
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-4xl font-extrabold ${riskStyles.text}`}>{currentRisk}</span>
                  <span className="text-sm font-medium text-brandtext-secondary">/ 100</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${riskStyles.badge} ml-2`}>
                    {currentLevel.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="text-right">
                <span className="text-xs text-brandtext-secondary">Wearable Link</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-primary mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${networkOffline ? "bg-rose-500" : "bg-emerald-aurora animate-ping"}`} />
                  <span>{networkOffline ? "OFFLINE" : "STREAMING"}</span>
                </div>
              </div>
            </div>

            <div className="w-full h-3 bg-surface-border rounded-full overflow-hidden mt-4">
              <div
                className={`h-full transition-all duration-700 ${
                  currentRisk >= 75 ? "bg-health-critical" : currentRisk >= 50 ? "bg-health-warning" : currentRisk >= 25 ? "bg-health-watch" : "bg-health-normal"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, currentRisk))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-brandtext-secondary mt-1">
              <span>0 (Normal)</span>
              <span>25 (Watch)</span>
              <span>50 (Warning)</span>
              <span>75-100 (Critical)</span>
            </div>
          </div>

          {/* Real-Time Live Vitals Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white border border-surface-border shadow-sm">
              <div className="flex items-center justify-between text-xs text-brandtext-secondary mb-1">
                <span>Heart Rate</span>
                <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-deep">
                {latestReading?.heart_rate || 68} <span className="text-xs font-normal text-brandtext-secondary">BPM</span>
              </div>
              <span className="text-[10px] text-emerald-primary font-medium">Resting: {latestReading?.resting_heart_rate || 66}</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-surface-border shadow-sm">
              <div className="flex items-center justify-between text-xs text-brandtext-secondary mb-1">
                <span>SpO2</span>
                <Activity className="w-4 h-4 text-emerald-aurora" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-deep">
                {latestReading?.spo2 || 98.2} <span className="text-xs font-normal text-brandtext-secondary">%</span>
              </div>
              <span className={`text-[10px] font-medium ${latestReading?.spo2 < 94 ? "text-health-warning font-bold" : "text-emerald-primary"}`}>
                {latestReading?.spo2 < 94 ? "Reduced Saturation" : "Optimal"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-surface-border shadow-sm">
              <div className="flex items-center justify-between text-xs text-brandtext-secondary mb-1">
                <span>HRV (rMSSD)</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-deep">
                {latestReading?.hrv || 38} <span className="text-xs font-normal text-brandtext-secondary">ms</span>
              </div>
              <span className="text-[10px] text-brandtext-secondary font-medium">Autonomic tone</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-surface-border shadow-sm">
              <div className="flex items-center justify-between text-xs text-brandtext-secondary mb-1">
                <span>Resp Rate</span>
                <ShieldCheck className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-deep">
                {latestReading?.respiratory_rate || 16} <span className="text-xs font-normal text-brandtext-secondary">rpm</span>
              </div>
              <span className="text-[10px] text-brandtext-secondary font-medium">14-18 normal</span>
            </div>
          </div>

          {/* 14-Day Baseline Comparison Table */}
          <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-sm">
            <h4 className="font-heading font-bold text-sm text-emerald-deep mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-primary" />
              <span>Personal 14-Day Baseline Ranges ({summary?.patient?.full_name})</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {summary?.baselines && Object.entries(summary.baselines).map(([metric, b]: any) => (
                <div key={metric} className="p-2.5 rounded-lg bg-surface-ivory border border-surface-border">
                  <div className="font-medium text-brandtext-secondary capitalize">{metric.replace(/_/g, " ")}</div>
                  <div className="text-sm font-bold text-emerald-deep mt-0.5">{b.mean}</div>
                  <div className="text-[10px] text-brandtext-secondary">Range: {b.p10} - {b.p90}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Explainable Alert & AI Explanation (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Alert Card */}
          <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="font-heading font-bold text-base text-emerald-deep flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-health-warning" />
                <span>Explainable Early Warning Alert</span>
              </h3>
              {lastAlert && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskColor(lastAlert.severity).badge}`}>
                  {lastAlert.severity.toUpperCase()}
                </span>
              )}
            </div>

            {lastAlert ? (
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-brandtext-primary">{lastAlert.title}</h4>
                <p className="text-xs text-brandtext-secondary leading-relaxed bg-surface-ivory p-3 rounded-xl border border-surface-border">
                  {lastAlert.explanation}
                </p>

                <div className="text-xs space-y-1">
                  <span className="font-semibold text-brandtext-primary">Suggested Clinical Action:</span>
                  <p className="text-xs text-emerald-primary font-medium">{lastAlert.suggested_action}</p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onOpenCompanion}
                    className="w-full py-2.5 rounded-xl bg-emerald-primary hover:bg-emerald-aurora hover:text-emerald-deep text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Ask AI Companion to Explain in Kannada / Tulu</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-brandtext-secondary">
                <CheckCircle2 className="w-8 h-8 text-health-normal mx-auto mb-2" />
                <span>No active alerts. Click <b>"Simulate Deterioration"</b> or <b>"Trigger Doctor Emergency Alert"</b> above to test real-time detection.</span>
              </div>
            )}
          </div>

          {/* Hackathon Demo Workflow Guide */}
          <div className="bg-emerald-mint/20 p-5 rounded-2xl border border-emerald-aurora/30 space-y-3 text-xs">
            <span className="font-heading font-bold text-emerald-deep block text-sm">
              3 Hackathon Judge Scenarios:
            </span>
            <ul className="space-y-2 text-brandtext-secondary">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-deep shrink-0">1. Early Warning:</span>
                <span>Click "Start Simulator" → "Simulate Deterioration" to see 14-day baselines catch 18% HR elevation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-deep shrink-0">2. Emergency Doctor Alert:</span>
                <span>Click "Trigger Doctor Emergency Alert" to witness immediate Level 4 doctor notification & acknowledgement.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-deep shrink-0">3. Network Failure Watchdog:</span>
                <span>Click "Simulate Network Failure" to hear Sound 1 warning and observe automatic queued recovery.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};
