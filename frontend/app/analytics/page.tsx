"use client";

import React, { useState, useEffect } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { 
  Moon, 
  Footprints, 
  Activity, 
  TrendingUp, 
  Calendar,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { Header } from "@/components/navigation/Header";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { AICompanionModal } from "@/components/companion/AICompanionModal";

export default function AnalyticsPage() {
  const [patientId, setPatientId] = useState<string>("");
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const pRes = await fetch("http://localhost:8000/api/v1/patients/");
        if (pRes.ok) {
          const patients = await pRes.json();
          if (patients.length > 0) {
            const patId = patients[0].id;
            setPatientId(patId);
            fetchData(patId, timeRange);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  const fetchData = async (patId: string, range: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/vitals/${patId}?range_filter=${range}`);
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((d: any) => {
          const dt = new Date(d.timestamp);
          return {
            ...d,
            day: `${dt.getMonth() + 1}/${dt.getDate()}`,
            sleepScore: Math.round(d.sleep_quality || 85),
            dailySteps: Math.round(d.steps || 4200)
          };
        });
        setAnalyticsData(formatted);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-surface-ivory pb-20 lg:pb-12 text-brandtext-primary">
      <Header onOpenCompanion={() => setIsCompanionOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        
        {/* Analytics Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-primary">Recovery & Activity</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-clinical-blue text-blue-800">
                Longitudinal Modeling
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-deep">
              Sleep & Physical Activity Analytics
            </h1>
            <p className="text-xs sm:text-sm text-brandtext-secondary mt-1">
              Correlating sleep quality with resting heart rate and autonomic heart rate variability (HRV).
            </p>
          </div>

          <div className="flex items-center bg-white p-1 rounded-xl border border-surface-border shadow-sm text-xs font-semibold">
            {["24h", "7d", "30d"].map(r => (
              <button
                key={r}
                onClick={() => {
                  setTimeRange(r);
                  fetchData(patientId, r);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  timeRange === r
                    ? "bg-emerald-deep text-white shadow-sm"
                    : "text-brandtext-secondary hover:text-brandtext-primary"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Sleep Duration & Quality Score */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-surface-border shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-500" />
                <h3 className="font-heading font-bold text-base text-emerald-deep">Sleep Duration (Hours)</h3>
              </div>
              <span className="text-xs text-brandtext-secondary">Average: <b>7.3 hrs</b></span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2ED" />
                  <XAxis dataKey="day" stroke="#94A39F" fontSize={11} />
                  <YAxis stroke="#94A39F" fontSize={11} domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="sleep_duration" fill="#087F70" radius={[6, 6, 0, 0]} name="Sleep (Hours)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-brandtext-secondary">
              Consistent sleep duration of 7-8 hours stabilizes resting heart rate and aids daytime cognitive alertness.
            </p>
          </div>

          {/* Daily Activity Step Counts */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-surface-border shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-amber-500" />
                <h3 className="font-heading font-bold text-base text-emerald-deep">Daily Step Trajectory</h3>
              </div>
              <span className="text-xs text-brandtext-secondary">Goal: <b>5,000 steps</b></span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2ED" />
                  <XAxis dataKey="day" stroke="#94A39F" fontSize={11} />
                  <YAxis stroke="#94A39F" fontSize={11} domain={[0, 8000]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="steps" stroke="#E6A23C" strokeWidth={3} dot={{ r: 3 }} name="Daily Steps" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-brandtext-secondary">
              Low physical activity recorded during recovery periods is factored into the context-aware anomaly detector.
            </p>
          </div>

        </div>

      </main>

      <AICompanionModal
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
        patientId={patientId}
      />

      <MobileBottomNav onOpenCompanion={() => setIsCompanionOpen(true)} />
    </div>
  );
}
