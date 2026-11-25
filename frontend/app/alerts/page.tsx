"use client";

import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  BellOff, 
  HelpCircle, 
  ShieldAlert, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Header } from "@/components/navigation/Header";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { AICompanionModal } from "@/components/companion/AICompanionModal";
import { getRiskColor, formatDate, formatTime } from "@/lib/utils";

export default function AlertsPage() {
  const [patientId, setPatientId] = useState<string>("");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async (patId: string, filter: string) => {
    try {
      const q = filter !== "All" ? `?severity=${filter}` : "";
      const res = await fetch(`http://localhost:8000/api/v1/alerts/${patId}${q}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const pRes = await fetch("http://localhost:8000/api/v1/patients/");
        if (pRes.ok) {
          const patients = await pRes.json();
          if (patients.length > 0) {
            const patId = patients[0].id;
            setPatientId(patId);
            fetchAlerts(patId, severityFilter);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  const handleAction = async (alertId: string, actionType: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/alerts/${alertId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType })
      });
      if (res.ok) {
        fetchAlerts(patientId, severityFilter);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-surface-ivory pb-20 lg:pb-12 text-brandtext-primary">
      <Header onOpenCompanion={() => setIsCompanionOpen(true)} activeAlertCount={alerts.filter(a => a.status === 'active').length} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        
        {/* Alerts Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-primary">Clinical Early Warnings</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-mint text-emerald-deep">
                Explainable AI Alerts
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-deep">
              Alerts & Physiological Shifts
            </h1>
            <p className="text-xs sm:text-sm text-brandtext-secondary mt-1">
              Every notification explains exactly what physiological metric changed, why, and what action to consider.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-surface-border shadow-sm text-xs font-semibold">
            {["All", "Watch", "Warning", "Critical"].map(f => (
              <button
                key={f}
                onClick={() => {
                  setSeverityFilter(f);
                  fetchAlerts(patientId, f);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  severityFilter === f
                    ? "bg-emerald-deep text-white shadow-sm"
                    : "text-brandtext-secondary hover:text-brandtext-primary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts Timeline List */}
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const riskStyles = getRiskColor(alert.severity);
              const isAcknowledged = alert.status === "acknowledged";
              const isSnoozed = alert.status === "snoozed";

              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition-all ${
                    alert.severity === "Critical"
                      ? "border-health-critical/40 bg-rose-50/30"
                      : alert.severity === "Warning"
                      ? "border-health-warning/40 bg-amber-50/20"
                      : "border-surface-border"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-surface-border">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${riskStyles.badge}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <h3 className="font-heading font-bold text-base text-emerald-deep">{alert.title}</h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-brandtext-secondary">
                      <Clock className="w-3.5 h-3.5 text-emerald-primary" />
                      <span>{formatDate(alert.timestamp)} at {formatTime(alert.timestamp)}</span>
                    </div>
                  </div>

                  {/* Explanation & Baseline Deviation */}
                  <div className="py-3.5 space-y-3">
                    <p className="text-sm text-brandtext-primary leading-relaxed">
                      {alert.explanation}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-surface-ivory p-3.5 rounded-xl border border-surface-border">
                      <div>
                        <span className="text-brandtext-secondary block">Contributing Biomarkers:</span>
                        <span className="font-semibold text-emerald-deep capitalize">
                          {alert.contributing_metrics.map((m: string) => m.replace(/_/g, " ")).join(", ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-brandtext-secondary block">Baseline Deviation:</span>
                        <span className="font-bold text-health-watch">+{alert.deviation_pct}% from personal 14d mean</span>
                      </div>
                      <div>
                        <span className="text-brandtext-secondary block">Duration:</span>
                        <span className="font-semibold text-emerald-deep">Observed across ~{alert.duration_hours} hours</span>
                      </div>
                    </div>

                    {/* Suggested Clinical Action */}
                    <div className="p-3 rounded-xl bg-emerald-mint/20 border border-emerald-aurora/30 text-xs text-emerald-deep flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-aurora shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Recommended Action:</span>
                        <span>{alert.suggested_action}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      {isAcknowledged ? (
                        <span className="inline-flex items-center gap-1.5 text-health-normal font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Acknowledged by {alert.acknowledged_by || "User"}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAction(alert.id, "acknowledge")}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-primary hover:bg-emerald-dark text-white font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Acknowledge</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleAction(alert.id, "snooze")}
                        className="px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-surface-border text-brandtext-secondary font-semibold transition-colors flex items-center gap-1"
                      >
                        <BellOff className="w-3.5 h-3.5" />
                        <span>Snooze (4h)</span>
                      </button>

                      <button
                        onClick={() => handleAction(alert.id, "false_alarm")}
                        className="px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-surface-border text-brandtext-secondary font-semibold transition-colors"
                      >
                        Mark False Alarm
                      </button>
                    </div>

                    <button
                      onClick={() => setIsCompanionOpen(true)}
                      className="text-emerald-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Explain in Kannada / Tulu</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-surface-border text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-health-normal mx-auto" />
              <h3 className="font-heading font-bold text-base text-emerald-deep">No Active Health Alerts</h3>
              <p className="text-xs text-brandtext-secondary max-w-sm mx-auto">
                All patient biometrics currently align with personalized baseline intervals. To simulate an alert, head to the Judge Demo Panel.
              </p>
            </div>
          )}
        </div>

      </main>

      <AICompanionModal
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
        patientId={patientId}
      />

      <MobileBottomNav
        onOpenCompanion={() => setIsCompanionOpen(true)}
        activeAlertCount={alerts.filter(a => a.status === 'active').length}
      />
    </div>
  );
}
