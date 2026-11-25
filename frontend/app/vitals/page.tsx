"use client";

import React, { useState, useEffect } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  ReferenceArea
} from "recharts";
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  Wind, 
  Clock, 
  ShieldCheck, 
  Filter,
  Info
} from "lucide-react";
import { Header } from "@/components/navigation/Header";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { AICompanionModal } from "@/components/companion/AICompanionModal";

export default function VitalsPage() {
  const [patientId, setPatientId] = useState<string>("");
  const [selectedMetric, setSelectedMetric] = useState<string>("resting_heart_rate");
  const [rangeFilter, setRangeFilter] = useState<string>("24h");
  const [chartData, setChartData] = useState<any[]>([]);
  const [baselines, setBaselines] = useState<any>({});
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const metricsConfig: Record<string, { label: string; unit: string; color: string; min: number; max: number; icon: any }> = {
    resting_heart_rate: { label: "Resting Heart Rate", unit: "BPM", color: "#E97835", min: 45, max: 105, icon: Heart },
    heart_rate: { label: "Continuous Heart Rate", unit: "BPM", color: "#DC4545", min: 45, max: 130, icon: Heart },
    spo2: { label: "Blood Oxygen (SpO2)", unit: "%", color: "#16B8A6", min: 90, max: 100, icon: Activity },
    hrv: { label: "Heart Rate Variability (rMSSD)", unit: "ms", color: "#3B82F6", min: 10, max: 70, icon: TrendingUp },
    respiratory_rate: { label: "Respiratory Rate", unit: "rpm", color: "#8B5CF6", min: 10, max: 26, icon: Wind },
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
            
            // Fetch baselines
            const bRes = await fetch(`http://localhost:8000/api/v1/baselines/${patId}`);
            if (bRes.ok) {
              const bData = await bRes.json();
              const bMap: any = {};
              bData.forEach((item: any) => { bMap[item.metric] = item; });
              setBaselines(bMap);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!patientId) return;
    async function fetchVitals() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/v1/vitals/${patientId}?range_filter=${rangeFilter}`);
        if (res.ok) {
          const raw = await res.json();
          const formatted = raw.map((r: any) => {
            const date = new Date(r.timestamp);
            return {
              ...r,
              displayTime: rangeFilter === "24h"
                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`
            };
          });
          setChartData(formatted);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchVitals();
  }, [patientId, rangeFilter]);

  const activeConfig = metricsConfig[selectedMetric] || metricsConfig.resting_heart_rate;
  const currentBaseline = baselines[selectedMetric] || { mean: 68, p10: 62, p90: 74 };

  // Calculate statistics from loaded chart data
  const values = chartData.map(d => d[selectedMetric]).filter(v => typeof v === "number");
  const stats = {
    mean: values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : "-",
    min: values.length ? Math.min(...values).toFixed(1) : "-",
    max: values.length ? Math.max(...values).toFixed(1) : "-",
    latest: values.length ? values[values.length - 1] : "-"
  };

  return (
    <div className="min-h-screen bg-surface-ivory pb-20 lg:pb-12 text-brandtext-primary">
      <Header onOpenCompanion={() => setIsCompanionOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-primary">Clinical Trends</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 border border-amber-500/40">
                SIMULATED DEMO DATA
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-deep">
              Vitals & Personal Baseline Bands
            </h1>
            <p className="text-xs sm:text-sm text-brandtext-secondary mt-1">
              Shaded bands represent your learned 14-day normal range (10th to 90th percentile).
            </p>
          </div>

          {/* Time Range Filter Buttons */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-surface-border shadow-sm text-xs font-semibold">
            {[
              { id: "24h", label: "Last 24 Hours" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setRangeFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  rangeFilter === f.id
                    ? "bg-emerald-deep text-white shadow-sm"
                    : "text-brandtext-secondary hover:text-brandtext-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {Object.entries(metricsConfig).map(([key, cfg]) => {
            const isSelected = selectedMetric === key;
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-white border-emerald-primary ring-2 ring-emerald-aurora/30 shadow-md"
                    : "bg-white/70 border-surface-border hover:border-emerald-aurora/50 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={`font-semibold ${isSelected ? "text-emerald-deep" : "text-brandtext-secondary"}`}>
                    {cfg.label.split("(")[0]}
                  </span>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div className="text-xl font-black text-emerald-deep">
                  {stats.latest} <span className="text-xs font-normal text-brandtext-secondary">{cfg.unit}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Chart Area */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-surface-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-surface-border">
            <div>
              <h3 className="font-heading font-bold text-base text-emerald-deep">
                {activeConfig.label} ({activeConfig.unit})
              </h3>
              <p className="text-xs text-brandtext-secondary">
                Personalized 14-day mean: <b className="text-emerald-deep">{currentBaseline.mean} {activeConfig.unit}</b> (Normal band: {currentBaseline.p10} - {currentBaseline.p90} {activeConfig.unit})
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-brandtext-secondary">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full" style={{ backgroundColor: activeConfig.color }} />
                <span>Observed Vitals</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-aurora/20 border border-emerald-aurora/40" />
                <span>14d Normal Band</span>
              </div>
            </div>
          </div>

          {/* Recharts Canvas */}
          <div className="h-72 sm:h-96 w-full pt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2ED" />
                  <XAxis 
                    dataKey="displayTime" 
                    stroke="#94A39F" 
                    fontSize={11} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#94A39F" 
                    fontSize={11} 
                    domain={[activeConfig.min, activeConfig.max]} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#FFFFFF", 
                      borderColor: "#E2E8E5", 
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                      fontSize: "12px"
                    }}
                    formatter={(val: any) => [`${val} ${activeConfig.unit}`, activeConfig.label]}
                  />

                  {/* Shaded 14-day Baseline Normal Range Area */}
                  {currentBaseline.p10 && currentBaseline.p90 && (
                    <ReferenceArea
                      y1={currentBaseline.p10}
                      y2={currentBaseline.p90}
                      fill="#16B8A6"
                      fillOpacity={0.12}
                    />
                  )}

                  {/* Baseline Mean Centerline */}
                  {currentBaseline.mean && (
                    <ReferenceLine 
                      y={currentBaseline.mean} 
                      stroke="#087F70" 
                      strokeDasharray="4 4" 
                      label={{ value: `Mean: ${currentBaseline.mean}`, fill: "#087F70", fontSize: 10, position: 'insideRight' }} 
                    />
                  )}

                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={activeConfig.color}
                    strokeWidth={2.8}
                    dot={{ r: 2.5, fill: activeConfig.color }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-brandtext-secondary">
                Loading telemetry chart...
              </div>
            )}
          </div>

          {/* Quick Stats Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-surface-border text-center text-xs">
            <div className="p-2.5 rounded-xl bg-surface-ivory">
              <span className="text-brandtext-secondary">Current Latest</span>
              <div className="text-base font-bold text-emerald-deep mt-0.5">{stats.latest} {activeConfig.unit}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-ivory">
              <span className="text-brandtext-secondary">Period Average</span>
              <div className="text-base font-bold text-emerald-deep mt-0.5">{stats.mean} {activeConfig.unit}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-ivory">
              <span className="text-brandtext-secondary">Period Minimum</span>
              <div className="text-base font-bold text-emerald-deep mt-0.5">{stats.min} {activeConfig.unit}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-ivory">
              <span className="text-brandtext-secondary">Period Maximum</span>
              <div className="text-base font-bold text-emerald-deep mt-0.5">{stats.max} {activeConfig.unit}</div>
            </div>
          </div>
        </div>

      </main>

      <AICompanionModal
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
        patientId={patientId}
      />

      <MobileBottomNav
        onOpenCompanion={() => setIsCompanionOpen(true)}
      />
    </div>
  );
}
